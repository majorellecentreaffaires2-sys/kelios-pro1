import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import 'dotenv/config';

const app = express();
const PORT = 3001;

// Configuration JWT
const JWT_SECRET = 'kelios_jwt_secret_local_2024';

// Variables globales
let db;

// Initialisation de la base de données SQLite
function initDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = process.env.DB_PATH || './kelios-local.db';
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erreur de connexion à SQLite:', err);
        reject(false);
      } else {
        console.log('Connecté à la base de données SQLite');
        createTables()
          .then(() => resolve(true))
          .catch(reject);
      }
    });
  });
}

// Création des tables
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table users
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          subscriptionStatus TEXT DEFAULT 'free',
          emailVerified INTEGER DEFAULT 0,
          verificationToken TEXT,
          resetToken TEXT,
          resetTokenExpiry TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table companies
      db.run(`
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT NOT NULL,
          address TEXT,
          email TEXT,
          phone TEXT,
          logoUrl TEXT,
          defaultVatRates TEXT,
          accountingPlan TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table invoices
      db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          companyId INTEGER NOT NULL,
          invoiceNumber TEXT NOT NULL,
          type TEXT DEFAULT 'invoice',
          status TEXT DEFAULT 'draft',
          date TEXT NOT NULL,
          dueDate TEXT,
          sender TEXT NOT NULL,
          client TEXT NOT NULL,
          items TEXT NOT NULL,
          payments TEXT,
          auditTrail TEXT,
          discount REAL DEFAULT 0,
          notes TEXT,
          totalAmount REAL DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Vérifier si un utilisateur de test existe
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count === 0) {
          const hashedPassword = bcrypt.hashSync('password123', 10);
          db.run(`
            INSERT INTO users (username, email, password, emailVerified) 
            VALUES ('demo', 'demo@kelios.local', ?, 1)
          `, [hashedPassword], (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Utilisateur de test créé: demo@kelios.local / password123');
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  });
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

// Middleware
app.use(cors());
app.use(express.json());

// Routes d'authentification
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email et mot de passe requis' 
    });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Erreur login:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

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
        emailVerified: !!user.emailVerified
      }
    });
  });
});

app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tous les champs sont requis' 
    });
  }

  // Vérifier si l'utilisateur existe déjà
  db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, existingUser) => {
    if (err) {
      console.error('Erreur register:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email ou nom d\'utilisateur déjà utilisé' 
      });
    }

    // Hash du mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Création de l'utilisateur
    db.run(`
      INSERT INTO users (username, email, password) 
      VALUES (?, ?, ?)
    `, [username, email, hashedPassword], function(err) {
      if (err) {
        console.error('Erreur register:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erreur serveur' 
        });
      }

      const token = jwt.sign(
        { id: this.lastID, email, username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: this.lastID,
          username,
          email,
          subscriptionStatus: 'free',
          emailVerified: false
        }
      });
    });
  });
});

app.get('/api/me', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, username, email, subscriptionStatus, emailVerified, createdAt FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Erreur /me:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erreur serveur' 
        });
      }

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }

      res.json({
        success: true,
        user: {
          ...user,
          emailVerified: !!user.emailVerified
        }
      });
    }
  );
});

// Routes pour les entreprises
app.get('/api/companies', authenticateToken, (req, res) => {
  db.all('SELECT * FROM companies WHERE userId = ?', [req.user.id], (err, companies) => {
    if (err) {
      console.error('Erreur companies:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    res.json({
      success: true,
      companies: companies.map(company => ({
        ...company,
        defaultVatRates: company.defaultVatRates ? JSON.parse(company.defaultVatRates) : {},
        accountingPlan: company.accountingPlan ? JSON.parse(company.accountingPlan) : {}
      }))
    });
  });
});

app.post('/api/companies', authenticateToken, (req, res) => {
  const { name, address, email, phone, logoUrl, defaultVatRates, accountingPlan } = req.body;

  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Le nom de l\'entreprise est requis' 
    });
  }

  db.run(`
    INSERT INTO companies (userId, name, address, email, phone, logoUrl, defaultVatRates, accountingPlan) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.id, name, address, email, phone, logoUrl, JSON.stringify(defaultVatRates || {}), JSON.stringify(accountingPlan || {})], function(err) {
    if (err) {
      console.error('Erreur create company:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Entreprise créée avec succès',
      companyId: this.lastID
    });
  });
});

// Routes pour les factures
app.get('/api/invoices', authenticateToken, (req, res) => {
  db.all(`
    SELECT i.*, c.name as companyName 
    FROM invoices i 
    JOIN companies c ON i.companyId = c.id 
    WHERE c.userId = ?
    ORDER BY i.createdAt DESC
  `, [req.user.id], (err, invoices) => {
    if (err) {
      console.error('Erreur invoices:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    res.json({
      success: true,
      invoices: invoices.map(invoice => ({
        ...invoice,
        sender: invoice.sender ? JSON.parse(invoice.sender) : {},
        client: invoice.client ? JSON.parse(invoice.client) : {},
        items: invoice.items ? JSON.parse(invoice.items) : [],
        payments: invoice.payments ? JSON.parse(invoice.payments) : [],
        auditTrail: invoice.auditTrail ? JSON.parse(invoice.auditTrail) : []
      }))
    });
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API KELIOS IA - Backend local',
    version: '1.0.0',
    endpoints: [
      'GET /api/test',
      'POST /api/login',
      'POST /api/register',
      'GET /api/me',
      'GET /api/companies',
      'POST /api/companies',
      'GET /api/invoices'
    ]
  });
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur local KELIOS IA fonctionnel',
    timestamp: new Date().toISOString(),
    environment: 'local',
    database: 'SQLite'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Gestionnaire 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    console.log('Démarrage du serveur KELIOS IA...');
    console.log('Node.js version:', process.version);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', PORT);
    console.log('DB Path:', process.env.DB_PATH || './kelios-local.db');
    
    const dbInitialized = await initDatabase();
    
    if (!dbInitialized) {
      console.error('Impossible d\'initialiser la base de données');
      process.exit(1);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  Serveur local KELIOS IA démarré`);
      console.log(`  Port: ${PORT}`);
      console.log(`  URL: http://0.0.0.0:${PORT}`);
      console.log(`  Base de données: SQLite (${process.env.DB_PATH || './kelios-local.db'})\n`);
      console.log(`  Utilisateur de test: demo@kelios.local / password123\n`);
    });
  } catch (error) {
    console.error('Erreur de démarrage:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startServer();
