import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = 3001;

// Configuration JWT
const JWT_SECRET = 'kelios_jwt_secret_local_2024';

// Configuration MySQL locale
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kelios_local',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Middleware
app.use(cors());
app.use(express.json());

// Variables globales
let db;

// Initialisation de la base de données
async function initDatabase() {
  try {
    // Connexion à MySQL sans base de données spécifique
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });

    // Création de la base de données si elle n'existe pas
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database}`);
    await connection.end();

    // Connexion à la base de données créée
    db = mysql.createPool(DB_CONFIG);

    // Création des tables
    await createTables();
    
    console.log('Base de données locale initialisée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur d\'initialisation de la base de données:', error);
    return false;
  }
}

// Création des tables
async function createTables() {
  try {
    // Table users
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        subscriptionStatus VARCHAR(50) DEFAULT 'free',
        emailVerified BOOLEAN DEFAULT FALSE,
        verificationToken VARCHAR(255),
        resetToken VARCHAR(255),
        resetTokenExpiry DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Table companies
    await db.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        email VARCHAR(255),
        phone VARCHAR(50),
        logoUrl VARCHAR(500),
        defaultVatRates JSON,
        accountingPlan JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Table invoices
    await db.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT NOT NULL,
        invoiceNumber VARCHAR(100) NOT NULL,
        type ENUM('invoice', 'quote', 'credit_note') DEFAULT 'invoice',
        status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
        date DATE NOT NULL,
        dueDate DATE,
        sender JSON NOT NULL,
        client JSON NOT NULL,
        items JSON NOT NULL,
        payments JSON,
        auditTrail JSON,
        discount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        totalAmount DECIMAL(15,2) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);

    // Création d'un utilisateur de test si la table est vide
    const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.execute(`
        INSERT INTO users (username, email, password, emailVerified) 
        VALUES ('demo', 'demo@kelios.local', ?, TRUE)
      `, [hashedPassword]);
      
      console.log('Utilisateur de test créé: demo@kelios.local / password123');
    }

  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
    throw error;
  }
}

// Middleware d'authentification
function authenticateToken(req, res, next) {
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
}

// Routes d'authentification
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }

    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
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

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email ou nom d\'utilisateur déjà utilisé' 
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const [result] = await db.execute(`
      INSERT INTO users (username, email, password) 
      VALUES (?, ?, ?)
    `, [username, email, hashedPassword]);

    const token = jwt.sign(
      { id: result.insertId, email, username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        subscriptionStatus: 'free',
        emailVerified: false
      }
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, subscriptionStatus, emailVerified, createdAt FROM users WHERE id = ?',
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
    console.error('Erreur /me:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Routes pour les entreprises
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const [companies] = await db.execute(
      'SELECT * FROM companies WHERE userId = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      companies
    });

  } catch (error) {
    console.error('Erreur companies:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    const { name, address, email, phone, logoUrl, defaultVatRates, accountingPlan } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom de l\'entreprise est requis' 
      });
    }

    const [result] = await db.execute(`
      INSERT INTO companies (userId, name, address, email, phone, logoUrl, defaultVatRates, accountingPlan) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, name, address, email, phone, logoUrl, JSON.stringify(defaultVatRates || {}), JSON.stringify(accountingPlan || {})]);

    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès',
      companyId: result.insertId
    });

  } catch (error) {
    console.error('Erreur create company:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Routes pour les factures
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const [invoices] = await db.execute(`
      SELECT i.*, c.name as companyName 
      FROM invoices i 
      JOIN companies c ON i.companyId = c.id 
      WHERE c.userId = ?
      ORDER BY i.createdAt DESC
    `, [req.user.id]);

    res.json({
      success: true,
      invoices
    });

  } catch (error) {
    console.error('Erreur invoices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur local KELIOS IA fonctionnel',
    timestamp: new Date().toISOString(),
    environment: 'local'
  });
});

// Démarrage du serveur
async function startServer() {
  const dbInitialized = await initDatabase();
  
  if (!dbInitialized) {
    console.error('Impossible d\'initialiser la base de données');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n  Serveur local KELIOS IA démarré`);
    console.log(`  Port: ${PORT}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Base de données: ${DB_CONFIG.database}\n`);
    console.log(`  Utilisateur de test: demo@kelios.local / password123\n`);
  });
}

startServer().catch(console.error);
