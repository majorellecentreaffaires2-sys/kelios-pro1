import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  ShoppingCart, 
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  Truck,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface DashboardProps {
  user?: any;
  shortcuts?: any[];
  onShortcut?: (shortcut: any) => void;
}

const handleExportReport = () => {
    // Créer le contenu CSV
    const csvContent = [
      ['Métrique', 'Valeur'],
      ['Chiffre d\'affaires', `${stats.totalRevenue.toLocaleString()} DH`],
      ['Dépenses totales', `${stats.totalExpenses.toLocaleString()} DH`],
      ['Nombre de clients', stats.totalCustomers.toString()],
      ['Nombre de commandes', stats.totalOrders.toString()],
      ['Factures en attente', stats.pendingInvoices.toString()],
      ['Factures en retard', stats.overdueInvoices.toString()],
      ['Produits en stock faible', stats.lowStockProducts.toString()],
      ['Factures payées', stats.paymentStatus.paid.toString()],
      ['Factures en attente de paiement', stats.paymentStatus.pending.toString()],
      ['Factures en retard de paiement', stats.paymentStatus.overdue.toString()]
    ].map(row => row.join(',')).join('\n');

    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const Dashboard: React.FC<DashboardProps> = ({ user, shortcuts, onShortcut }) => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    lowStockProducts: 0,
    recentOrders: [],
    recentInvoices: [],
    monthlyRevenue: [],
    topProducts: [],
    paymentStatus: {
      paid: 0,
      pending: 0,
      overdue: 0
    }
  });
  
  const [previousStats, setPreviousStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalCustomers: 0,
    totalOrders: 0
  });

  useEffect(() => {
    // Charger les données du dashboard
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simuler la récupération des données précédentes pour calculer les variations
      const previousData = {
        totalRevenue: 0,
        totalExpenses: 0,
        totalCustomers: 0,
        totalOrders: 0
      };
      
      // Données réelles - à remplacer par des vrais appels API
      // Les données restent à zéro jusqu'à l'intégration avec l'API
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        totalCustomers: 0,
        totalOrders: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        lowStockProducts: 0,
        recentOrders: [],
        recentInvoices: [],
        monthlyRevenue: [],
        topProducts: [],
        paymentStatus: {
          paid: 0,
          pending: 0,
          overdue: 0
        }
      });
      
      setPreviousStats(previousData);
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard:', error);
    }
  };

  // Calculer les pourcentages de variation
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = calculatePercentageChange(stats.totalRevenue, previousStats.totalRevenue);
  const expensesChange = calculatePercentageChange(stats.totalExpenses, previousStats.totalExpenses);
  const customersChange = calculatePercentageChange(stats.totalCustomers, previousStats.totalCustomers);
  const ordersChange = calculatePercentageChange(stats.totalOrders, previousStats.totalOrders);

  const StatCard = ({ title, value, icon: Icon, change, changeType, color = 'blue' }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change && (
          <div className={`flex items-center text-sm ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
            {change}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );

  const RecentOrdersTable = ({ orders }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes récentes</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">N° Commande</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Montant</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">#{order.id}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{order.customer}</td>
                <td className="py-3 px-4 text-sm text-gray-900">{order.amount.toLocaleString()} DH</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'LIVREE' ? 'bg-green-100 text-green-800' :
                    order.status === 'EXPEDIEE' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PaymentStatusChart = ({ data }: any) => {
    const total = data.paid + data.pending + data.overdue;
    const paidPercentage = (data.paid / total) * 100;
    const pendingPercentage = (data.pending / total) * 100;
    const overduePercentage = (data.overdue / total) * 100;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des paiements</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Payés</span>
              <span className="text-sm font-medium text-gray-900">{data.paid}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${paidPercentage}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">En attente</span>
              <span className="text-sm font-medium text-gray-900">{data.pending}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${pendingPercentage}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">En retard</span>
              <span className="text-sm font-medium text-gray-900">{data.overdue}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: `${overduePercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {user?.role || 'Utilisateur'}
          </div>
          <button 
            onClick={handleExportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Exporter le rapport
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Chiffre d'affaires" 
          value={`${stats.totalRevenue.toLocaleString()} DH`} 
          icon={DollarSign} 
          change={Math.abs(revenueChange)} 
          changeType={revenueChange >= 0 ? 'positive' : 'negative'}
          color="blue"
        />
        <StatCard 
          title="Dépenses" 
          value={`${stats.totalExpenses.toLocaleString()} DH`} 
          icon={TrendingDown} 
          change={Math.abs(expensesChange)} 
          changeType={expensesChange >= 0 ? 'positive' : 'negative'}
          color="red"
        />
        <StatCard 
          title="Clients" 
          value={stats.totalCustomers} 
          icon={Users} 
          change={Math.abs(customersChange)} 
          changeType={customersChange >= 0 ? 'positive' : 'negative'}
          color="green"
        />
        <StatCard 
          title="Commandes" 
          value={stats.totalOrders} 
          icon={ShoppingCart} 
          change={Math.abs(ordersChange)} 
          changeType={ordersChange >= 0 ? 'positive' : 'negative'}
          color="purple"
        />
      </div>

      {/* Alertes */}
      {(stats.overdueInvoices > 0 || stats.lowStockProducts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.overdueInvoices > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {stats.overdueInvoices} facture(s) en retard
                  </p>
                  <p className="text-xs text-red-700">Action requise</p>
                </div>
              </div>
            </div>
          )}
          {stats.lowStockProducts > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {stats.lowStockProducts} produit(s) en stock faible
                  </p>
                  <p className="text-xs text-yellow-700">Réapprovisionnement nécessaire</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={stats.recentOrders} />
        </div>
        <div>
          <PaymentStatusChart data={stats.paymentStatus} />
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du chiffre d'affaires</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {stats.monthlyRevenue.map((month: any, index: number) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-600 rounded-t-lg hover:bg-blue-700 transition-colors"
                style={{ height: `${(month.revenue / 26000) * 100}%` }}
                title={`${month.month}: ${month.revenue.toLocaleString()} DH`}
              ></div>
              <span className="text-xs text-gray-600 mt-2">{month.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits les plus vendus</h3>
        <div className="space-y-3">
          {stats.topProducts.map((product: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} ventes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{product.revenue.toLocaleString()} DH</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
