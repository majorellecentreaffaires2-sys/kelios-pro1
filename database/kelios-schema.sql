-- =============================================
-- KELIOS IA - Base de données pour CPanel
-- Compatible MySQL/MariaDB Hostinger
-- =============================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS `kelios_db` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- Utilisation de la base de données
USE `kelios_db`;

-- =============================================
-- TABLE DES ENTREPRISES
-- =============================================
CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `address` TEXT,
  `tax_id` VARCHAR(100),
  `logo_url` VARCHAR(500),
  `sector` ENUM('BTP', 'SERVICES', 'COMMERCE', 'AUTRE') DEFAULT 'AUTRE',
  `is_active` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_companies_active` (`is_active`),
  INDEX `idx_companies_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES CLIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `address` TEXT,
  `city` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(100) DEFAULT 'Maroc',
  `tax_id` VARCHAR(100),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_clients_company` (`company_id`),
  INDEX `idx_clients_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES FACTURES
-- =============================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
  `type` ENUM('Standard', 'Devis', 'Proforma', 'Acompte', 'Avoir', 'DevisAvecAcompte', 'Dev', 'Recurrente', 'Livraison', 'BonCommande') DEFAULT 'Standard',
  `status` ENUM('Brouillon', 'Envoyée', 'Payée', 'En_attente', 'En_retard', 'Annulée') DEFAULT 'Brouillon',
  `date` DATE NOT NULL,
  `due_date` DATE,
  `payment_date` DATE,
  `payment_method` ENUM('Carte bancaire', 'Virement bancaire', 'Espèces', 'Chèque', 'PayPal', 'Autre'),
  `subtotal_ht` DECIMAL(15,2) DEFAULT 0.00,
  `total_tva` DECIMAL(15,2) DEFAULT 0.00,
  `total_ttc` DECIMAL(15,2) DEFAULT 0.00,
  `deposit_received` DECIMAL(15,2) DEFAULT 0.00,
  `remaining_amount` DECIMAL(15,2) DEFAULT 0.00,
  `notes` TEXT,
  `created_by` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  INDEX `idx_invoices_company` (`company_id`),
  INDEX `idx_invoices_client` (`client_id`),
  INDEX `idx_invoices_status` (`status`),
  INDEX `idx_invoices_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES LIGNES DE FACTURE
-- =============================================
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `invoice_id` VARCHAR(36) NOT NULL,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1.00,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  `vat_rate` DECIMAL(5,2) DEFAULT 20.00,
  `vat_amount` DECIMAL(15,2) GENERATED ALWAYS AS (total_price * vat_rate / 100) STORED,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  INDEX `idx_invoice_items_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES PAIEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `invoice_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `payment_method` ENUM('Carte bancaire', 'Virement bancaire', 'Espèces', 'Chèque', 'PayPal', 'Autre'),
  `reference` VARCHAR(255),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  INDEX `idx_payments_invoice` (`invoice_id`),
  INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES DÉPENSES
-- =============================================
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `date` DATE NOT NULL,
  `payment_method` ENUM('Carte bancaire', 'Espèces', 'Virement', 'Autre'),
  `receipt_url` VARCHAR(500),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_expenses_company` (`company_id`),
  INDEX `idx_expenses_category` (`category`),
  INDEX `idx_expenses_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES BUDGETS PAR CATÉGORIE
-- =============================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `budget_amount` DECIMAL(15,2) NOT NULL,
  `spent_amount` DECIMAL(15,2) DEFAULT 0.00,
  `period` ENUM('Mensuel', 'Trimestriel', 'Annuel') DEFAULT 'Mensuel',
  `year` INT(4) NOT NULL,
  `month` INT(2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_budgets_unique` (`company_id`, `category`, `year`, `month`),
  INDEX `idx_budgets_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES INSIGHTS IA KELIOS
-- =============================================
CREATE TABLE IF NOT EXISTS `ai_insights` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `type` ENUM('optimization', 'warning', 'opportunity', 'market_trend') NOT NULL,
  `priority` ENUM('high', 'medium', 'low') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `impact` TEXT,
  `action` TEXT NOT NULL,
  `market_context` ENUM('morocco', 'global') DEFAULT 'morocco',
  `expected_gain` VARCHAR(100),
  `implementation_steps` JSON,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_ai_insights_company` (`company_id`),
  INDEX `idx_ai_insights_type` (`type`),
  INDEX `idx_ai_insights_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES MÉTRIQUES DE PERFORMANCE
-- =============================================
CREATE TABLE IF NOT EXISTS `performance_metrics` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `company_id` VARCHAR(36) NOT NULL,
  `feature_name` VARCHAR(100) NOT NULL,
  `metric_name` VARCHAR(100) NOT NULL,
  `metric_value` DECIMAL(15,2) NOT NULL,
  `metric_unit` VARCHAR(50),
  `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
  INDEX `idx_performance_company` (`company_id`),
  INDEX `idx_performance_feature` (`feature_name`),
  INDEX `idx_performance_date` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- =============================================

