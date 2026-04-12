import React from 'react';
import { UpgradePlan, UpgradePayment } from '../types';
import { CreditCard, Building2, Smartphone, DollarSign } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (payment: UpgradePayment) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  const plans: UpgradePlan[] = [
    {
      name: 'Pro Mensuel',
      price: '200',
      period: 'DH HT/mois',
      features: [
        'Facturation Illimitée & Devis illimités',
        'Gestion Clients & Articles Illimités',
        'Support Prioritaire Support VIP 24/7',
        'Intelligence Artificielle (Gemini Pro)',
        'Sauvegarde Cloud Haute Disponibilité',
        'Multi-sociétés Jusqu\'à 5 entités',
        'Rapports Financiers Avancés',
        'Personnalisation Totale des Modèles'
      ]
    },
    {
      name: 'Pro Annuel',
      price: '2200',
      period: 'DH HT/an',
      features: [
        'Facturation Illimitée & Devis illimités',
        'Gestion Clients & Articles Illimités',
        'Support Prioritaire Support VIP 24/7',
        'Intelligence Artificielle (Gemini Pro)',
        'Sauvegarde Cloud Haute Disponibilité',
        'Multi-sociétés Jusqu\'à 5 entités',
        'Rapports Financiers Avancés',
        'Personnalisation Totale des Modèles',
        'Économisez 20% par rapport au mensuel'
      ]
    }
  ];

  const additionalOptions = [
    {
      name: 'Société Supplémentaire Mensuelle',
      price: '150',
      period: 'DH HT/mois par société',
      description: 'Ajoutez une société supplémentaire à votre abonnement mensuel',
      features: [
        'Toutes les fonctionnalités Pro',
        'Gestion multi-sociétés',
        'Rapports consolidés',
        'Support dédié'
      ]
    },
    {
      name: 'Société Supplémentaire Annuelle',
      price: '1600',
      period: 'DH HT/an par société',
      description: 'Ajoutez une société supplémentaire à votre abonnement annuel',
      features: [
        'Toutes les fonctionnalités Pro',
        'Gestion multi-sociétés',
        'Rapports consolidés',
        'Support dédié',
        'Économisez 13% par rapport au mensuel'
      ]
    }
  ];

  const paymentMethods = [
    { 
      method: 'Virement' as const, 
      icon: Building2, 
      color: 'blue',
      description: 'Virement bancaire classique'
    },
    { 
      method: 'Carte' as const, 
      icon: CreditCard, 
      color: 'green',
      description: 'Paiement par carte bancaire'
    },
    { 
      method: 'Especes' as const, 
      icon: DollarSign, 
      color: 'yellow',
      description: 'Paiement en espèces'
    },
    { 
      method: 'Cheque' as const, 
      icon: Building2, 
      color: 'purple',
      description: 'Paiement par chèque'
    }
  ];

  const handlePayment = (plan: UpgradePlan | any, method: 'Virement' | 'Carte' | 'Especes' | 'Cheque', isAdditionalOption: boolean = false) => {
    const payment: UpgradePayment = {
      plan: plan.name,
      method,
      amount: plan.name === 'Pro Mensuel' ? 200 : plan.name === 'Pro Annuel' ? 2200 : 
              plan.name === 'Société Supplémentaire Mensuelle' ? 150 : 1600
    };
    onUpgrade(payment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Upgradez votre abonnement</h2>
            <p className="text-gray-600">Choisissez le plan qui correspond à vos besoins</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan, index) => (
            <div key={plan.name} className={`relative rounded-2xl p-6 border-2 ${
              index === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
            } hover:shadow-lg transition-shadow`}>
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Économisez 20%
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Payment Methods */}
              <div className="space-y-2">
                {paymentMethods.map((payment) => (
                  <button
                    key={payment.method}
                    onClick={() => handlePayment(plan, payment.method)}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2
                      ${payment.color === 'blue' ? 'border-blue-600 text-blue-600 hover:bg-blue-50' :
                        payment.color === 'green' ? 'border-green-600 text-green-600 hover:bg-green-50' :
                        payment.color === 'yellow' ? 'border-yellow-600 text-yellow-700 hover:bg-yellow-50' :
                        'border-purple-600 text-purple-600 hover:bg-purple-50'}
                    `}
                  >
                    <payment.icon className="w-4 h-4" />
                    <span className="font-medium">{payment.method}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Options Section */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-800 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Options Supplémentaires
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalOptions.map((option, index) => (
              <div key={option.name} className="bg-white rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{option.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-purple-600">{option.price}</span>
                    <span className="text-gray-500 text-sm">{option.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <svg className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Payment Methods for Additional Options */}
                <div className="space-y-2">
                  {paymentMethods.map((payment) => (
                    <button
                      key={payment.method}
                      onClick={() => handlePayment(option, payment.method, true)}
                      className={`w-full py-2 px-3 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm
                        ${payment.color === 'blue' ? 'border-purple-600 text-purple-600 hover:bg-purple-50' :
                          payment.color === 'green' ? 'border-green-600 text-green-600 hover:bg-green-50' :
                          payment.color === 'yellow' ? 'border-yellow-600 text-yellow-700 hover:bg-yellow-50' :
                          'border-purple-600 text-purple-600 hover:bg-purple-50'}
                      `}
                    >
                      <payment.icon className="w-3 h-3" />
                      <span className="font-medium">{payment.method}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Info */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de paiement disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((payment) => (
              <div key={payment.method} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                  ${payment.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    payment.color === 'green' ? 'bg-green-100 text-green-600' :
                    payment.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-purple-100 text-purple-600'}
                `}>
                  <payment.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{payment.method}</p>
                  <p className="text-xs text-gray-500">{payment.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Tous les plans incluent l'accès complet à toutes les fonctionnalités. Annulation à tout moment.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Peut-être plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
