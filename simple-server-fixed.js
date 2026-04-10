import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = 3000;

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'kelios_jwt_secret_2024';
const DB_HOST = process.env.DB_HOST || '127.0.0.1';  // Forcer IPv4
const DB_USER = process.env.DB_USER || 'kelios_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'kelios_password_2024';
const DB_NAME = process.env.DB_NAME || 'kelios_db';

console.log(`Configuration DB: ${DB_HOST}:${3306} avec ${DB_USER}@${DB_NAME}`);

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MySQL avec configuration IPv4 explicite
const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
});

// Test de connexion à la base de données
db.getConnection()
  .then(connection => {
    console.log('Connexion MySQL réussie!');
    connection.release();
  })
  .catch(err => {
    console.error('Erreur de connexion MySQL:', err);
  });

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur et mot de passe requis' 
      });
    }

    console.log(`Tentative de connexion pour: ${username}`);

    // Recherche de l'utilisateur
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      console.log('Utilisateur non trouvé');
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiants incorrects' 
      });
    }

    const user = users[0];
    console.log(`Utilisateur trouvé: ${user.username}, isVerified: ${user.isVerified}`);

    // Vérification du mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Mot de passe incorrect');
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiants incorrects' 
      });
    }

    // Vérification si le compte est vérifié
    if (!user.isVerified) {
      console.log('Compte non vérifié');
      return res.json({
        success: false,
        needsVerification: true,
        email: user.email,
        message: 'Compte non vérifié. Veuillez vérifier votre email.'
      });
    }

    // Génération du token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Connexion réussie pour: ${user.username}`);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis' 
      });
    }

    // Vérification si l'utilisateur existe déjà
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Nom d\'utilisateur ou email déjà utilisé' 
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Génération d'un code de vérification
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Création de l'utilisateur
    const [result] = await db.execute(
      `INSERT INTO users (id, username, email, password, role, isVerified, verificationCode, createdAt) 
       VALUES (?, ?, ?, ?, 'User', 0, ?, NOW())`,
      [Date.now().toString(), username, email, hashedPassword, verificationCode]
    );

    res.json({
      success: true,
      message: 'Compte créé avec succès. Un code de vérification a été envoyé.',
      needsVerification: true,
      email: email,
      verificationCode: verificationCode // En production, envoyez par email
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

app.post('/api/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et code requis' 
      });
    }

    // Vérification du code
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND verificationCode = ?',
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code de vérification invalide' 
      });
    }

    // Activation du compte
    await db.execute(
      'UPDATE users SET isVerified = 1, verificationCode = NULL WHERE email = ?',
      [email]
    );

    const user = users[0];

    // Génération du token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Compte vérifié avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur verify:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, subscriptionStatus, plan, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Erreur me:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API KELIOS IA opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Route de test DB
app.get('/api/test-db', async (req, res) => {
  try {
    const [result] = await db.execute('SELECT COUNT(*) as userCount FROM users');
    res.json({ 
      success: true, 
      message: 'Connexion DB réussie',
      userCount: result[0].userCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur de connexion DB',
      error: error.message 
    });
  }
});

// Démarrage du serveur
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  API KELIOS IA démarrée`);
  console.log(`  Port: ${PORT}`);
  console.log(`  URL: http://194.164.77.52:${PORT}`);
  console.log(`  Database: ${DB_NAME}`);
  console.log(`  Host: ${DB_HOST}\n`);
});
