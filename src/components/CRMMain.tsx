import React, { useState, useEffect } from 'react';
import CRMLayout from './CRMLayout';
import Dashboard from './pages/Dashboard';
import CustomerManagement from './pages/CustomerManagement';
import SupplierManagement from './pages/SupplierManagement';
import ProductManagement from './pages/ProductManagement';
import InvoiceManagement from './pages/InvoiceManagement';
import QuoteManagement from './pages/QuoteManagement';
import ProformaManagement from './pages/ProformaManagement';
import CreditManagement from './pages/CreditManagement';
import OrderManagement from './pages/OrderManagement';
import SalesManagement from './pages/SalesManagement';
import StockManagement from './pages/StockManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import PaymentTracking from './pages/PaymentTracking';
import ProjectManagement from './pages/ProjectManagement';
import Reporting from './pages/Reporting';
import Audit from './pages/Audit';
import Settings from './pages/Settings';

const CRMMain: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userSubscription, setUserSubscription] = useState('GRATUIT');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Vérifier l'abonnement de l'utilisateur au chargement
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/status');
        const data = await response.json();
        setUserSubscription(data.plan || 'GRATUIT');
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'abonnement:', error);
      }
    };
    checkSubscription();
  }, []);

  // Fonction pour vérifier si une fonctionnalité est disponible selon l'abonnement
  const isFeatureAvailable = (feature: string): boolean => {
    const features = {
      GRATUIT: ['dashboard', 'customers', 'invoices', 'quotes', 'settings'],
      STARTER: ['dashboard', 'customers', 'suppliers', 'products', 'invoices', 'quotes', 'proformas', 'orders', 'sales', 'settings'],
      PROFESSIONNEL: ['dashboard', 'customers', 'suppliers', 'products', 'invoices', 'quotes', 'proformas', 'credits', 'orders', 'sales', 'stock', 'expenses', 'payments', 'projects', 'reporting', 'settings'],
      ENTREPRISE: ['dashboard', 'customers', 'suppliers', 'products', 'invoices', 'quotes', 'proformas', 'credits', 'orders', 'sales', 'stock', 'expenses', 'payments', 'projects', 'reporting', 'audit', 'settings'],
      PERSONNALISE: ['dashboard', 'customers', 'suppliers', 'products', 'invoices', 'quotes', 'proformas', 'credits', 'orders', 'sales', 'stock', 'expenses', 'payments', 'projects', 'reporting', 'audit', 'settings']
    };
    return features[userSubscription as keyof typeof features]?.includes(feature) || false;
  };

  // Fonction pour gérer le changement de page
  const handlePageChange = (page: string) => {
    if (!isFeatureAvailable(page)) {
      setShowUpgradeModal(true);
      return;
    }
    setCurrentPage(page);
  };

  // Rendu de la page actuelle
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userSubscription={userSubscription} />;
      case 'customers':
        return <CustomerManagement />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'products':
        return <ProductManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'quotes':
        return <QuoteManagement />;
      case 'proformas':
        return <ProformaManagement />;
      case 'credits':
        return <CreditManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'stock':
        return <StockManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'payments':
        return <PaymentTracking />;
      case 'projects':
        return <ProjectManagement />;
      case 'reporting':
        return <Reporting />;
      case 'audit':
        return <Audit />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard userSubscription={userSubscription} />;
    }
  };

  // Modal d'upgrade
  const UpgradeModal = () => {
    if (!showUpgradeModal) return null;

    const plans = [
      {
        name: 'STARTER',
        price: '29€',
        period: '/mois',
        features: [
          'Gestion clients et fournisseurs',
          'Facturation et devis',
          'Factures proforma',
          'Bons de commande',
          'Gestion des ventes',
          'Support email'
        ]
      },
      {
        name: 'PROFESSIONNEL',
        price: '79€',
        period: '/mois',
        features: [
          'Tout le plan Starter',
          'Avoirs et notes de crédit',
          'Gestion de stock complète',
          'Suivi des dépenses',
          'Gestion des paiements',
          'Gestion de projets',
          'Reporting avancé',
          'Support prioritaire'
        ]
      },
      {
        name: 'ENTREPRISE',
        price: '199€',
        period: '/mois',
        features: [
          'Tout le plan Professionnel',
          'Audit et conformité',
          'API personnalisée',
          'Intégrations avancées',
          'Formation dédiée',
          'Account manager',
          'SLA garanti'
        ]
      }
    ];

    const handleUpgrade = (plan: string, paymentMethod: string) => {
      // Logique d'upgrade avec la méthode de paiement
      console.log(`Upgrade vers ${plan} avec ${paymentMethod}`);
      setShowUpgradeModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upgradez votre abonnement</h2>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <div key={plan.name} className="border border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <button
                    onClick={() => handleUpgrade(plan.name, 'Virement')}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Virement bancaire
                  </button>
                  <button
                    onClick={() => handleUpgrade(plan.name, 'Carte')}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Carte bancaire
                  </button>
                  <button
                    onClick={() => handleUpgrade(plan.name, 'Especes')}
                    className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Espèces
                  </button>
                  <button
                    onClick={() => handleUpgrade(plan.name, 'Cheque')}
                    className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Chèque
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMLayout currentPage={currentPage} onPageChange={handlePageChange}>
        {renderCurrentPage()}
      </CRMLayout>
      <UpgradeModal />
    </div>
  );
};

export default CRMMain;
