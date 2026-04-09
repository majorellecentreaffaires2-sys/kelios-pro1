import React, { useState } from 'react';
import {
  FileText, Plus, Save, Printer, Copy, Trash2, Users,
  Settings, BarChart3, Calculator, Home, ShoppingCart,
  Star, FileEdit, FolderOpen, RefreshCw, Download, Eye, Pencil, Building2, LogOut, CheckCircle
} from 'lucide-react';
import NotificationBell from './NotificationBell';

interface TopMenuProps {
  onAction: (id: string) => void;
  trialDaysLeft?: number | null;
  subscriptionDaysLeft?: number | null;
  subscriptionStatus?: string;
  onUpgrade?: () => void;
  user?: any;
  appActiveTab?: string;
  isProgramMode?: boolean;
}

interface RibbonButton {
  icon: React.ReactNode;
  label: string;
  action: string;
  size?: 'large' | 'small';
}

const TopMenu: React.FC<TopMenuProps> = ({ onAction, trialDaysLeft, subscriptionDaysLeft, subscriptionStatus, onUpgrade, user, appActiveTab, isProgramMode }) => {
  const [activeTab, setActiveTab] = useState('accueil');
  const [showProfile, setShowProfile] = useState(false);

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

        {/* Active Subscription Section */}
        {subscriptionStatus === 'active' && subscriptionDaysLeft !== undefined && subscriptionDaysLeft !== null && subscriptionDaysLeft > 0 && (
          <div className="ml-auto flex items-center gap-3 px-4 py-1 bg-blue-50 rounded-t-lg border-t border-x border-blue-100/50 mr-2">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
              Abonnement : <span className="font-black">{subscriptionDaysLeft}j restants</span>
            </span>
            <button
              onClick={onUpgrade}
              className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded hover:bg-blue-700 transition-colors"
            >
              🔄 Renouveler
            </button>
          </div>
        )}

        {/* Free User Section */}
        {trialDaysLeft === undefined || trialDaysLeft === null || trialDaysLeft <= 0 ? (
          <div className="ml-auto flex items-center gap-3 px-4 py-1 bg-green-50 rounded-t-lg border-t border-x border-green-100/50 mr-2">
            <Star className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">
              Version <span className="font-black">Gratuite</span>
            </span>
            <button
              onClick={onUpgrade}
              className="px-2 py-0.5 bg-green-600 text-white text-[9px] font-black uppercase rounded hover:bg-green-700 transition-colors"
            >
              🚀 Upgrade
            </button>
          </div>
        ) : null}

        {/* Notification Bell */}
        <div className="ml-auto">
          <NotificationBell />
        </div>

        {/* User Profile Section */}
        <div className={`relative mr-2`}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-t-md transition-all border-t border-x border-transparent hover:border-[var(--ribbon-border)]"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
              {user?.username?.substring(0, 2) || 'UP'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[10px] font-black text-slate-700 leading-none">{user?.username}</p>
              <p className="text-[9px] text-slate-400 font-medium">{user?.email}</p>
            </div>
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-0 w-56 bg-white border border-[var(--ribbon-border)] rounded-b-xl rounded-tl-xl shadow-xl z-[120] py-2 animate-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Compte</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { onAction(appActiveTab === 'account' ? 'dashboard' : 'account'); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  {appActiveTab === 'account' ? <Home className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                  {appActiveTab === 'account' ? (isProgramMode ? 'Retour Tableau' : 'Retour Portfolio') : 'Paramètres Profil'}
                </button>
                <div className="h-px bg-slate-100 my-2" />
                <button
                  onClick={() => { onAction('exit'); setShowProfile(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
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
