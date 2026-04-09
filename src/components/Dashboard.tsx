
import React, { useMemo, useState, useEffect } from 'react';
import { Invoice, Shortcut } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, FileText, CheckCircle, Clock, Zap, PlusCircle, LayoutList, UserPlus, FileEdit, AlertTriangle, Send, Percent, Bell, CalendarClock, ArrowRight, Users, CreditCard, Crown, X } from 'lucide-react';
import { api } from '../apiClient';

interface DashboardProps {
  invoices: Invoice[];
  shortcuts?: Shortcut[];
  onShortcut?: (actionId: string) => void;
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, shortcuts = [], onShortcut, user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [additionalCompanies, setAdditionalCompanies] = useState(0);
  const [companyOption, setCompanyOption] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      console.log('Loading subscription status...');
      const status = await api.getSubscriptionStatus();
      console.log('Subscription status received:', status);
      setSubscriptionStatus(status);
      setAdditionalCompanies(status.extraCompanies || 0);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
      // En cas d'erreur, définir un statut par défaut pour éviter le chargement infini
      setSubscriptionStatus({
        success: true,
        status: 'trial',
        plan: 'monthly_200',
        extraCompanies: 0,
        totalMonthlyCost: 0
      });
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/subscription/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mj_token')}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          extraCompanies: additionalCompanies,
          companyOption: companyOption
        })
      }).then(r => r.json());
      
      if (res.success) {
        await loadSubscriptionStatus(); // Recharger le statut
        setShowUpgradeModal(false);
        // Rafraîchir la page pour appliquer les nouvelles fonctionnalités
        window.location.reload();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Erreur lors de la mise à niveau. Veuillez réessayer.');
    }
  };

  const calculateCompanyCost = () => {
    return additionalCompanies * (companyOption === 'monthly' ? 150 : 1600);
  };

  const calculateTotalCost = () => {
    const basePrice = selectedPlan === 'monthly' ? 200 : 2200;
    const companyCost = additionalCompanies * (companyOption === 'monthly' ? 150 : 1600);
    return basePrice + companyCost;
  };

  const calculateTotalTTC = (inv: Invoice) => {
    let totalHt = 0;
    let totalTva = 0;
    inv.items.forEach(item => {
      item.subItems.forEach(sub => {
        const price = parseFloat(String(sub.price)) || 0;
        const quantity = parseFloat(String(sub.quantity)) || 0;
        const taxRate = parseFloat(String(sub.taxRate)) || 0;
        const lineHt = price * quantity;
        totalHt += lineHt;
        totalTva += lineHt * (taxRate / 100);
      });
    });
    const discount = parseFloat(String(inv.discount)) || 0;
    return totalHt + totalTva - discount;
  };

  const calculatePaid = (inv: Invoice) => (inv.payments || []).reduce((acc, p) => acc + (parseFloat(String(p.amount)) || 0), 0);

  const statsCalculated = useMemo(() => {
    const activeInvoices = invoices.filter(i => i.status !== 'Annule' && i.status !== 'Annulée' && i.type !== 'Devis');
    const totalRevenue = activeInvoices.reduce((acc, inv) => acc + calculateTotalTTC(inv), 0);
    const totalPaid = activeInvoices.reduce((acc, inv) => acc + calculatePaid(inv), 0);
    const totalPending = totalRevenue - totalPaid;

    const quotes = invoices.filter(i => i.type === 'Devis');
    const accepted = quotes.filter(q => q.status === 'Accepte');
    const conversion = quotes.length > 0 ? (accepted.length / quotes.length) * 100 : 0;

    return { totalRevenue, totalPaid, totalPending, conversion };
  }, [invoices]);

  // Overdue invoices calculation
  const overdueInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < today && !['Payée', 'Annulée', 'Brouillon', 'Paye'].includes(inv.status) && inv.type !== 'Devis';
    });
  }, [invoices]);

  // Due soon invoices (next 7 days)
  const dueSoonInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate >= today && dueDate <= nextWeek && !['Payée', 'Annulée', 'Brouillon', 'Paye'].includes(inv.status) && inv.type !== 'Devis';
    });
  }, [invoices]);

  const totalOverdueAmount = overdueInvoices.reduce((acc, inv) => {
    const total = calculateTotalTTC(inv);
    const paid = calculatePaid(inv);
    return acc + (total - paid);
  }, 0);

  const chartData = invoices.filter(i => i.type !== 'Devis').slice(0, 10).reverse().map(inv => ({
    name: inv.invoiceNumber,
    amount: calculateTotalTTC(inv),
  }));

  const quotesToRelance = invoices.filter(i => i.type === 'Devis' && i.status === 'Brouillon').slice(0, 5);

  const getShortcutIcon = (id: string) => {
    switch (id) {
      case 'new-invoice': return <PlusCircle className="w-5 h-5" />;
      case 'new-quote': return <FileText className="w-5 h-5" />;
      case 'new-client': return <UserPlus className="w-5 h-5" />;
      case 'new-template': return <FileEdit className="w-5 h-5" />;
      case 'view-history': return <LayoutList className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const stats = [
    { label: 'C.A HT Global', value: `${statsCalculated.totalRevenue.toLocaleString()}`, icon: <DollarSign />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Recouvrement', value: `${statsCalculated.totalPaid.toLocaleString()}`, icon: <CheckCircle />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Encours Client', value: `${statsCalculated.totalPending.toLocaleString()}`, icon: <Clock />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Taux Conv.', value: `${statsCalculated.conversion.toFixed(1)}%`, icon: <Percent />, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end no-print">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">Sales Monitoring</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">Pilotage financier & conversion</p>
        </div>
        <div className="flex gap-4 no-print">
          {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
            <div
              onClick={() => onShortcut?.('automation')}
              className="text-right glass px-6 py-3 rounded-2xl border-blue-100 flex gap-4 items-center cursor-pointer hover:bg-blue-50/50 transition-all"
            >
              <div className="text-right">
                <p className="text-[9px] font-black text-blue-500 uppercase">Automatisation</p>
                <p className="text-sm font-black text-gray-800">Actif & Sécurisé</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
          )}
          <div className="text-right glass px-6 py-3 rounded-2xl border-blue-100 flex gap-4 items-center">
            <div className="text-right">
              <p className="text-[9px] font-black text-blue-500 uppercase">Tenant Connecté</p>
              <p className="text-sm font-black text-gray-800">Système Kelios</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Alerts Section */}
      {(overdueInvoices.length > 0 || dueSoonInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          {/* Overdue Alert */}
          {overdueInvoices.length > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-red-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{overdueInvoices.length} Facture{overdueInvoices.length > 1 ? 's' : ''} en Retard</h3>
                    <p className="text-white/80 text-sm font-medium">Montant impayé: {totalOverdueAmount.toLocaleString()} MAD</p>
                  </div>
                </div>
                <button
                  onClick={() => onShortcut?.('automation')}
                  className="px-4 py-2 bg-white/20 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  Voir <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {overdueInvoices.slice(0, 3).map(inv => {
                  const daysOverdue = Math.ceil((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <span key={inv.id} className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                      {inv.invoiceNumber} ({daysOverdue}j)
                    </span>
                  );
                })}
                {overdueInvoices.length > 3 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                    +{overdueInvoices.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Due Soon Alert */}
          {dueSoonInvoices.length > 0 && (
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl shadow-orange-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CalendarClock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{dueSoonInvoices.length} Échéance{dueSoonInvoices.length > 1 ? 's' : ''} Proche{dueSoonInvoices.length > 1 ? 's' : ''}</h3>
                    <p className="text-white/80 text-sm font-medium">Dans les 7 prochains jours</p>
                  </div>
                </div>
                <button
                  onClick={() => onShortcut?.('ventes')}
                  className="px-4 py-2 bg-white/20 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  Voir <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {dueSoonInvoices.slice(0, 3).map(inv => {
                  const daysUntil = Math.ceil((new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <span key={inv.id} className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                      {inv.invoiceNumber} ({daysUntil === 0 ? "Aujourd'hui" : `${daysUntil}j`})
                    </span>
                  );
                })}
                {dueSoonInvoices.length > 3 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                    +{dueSoonInvoices.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass p-6 rounded-[2rem] hover-lift border-white/40">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 shadow-sm`}>
              {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
            </div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black mt-1 text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Subscription Status Card */}
      <div className="glass p-8 rounded-[2.5rem] no-print">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Statut Abonnement</h3>
              <p className="text-sm text-gray-500">Gérez votre plan et sociétés</p>
            </div>
          </div>
          {subscriptionStatus?.subscriptionStatus !== 'active' && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Upgrader
            </button>
          )}
        </div>

        {subscriptionStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Plan Actuel</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPlan('monthly')}
                      className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${
                        selectedPlan === 'monthly' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      onClick={() => setSelectedPlan('yearly')}
                      className={`p-2 rounded-lg border-2 text-xs font-bold transition-all ${
                        selectedPlan === 'yearly' 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      Annuel
                      <span className="ml-1 bg-emerald-100 text-emerald-700 text-[8px] px-1 rounded">
                        -200 DH
                      </span>
                    </button>
                  </div>
                  <div>
                    <p className="text-lg font-black text-blue-600">
                      {selectedPlan === 'monthly' ? 'Pack Mensuel' : 'Pack Annuel'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedPlan === 'monthly' ? '200 DH HT / mois' : '2200 DH HT / an'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sociétés Suppl.</p>
                <p className="text-lg font-black text-green-600">{additionalCompanies}</p>
                <div className="mt-3 space-y-2">
                  <div className="text-sm text-gray-600">
                    Option: <span className="font-bold">
                      {companyOption === 'monthly' ? 'Mensuelle (150 DH HT)' : 'Annuelle (1600 DH HT)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={additionalCompanies}
                      onChange={(e) => setAdditionalCompanies(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-black text-center"
                    />
                    <span className="text-sm text-gray-600">sociétés</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Mensuel</p>
                <p className="text-lg font-black text-blue-600">
                  {calculateTotalCost().toLocaleString()} DH HT
                </p>
                {additionalCompanies > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    +{calculateCompanyCost().toLocaleString()} DH HT / mois
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">
                  Statut: <span className={`font-bold ${
                    subscriptionStatus.subscriptionStatus === 'active' ? 'text-green-600' : 
                    subscriptionStatus.subscriptionStatus === 'trial' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {subscriptionStatus.subscriptionStatus === 'active' ? 'Actif' :
                     subscriptionStatus.subscriptionStatus === 'trial' ? 'Essai' : 'Inactif'}
                  </span>
                </p>
                {subscriptionStatus.trialEndsAt && (
                  <p className="text-xs text-gray-500">
                    Essai expire: {new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscriptionStatus.subscriptionStatus !== 'active' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Activer l'abonnement
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-xl">
              <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Chargement...</span>
            </div>
          </div>
        )}
      </div>

    {/* Upgrade Modal */}
    {showUpgradeModal && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-gray-900">Mettre à niveau l'abonnement</h3>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-bold text-gray-900">Pack Mensuel</h4>
                <p className="text-2xl font-black text-blue-600">200 DH HT</p>
                <p className="text-sm text-gray-600">/ mois</p>
              </div>
              
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedPlan === 'yearly' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">Pack Annuel</h4>
                    <p className="text-2xl font-black text-blue-600">2200 DH HT</p>
                    <p className="text-sm text-gray-600">/ an</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                    Économisez 200 DH
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3">Sociétés supplémentaires</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setCompanyOption('monthly')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      companyOption === 'monthly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <h5 className="font-bold text-sm text-gray-900">Option Mensuelle</h5>
                    <p className="text-lg font-black text-blue-600">150 DH HT</p>
                    <p className="text-xs text-gray-600">/ mois par société</p>
                  </div>
                  <div
                    onClick={() => setCompanyOption('yearly')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      companyOption === 'yearly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-gray-900">Option Annuelle</h5>
                        <p className="text-lg font-black text-blue-600">1600 DH HT</p>
                        <p className="text-xs text-gray-600">/ an par société</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-1 rounded-full">
                        Éco 200 DH
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nombre de sociétés</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdditionalCompanies(Math.max(0, additionalCompanies - 1))}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold">{additionalCompanies}</span>
                    <button
                      onClick={() => setAdditionalCompanies(additionalCompanies + 1)}
                      className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                  Coût: {additionalCompanies} × {companyOption === 'monthly' ? '150 DH HT / mois' : '1600 DH HT / an'} = {calculateCompanyCost().toLocaleString()} DH HT
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-900">Total à payer</span>
                <span className="text-2xl font-black text-blue-600">
                  {calculateTotalCost().toLocaleString()} DH HT
                </span>
              </div>
              
              <button
                onClick={handleUpgrade}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3"
              >
                <CreditCard className="w-5 h-5" />
                Confirmer et payer
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quotes to Relance section */}
          <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <AlertTriangle className="w-32 h-32" />
            </div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-600 leading-none">Relances prioritaires (Devis)</h3>
              </div>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">En attente</span>
            </div>
            <div className="space-y-3">
              {quotesToRelance.length === 0 ? (
                <p className="text-gray-300 italic text-center py-10">Optimisation complète. Aucun devis en souffrance.</p>
              ) : (
                quotesToRelance.map(quote => (
                  <div key={quote.id} className="flex items-center justify-between p-4 bg-white/50 border border-orange-50 rounded-2xl hover:bg-white transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase text-gray-800">{quote.client.name}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">N° {quote.invoiceNumber} · {calculateTotalTTC(quote).toLocaleString()} {quote.currency}</p>
                      </div>
                    </div>
                    <button onClick={() => onShortcut?.('history')} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all"><Send className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {shortcuts.length > 0 && (
            <div className="glass p-8 rounded-[2.5rem]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Raccourcis Utilisateur</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {shortcuts.map(s => (
                  <button key={s.id} onClick={() => onShortcut?.(s.actionId)} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white border border-gray-100 hover:border-blue-600 transition-all hover-lift">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                      {getShortcutIcon(s.actionId)}
                    </div>
                    <span className="text-[8px] font-black uppercase text-gray-500 text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activity Graph */}
          <div className="glass p-8 rounded-[2.5rem] min-h-[350px]">
            <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.3em] text-gray-400">Journal d'activité Factures</h3>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#007AFF' : '#cbd5e1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Feed Detail */}
        <div className="glass p-8 rounded-[2.5rem]">
          <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.3em] text-gray-400">Flux en direct</h3>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-gray-300 text-center py-20 italic text-sm">Aucune activité.</p>
            ) : (
              invoices.slice(0, 10).map(inv => {
                const isOverdue = new Date(inv.dueDate) < new Date() && !['Payée', 'Annulée', 'Brouillon', 'Paye'].includes(inv.status);
                return (
                  <div key={inv.id} className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-all group ${isOverdue ? 'bg-red-50/50' : ''}`}>
                    <div className={`w-1.5 h-8 rounded-full ${inv.status === 'Paye' || inv.status === 'Payée' ? 'bg-emerald-500' : inv.status === 'Accepte' ? 'bg-blue-600' : isOverdue ? 'bg-red-500' : 'bg-gray-200'}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-black text-[11px] truncate uppercase tracking-tight text-gray-800">{inv.client.name}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-blue-700">{calculateTotalTTC(inv).toLocaleString()}</p>
                      <p className={`text-[7px] font-black uppercase ${isOverdue ? 'text-red-500' : 'text-gray-300'}`}>
                        {isOverdue ? 'En retard' : inv.status}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
