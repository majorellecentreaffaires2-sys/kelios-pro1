-- Script de configuration pour KELIOS IA
-- Base de données principale pour l'application

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS `kelios_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci;

USE `kelios_db`;

-- Table des utilisateurs
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `subscriptionStatus` varchar(20) DEFAULT 'trial',
  `trialEndsAt` datetime DEFAULT NULL,
  `plan` varchar(50) DEFAULT 'monthly_200',
  `lastPaymentDate` datetime DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT '0',
  `verificationCode` varchar(10) DEFAULT NULL,
  `stripeCustomerId` varchar(255) DEFAULT NULL,
  `stripeSubscriptionId` varchar(255) DEFAULT NULL,
  `planInterval` enum('monthly','yearly') DEFAULT 'monthly',
  `avatarUrl` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `extraCompanies` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des entreprises
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `address` text,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `ice` varchar(255) DEFAULT NULL,
  `ifNum` varchar(255) DEFAULT NULL,
  `rc` varchar(255) DEFAULT NULL,
  `taxePro` varchar(255) DEFAULT NULL,
  `logoUrl` longtext,
  `currency` varchar(10) DEFAULT NULL,
  `defaultVatRates` json DEFAULT NULL,
  `numberingFormat` varchar(255) DEFAULT NULL,
  `primaryColor` varchar(20) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `accountingPlan` json DEFAULT NULL,
  `siren` varchar(50) DEFAULT NULL,
  `naf` varchar(50) DEFAULT NULL,
  `tvaIntra` varchar(50) DEFAULT NULL,
  `tp` varchar(50) DEFAULT NULL,
  `bp` varchar(50) DEFAULT NULL,
  `rcs` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'maroc',
  `bankAccount` varchar(255) DEFAULT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `swiftCode` varchar(50) DEFAULT NULL,
  `userId` varchar(255) DEFAULT NULL,
  `companyType` varchar(50) DEFAULT 'Standard',
  `postalCode` varchar(50) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table des factures
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` varchar(255) NOT NULL,
  `companyId` varchar(255) DEFAULT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `sender` longtext,
  `client` longtext,
  `items` longtext,
  `payments` longtext,
  `auditTrail` longtext,
  `relanceHistory` longtext,
  `discount` decimal(15,2) DEFAULT NULL,
  `notes` text,
  `currency` varchar(10) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `primaryColor` varchar(20) DEFAULT NULL,
  `visualTemplate` varchar(50) DEFAULT NULL,
  `convertedFromId` varchar(255) DEFAULT NULL,
  `validatedAt` datetime DEFAULT NULL,
  `legalArchiveUntil` datetime DEFAULT NULL,
  `paymentTerms` varchar(255) DEFAULT NULL,
  `paymentMethod` varchar(255) DEFAULT NULL,
  `subject` text,
  `documentNature` varchar(50) DEFAULT 'Facture',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `companyId` (`companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Création de l'utilisateur de la base de données pour l'application
CREATE USER IF NOT EXISTS 'kelios_user'@'localhost' IDENTIFIED BY 'kelios_password_2024';
GRANT ALL PRIVILEGES ON kelios_db.* TO 'kelios_user'@'localhost';
FLUSH PRIVILEGES;
