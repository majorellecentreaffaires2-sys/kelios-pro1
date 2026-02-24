import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'majorlle_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initDb() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connecté à MySQL avec succès.');

    const addColumn = async (table, column, definition) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`✨ Colonne ajoutée: ${table}.${column}`);
      } catch (err) {
        if (err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME') {
          console.error(`❌ Erreur colonne ${table}.${column}:`, err.message);
        }
      }
    };

    // --- TABLES DEFINITION ---
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
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'User',
      subscriptionStatus VARCHAR(20) DEFAULT 'trial',
      trialEndsAt DATETIME,
      plan VARCHAR(50) DEFAULT 'monthly_200',
      planInterval ENUM('monthly','yearly') DEFAULT 'monthly',
      lastPaymentDate DATETIME,
      stripeCustomerId VARCHAR(255) NULL,
      stripeSubscriptionId VARCHAR(255) NULL,
      isVerified TINYINT(1) DEFAULT 0,
      verificationCode VARCHAR(10),
      avatarUrl TEXT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (email),
      INDEX (stripeCustomerId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255),
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
      accountingPlan JSON,
      companyType VARCHAR(50) DEFAULT 'Standard',
      INDEX (userId)
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
      subject TEXT,
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

    // --- OTHER SERVICE TABLES ---
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
      INDEX (companyId)
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
      INDEX (companyId)
    )`);

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

    // --- NEW TABLES: Security & Features ---
    await connection.query(`CREATE TABLE IF NOT EXISTS password_resets (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expiresAt DATETIME NOT NULL,
      usedAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (token),
      INDEX (userId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS invoice_tokens (
      id VARCHAR(36) PRIMARY KEY,
      invoiceId VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expiresAt DATETIME NULL,
      viewedAt DATETIME NULL,
      respondedAt DATETIME NULL,
      response ENUM('accepted','declined') NULL,
      clientIp VARCHAR(45) NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (token),
      INDEX (invoiceId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS uploads (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      companyId VARCHAR(255) NULL,
      filename VARCHAR(255) NOT NULL,
      originalName VARCHAR(255) NOT NULL,
      mimeType VARCHAR(100),
      size INT,
      path VARCHAR(500) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (userId)
    )`);

    await connection.query(`CREATE TABLE IF NOT EXISTS reminder_settings (
      id VARCHAR(255) PRIMARY KEY DEFAULT (UUID()),
      companyId VARCHAR(255) NOT NULL UNIQUE,
      enableAutoReminder TINYINT(1) DEFAULT 0,
      reminderDays JSON DEFAULT '[7,14,30]',
      reminderEmailSubject VARCHAR(255),
      reminderEmailBody TEXT,
      enableDueDateNotification TINYINT(1) DEFAULT 0,
      dueDateDaysBefore INT DEFAULT 3,
      enableMonthlyReport TINYINT(1) DEFAULT 0,
      monthlyReportDay INT DEFAULT 1,
      monthlyReportEmail VARCHAR(255),
      INDEX (companyId)
    )`);

    // --- MIGRATIONS ---
    await addColumn('invoices', 'subject', 'TEXT');
    await addColumn('users', 'stripeCustomerId', 'VARCHAR(255) NULL');
    await addColumn('users', 'stripeSubscriptionId', 'VARCHAR(255) NULL');
    await addColumn('users', 'planInterval', "ENUM('monthly','yearly') DEFAULT 'monthly'");
    await addColumn('users', 'avatarUrl', 'TEXT NULL');
    await addColumn('users', 'createdAt', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // Mises à jour Table Companies (pour VPS existants)
    await addColumn('companies', 'companyType', "VARCHAR(50) DEFAULT 'Standard'");
    await addColumn('companies', 'accountingPlan', 'JSON');
    await addColumn('companies', 'defaultVatRates', 'JSON');
    await addColumn('companies', 'bankAccount', 'VARCHAR(255)');
    await addColumn('companies', 'bankName', 'VARCHAR(255)');
    await addColumn('companies', 'swiftCode', 'VARCHAR(50)');
    await addColumn('companies', 'ice', 'VARCHAR(255)');
    await addColumn('companies', 'ifNum', 'VARCHAR(255)');
    await addColumn('companies', 'rc', 'VARCHAR(255)');
    await addColumn('companies', 'taxePro', 'VARCHAR(255)');
    await addColumn('companies', 'siren', 'VARCHAR(50)');
    await addColumn('companies', 'naf', 'VARCHAR(50)');
    await addColumn('companies', 'tvaIntra', 'VARCHAR(50)');
    await addColumn('companies', 'tp', 'VARCHAR(50)');
    await addColumn('companies', 'bp', 'VARCHAR(50)');
    await addColumn('companies', 'rcs', 'VARCHAR(50)');

    // Mises à jour Table Clients (pour VPS existants)
    await addColumn('clients', 'taxePro', 'VARCHAR(50)');
    await addColumn('clients', 'cnss', 'VARCHAR(50)');
    await addColumn('clients', 'siret', 'VARCHAR(50)');
    await addColumn('clients', 'tp', 'VARCHAR(50)');
    await addColumn('clients', 'bp', 'VARCHAR(50)');
    await addColumn('clients', 'rcs', 'VARCHAR(50)');
    await addColumn('clients', 'bankAccount', 'VARCHAR(255)');
    await addColumn('clients', 'bankName', 'VARCHAR(255)');
    await addColumn('clients', 'swiftCode', 'VARCHAR(50)');

    // Mises à jour Table Companies (pour VPS existants)
    await addColumn('companies', 'companyType', "VARCHAR(50) DEFAULT 'Standard'");
    await addColumn('companies', 'accountingPlan', 'JSON');
    await addColumn('companies', 'defaultVatRates', 'JSON');
    await addColumn('companies', 'bankAccount', 'VARCHAR(255)');
    await addColumn('companies', 'bankName', 'VARCHAR(255)');
    await addColumn('companies', 'swiftCode', 'VARCHAR(50)');
    await addColumn('companies', 'ice', 'VARCHAR(255)');
    await addColumn('companies', 'ifNum', 'VARCHAR(255)');
    await addColumn('companies', 'rc', 'VARCHAR(255)');
    await addColumn('companies', 'taxePro', 'VARCHAR(255)');
    await addColumn('companies', 'siren', 'VARCHAR(50)');
    await addColumn('companies', 'naf', 'VARCHAR(50)');
    await addColumn('companies', 'tvaIntra', 'VARCHAR(50)');
    await addColumn('companies', 'tp', 'VARCHAR(50)');
    await addColumn('companies', 'bp', 'VARCHAR(50)');
    await addColumn('companies', 'rcs', 'VARCHAR(50)');

    // SuperAdmin par défaut
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ? OR email = ?', ['admin', 'admin@example.com']);
    if (rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Majorlle2025!';
      const hashedPassword = await bcrypt.default.hash(initialPassword, 12);
      await connection.query('INSERT INTO users (id, username, email, password, role, subscriptionStatus, trialEndsAt, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['u1', 'taha', 'majorellecentreaffaires@gmail.com', hashedPassword, 'SuperAdmin', 'active', new Date(Date.now() + 1000 * 365 * 24 * 60 * 60 * 1000), 1]);
      console.log('👑 Compte SuperAdmin initialisé.');
    }

    connection.release();
    console.log('🚀 Structure Majorlle ERP synchronisée.');
  } catch (err) {
    console.error('❌ Erreur Critique de Base de Données:', err);
    throw err;
  }
}

export default pool;