-- Insertion d'une entreprise de démonstration
INSERT IGNORE INTO `companies` (
  `id`, `name`, `email`, `phone`, `address`, `sector`, `is_active`
) VALUES (
  UUID(), 'Entreprise KELIOS Démo', 'demo@kelios.ma', '+212 5XX-XXXXXX', 
  'Casablanca, Maroc', 'BTP', TRUE
);

-- Insertion de clients de démonstration
INSERT IGNORE INTO `clients` (
  `id`, `company_id`, `name`, `email`, `phone`, `address`, `city`, `postal_code`
) VALUES 
  (UUID(), (SELECT `id` FROM `companies` WHERE `name` = 'Entreprise KELIOS Démo' LIMIT 1), 
   'Client BTP Maroc', 'client@btp.ma', '+212 6XX-XXXXXX', 
   'Rue de la construction, Casablanca', 'Casablanca', '20000'),
  (UUID(), (SELECT `id` FROM `companies` WHERE `name` = 'Entreprise KELIOS Démo' LIMIT 1), 
   'Société Services IT', 'contact@services.ma', '+212 7XX-XXXXXX', 
   'Boulevard Mohamed V, Rabat', 'Rabat', '10000');

-- Insertion d'insights IA de démonstration
INSERT IGNORE INTO `ai_insights` (
  `id`, `company_id`, `type`, `priority`, `title`, `description`, 
  `impact`, `action`, `expected_gain`, `implementation_steps`
) VALUES 
  (UUID(), (SELECT `id` FROM `companies` WHERE `name` = 'Entreprise KELIOS Démo' LIMIT 1), 
   'optimization', 'high', 'Optimisation Marges BTP Maroc', 
   'Vos marges actuelles sont de 15% en dessous de la moyenne du secteur BTP marocain (25%).', 
   'Augmentation du bénéfice net de 125K-250K DH/an', 
   'Revoir votre politique de prix et optimiser les coûts d\'approvisionnement', 
   '+180K DH/an', 
   '["Analyser les prix des concurrents locaux", "Négocier de meilleurs tarifs", "Appliquer majoration 8-12%"]'),
  (UUID(), (SELECT `id` FROM `companies` WHERE `name` = 'Entreprise KELIOS Démo' LIMIT 1), 
   'market_trend', 'medium', 'Tendance Saisonnière Construction Q2-Q3', 
   'Le marché de la construction au Maroc connaît une forte demande en Q2-Q3.', 
   'Opportunité de croissance de 40% sur 6 mois', 
   'Anticiper la demande et renforcer les capacités', 
   '+35% CA', 
   '["Recruter personnel temporaire", "Augmenter stocks 25%", "Lancer campagne Q2"]');

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue des statistiques de facturation
CREATE OR REPLACE VIEW `v_invoice_stats` AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(i.id) as total_invoices,
  SUM(CASE WHEN i.status = 'Payée' THEN 1 ELSE 0 END) as paid_invoices,
  SUM(CASE WHEN i.status = 'En_attente' THEN 1 ELSE 0 END) as pending_invoices,
  SUM(CASE WHEN i.status = 'En_retard' THEN 1 ELSE 0 END) as overdue_invoices,
  SUM(i.total_ttc) as total_amount,
  SUM(CASE WHEN i.status = 'Payée' THEN i.total_ttc ELSE 0 END) as paid_amount,
  SUM(CASE WHEN i.status != 'Payée' THEN i.total_ttc ELSE 0 END) as unpaid_amount
FROM companies c
LEFT JOIN invoices i ON c.id = i.company_id
GROUP BY c.id, c.name;

-- Vue des insights IA actifs
CREATE OR REPLACE VIEW `v_active_insights` AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(ai.id) as total_insights,
  SUM(CASE WHEN ai.priority = 'high' THEN 1 ELSE 0 END) as high_priority_insights,
  SUM(CASE WHEN ai.priority = 'medium' THEN 1 ELSE 0 END) as medium_priority_insights,
  SUM(CASE WHEN ai.type = 'optimization' THEN 1 ELSE 0 END) as optimization_insights,
  SUM(CASE WHEN ai.type = 'warning' THEN 1 ELSE 0 END) as warning_insights,
  SUM(CASE WHEN ai.type = 'opportunity' THEN 1 ELSE 0 END) as opportunity_insights
FROM companies c
LEFT JOIN ai_insights ai ON c.id = ai.company_id AND ai.is_active = TRUE
GROUP BY c.id, c.name;

-- =============================================
-- FIN DU SCHÉMA
-- =============================================
