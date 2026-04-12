// Configuration de la base de données KELIOS IA
// Adaptée pour Hostinger Ubuntu VPS avec MySQL

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

// Configuration pour le VPS Hostinger Ubuntu
const vpsConfig: DatabaseConfig = {
  host: 'localhost', // MySQL sur le même VPS
  port: 3306,
  user: '',
  password: '',
  database: 'kelios_db',
  ssl: false
};

// Configuration pour le développement local
const localConfig: DatabaseConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'kelios_db',
  ssl: false
};

// Configuration pour CPanel (backup)
const cpanelConfig: DatabaseConfig = {
  host: 'localhost',
  port: 3306,
  user: '',
  password: '',
  database: 'kelios_db',
  ssl: false
};

// Sélection de la configuration en fonction de l'environnement
export const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = import.meta.env.PROD;
  const isVPS = isProduction && true; // Force VPS mode pour production
  
  if (isVPS) {
    return vpsConfig;
  } else if (isProduction) {
    return cpanelConfig;
  } else {
    return localConfig;
  }
};

// Export de la configuration par défaut
export const databaseConfig = getDatabaseConfig();

// Connexion string pour MySQL
export const getConnectionString = (): string => {
  const config = getDatabaseConfig();
  return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
};

export default databaseConfig;
