// Configuration de la base de données pour CPanel Hostinger
// Compatible MySQL/MariaDB

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// Configuration CPanel Hostinger
export const cpanelDbConfig: DatabaseConfig = {
  host: import.meta.env?.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env?.VITE_DB_PORT || '3306'),
  database: import.meta.env?.VITE_DB_NAME || 'kelios_db',
  username: import.meta.env?.VITE_DB_USER || 'kelios_user',
  password: import.meta.env?.VITE_DB_PASSWORD || '',
  ssl: import.meta.env?.VITE_DB_SSL === 'true'
};

// Configuration locale pour développement
export const localDbConfig: DatabaseConfig = {
  host: 'localhost',
  port: 3306,
  database: 'kelios_db',
  username: 'root',
  password: '',
  ssl: false
};

// Configuration en fonction de l'environnement
export const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = import.meta.env?.MODE === 'production';
  const isCPanel = import.meta.env?.VITE_CPANEL === 'true';  
  if (isProduction && isCPanel) {
    return cpanelDbConfig;
  }
  
  return localDbConfig;
};

// Validation de la configuration
export const validateDatabaseConfig = (config: DatabaseConfig): boolean => {
  return !!(
    config.host &&
    config.database &&
    config.username &&
    config.password &&
    config.port
  );
};

// URL de connexion pour phpMyAdmin CPanel
export const getPhpMyAdminUrl = (): string => {
  const domain = import.meta.env?.VITE_CPANEL_DOMAIN || 'votre-domaine.com';
  return `https://${domain}:2083/cpsessXXXXXXXX/frontend/phpmyadmin/index.php`;
};

export default {
  cpanelDbConfig,
  localDbConfig,
  getDatabaseConfig,
  validateDatabaseConfig,
  getPhpMyAdminUrl
};
