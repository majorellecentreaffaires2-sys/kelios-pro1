-- Script de création de nouvelles tables et de base de données optionnelle

CREATE DATABASE IF NOT EXISTS `majorlle_erp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `majorlle_erp`;

CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NULL,
  keyName VARCHAR(255) NOT NULL,
  value TEXT,
  category VARCHAR(100),
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (companyId),
  INDEX (keyName)
);

CREATE TABLE IF NOT EXISTS payment_logs (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255),
  userId VARCHAR(255),
  invoiceId VARCHAR(255),
  paymentMethod VARCHAR(100),
  amount DECIMAL(15,2),
  currency VARCHAR(10),
  status VARCHAR(50),
  reference VARCHAR(255),
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (companyId),
  INDEX (invoiceId)
);
