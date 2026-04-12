import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  FileText, 
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Brain,
  Lightbulb,
  TrendingUpIcon,
  AlertCircle,
  ArrowUpRight,
  Star
} from 'lucide-react';
import { api } from '../../apiClient';

interface PerformanceMetrics {
  feature: string;
  totalOperations: number;
  successfulOperations: number;
  errorRate: number;
  averageProcessingTime: number;
  dailyUsage: number;
  weeklyGrowth: number;
  lastUpdated: string;
}

interface FeatureDetails {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'warning' | 'error';
  performance: number;
  usage: number;
  lastUsed: string;
  evolution: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

interface AIInsight {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'market_trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action: string;
  marketContext: 'morocco' | 'global';
  expectedGain: string;
  implementation: string[];
}

interface MarketData {
  sector: string;
  averageMargin: number;
  marketGrowth: number;
  competitionLevel: 'low' | 'medium' | 'high';
  seasonalTrends: string[];
  recommendedPrice: number;
}

const Audit: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Charger les métriques de performance
  useEffect(() => {
    loadPerformanceMetrics();
    generateAIInsights();
    loadMarketData();
  }, []);

  const loadPerformanceMetrics = async () => {
    setLoading(true);
    try {
      // Simuler des métriques de performance (à remplacer par de vrais appels API)
      const mockMetrics: PerformanceMetrics[] = [
        {
          feature: 'Facturation',
          totalOperations: 1247,
          successfulOperations: 1198,
          errorRate: 3.9,
          averageProcessingTime: 1.2,
          dailyUsage: 89,
          weeklyGrowth: 12.5,
          lastUpdated: new Date().toISOString()
        },
        {
          feature: 'Gestion Clients',
          totalOperations: 456,
          successfulOperations: 442,
          errorRate: 3.1,
          averageProcessingTime: 0.8,
          dailyUsage: 34,
          weeklyGrowth: 8.2,
          lastUpdated: new Date().toISOString()
        },
        {
          feature: 'Suivi Paiements',
          totalOperations: 892,
          successfulOperations: 876,
          errorRate: 1.8,
          averageProcessingTime: 0.6,
          dailyUsage: 67,
          weeklyGrowth: 15.3,
          lastUpdated: new Date().toISOString()
        },
        {
          feature: 'Gestion Projets',
          totalOperations: 234,
          successfulOperations: 221,
          errorRate: 5.6,
          averageProcessingTime: 2.1,
          dailyUsage: 23,
          weeklyGrowth: -2.1,
          lastUpdated: new Date().toISOString()
        },
        {
          feature: 'Gestion Stock',
          totalOperations: 1567,
          successfulOperations: 1534,
          errorRate: 2.1,
          averageProcessingTime: 0.9,
          dailyUsage: 112,
          weeklyGrowth: 6.7,
          lastUpdated: new Date().toISOString()
        },
        {
          feature: 'Reporting',
          totalOperations: 78,
          successfulOperations: 76,
          errorRate: 2.6,
          averageProcessingTime: 3.4,
          dailyUsage: 45,
          weeklyGrowth: 9.8,
          lastUpdated: new Date().toISOString()
        },
        {
          feature: 'Automatisation',
          totalOperations: 342,
          successfulOperations: 338,
          errorRate: 1.2,
          averageProcessingTime: 0.4,
          dailyUsage: 28,
          weeklyGrowth: 18.5,
          lastUpdated: new Date().toISOString()
        }
      ];

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = () => {
    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'optimization',
        priority: 'high',
        title: 'Optimisation des marges - Secteur BTP Maroc',
        description: 'Vos marges actuelles sont de 15% en dessous de la moyenne du secteur BTP marocain (25%). Le marché actuel offre une opportunité d\'amélioration de 10-15%.',
        impact: 'Augmentation du bénéfice net de 125K-250K DH/an',
        action: 'Revoir votre politique de prix et optimiser les coûts d\'approvisionnement',
        marketContext: 'morocco',
        expectedGain: '+180K DH/an',
        implementation: [
          'Analyser les prix des concurrents locaux',
          'Négocier de meilleurs tarifs avec les fournisseurs',
          'Appliquer une majoration de 8-12% sur les services premium'
        ]
      },
      {
        id: '2',
        type: 'market_trend',
        priority: 'medium',
        title: 'Tendance saisonnière - Construction Q2-Q3',
        description: 'Le marché de la construction au Maroc connaît une forte demande en Q2-Q3. Préparez-vous pour une augmentation de 35% des commandes.',
        impact: 'Opportunité de croissance de 40% sur 6 mois',
        action: 'Anticiper la demande et renforcer les capacités de production',
        marketContext: 'morocco',
        expectedGain: '+35% CA',
        implementation: [
          'Recruter du personnel temporaire qualifié',
          'Augmenter les stocks de matériaux de 25%',
          'Lancer une campagne marketing ciblée Q2'
        ]
      },
      {
        id: '3',
        type: 'warning',
        priority: 'high',
        title: 'Alerte - Taux de conversion',
        description: 'Votre taux de conversion des devis en factures est de 22%, inférieur de 8% à la moyenne sectorielle (30%). Optimisez votre processus de suivi.',
        impact: 'Perte estimée de 85K DH/mois',
        action: 'Mettre en place un système de relance automatique et personnalisée',
        marketContext: 'morocco',
        expectedGain: '+85K DH/mois',
        implementation: [
          'Configurer des relances automatiques à J+3, J+7, J+15',
          'Personnaliser les messages selon le profil client',
          'Proposer des facilités de paiement adaptées au marché marocain'
        ]
      },
      {
        id: '4',
        type: 'opportunity',
        priority: 'medium',
        title: 'Opportunité - Digitalisation BTP Maroc',
        description: 'Le gouvernement marocain pousse la digitalisation du BTP. Les entreprises qui adoptent le numérique voient leur productivité augmenter de 28%.',
        impact: 'Avantage concurrentiel significatif et accès aux marchés publics',
        action: 'Accélérer votre transformation digitale',
        marketContext: 'morocco',
        expectedGain: '+28% productivité',
        implementation: [
          'Déployer une solution de gestion de chantier mobile',
          'Numériser les processus administratifs',
          'Former les équipes aux outils digitaux'
        ]
      },
      {
        id: '5',
        type: 'optimization',
        priority: 'high',
        title: 'Optimisation fiscale - TVA BTP',
        description: 'Le secteur BTP bénéficie de taux de TVA réduits (10% vs 20%). Assurez une application correcte pour optimiser votre trésorerie.',
        impact: 'Économie fiscale de 45K DH/an',
        action: 'Vérifier l\'application des taux de TVA réduits',
        marketContext: 'morocco',
        expectedGain: '-45K DH impôts',
        implementation: [
          'Auditer les factures pour vérifier les taux appliqués',
          'Former le service comptable aux spécificités BTP',
          'Mettre en place des contrôles automatiques'
        ]
      }
    ];

    setAiInsights(insights);
  };

