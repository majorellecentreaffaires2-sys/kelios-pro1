import React, { useState } from 'react';
import {
  FileText, Plus, Save, Printer, Copy, Trash2, Users,
  Settings, BarChart3, Calculator, Home, ShoppingCart,
  Star, FileEdit, FolderOpen, RefreshCw, Download, Eye, Pencil, Building2
} from 'lucide-react';

interface TopMenuProps {
  onAction: (id: string) => void;
  trialDaysLeft?: number | null;
  onUpgrade?: () => void;
}

interface RibbonButton {
  icon: React.ReactNode;
  label: string;
  action: string;
  size?: 'large' | 'small';
}

const TopMenu: React.FC<TopMenuProps> = ({ onAction, trialDaysLeft, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState('accueil');

  // Favorites - Quick access actions
  const favorites: RibbonButton[] = [
    { icon: <FileText className="w-5 h-5" />, label: 'Nouvelle Facture', action: 'create', size: 'large' },
    { icon: <FileEdit className="w-5 h-5" />, label: 'Nouveau Devis', action: 'nouveau-devis', size: 'large' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Coordonnées', action: 'coordonnees', size: 'large' },
    { icon: <Users className="w-5 h-5" />, label: 'Clients', action: 'clients', size: 'large' },
  ];

  // Ribbon tabs configuration
  const ribbonTabs = {
    accueil: {
      label: 'Accueil',
      groups: [
        {
          title: 'Nouveau',
          buttons: [
            { icon: <FileText className="w-6 h-6" />, label: 'Facture', action: 'create', size: 'large' as const },
            { icon: <FileEdit className="w-6 h-6" />, label: 'Devis', action: 'nouveau-devis', size: 'large' as const },
          ]
        },
        {
          title: 'Actions',
          buttons: [
            { icon: <Copy className="w-5 h-5" />, label: 'Dupliquer', action: 'duplicate', size: 'small' as const },
            { icon: <Trash2 className="w-5 h-5" />, label: 'Supprimer', action: 'delete', size: 'small' as const },
            { icon: <Save className="w-5 h-5" />, label: 'Enregistrer', action: 'save', size: 'small' as const },
          ]
        },
        {
          title: 'Impression',
          buttons: [
            { icon: <Printer className="w-6 h-6" />, label: 'Imprimer', action: 'print', size: 'large' as const },
            { icon: <Download className="w-5 h-5" />, label: 'Exporter', action: 'export', size: 'small' as const },
          ]
        },
      ]
    },
    ventes: {
      label: 'Ventes',
      groups: [
        {
          title: 'Documents',
          buttons: [
            { icon: <FileText className="w-6 h-6" />, label: 'Liste', action: 'ventes', size: 'large' as const },
            { icon: <FolderOpen className="w-6 h-6" />, label: 'Historique', action: 'history', size: 'large' as const },
          ]
        },
        {
          title: 'Clients',
          buttons: [
            { icon: <Users className="w-6 h-6" />, label: 'Fiches', action: 'clients', size: 'large' as const },
            { icon: <Plus className="w-5 h-5" />, label: 'Nouveau', action: 'new-client', size: 'small' as const },
          ]
        },
        {
          title: 'Analyse',
          buttons: [
            { icon: <BarChart3 className="w-6 h-6" />, label: 'Reporting', action: 'reporting', size: 'large' as const },
          ]
        },
      ]
    },
    outils: {
      label: 'Outils',
      groups: [
        {
          title: 'Configuration',
          buttons: [
            { icon: <Settings className="w-6 h-6" />, label: 'TVA', action: 'tva', size: 'large' as const },
            { icon: <FileEdit className="w-6 h-6" />, label: 'Coordonnées', action: 'coordonnees', size: 'large' as const },
            { icon: <ShoppingCart className="w-6 h-6" />, label: 'Articles', action: 'articles', size: 'large' as const },
          ]
        },
        {
          title: 'Utilitaires',
          buttons: [
            { icon: <Calculator className="w-6 h-6" />, label: 'Calculatrice', action: 'tools', size: 'large' as const },
            { icon: <RefreshCw className="w-5 h-5" />, label: 'Actualiser', action: 'refresh', size: 'small' as const },
          ]
        },
      ]
    },
  };

  const currentTab = ribbonTabs[activeTab as keyof typeof ribbonTabs];

  return (
    <div className="bg-[var(--ribbon-bg)] border-b border-[var(--ribbon-border)] z-[100] no-print">
      {/* Tabs Row */}
      <div className="flex items-end px-2 pt-1 gap-0.5">
        {/* Favorites Section */}
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-t-md mr-2">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-bold uppercase">Favoris</span>
        </div>

        {Object.entries(ribbonTabs).map(([key, tab]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 text-[11px] font-semibold rounded-t-md transition-colors ${activeTab === key
              ? 'bg-white text-[var(--ribbon-tab-active-text)] border-t border-x border-[var(--ribbon-border)]'
              : 'text-[var(--ribbon-tab-text)] hover:bg-gray-200'
              }`}
          >
            {tab.label}
          </button>
        ))}

        {trialDaysLeft !== undefined && trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="ml-auto flex items-center gap-3 px-4 py-1 bg-amber-50 rounded-t-lg border-t border-x border-amber-100/50 mr-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
              Essai : <span className="font-black">{trialDaysLeft}j restants</span>
            </span>
            <button
              onClick={onUpgrade}
              className="px-2 py-0.5 bg-amber-600 text-white text-[9px] font-black uppercase rounded hover:bg-amber-700 transition-colors"
            >
              🚀 Upgrade
            </button>
          </div>
        )}

        <button
          onClick={() => onAction('exit')}
          className={`${trialDaysLeft ? "" : "ml-auto"} px-4 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-t-md transition-colors`}
        >
          Quitter
        </button>
      </div>

      {/* Ribbon Toolbar */}
      <div className="bg-white border-t border-[var(--ribbon-border)] px-3 py-2 flex items-start gap-6">
        {/* Favorites Quick Access */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          {favorites.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onAction(btn.action)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors group"
              title={btn.label}
            >
              <div className="text-blue-600 group-hover:text-blue-700">{btn.icon}</div>
              <span className="text-[9px] font-semibold text-gray-600 group-hover:text-blue-700">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Current Tab Groups */}
        {currentTab.groups.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {group.buttons.map((btn, bIdx) => (
                <button
                  key={bIdx}
                  onClick={() => onAction(btn.action)}
                  className={`flex flex-col items-center gap-1 hover:bg-gray-100 rounded-md transition-colors group ${btn.size === 'large' ? 'px-4 py-2' : 'px-3 py-1.5'
                    }`}
                  title={btn.label}
                >
                  <div className="text-gray-700 group-hover:text-blue-600">{btn.icon}</div>
                  <span className={`font-semibold text-gray-600 group-hover:text-blue-700 ${btn.size === 'large' ? 'text-[10px]' : 'text-[9px]'
                    }`}>
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-[9px] text-gray-400 font-semibold text-center border-t border-gray-100 pt-0.5">
              {group.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopMenu;
