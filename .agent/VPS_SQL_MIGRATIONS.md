# 🗄️ SQL à exécuter sur le VPS (MySQL)

> Ces requêtes sont **idempotentes** — `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ne casseront rien si elles sont déjà partiellement appliquées.  
> **La plupart s'auto-exécutent au démarrage du serveur** via `initDb()`. Ce fichier est votre référence pour les appliquer manuellement sur le VPS.

---

## ▶️ Option 1 — Laisser le serveur le faire automatiquement (Recommandé)

Quand vous redémarrez le serveur sur le VPS (`pm2 restart majorlle-pro`), `initDb()` crée automatiquement toutes les tables et colonnes manquantes. **Rien à faire manuellement** sauf pour les colonnes déjà existantes sur une ancienne version.

---

## ▶️ Option 2 — Exécuter manuellement sur le VPS

```bash
# Connexion MySQL sur le VPS
mysql -u root -p majorlle_erp
```

Puis coller le SQL suivant :

```sql
-- ════════════════════════════════════════════════════════════════
-- 1. NOUVEAUX COLONNES sur la table USERS existante
--    (Si la table users existe déjà sur le VPS, ajoutez ces colonnes)
-- ════════════════════════════════════════════════════════════════

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS planInterval ENUM('monthly','yearly') DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS stripeCustomerId VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS stripeSubscriptionId VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS avatarUrl TEXT NULL,
  ADD COLUMN IF NOT EXISTS createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Index de sécurité pour recherche rapide par email et Stripe
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users (stripeCustomerId);


-- ════════════════════════════════════════════════════════════════
-- 2. NOUVEAUX COLONNES sur la table COMPANIES existante
-- ════════════════════════════════════════════════════════════════

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS companyType VARCHAR(50) DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS accountingPlan JSON NULL,
  ADD COLUMN IF NOT EXISTS defaultVatRates JSON NULL,
  ADD COLUMN IF NOT EXISTS bankAccount VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS bankName VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS swiftCode VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS ice VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS ifNum VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS rc VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS taxePro VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS siren VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS naf VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS tvaIntra VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS tp VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS bp VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS rcs VARCHAR(50) NULL;


-- ════════════════════════════════════════════════════════════════
-- 3. TABLE password_resets (réinitialisation mot de passe par email)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,   -- Stocké hashé SHA-256
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME NULL,                 -- NULL = pas encore utilisé
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pr_token (token),
  INDEX idx_pr_user (userId)
);


-- ════════════════════════════════════════════════════════════════
-- 3. TABLE invoice_tokens (liens publics pour devis/factures)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invoice_tokens (
  id VARCHAR(36) PRIMARY KEY,
  invoiceId VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,   -- 80 chars hex (crypto.randomBytes(40))
  expiresAt DATETIME NULL,              -- NULL = jamais expire
  viewedAt DATETIME NULL,               -- Date de première consultation
  respondedAt DATETIME NULL,
  response ENUM('accepted','declined') NULL,
  clientIp VARCHAR(45) NULL,            -- IP du client (audit de sécurité)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_it_token (token),
  INDEX idx_it_invoice (invoiceId)
);


-- ════════════════════════════════════════════════════════════════
-- 4. TABLE uploads (logos et fichiers)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  companyId VARCHAR(255) NULL,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100),
  size INT,
  path VARCHAR(500) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_uploads_user (userId)
);


-- ════════════════════════════════════════════════════════════════
-- 5. TABLE reminder_settings (paramètres relances automatiques)
--    Remplace l'ancienne structure si elle existait sous un autre format
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reminder_settings (
  id VARCHAR(255) PRIMARY KEY,
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
  INDEX idx_rs_company (companyId)
);
```

---

## ▶️ Vérification après exécution

```sql
-- Vérifier que toutes les tables existent
SHOW TABLES;

-- Vérifier les colonnes users
DESCRIBE users;

-- Vérifier les nouvelles tables
DESCRIBE password_resets;
DESCRIBE invoice_tokens;
DESCRIBE uploads;
```

---

## ⚠️ Notes importantes

| Point | Détail |
|---|---|
| **`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`** | Supporté MySQL 8.0+. Sur MySQL 5.7, utilisez `ADD COLUMN` sans `IF NOT EXISTS` (ignorez l'erreur "duplicate column") |
| **`password_resets.token`** | Stocké en SHA-256 — jamais le token brut. Le token brut est envoyé par email et hashé avant comparaison |
| **`invoice_tokens.token`** | 80 caractères hex générés par `crypto.randomBytes(40)` — très haute entropie |
| **`invoice_tokens.clientIp`** | Log de l'IP du 1er accès — purement pour audit de sécurité, jamais exposé publiquement |
| **Pas besoin de Stripe pour l'instant** | Les colonnes `stripeCustomerId` et `stripeSubscriptionId` sont ajoutées mais resteront NULL jusqu'à l'intégration Stripe |
