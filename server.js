
import express from 'express';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { extname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
// --- SECURITY MIDDLEWARE ---
// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Rate limiting for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Specific stricter rate limiter for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Utilisation de variables d'environnement pour les secrets
const JWT_SECRET = process.env.JWT_SECRET || 'majorlle-erp-default-dev-key-change-me';

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ Configuration Email non valide:', error.message);
  } else {
    console.log('✅ Serveur Email prêt à envoyer des messages');
  }
});

// SECURE STATIC FILE SERVING
// ❌ REMOVED: app.use(express.static('.')) -> This was exposing the entire project root including .env and server.js
// ✅ CORRECT: Only serve the 'dist' folder which contains the built frontend
app.use(express.static('dist'));

// Middleware extra precaution to block access to sensitive files if they somehow become exposed
app.use((req, res, next) => {
  const sensitiveFiles = ['.env', '.git', 'server.js', 'vite.config.ts', 'package.json', 'node_modules', 'README.md', 'tsconfig.json'];
  const lowercasePath = req.path.toLowerCase();

  if (sensitiveFiles.some(file => lowercasePath.includes(file.toLowerCase()))) {
    console.warn(`Blocked access attempt to sensitive file: ${req.path}`);
    return res.status(403).json({ error: 'Access Denied' });
  }
  next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.get('/api.ts', (req, res) => {
  console.error('❌ Someone requested /api.ts');
  res.status(404).end();
});
app.get('/server.js', (req, res) => {
  console.error('❌ Someone requested /server.js');
  res.status(404).end();
});
app.get('/vite.config.ts', (req, res) => {
  console.error('❌ Someone requested /vite.config.ts');
  res.status(404).end();
});
app.get('/package.json', (req, res) => {
  console.error('❌ Someone requested /package.json');
  res.status(404).end();
});
app.get('/package-lock.json', (req, res) => {
  console.error('❌ Someone requested /package-lock.json');
  res.status(404).end();
});
let pool;
async function initDb() {
  try {
    // Configuration dynamique via process.env
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '', // Le mot de passe doit être dans process.env
      database: process.env.DB_NAME || 'majorlle_erp',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    console.log('Connecté à MySQL avec succès.');

    // Function to safely add columns (MySQL compatible)
    const addColumn = async (table, column, definition) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`✅ Column added: ${table}.${column}`);
      } catch (err) {
        if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
          // Column already exists, ignore
        } else {
          console.error(`❌ Error adding column ${table}.${column}:`, err.message);
        }
      }
    };

    await connection.query(`CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      userId VARCHAR(255),
      timestamp DATETIME,
      action VARCHAR(50),
      entity VARCHAR(50),
      details TEXT,
      severity VARCHAR(20)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin'
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      address TEXT,
      email VARCHAR(255),
      phone VARCHAR(50),
      website VARCHAR(255),
      ice VARCHAR(255),
      ifNum VARCHAR(255),
      rc VARCHAR(255),
      taxePro VARCHAR(255),
      tp VARCHAR(50),
      bp VARCHAR(50),
      rcs VARCHAR(50),
      siren VARCHAR(50),
      naf VARCHAR(50),
      tvaIntra VARCHAR(50),
      logoUrl LONGTEXT,
      currency VARCHAR(10),
      defaultVatRates JSON,
      numberingFormat VARCHAR(255),
      primaryColor VARCHAR(20),
      active TINYINT(1) DEFAULT 1,
      country VARCHAR(50) DEFAULT 'maroc',
      bankAccount VARCHAR(255),
      bankName VARCHAR(255),
      swiftCode VARCHAR(50),
      accountingPlan JSON
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS articles (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      code VARCHAR(255),
      description TEXT,
      priceHt DECIMAL(15, 2),
      defaultVat DECIMAL(5, 2),
      unit VARCHAR(50),
      category VARCHAR(255),
      type VARCHAR(20) DEFAULT 'product',
      stockQuantity INT DEFAULT 0,
      stockMin INT DEFAULT 0,
      trackStock TINYINT(1) DEFAULT 0,
      INDEX (companyId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      code VARCHAR(50),
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      mobile VARCHAR(50),
      fax VARCHAR(50),
      website VARCHAR(255),
      address TEXT,
      ice VARCHAR(255),
      ifNum VARCHAR(255),
      siren VARCHAR(50),
      naf VARCHAR(50),
      tvaIntra VARCHAR(50),
      rc VARCHAR(50),
      reglementMode VARCHAR(50),
      echeance VARCHAR(50),
      remiseDefault FLOAT DEFAULT 0,
      category VARCHAR(100),
      logoUrl LONGTEXT,
      civility VARCHAR(50),
      taxNum VARCHAR(50),
      country VARCHAR(20) DEFAULT 'maroc',
      paymentDelay INT DEFAULT 0,
      accountingAccount VARCHAR(50),
      encoursAutorise DECIMAL(15, 2) DEFAULT 0,
      soldeInitial DECIMAL(15, 2) DEFAULT 0,
      isBlocked TINYINT(1) DEFAULT 0,
      taxePro VARCHAR(50),
      cnss VARCHAR(50),
      siret VARCHAR(50),
      tp VARCHAR(50),
      bp VARCHAR(50),
      rcs VARCHAR(50),
      bankAccount VARCHAR(255),
      bankName VARCHAR(255),
      swiftCode VARCHAR(50),
      INDEX (companyId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      invoiceNumber VARCHAR(255),
      type VARCHAR(50),
      status VARCHAR(50),
      date DATE,
      dueDate DATE,
      sender JSON,
      client JSON,
      items JSON,
      payments JSON,
      auditTrail JSON,
      relanceHistory JSON,
      discount DECIMAL(15, 2),
      notes TEXT,
      currency VARCHAR(10),
      language VARCHAR(10),
      primaryColor VARCHAR(20),
      visualTemplate VARCHAR(50),
      convertedFromId VARCHAR(255),
      validatedAt DATETIME,
      legalArchiveUntil DATETIME,
      paymentTerms VARCHAR(255),
      paymentMethod VARCHAR(255),
      INDEX (companyId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS recurring_schedules (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      invoiceTemplateId VARCHAR(255),
      clientId VARCHAR(255),
      frequency VARCHAR(20),
      startDate DATE,
      nextRunDate DATE,
      endDate DATE,
      isActive TINYINT(1) DEFAULT 1,
      lastRunDate DATE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (companyId),
      INDEX (nextRunDate)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS reminder_settings (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255) UNIQUE,
      enableAutoReminder TINYINT(1) DEFAULT 0,
      reminderDays JSON,
      reminderEmailSubject TEXT,
      reminderEmailBody TEXT,
      enableDueDateNotification TINYINT(1) DEFAULT 0,
      dueDateDaysBefore INT DEFAULT 3,
      enableMonthlyReport TINYINT(1) DEFAULT 0,
      monthlyReportDay INT DEFAULT 1,
      monthlyReportEmail VARCHAR(255),
      INDEX (companyId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS scheduled_emails (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      invoiceId VARCHAR(255),
      type VARCHAR(50),
      recipientEmail VARCHAR(255),
      subject TEXT,
      body TEXT,
      scheduledDate DATETIME,
      sentAt DATETIME,
      status VARCHAR(20) DEFAULT 'pending',
      errorMessage TEXT,
      INDEX (companyId),
      INDEX (status),
      INDEX (scheduledDate)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS vat_rates (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      rate DECIMAL(5, 2) NOT NULL,
      label VARCHAR(255) NOT NULL,
      description TEXT,
      active TINYINT(1) DEFAULT 1,
      defaultRate TINYINT(1) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (companyId),
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )`);

    // --- MIGRATIONS (Adding missing columns to existing tables) ---

    // Companies
    await addColumn('companies', 'tp', "VARCHAR(50)");
    await addColumn('companies', 'bp', "VARCHAR(50)");
    await addColumn('companies', 'rcs', "VARCHAR(50)");
    await addColumn('companies', 'siren', "VARCHAR(50)");
    await addColumn('companies', 'naf', "VARCHAR(50)");
    await addColumn('companies', 'tvaIntra', "VARCHAR(50)");
    await addColumn('companies', 'active', "TINYINT(1) DEFAULT 1");
    await addColumn('companies', 'accountingPlan', "JSON");
    await addColumn('companies', 'website', "VARCHAR(255)");
    await addColumn('companies', 'country', "VARCHAR(50) DEFAULT 'maroc'");
    await addColumn('companies', 'bankAccount', "VARCHAR(255)");
    await addColumn('companies', 'bankName', "VARCHAR(255)");
    await addColumn('companies', 'swiftCode', "VARCHAR(50)");
    await addColumn('companies', 'companyType', "VARCHAR(50) DEFAULT 'Standard'");

    // Clients
    await addColumn('clients', 'category', "VARCHAR(100)");
    await addColumn('clients', 'logoUrl', "LONGTEXT");
    await addColumn('clients', 'civility', "VARCHAR(50)");
    await addColumn('clients', 'taxNum', "VARCHAR(50)");
    await addColumn('clients', 'country', "VARCHAR(20) DEFAULT 'maroc'");
    await addColumn('clients', 'paymentDelay', "INT DEFAULT 0");
    await addColumn('clients', 'accountingAccount', "VARCHAR(50)");
    await addColumn('clients', 'encoursAutorise', "DECIMAL(15, 2) DEFAULT 0");
    await addColumn('clients', 'soldeInitial', "DECIMAL(15, 2) DEFAULT 0");
    await addColumn('clients', 'isBlocked', "TINYINT(1) DEFAULT 0");
    await addColumn('clients', 'taxePro', "VARCHAR(50)");
    await addColumn('clients', 'cnss', "VARCHAR(50)");
    await addColumn('clients', 'siret', "VARCHAR(50)");
    await addColumn('clients', 'tp', "VARCHAR(50)");
    await addColumn('clients', 'bp', "VARCHAR(50)");
    await addColumn('clients', 'rcs', "VARCHAR(50)");
    await addColumn('clients', 'bankAccount', "VARCHAR(255)");
    await addColumn('clients', 'bankName', "VARCHAR(255)");
    await addColumn('clients', 'swiftCode', "VARCHAR(50)");

    // Articles
    await addColumn('articles', 'type', "VARCHAR(20) DEFAULT 'product'");
    await addColumn('articles', 'stockQuantity', "INT DEFAULT 0");
    await addColumn('articles', 'stockMin', "INT DEFAULT 0");
    await addColumn('articles', 'trackStock', "TINYINT(1) DEFAULT 0");

    // Invoices
    await addColumn('invoices', 'paymentTerms', "VARCHAR(255)");
    await addColumn('invoices', 'paymentMethod', "VARCHAR(255)");
    await addColumn('invoices', 'relanceHistory', "JSON");
    await addColumn('invoices', 'convertedFromId', "VARCHAR(255)");
    await addColumn('invoices', 'validatedAt', "DATETIME");
    await addColumn('invoices', 'legalArchiveUntil', "DATETIME");

    // Users
    await addColumn('users', 'role', "VARCHAR(50) DEFAULT 'User'");

    await connection.query(`CREATE TABLE IF NOT EXISTS templates (
      id VARCHAR(255) PRIMARY KEY,
      companyId VARCHAR(255),
      name VARCHAR(255),
      subject TEXT,
      notes TEXT,
      currency VARCHAR(10),
      items JSON,
      INDEX (companyId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS shortcuts (
      companyId VARCHAR(255),
      userId VARCHAR(255),
      shortcuts JSON,
      PRIMARY KEY (companyId, userId)
    )`);

    await addColumn('users', 'subscriptionStatus', "VARCHAR(20) DEFAULT 'trial'");
    await addColumn('users', 'trialEndsAt', "DATETIME");
    await addColumn('users', 'plan', "VARCHAR(50) DEFAULT 'monthly_200'");
    await addColumn('users', 'lastPaymentDate', "DATETIME");

    // SuperAdmin par défaut - Identifiants robustes
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (rows.length === 0) {
      const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Majorlle2025!';
      const hashedPassword = await bcrypt.hash(initialPassword, 12);
      // Admin gets unlimited active status
      await connection.query('INSERT INTO users (id, username, password, role, subscriptionStatus, trialEndsAt) VALUES (?, ?, ?, ?, ?, ?)',
        ['u1', 'admin', hashedPassword, 'SuperAdmin', 'active', new Date(Date.now() + 1000 * 365 * 24 * 60 * 60 * 1000)]);
      console.log('Compte Admin créé avec le mot de passe défini dans l\'environnement.');
    }

    connection.release();
    console.log('Structure Majorlle ERP synchronisée.');
  } catch (err) {
    console.error('Erreur Critique de Base de Données:', err);
    process.exit(1); // Arrêter le serveur si la DB est inaccessible
  }
}