  const loadMarketData = () => {
    const market: MarketData[] = [
      {
        sector: 'BTP/Construction',
        averageMargin: 25,
        marketGrowth: 12,
        competitionLevel: 'medium',
        seasonalTrends: ['Fort demande Q2-Q3', 'Faible activité Q1', 'Reprise Q4'],
        recommendedPrice: 1250 // DH/m² moyen
      },
      {
        sector: 'Services IT',
        averageMargin: 35,
        marketGrowth: 18,
        competitionLevel: 'high',
        seasonalTrends: ['Forte demande année', 'Pic projets fin d\'année'],
        recommendedPrice: 850 // DH/jour moyen
      },
      {
        sector: 'Commerce/Distribution',
        averageMargin: 18,
        marketGrowth: 8,
        competitionLevel: 'high',
        seasonalTrends: ['Saisons hautes RAMADAN', 'Soldes fin d\'année'],
        recommendedPrice: 2.5 // Coefficient moyen
      }
    ];

    setMarketData(market);
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 95) return 'text-green-600';
    if (performance >= 85) return 'text-blue-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUpIcon className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'market_trend': return <TrendingUp className="w-5 h-5 text-blue-600" />;
      default: return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const filteredMetrics = metrics.filter(metric => 
    metric.feature.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFeatureDetails = (featureName: string): FeatureDetails => {
    const metric = metrics.find(m => m.feature === featureName);
    if (!metric) return null;

    return {
      name: featureName,
      description: getDescriptionForFeature(featureName),
      icon: getIconForFeature(featureName),
      status: metric.errorRate < 2 ? 'active' : metric.errorRate < 5 ? 'warning' : 'error',
      performance: ((metric.successfulOperations / metric.totalOperations) * 100),
      usage: metric.dailyUsage,
      lastUsed: new Date(metric.lastUpdated).toLocaleString(),
      evolution: {
        daily: [45, 52, 48, 61, 58, 72], // Simulé
        weekly: [320, 345, 336, 378, 401, 412], // Simulé
        monthly: [1200, 1450, 1380, 1550, 1670, 1890] // Simulé
      }
    };
  };

  const getDescriptionForFeature = (feature: string): string => {
    const descriptions: { [key: string]: string } = {
      'Facturation': 'Gestion complète des factures, devis et acomptes avec génération PDF automatique',
      'Gestion Clients': 'CRM intégré avec suivi des interactions et historique complet',
      'Suivi Paiements': 'Suivi en temps réel des paiements, échéanciers et rapprochement bancaire',
      'Gestion Projets': 'Planification et suivi des projets avec affectation des ressources et gestion des tâches',
      'Gestion Stock': 'Gestion multi-dépôts avec suivi des mouvements et alertes de stock',
      'Reporting': 'Tableaux de bord analytiques avec export multi-formats et visualisation des données',
      'Automatisation': 'Règles métier automatisées avec workflows personnalisés et IA intégrée'
    };
    return descriptions[feature] || 'Module de gestion';
  };

  const getIconForFeature = (feature: string): React.ReactNode => {
    const icons: { [key: string]: React.ReactNode } = {
      'Facturation': <FileText className="w-6 h-6" />,
      'Gestion Clients': <Users className="w-6 h-6" />,
      'Suivi Paiements': <DollarSign className="w-6 h-6" />,
      'Gestion Projets': <Target className="w-6 h-6" />,
      'Gestion Stock': <BarChart3 className="w-6 h-6" />,
      'Reporting': <PieChart className="w-6 h-6" />,
      'Automatisation': <Zap className="w-6 h-6" />
    };
    return icons[feature] || <Activity className="w-6 h-6" />;
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simuler une analyse IA (à remplacer par de vrais appels API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Générer de nouveaux insights basés sur les données actuelles
      generateAIInsights();
    } catch (error) {
      console.error('Erreur lors de l\'analyse IA:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            Audit IA - Conseil Maroc
          </h1>
          <p className="text-gray-500">Intelligence artificielle spécialisée pour optimiser vos performances sur le marché marocain</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAIAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
          </button>
          <button
            onClick={loadPerformanceMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Conseils IA prioritaires */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Conseils IA - Marché Marocain</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiInsights.map((insight) => (
            <div 
              key={insight.id}
              className={`p-4 rounded-lg border-2 ${getPriorityColor(insight.priority)} hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getInsightIcon(insight.type)}
                <h3 className="font-semibold text-gray-900 text-sm">{insight.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {insight.priority === 'high' ? 'Urgent' : 
                   insight.priority === 'medium' ? 'Important' : 'Conseil'}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Gain: {insight.expectedGain}</span>
                </div>
                
                <div className="bg-white p-2 rounded border">
                  <p className="text-xs font-medium text-gray-900 mb-1">Action recommandée:</p>
                  <p className="text-xs text-gray-700">{insight.action}</p>
                </div>
                
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-900 mb-1">Implémentation:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {insight.implementation.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une fonctionnalité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Tableau de bord principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vue d'ensemble */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Vue d'ensemble</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredMetrics.slice(0, 8).map((metric, index) => (
              <div 
                key={metric.feature}
                onClick={() => setSelectedFeature(metric.feature)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedFeature === metric.feature 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getIconForFeature(metric.feature)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{metric.feature}</h3>
                      <p className={`text-sm ${getPerformanceColor(metric.performance)}`}>
                        {metric.performance.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(metric.errorRate < 2 ? 'active' : metric.errorRate < 5 ? 'warning' : 'error')}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opérations</span>
                    <span className="font-medium">{metric.totalOperations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Succès</span>
                    <span className="font-medium text-green-600">{metric.successfulOperations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Erreurs</span>
                    <span className="font-medium text-red-600">{metric.totalOperations - metric.successfulOperations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Temps moyen</span>
                    <span className="font-medium">{metric.averageProcessingTime}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Utilisation/jour</span>
                    <span className="font-medium">{metric.dailyUsage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails de la fonctionnalité sélectionnée */}
        {selectedFeature && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Détails: {selectedFeature}</h2>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const details = getFeatureDetails(selectedFeature);
              if (!details) return null;
              
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    {details.icon}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{details.name}</h3>
                      <p className="text-gray-600 mt-1">{details.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                      <div className="text-3xl font-bold text-gray-900">
                        {details.performance.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Taux de succès: {((details.performance / 100) * details.usage).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Utilisation</h4>
                      <div className="text-3xl font-bold text-gray-900">
                        {details.usage}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">opérations ce {dateRange}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Dernière activité</h4>
                      <div className="text-sm text-gray-900">
                        {new Date(details.lastUsed).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Évolution */}
                  <div className="md:col-span-3 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Évolution sur 7 jours</h4>
                    <div className="h-32 flex items-end gap-2">
                      {details.evolution.daily.map((value, index) => (
                        <div key={index} className="flex-1">
                          <div 
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${(value / Math.max(...details.evolution.daily)) * 100}%` }}
                          />
                          <div className="text-xs text-center mt-1 text-gray-600">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Min: {Math.min(...details.evolution.daily)}</span>
                      <span>Max: {Math.max(...details.evolution.daily)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Données de marché Maroc */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          Données de Marché - Maroc
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketData.map((sector, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{sector.sector}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Marge moyenne</span>
                  <span className="font-medium text-green-600">{sector.averageMargin}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Croissance marché</span>
                  <span className="font-medium text-blue-600">+{sector.marketGrowth}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Concurrence</span>
                  <span className={`font-medium ${
                    sector.competitionLevel === 'low' ? 'text-green-600' :
                    sector.competitionLevel === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {sector.competitionLevel === 'low' ? 'Faible' :
                     sector.competitionLevel === 'medium' ? 'Moyenne' :
                     'Élevée'}
                  </span>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Tendances saisonnières:</p>
                  <div className="flex flex-wrap gap-1">
                    {sector.seasonalTrends.map((trend, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {trend}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicateurs de performance globaux */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Indicateurs globaux</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {metrics.reduce((sum, m) => sum + m.totalOperations, 0)}
            </div>
            <p className="text-sm text-gray-600">Opérations totales</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {metrics.reduce((sum, m) => sum + m.successfulOperations, 0)}
            </div>
            <p className="text-sm text-gray-600">Opérations réussies</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {(metrics.reduce((sum, m) => sum + m.totalOperations, 0) * 
                (metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length)).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Taux d'erreur moyen</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {(metrics.reduce((sum, m) => sum + m.averageProcessingTime, 0) / metrics.length).toFixed(1)}s
            </div>
            <p className="text-sm text-gray-600">Temps de réponse moyen</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
