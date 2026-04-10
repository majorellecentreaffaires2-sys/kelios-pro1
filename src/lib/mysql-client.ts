// Client MySQL/MariaDB pour CPanel Hostinger
import { getDatabaseConfig, DatabaseConfig } from '../config/database';

export interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  affectedRows?: number;
}

export interface MySqlConnection {
  query: (sql: string, params?: any[]) => Promise<QueryResult>;
  close: () => void;
}

// Client MySQL pour CPanel
class MySQLCPanelClient {
  private config: DatabaseConfig;
  private connection: any = null;

  constructor(config?: DatabaseConfig) {
    this.config = config || getDatabaseConfig();
  }

  // Connexion à la base de données
  async connect(): Promise<QueryResult> {
    try {
      // Pour le frontend, nous utiliserons une simulation de base de données
      // En production, vous devrez utiliser un backend PHP/Node.js
      console.log('Connexion à la base de données CPanel:', this.config.database);
      
      return {
        success: true,
        data: { message: 'Connecté à la base de données CPanel' }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // Exécution de requête
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      console.log('Requête SQL:', sql);
      console.log('Paramètres:', params);

      // Simulation pour le frontend
      // En production, ces requêtes seront envoyées à un backend PHP
      const mockData = this.generateMockData(sql);
      
      return {
        success: true,
        data: mockData,
        affectedRows: Array.isArray(mockData) ? mockData.length : 1
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de requête: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // Génération de données de démonstration
  private generateMockData(sql: string): any {
    const lowerSql = sql.toLowerCase();
    
    // Mock pour les entreprises
    if (lowerSql.includes('companies')) {
      return [
        {
          id: 'demo-company-1',
          name: 'Entreprise KELIOS Démo',
          email: 'demo@kelios.ma',
          phone: '+212 5XX-XXXXXX',
          address: 'Casablanca, Maroc',
          sector: 'BTP',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
    }

    // Mock pour les clients
    if (lowerSql.includes('clients')) {
      return [
        {
          id: 'demo-client-1',
          company_id: 'demo-company-1',
          name: 'Client BTP Maroc',
          email: 'client@btp.ma',
          phone: '+212 6XX-XXXXXX',
          city: 'Casablanca',
          country: 'Maroc',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-client-2',
          company_id: 'demo-company-1',
          name: 'Société Services IT',
          email: 'contact@services.ma',
          phone: '+212 7XX-XXXXXX',
          city: 'Rabat',
          country: 'Maroc',
          created_at: new Date().toISOString()
        }
      ];
    }

    // Mock pour les factures
    if (lowerSql.includes('invoices')) {
      return [
        {
          id: 'demo-invoice-1',
          company_id: 'demo-company-1',
          client_id: 'demo-client-1',
          invoice_number: 'FAC-2024-001',
          type: 'Standard',
          status: 'Payée',
          date: '2024-01-15',
          total_ttc: 12500.00,
          remaining_amount: 0.00,
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-invoice-2',
          company_id: 'demo-company-1',
          client_id: 'demo-client-2',
          invoice_number: 'FAC-2024-002',
          type: 'DevisAvecAcompte',
          status: 'En_attente',
          date: '2024-02-20',
          total_ttc: 28000.00,
          deposit_received: 8000.00,
          remaining_amount: 20000.00,
          created_at: new Date().toISOString()
        }
      ];
    }

    // Mock pour les insights IA
    if (lowerSql.includes('ai_insights')) {
      return [
        {
          id: 'demo-insight-1',
          company_id: 'demo-company-1',
          type: 'optimization',
          priority: 'high',
          title: 'Optimisation Marges BTP Maroc',
          description: 'Vos marges actuelles sont de 15% en dessous de la moyenne du secteur BTP marocain (25%).',
          impact: 'Augmentation du bénéfice net de 125K-250K DH/an',
          action: 'Revoir votre politique de prix et optimiser les coûts d\'approvisionnement',
          expected_gain: '+180K DH/an',
          implementation_steps: [
            'Analyser les prix des concurrents locaux',
            'Négocier de meilleurs tarifs avec les fournisseurs',
            'Appliquer une majoration de 8-12% sur les services premium'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-insight-2',
          company_id: 'demo-company-1',
          type: 'market_trend',
          priority: 'medium',
          title: 'Tendance Saisonnière Construction Q2-Q3',
          description: 'Le marché de la construction au Maroc connaît une forte demande en Q2-Q3.',
          impact: 'Opportunité de croissance de 40% sur 6 mois',
          action: 'Anticiper la demande et renforcer les capacités',
          expected_gain: '+35% CA',
          implementation_steps: [
            'Recruter du personnel temporaire qualifié',
            'Augmenter les stocks de matériaux de 25%',
            'Lancer une campagne marketing ciblée Q2'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
    }

    // Mock pour les métriques de performance
    if (lowerSql.includes('performance_metrics')) {
      return [
        {
          id: 'demo-metric-1',
          company_id: 'demo-company-1',
          feature_name: 'Facturation',
          metric_name: 'Taux de conversion',
          metric_value: 22.5,
          metric_unit: '%',
          recorded_at: new Date().toISOString()
        },
        {
          id: 'demo-metric-2',
          company_id: 'demo-company-1',
          feature_name: 'Gestion Clients',
          metric_name: 'Nouveaux clients',
          metric_value: 15.0,
          metric_unit: 'clients/mois',
          recorded_at: new Date().toISOString()
        }
      ];
    }

    // Retourner des données vides par défaut
    return [];
  }

  // Fermeture de connexion
  close(): void {
    if (this.connection) {
      console.log('Fermeture de la connexion à la base de données');
      this.connection = null;
    }
  }

  // Test de connexion
  async testConnection(): Promise<QueryResult> {
    return this.connect();
  }
}

// Instance du client
export const dbClient = new MySQLCPanelClient();

// Fonctions utilitaires
export const db = {
  // Exécution d'une requête
  query: (sql: string, params?: any[]) => dbClient.query(sql, params),
  
  // Insertion
  insert: async (table: string, data: any): Promise<QueryResult> => {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    return dbClient.query(sql, values);
  },

  // Sélection
  select: async (table: string, where?: string, params?: any[]): Promise<QueryResult> => {
    let sql = `SELECT * FROM ${table}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    return dbClient.query(sql, params || []);
  },

  // Mise à jour
  update: async (table: string, data: any, where: string, params?: any[]): Promise<QueryResult> => {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...(params || [])];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    return dbClient.query(sql, values);
  },

  // Suppression
  delete: async (table: string, where: string, params?: any[]): Promise<QueryResult> => {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    return dbClient.query(sql, params || []);
  }
};

export default MySQLCPanelClient;