initDb();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTHENTIFICATION ---

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Champs requis' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = Math.random().toString(36).substr(2, 9);

    // 5 days trial
    const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO users (id, username, password, role, subscriptionStatus, trialEndsAt, plan) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, username, hashedPassword, 'User', 'trial', trialEndsAt, 'monthly_200']
    );

    const token = jwt.sign(
      { id: userId, username, role: 'User' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { id: userId, username, role: 'User', subscriptionStatus: 'trial', trialEndsAt },
      token
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// SUBSCRIPTION
app.get('/api/subscription/status', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT subscriptionStatus, trialEndsAt, plan, lastPaymentDate FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    const now = new Date();
    const trialEnds = new Date(user.trialEndsAt);

    // Auto-lock if trial expired and not active
    if (user.subscriptionStatus === 'trial' && now > trialEnds) {
      await pool.query('UPDATE users SET subscriptionStatus = ? WHERE id = ?', ['locked', req.user.id]);
      user.subscriptionStatus = 'locked';
    }

    res.json({
      success: true,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      isLocked: user.subscriptionStatus === 'locked'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subscription/pay', authenticateToken, async (req, res) => {
  try {
    // Simulate payment
    const newStatus = 'active';
    const lastPaymentDate = new Date();

    await pool.query('UPDATE users SET subscriptionStatus = ?, lastPaymentDate = ? WHERE id = ?', [newStatus, lastPaymentDate, req.user.id]);

    res.json({ success: true, status: 'active' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/api/login',
  loginLimiter,
  [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Données invalides' });
    }

    const username = req.body.username;
    const password = req.body.password;

    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.json({ success: false, message: 'Identifiants invalides' });
      }

      const user = rows[0];

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.json({ success: false, message: 'Identifiants invalides' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
        token
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });


// Endpoint to verify current session and return user data
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { password } = req.body;
  if (req.user.id !== req.params.id && req.user.role !== 'SuperAdmin') return res.sendStatus(403);
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SOCIÉTÉS ---
app.get('/api/companies', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM companies');
  // Parse JSON fields
  const companies = rows.map(row => ({
    ...row,
    defaultVatRates: typeof row.defaultVatRates === 'string' ? JSON.parse(row.defaultVatRates) : (row.defaultVatRates || [20, 14, 10, 7, 0]),
    accountingPlan: typeof row.accountingPlan === 'string' ? JSON.parse(row.accountingPlan) : (row.accountingPlan || [])
  }));
  res.json(companies);
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  const c = req.body;
  try {
    await pool.query('INSERT INTO companies SET ?', {
      ...c,
      defaultVatRates: JSON.stringify(c.defaultVatRates || [20, 14, 10, 7, 0]),
      accountingPlan: JSON.stringify(c.accountingPlan || []),
      active: 1,
      companyType: c.companyType || 'Standard'
    });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  const { id, ...updates } = req.body;

  // Whitelist allowed columns to prevent SQL errors
  const allowedColumns = [
    'name', 'address', 'email', 'phone', 'website',
    'ice', 'ifNum', 'rc', 'taxePro', 'siren', 'naf', 'tvaIntra',
    'logoUrl', 'currency', 'defaultVatRates', 'numberingFormat',
    'primaryColor', 'active', 'accountingPlan',
    'country', 'bankAccount', 'bankName', 'swiftCode', 'tp', 'bp', 'rcs',
    'companyType'
  ];

  const filteredUpdates = {};
  for (const key of allowedColumns) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (filteredUpdates.defaultVatRates) filteredUpdates.defaultVatRates = JSON.stringify(filteredUpdates.defaultVatRates);
  if (filteredUpdates.accountingPlan) filteredUpdates.accountingPlan = JSON.stringify(filteredUpdates.accountingPlan);
  if (filteredUpdates.active !== undefined) filteredUpdates.active = filteredUpdates.active ? 1 : 0;

  // Ensure we have something to update
  if (Object.keys(filteredUpdates).length === 0) {
    return res.json({ success: true }); // Nothing to update
  }

  try {
    await pool.query('UPDATE companies SET ? WHERE id = ?', [filteredUpdates, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Update Company Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --- FACTURES ---
app.get('/api/invoices', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  const [rows] = await pool.query('SELECT * FROM invoices WHERE companyId = ?', [companyId]);
  // Parse JSON fields
  const invoices = rows.map(row => ({
    ...row,
    sender: typeof row.sender === 'string' ? JSON.parse(row.sender) : row.sender,
    client: typeof row.client === 'string' ? JSON.parse(row.client) : row.client,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    payments: typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments,
    auditTrail: typeof row.auditTrail === 'string' ? JSON.parse(row.auditTrail) : row.auditTrail,
    relanceHistory: typeof row.relanceHistory === 'string' ? JSON.parse(row.relanceHistory) : (row.relanceHistory || []),
    discount: parseFloat(row.discount) || 0
  }));
  res.json(invoices);
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  const i = req.body;
  try {
    const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;

    const invoiceData = {
      id: i.id,
      companyId: i.companyId,
      invoiceNumber: i.invoiceNumber,
      type: i.type,
      status: i.status,
      date: formatDate(i.date),
      dueDate: formatDate(i.dueDate),
      sender: JSON.stringify(i.sender || {}),
      client: JSON.stringify(i.client || {}),
      items: JSON.stringify(i.items || []),
      payments: JSON.stringify(i.payments || []),
      auditTrail: JSON.stringify(i.auditTrail || []),
      relanceHistory: JSON.stringify(i.relanceHistory || []),
      discount: i.discount || 0,
      notes: i.notes || '',
      currency: i.currency || 'MAD',
      language: i.language || 'fr',
      primaryColor: i.primaryColor || '#007AFF',
      visualTemplate: i.visualTemplate || 'BlueSky',
      convertedFromId: i.convertedFromId || null,
      validatedAt: formatDate(i.validatedAt),
      legalArchiveUntil: formatDate(i.legalArchiveUntil),
      paymentTerms: i.paymentTerms || null,
      paymentMethod: i.paymentMethod || null
    };
    await pool.query('INSERT INTO invoices SET ?', invoiceData);
    res.json({ success: true, invoice: i });
  } catch (e) {
    console.error('Error creating invoice:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/invoices', authenticateToken, async (req, res) => {
  const i = req.body;
  try {
    // Check if invoice exists
    const [existing] = await pool.query('SELECT id FROM invoices WHERE id = ?', [i.id]);

    const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;

    const invoiceData = {
      companyId: i.companyId,
      invoiceNumber: i.invoiceNumber,
      type: i.type,
      status: i.status,
      date: formatDate(i.date),
      dueDate: formatDate(i.dueDate),
      sender: JSON.stringify(i.sender || {}),
      client: JSON.stringify(i.client || {}),
      items: JSON.stringify(i.items || []),
      payments: JSON.stringify(i.payments || []),
      auditTrail: JSON.stringify(i.auditTrail || []),
      relanceHistory: JSON.stringify(i.relanceHistory || []),
      discount: i.discount || 0,
      notes: i.notes || '',
      currency: i.currency || 'MAD',
      language: i.language || 'fr',
      primaryColor: i.primaryColor || '#007AFF',
      visualTemplate: i.visualTemplate || 'BlueSky',
      convertedFromId: i.convertedFromId || null,
      validatedAt: formatDate(i.validatedAt),
      legalArchiveUntil: formatDate(i.legalArchiveUntil),
      paymentTerms: i.paymentTerms || null,
      paymentMethod: i.paymentMethod || null
    };

    if (existing.length === 0) {
      // Invoice doesn't exist, create it
      await pool.query('INSERT INTO invoices SET ?', { id: i.id, ...invoiceData });
    } else {
      // Update existing invoice
      await pool.query('UPDATE invoices SET ? WHERE id = ?', [invoiceData, i.id]);
    }
    res.json({ success: true, invoice: i });
  } catch (e) {
    console.error('Error updating invoice:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- CLIENTS ---
app.get('/api/clients', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clients WHERE companyId = ?', [req.query.companyId]);
  const clients = rows.map(r => ({
    ...r,
    isBlocked: r.isBlocked === 1 || r.isBlocked === true
  }));
  res.json(clients);
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  const c = req.body;
  try {
    const clientData = { ...c };
    if (clientData.isBlocked !== undefined) clientData.isBlocked = clientData.isBlocked ? 1 : 0;

    await pool.query('INSERT INTO clients SET ?', clientData);
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  const updates = req.body;
  try {
    const clientData = { ...updates };
    delete clientData.id; // Avoid updating PK
    if (clientData.isBlocked !== undefined) clientData.isBlocked = clientData.isBlocked ? 1 : 0;

    await pool.query('UPDATE clients SET ? WHERE id = ?', [clientData, req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting client:', e);
    res.status(500).json({ error: e.message });
  }
});



// --- ARTICLES ---
app.get('/api/articles', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM articles WHERE companyId = ?', [req.query.companyId]);
  const articles = rows.map(row => ({
    ...row,
    trackStock: row.trackStock === 1 || row.trackStock === true,
    type: row.type || 'product'
  }));
  res.json(articles);
});

app.post('/api/articles', authenticateToken, async (req, res) => {
  const a = req.body;
  try {
    const articleData = { ...a };
    if (articleData.trackStock !== undefined) articleData.trackStock = articleData.trackStock ? 1 : 0;
    await pool.query('INSERT INTO articles SET ?', articleData);
    res.json(a);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/articles/:id', authenticateToken, async (req, res) => {
  const updates = req.body;
  try {
    const articleData = { ...updates };
    if (articleData.trackStock !== undefined) articleData.trackStock = articleData.trackStock ? 1 : 0;
    await pool.query('UPDATE articles SET ? WHERE id = ?', [articleData, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/articles/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Import articles from CSV
app.post('/api/articles/import', authenticateToken, async (req, res) => {
  const { companyId, articles } = req.body;
  try {
    let imported = 0;
    let errors = [];
    for (const a of articles) {
      try {
        const articleData = {
          id: Math.random().toString(36).substr(2, 9),
          companyId,
          code: a.code || '',
          description: a.description || '',
          priceHt: parseFloat(a.priceHt) || 0,
          defaultVat: parseFloat(a.defaultVat) || 20,
          unit: a.unit || 'U',
          category: a.category || 'Import',
          type: a.type || 'product',
          stockQuantity: parseInt(a.stockQuantity) || 0,
          stockMin: parseInt(a.stockMin) || 0,
          trackStock: (a.trackStock === 'true' || a.trackStock === '1' || a.trackStock === true) ? 1 : 0
        };
        await pool.query('INSERT INTO articles SET ?', articleData);
        imported++;
      } catch (err) {
        errors.push({ code: a.code, error: err.message });
      }
    }
    res.json({ success: true, imported, errors });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update stock quantity
app.put('/api/articles/:id/stock', authenticateToken, async (req, res) => {
  const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'
  try {
    if (operation === 'set') {
      await pool.query('UPDATE articles SET stockQuantity = ? WHERE id = ?', [quantity, req.params.id]);
    } else if (operation === 'add') {
      await pool.query('UPDATE articles SET stockQuantity = stockQuantity + ? WHERE id = ?', [quantity, req.params.id]);
    } else if (operation === 'subtract') {
      await pool.query('UPDATE articles SET stockQuantity = GREATEST(0, stockQuantity - ?) WHERE id = ?', [quantity, req.params.id]);
    }
    const [rows] = await pool.query('SELECT stockQuantity FROM articles WHERE id = ?', [req.params.id]);
    res.json({ success: true, newStock: rows[0]?.stockQuantity || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get low stock articles
app.get('/api/articles/low-stock', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM articles WHERE companyId = ? AND trackStock = 1 AND stockQuantity <= stockMin',
      [companyId]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- TVA RATES ---
app.get('/api/vat-rates', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM vat_rates WHERE companyId = ? ORDER BY rate', [companyId]);
    // Convert MySQL tinyint to boolean for frontend
    const rates = rows.map(row => ({
      ...row,
      active: row.active === 1 || row.active === true,
      defaultRate: row.defaultRate === 1 || row.defaultRate === true
    }));
    res.json(rates);
  } catch (e) {
    console.error('Error fetching VAT rates:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/vat-rates', authenticateToken, async (req, res) => {
  const vatRate = req.body;
  try {
    const vatData = {
      id: vatRate.id,
      companyId: vatRate.companyId,
      rate: vatRate.rate,
      label: vatRate.label,
      description: vatRate.description || '',
      active: vatRate.active ? 1 : 0,
      defaultRate: vatRate.defaultRate ? 1 : 0
    };
    await pool.query('INSERT INTO vat_rates SET ?', vatData);
    res.json({ success: true, id: vatRate.id });
  } catch (e) {
    console.error('Error creating VAT rate:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/vat-rates/:id', authenticateToken, async (req, res) => {
  const updates = req.body;
  try {
    // Convert booleans to MySQL tinyint
    const updateData = {};
    if (updates.rate !== undefined) updateData.rate = updates.rate;
    if (updates.label !== undefined) updateData.label = updates.label;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.active !== undefined) updateData.active = updates.active ? 1 : 0;
    if (updates.defaultRate !== undefined) updateData.defaultRate = updates.defaultRate ? 1 : 0;

    await pool.query('UPDATE vat_rates SET ? WHERE id = ?', [updateData, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error updating VAT rate:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/vat-rates/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM vat_rates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting VAT rate:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- MODÈLES ---
app.get('/api/templates', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM templates WHERE companyId = ?', [req.query.companyId]);
  res.json(rows.map(r => ({ ...r, items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items })));
});

app.post('/api/templates', authenticateToken, async (req, res) => {
  const t = req.body;
  try {
    await pool.query('INSERT INTO templates SET ?', { ...t, items: JSON.stringify(t.items || []) });
    res.json(t);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/templates/:id', authenticateToken, async (req, res) => {
  const { id, ...updates } = req.body;
  try {
    const data = { ...updates };
    if (data.items) data.items = JSON.stringify(data.items);
    await pool.query('UPDATE templates SET ? WHERE id = ?', [data, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/templates/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- RACCOURCIS ---
app.get('/api/shortcuts', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM shortcuts WHERE companyId = ? AND userId = ?', [req.query.companyId, req.query.userId]);
  if (rows.length > 0) {
    res.json(typeof rows[0].shortcuts === 'string' ? JSON.parse(rows[0].shortcuts) : rows[0].shortcuts);
  } else {
    res.json([]);
  }
});

app.post('/api/shortcuts', authenticateToken, async (req, res) => {
  const { companyId, userId, shortcuts } = req.body;
  try {
    await pool.query('INSERT INTO shortcuts (companyId, userId, shortcuts) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shortcuts = ?', [companyId, userId, JSON.stringify(shortcuts), JSON.stringify(shortcuts)]);
    res.json(shortcuts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LOGS D'AUDIT ---
app.get('/api/logs', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
  res.json(rows);
});

// --- RECURRING SCHEDULES ---
app.get('/api/recurring-schedules', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM recurring_schedules WHERE companyId = ?', [companyId]);
    const schedules = rows.map(row => ({
      ...row,
      isActive: row.isActive === 1 || row.isActive === true
    }));
    res.json(schedules);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/recurring-schedules', authenticateToken, async (req, res) => {
  const schedule = req.body;
  try {
    const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
    const scheduleData = {
      id: schedule.id,
      companyId: schedule.companyId,
      invoiceTemplateId: schedule.invoiceTemplateId,
      clientId: schedule.clientId,
      frequency: schedule.frequency,
      startDate: formatDate(schedule.startDate),
      nextRunDate: formatDate(schedule.nextRunDate),
      endDate: formatDate(schedule.endDate),
      isActive: schedule.isActive ? 1 : 0,
      lastRunDate: formatDate(schedule.lastRunDate)
    };
    await pool.query('INSERT INTO recurring_schedules SET ?', scheduleData);
    res.json({ success: true, id: schedule.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/recurring-schedules/:id', authenticateToken, async (req, res) => {
  const updates = req.body;
  try {
    const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;
    const updateData = {};
    if (updates.invoiceTemplateId !== undefined) updateData.invoiceTemplateId = updates.invoiceTemplateId;
    if (updates.clientId !== undefined) updateData.clientId = updates.clientId;
    if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
    if (updates.startDate !== undefined) updateData.startDate = formatDate(updates.startDate);
    if (updates.nextRunDate !== undefined) updateData.nextRunDate = formatDate(updates.nextRunDate);
    if (updates.endDate !== undefined) updateData.endDate = formatDate(updates.endDate);
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? 1 : 0;
    if (updates.lastRunDate !== undefined) updateData.lastRunDate = formatDate(updates.lastRunDate);

    await pool.query('UPDATE recurring_schedules SET ? WHERE id = ?', [updateData, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/recurring-schedules/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM recurring_schedules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get due recurring schedules (for processing)
app.get('/api/recurring-schedules/due', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT * FROM recurring_schedules WHERE isActive = 1 AND nextRunDate <= ? AND (endDate IS NULL OR endDate >= ?)',
      [today, today]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- REMINDER SETTINGS ---
app.get('/api/reminder-settings', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM reminder_settings WHERE companyId = ?', [companyId]);
    if (rows.length > 0) {
      const settings = rows[0];
      res.json({
        ...settings,
        enableAutoReminder: settings.enableAutoReminder === 1,
        enableDueDateNotification: settings.enableDueDateNotification === 1,
        enableMonthlyReport: settings.enableMonthlyReport === 1,
        reminderDays: typeof settings.reminderDays === 'string' ? JSON.parse(settings.reminderDays) : (settings.reminderDays || [7, 14, 30])
      });
    } else {
      res.json({
        companyId,
        enableAutoReminder: false,
        reminderDays: [7, 14, 30],
        reminderEmailSubject: 'Rappel: Facture {invoiceNumber} en attente',
        reminderEmailBody: 'Bonjour,\n\nNous vous rappelons que la facture {invoiceNumber} d\'un montant de {amount} {currency} est en attente de règlement depuis le {dueDate}.\n\nMerci de procéder au paiement dans les meilleurs délais.\n\nCordialement,\n{companyName}',
        enableDueDateNotification: false,
        dueDateDaysBefore: 3,
        enableMonthlyReport: false,
        monthlyReportDay: 1,
        monthlyReportEmail: ''
      });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reminder-settings', authenticateToken, async (req, res) => {
  const settings = req.body;
  try {
    const settingsData = {
      id: settings.id || Math.random().toString(36).substr(2, 9),
      companyId: settings.companyId,
      enableAutoReminder: settings.enableAutoReminder ? 1 : 0,
      reminderDays: JSON.stringify(settings.reminderDays || [7, 14, 30]),
      reminderEmailSubject: settings.reminderEmailSubject || '',
      reminderEmailBody: settings.reminderEmailBody || '',
      enableDueDateNotification: settings.enableDueDateNotification ? 1 : 0,
      dueDateDaysBefore: settings.dueDateDaysBefore || 3,
      enableMonthlyReport: settings.enableMonthlyReport ? 1 : 0,
      monthlyReportDay: settings.monthlyReportDay || 1,
      monthlyReportEmail: settings.monthlyReportEmail || ''
    };

    await pool.query(
      'INSERT INTO reminder_settings SET ? ON DUPLICATE KEY UPDATE enableAutoReminder = VALUES(enableAutoReminder), reminderDays = VALUES(reminderDays), reminderEmailSubject = VALUES(reminderEmailSubject), reminderEmailBody = VALUES(reminderEmailBody), enableDueDateNotification = VALUES(enableDueDateNotification), dueDateDaysBefore = VALUES(dueDateDaysBefore), enableMonthlyReport = VALUES(enableMonthlyReport), monthlyReportDay = VALUES(monthlyReportDay), monthlyReportEmail = VALUES(monthlyReportEmail)',
      settingsData
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SCHEDULED EMAILS ---
app.get('/api/scheduled-emails', authenticateToken, async (req, res) => {
  const { companyId, status } = req.query;
  try {
    let query = 'SELECT * FROM scheduled_emails WHERE companyId = ?';
    const params = [companyId];
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY scheduledDate DESC LIMIT 100';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/scheduled-emails', authenticateToken, async (req, res) => {
  const email = req.body;
  try {
    const emailData = {
      id: email.id || Math.random().toString(36).substr(2, 9),
      companyId: email.companyId,
      invoiceId: email.invoiceId || null,
      type: email.type,
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      body: email.body,
      scheduledDate: email.scheduledDate,
      status: email.status || 'pending'
    };
    await pool.query('INSERT INTO scheduled_emails SET ?', emailData);
    res.json({ success: true, id: emailData.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/scheduled-emails/:id', authenticateToken, async (req, res) => {
  const updates = req.body;
  try {
    await pool.query('UPDATE scheduled_emails SET ? WHERE id = ?', [updates, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get pending emails to send
app.get('/api/scheduled-emails/pending', authenticateToken, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const [rows] = await pool.query(
      'SELECT * FROM scheduled_emails WHERE status = ? AND scheduledDate <= ?',
      ['pending', now]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- OVERDUE INVOICES ---
app.get('/api/invoices/overdue', authenticateToken, async (req, res) => {
  const { companyId } = req.query;
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT * FROM invoices WHERE companyId = ? AND dueDate < ? AND status NOT IN (?, ?, ?)',
      [companyId, today, 'Payée', 'Annulée', 'Brouillon']
    );
    const invoices = rows.map(row => ({
      ...row,
      sender: typeof row.sender === 'string' ? JSON.parse(row.sender) : row.sender,
      client: typeof row.client === 'string' ? JSON.parse(row.client) : row.client,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      payments: typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments
    }));
    res.json(invoices);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- INVOICES DUE SOON ---
app.get('/api/invoices/due-soon', authenticateToken, async (req, res) => {
  const { companyId, days } = req.query;
  try {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + parseInt(days || 7));

    const [rows] = await pool.query(
      'SELECT * FROM invoices WHERE companyId = ? AND dueDate BETWEEN ? AND ? AND status NOT IN (?, ?, ?)',
      [companyId, today.toISOString().split('T')[0], futureDate.toISOString().split('T')[0], 'Payée', 'Annulée', 'Brouillon']
    );
    const invoices = rows.map(row => ({
      ...row,
      sender: typeof row.sender === 'string' ? JSON.parse(row.sender) : row.sender,
      client: typeof row.client === 'string' ? JSON.parse(row.client) : row.client,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      payments: typeof row.payments === 'string' ? JSON.parse(row.payments) : row.payments
    }));
    res.json(invoices);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- MONTHLY REPORT DATA ---
app.get('/api/reports/monthly', authenticateToken, async (req, res) => {
  const { companyId, month, year } = req.query;
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get invoices for the month
    const [invoices] = await pool.query(
      'SELECT * FROM invoices WHERE companyId = ? AND date BETWEEN ? AND ?',
      [companyId, startDate, endDate]
    );

    // Calculate totals
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let invoiceCount = 0;
    let paidCount = 0;

    invoices.forEach(inv => {
      const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
      const payments = typeof inv.payments === 'string' ? JSON.parse(inv.payments) : inv.payments;

      let invHT = 0;
      let invTVA = 0;

      (items || []).forEach(item => {
        (item.subItems || []).forEach(sub => {
          const lineHT = sub.quantity * sub.price * (1 - (sub.discount || 0) / 100);
          const lineTVA = lineHT * (sub.taxRate / 100);
          invHT += lineHT;
          invTVA += lineTVA;
        });
      });

      const invTTC = invHT + invTVA;
      const paidAmount = (payments || []).reduce((sum, p) => sum + p.amount, 0);

      totalHT += invHT;
      totalTVA += invTVA;
      totalTTC += invTTC;
      totalPaid += paidAmount;

      if (inv.status === 'Payée') {
        paidCount++;
      } else if (inv.status !== 'Brouillon' && inv.status !== 'Annulée') {
        totalUnpaid += invTTC - paidAmount;
      }

      if (inv.status !== 'Brouillon') {
        invoiceCount++;
      }
    });

    res.json({
      period: { month, year, startDate, endDate },
      summary: {
        totalHT: Math.round(totalHT * 100) / 100,
        totalTVA: Math.round(totalTVA * 100) / 100,
        totalTTC: Math.round(totalTTC * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalUnpaid: Math.round(totalUnpaid * 100) / 100,
        invoiceCount,
        paidCount,
        unpaidCount: invoiceCount - paidCount
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SEND INVOICE BY EMAIL ---
app.post('/api/invoices/:id/send', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { recipientEmail, subject, body: emailBody, invoiceData, pdfBase64 } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ error: 'Email du destinataire requis' });
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Majorlle ERP" <noreply@majorlle.com>',
      to: recipientEmail,
      subject: subject || `${invoiceData.type} ${invoiceData.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #007AFF;">${invoiceData.type} ${invoiceData.invoiceNumber}</h2>
          <p>Bonjour,</p>
          <p>${emailBody || `Veuillez trouver ci-joint votre ${invoiceData.type.toLowerCase()} ${invoiceData.invoiceNumber}.`}</p>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Montant Total:</strong> ${invoiceData.totalTTC?.toLocaleString() || 'N/A'} ${invoiceData.currency}</p>
            <p><strong>Date d'échéance:</strong> ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
          </div>

          <p>Merci de votre confiance.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Cet email a été envoyé via Majorlle ERP.</p>
        </div>
      `,
      attachments: [
        ...(pdfBase64 ? [{
          filename: `${invoiceData.invoiceNumber}_${invoiceData.client.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          content: pdfBase64.split("base64,")[1] || pdfBase64,
          encoding: 'base64'
        }] : []),
        ...(req.body.customFile ? [{
          filename: req.body.customFile.name,
          content: req.body.customFile.base64.split("base64,")[1] || req.body.customFile.base64,
          encoding: 'base64'
        }] : [])
      ]
    };

    await transporter.sendMail(mailOptions);

    // Update invoice status or log the action
    const auditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      companyId: invoiceData.companyId,
      userId: req.user.id,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      action: 'EMAIL_SENT',
      entity: 'INVOICE',
      details: `Facture envoyée à ${recipientEmail}`,
      severity: 'INFO'
    };
    await pool.query('INSERT INTO audit_logs SET ?', auditEntry);

    res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email: ' + error.message });
  }
});

app.listen(PORT, () => console.log(`Serveur Majorlle ERP actif sur le port ${PORT}`));
