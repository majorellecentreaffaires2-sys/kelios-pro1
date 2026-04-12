
import React, { useState, useMemo } from 'react';
import { Invoice, Company, ContactInfo } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, PieChart as PieIcon, FileText,
  Users, Calendar, Filter, Download, ArrowUpRight,
  ArrowDownRight, Landmark, Receipt, Percent, AlertCircle, Clock, UserCheck, FileSpreadsheet
} from 'lucide-react';

interface ReportingProps {
  invoices: Invoice[];
  company: Company;
  clients: ContactInfo[];
}

const CLIENT_FAMILIES = ["Particuliers", "Professionnels", "Grands Comptes", "Administration", "International"];

const Reporting: React.FC<ReportingProps> = ({ invoices, company, clients }) => {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd' | 'all'>('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');

  const calculateInvoiceData = (inv: Invoice) => {
    let ht = 0;
    let tva = 0;
    const vats: { [key: number]: number } = {};

    inv.items.forEach(item => {
      item.subItems.forEach(sub => {
        const price = parseFloat(String(sub.price)) || 0;
        const quantity = parseFloat(String(sub.quantity)) || 0;
        const taxRate = parseFloat(String(sub.taxRate)) || 0;
        const lineHt = price * quantity;
        const lineTva = lineHt * (taxRate / 100);
        ht += lineHt;
        tva += lineTva;
        vats[taxRate] = (vats[taxRate] || 0) + lineTva;
      });
    });

    const discount = parseFloat(String(inv.discount)) || 0;
    const ttc = ht + tva - discount;
    const paid = (inv.payments || []).reduce((acc, p) => acc + (parseFloat(String(p.amount)) || 0), 0);

    // Add base ht per rate
    const vatsDetailed: { [key: number]: { amount: number, base: number } } = {};
    inv.items.forEach(item => {
      item.subItems.forEach(sub => {
        const r = parseFloat(String(sub.taxRate)) || 0;
        const b = (parseFloat(String(sub.price)) || 0) * (parseFloat(String(sub.quantity)) || 0);
        if (!vatsDetailed[r]) vatsDetailed[r] = { amount: 0, base: 0 };
        vatsDetailed[r].amount += b * (r / 100);
        vatsDetailed[r].base += b;
      });
    });

    return { ht, tva, ttc, paid, vats, vatsDetailed };
  };

  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(i => i.status !== 'Annule' && i.status !== 'Annulée');

    // Filtre Période
    const now = new Date();
    if (period === '30d') {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      filtered = filtered.filter(i => new Date(i.date) >= thirtyDaysAgo);
    } else if (period === 'ytd') {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(i => new Date(i.date) >= firstDayOfYear);
    }

    // Filtre Client
    if (clientFilter !== 'all') {
      filtered = filtered.filter(i => i.client.id === clientFilter || i.client.name === clientFilter);
    }

    // Filtre Famille
    if (familyFilter !== 'all') {
      filtered = filtered.filter(i => {
        const client = clients.find(c => c.id === i.client.id || c.name === i.client.name);
        return client?.category === familyFilter;
      });
    }

    return filtered;
  }, [invoices, clients, clientFilter, familyFilter, period]);

  const stats = useMemo(() => {
    let totalHt = 0;
    let totalTva = 0;
    let totalTtc = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    const quotes = invoices.filter(i => i.type === 'Devis');
    const acceptedQuotes = quotes.filter(q => q.status === 'Accepte');
    const conversionRate = quotes.length > 0 ? (acceptedQuotes.length / quotes.length) * 100 : 0;

    const vatDistribution: { [key: number]: { amount: number, base: number } } = {};
    const monthlyRevenue: { [key: string]: { name: string, ht: number, paid: number } } = {};
    const aging = { '0-30': 0, '31-60': 0, '61+': 0 };

    filteredInvoices.filter(i => i.type !== 'Devis').forEach(inv => {
      const data = calculateInvoiceData(inv);
      totalHt += data.ht;
      totalTva += data.tva;
      totalTtc += data.ttc;
      totalPaid += data.paid;
      const unpaid = data.ttc - data.paid;
      totalUnpaid += unpaid > 0 ? unpaid : 0;

      if (unpaid > 0) {
        const diff = (new Date().getTime() - new Date(inv.date).getTime()) / (1000 * 3600 * 24);
        if (diff <= 30) aging['0-30'] += unpaid;
        else if (diff <= 60) aging['31-60'] += unpaid;
        else aging['61+'] += unpaid;
      }

      Object.entries(data.vatsDetailed).forEach(([rate, detail]) => {
        const r = Number(rate);
        if (!vatDistribution[r]) vatDistribution[r] = { amount: 0, base: 0 };
        vatDistribution[r].amount += detail.amount;
        vatDistribution[r].base += detail.base;
      });

      const date = new Date(inv.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = { name: monthKey, ht: 0, paid: 0 };
      }
      monthlyRevenue[monthKey].ht += data.ht;
      monthlyRevenue[monthKey].paid += data.paid;
    });

    const chartData = Object.values(monthlyRevenue).sort((a, b) => a.name.localeCompare(b.name));
    const vatTableData = Object.entries(vatDistribution).map(([rate, data]) => ({ rate: Number(rate), ...data })).sort((a, b) => b.rate - a.rate);
    const pieData = Object.entries(vatDistribution).map(([rate, data]) => ({ name: `TVA ${rate}%`, value: data.amount }));
    const agingData = [
      { name: '0-30 Jours', value: aging['0-30'] },
      { name: '31-60 Jours', value: aging['31-60'] },
      { name: '61+ Jours', value: aging['61+'] },
    ];

    return { totalHt, totalTva, totalTtc, totalPaid, totalUnpaid, conversionRate, chartData, pieData, agingData, vatTableData };
  }, [filteredInvoices, invoices]);

  const COLORS = [company.primaryColor, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const exportFilteredStatsCSV = () => {
    const csvRows = [
      ["Période", "Client/Famille", "CA HT", "TVA Collectée", "Total TTC", "Encaissements", "Taux Conversion %"],
      [
        period,
        familyFilter !== 'all' ? familyFilter : clientFilter !== 'all' ? clientFilter : 'TOUT',
        stats.totalHt.toFixed(2),
        stats.totalTva.toFixed(2),
        stats.totalTtc.toFixed(2),
        stats.totalPaid.toFixed(2),
        stats.conversionRate.toFixed(2)
      ]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_analytique_${company.name}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">Intelligence Commerciale</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Analytique {company.name} · Filtré par Client/Famille</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={exportFilteredStatsCSV}
            className="px-6 py-4 bg-white border-2 border-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-50 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" /> Export Analytique
          </button>
          <div className="bg-white p-1 rounded-2xl border-2 border-blue-50 flex shadow-sm">
            {['30d', 'ytd', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-blue-600'}`}
              >
                {p === '30d' ? '30J' : p === 'ytd' ? 'ANN' : 'TOUT'}
              </button>
            ))}
          </div>
          <select
            className="bg-white border-2 border-blue-50 rounded-2xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-blue-600"
            value={familyFilter}
            onChange={e => setFamilyFilter(e.target.value)}
          >
            <option value="all">Toutes les Familles</option>
            {CLIENT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            className="bg-white border-2 border-blue-50 rounded-2xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-blue-600 max-w-[200px]"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="all">Tous les Clients</option>
            {clients.map(c => <option key={c.id} value={c.id || c.name}>{c.name}</option>)}
          </select>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {[
          { label: 'C.A HT Global', value: stats.totalHt, icon: <TrendingUp />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'TVA Collectée', value: stats.totalTva, icon: <Receipt />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Encaissements', value: stats.totalPaid, icon: <ArrowUpRight />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Reste à Percevoir', value: stats.totalUnpaid, icon: <Clock />, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Conversion Devis', value: `${stats.conversionRate.toFixed(1)}%`, icon: <Percent />, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Impayés +60j', value: stats.agingData[2].value, icon: <AlertCircle />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-[2rem] hover-lift border-white/50">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
            </div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-lg font-black text-gray-900 mt-1">
              {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
              {typeof stat.value !== 'string' && <span className="text-[10px] opacity-30 ml-1">{company.currency}</span>}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 rounded-[3rem] border-white/50 space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-3">
            <TrendingUp className="w-5 h-5" /> Vélocité Commerciale (MAD / Mois)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPaid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-10 rounded-[3rem] border-white/50 space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-3">
            <Clock className="w-5 h-5" /> Balance Âgée
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.agingData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={9} fontWeights="900" width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                  {stats.agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#ef4444' : index === 1 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 pt-4">
            {stats.agingData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <span className="text-[9px] font-black uppercase text-gray-500">{item.name}</span>
                <span className="text-xs font-black text-gray-900">{item.value.toLocaleString()} {company.currency}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-10 rounded-[3rem] border-white/50 space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-3">
            <Percent className="w-5 h-5" /> Récapitulatif TVA
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-[9px] font-black uppercase text-gray-400">Taux</th>
                  <th className="py-3 text-[9px] font-black uppercase text-gray-400 text-right">Base HT</th>
                  <th className="py-3 text-[9px] font-black uppercase text-gray-400 text-right">Montant TVA</th>
                </tr>
              </thead>
              <tbody>
                {stats.vatTableData.map((v, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-black text-gray-900 text-xs">{v.rate}%</td>
                    <td className="py-4 text-right text-xs font-bold text-gray-600">{v.base.toLocaleString()}</td>
                    <td className="py-4 text-right text-xs font-black text-blue-600">{v.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[9px] font-black uppercase text-gray-400">Total Collecté</span>
            <span className="text-sm font-black text-gray-900">{stats.totalTva.toLocaleString()} {company.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
