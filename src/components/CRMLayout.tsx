import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Package, 
  ShoppingCart, 
  Users, 
  ChartBar, 
  FolderOpen, 
  CreditCard, 
  Truck, 
  Calculator, 
  Search, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  TrendingUp,
  Database,
  Receipt,
  DollarSign,
  Briefcase,
  Target,
  FileSearch,
  Shield
} from 'lucide-react';

interface CRMLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const CRMLayout: React.FC<CRMLayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    // Tableau de bord
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, section: 'principal' },
    { id: 'reporting', label: 'Reporting', icon: ChartBar, section: 'principal' },
    
    // Gestion commerciale
    { id: 'customers', label: 'Clients', icon: Users, section: 'commercial' },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck, section: 'commercial' },
    { id: 'products', label: 'Articles/Produits', icon: Package, section: 'commercial' },
    
    // Documents
    { id: 'invoices', label: 'Factures', icon: FileText, section: 'documents' },
    { id: 'quotes', label: 'Devis', icon: FileText, section: 'documents' },
    { id: 'proformas', label: 'Factures Proforma', icon: FileText, section: 'documents' },
    { id: 'credits', label: 'Avoirs', icon: FileText, section: 'documents' },
    { id: 'orders', label: 'Bons de commande', icon: ShoppingCart, section: 'documents' },
    
    // Opérations
    { id: 'sales', label: 'Ventes', icon: TrendingUp, section: 'operations' },
    { id: 'stock', label: 'Gestion de stock', icon: Database, section: 'operations' },
    { id: 'expenses', label: 'Dépenses', icon: Receipt, section: 'operations' },
    { id: 'payments', label: 'Suivi des paiements', icon: CreditCard, section: 'operations' },
    
    // Projets
    { id: 'projects', label: 'Gestion de projets', icon: Briefcase, section: 'projets' },
    
    // Administration
    { id: 'audit', label: 'Audit', icon: Shield, section: 'administration' },
    { id: 'settings', label: 'Paramètres', icon: Settings, section: 'administration' },
  ];

  const sections = [
    { id: 'principal', label: 'Principal' },
    { id: 'commercial', label: 'Gestion Commerciale' },
    { id: 'documents', label: 'Documents' },
    { id: 'operations', label: 'Opérations' },
    { id: 'projets', label: 'Projets' },
    { id: 'administration', label: 'Administration' },
  ];

  const groupedMenuItems = sections.map(section => ({
    ...section,
    items: menuItems.filter(item => item.section === section.id)
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
              <Building2 className="w-8 h-8 text-blue-600" />
              {sidebarOpen && (
                <span className="ml-3 text-xl font-bold text-gray-900">CRM Pro</span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {groupedMenuItems.map(section => (
              <div key={section.id}>
                {sidebarOpen && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onPageChange(item.id)}
                      className={`w-full flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2 rounded-lg transition-colors ${
                        currentPage === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <item.icon className={`w-5 h-5 ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
                      {sidebarOpen && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button 
              className="w-full flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => item.id === currentPage)?.label || 'Tableau de bord'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  U
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Utilisateur</p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CRMLayout;
