
import React, { useMemo } from 'react';
import { Company, Invoice } from '../types';
import {
   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
   Cell, Legend, CartesianGrid, PieChart, Pie
} from 'recharts';
import {
   Briefcase, TrendingUp, DollarSign, ShieldCheck,
   ArrowRightCircle, Building2, Globe, Layers, Receipt, Download, FileSpreadsheet, PieChart as PieIcon, Calculator,
   CheckCircle2
} from 'lucide-react';

interface GlobalReportingProps {
   companies: Company[];
   allInvoices: { [companyId: string]: Invoice[] };
}

const GlobalReporting: React.FC<GlobalReportingProps> = ({ companies, allInvoices }) => {

   const calculateInvoiceTotal = (inv: Invoice) => {
      let ht = 0;
      let tva = 0;
      inv.items.forEach(item => {
         item.subItems.forEach(sub => {
            const price = parseFloat(String(sub.price)) || 0;
            const quantity = parseFloat(String(sub.quantity)) || 0;
            const taxRate = parseFloat(String(sub.taxRate)) || 0;
            const lineHt = price * quantity;
            ht += lineHt;
            tva += lineHt * (taxRate / 100);
         });
      });
      const discount = parseFloat(String(inv.discount)) || 0;
      return { ht, tva, ttc: ht + tva - discount };
   };

   const consolidatedData = useMemo(() => {
      let globalHt = 0;
      let globalTva = 0;
      let globalPaid = 0;
      let globalDocsCount = 0;
      const companyPerformance: { name: string, ht: number, paid: number, tva: number, color: string, recoveryRate: number }[] = [];

      companies.forEach(company => {
         const invoices = allInvoices[company.id] || [];
         let cHt = 0;
         let cTva = 0;
         let cPaid = 0;

         const activeInvoices = invoices.filter(i => i.status !== 'Annule' && i.status !== 'Annulée' && i.type !== 'Devis');
         globalDocsCount += activeInvoices.length;

         activeInvoices.forEach(inv => {
            const data = calculateInvoiceTotal(inv);
            cHt += data.ht;
            cTva += data.tva;
            cPaid += inv.payments.reduce((acc, p) => acc + p.amount, 0);
         });

         globalHt += cHt;
         globalTva += cTva;
         globalPaid += cPaid;

         companyPerformance.push({
            name: company.name,
            ht: cHt,
            paid: cPaid,
            tva: cTva,
            color: company.primaryColor,
            recoveryRate: cHt > 0 ? (cPaid / (cHt + cTva)) * 100 : 0
         });
      });

      return { globalHt, globalTva, globalPaid, globalDocsCount, companyPerformance };
   }, [companies, allInvoices]);

   const exportGlobalData = () => {
      const csvRows = [
         ["Société", "Chiffre Affaires HT", "TVA Collectée", "Total TTC", "Encaissements", "Taux Recouvrement %"],
         ...consolidatedData.companyPerformance.map(cp => [
            cp.name,
            cp.ht.toFixed(2),
            cp.tva.toFixed(2),
            (cp.ht + cp.tva).toFixed(2),
            cp.paid.toFixed(2),
            cp.recoveryRate.toFixed(2)
         ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporting_global_groupe_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-20">
         <header className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
               <h1 className="text-6xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">Dashboard Portfolio</h1>
               <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Vue consolidée du groupe Kelios · Multi-Tenant Monitoring</p>
            </div>
            <div className="flex gap-4">
               <button
                  onClick={exportGlobalData}
                  className="px-6 py-4 bg-white border-2 border-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-50 transition-all shadow-sm"
               >
                  <FileSpreadsheet className="w-5 h-5" /> Export Groupe CSV
               </button>
               <div className="glass px-8 py-4 rounded-2xl border-white/50 flex gap-10 items-center">
                  <div className="text-center">
                     <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Entités</p>
                     <p className="text-xl font-black text-blue-600">{companies.filter(c => c.active).length}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100" />
                  <div className="text-center">
                     <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Total CA HT</p>
                     <p className="text-xl font-black text-gray-900">{consolidatedData.globalHt.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </header>

         {/* Global KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass p-10 rounded-[3rem] border-white/50 relative overflow-hidden bg-blue-600 text-white shadow-2xl shadow-blue-200">
               <div className="relative z-10">
                  <DollarSign className="w-12 h-12 mb-6 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Revenue HT Groupe</p>
                  <h2 className="text-4xl font-black italic mt-2">{consolidatedData.globalHt.toLocaleString()} <span className="text-sm opacity-40 not-italic">MAD</span></h2>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            </div>

            <div className="glass p-10 rounded-[3rem] border-white/50 relative overflow-hidden bg-white shadow-xl">
               <Receipt className="w-12 h-12 mb-6 text-indigo-100" />
               <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">TVA Collectée Totale</p>
               <h2 className="text-4xl font-black italic mt-2 text-indigo-600">{consolidatedData.globalTva.toLocaleString()} <span className="text-sm opacity-40 not-italic">MAD</span></h2>
            </div>

            <div className="glass p-10 rounded-[3rem] border-white/50 relative overflow-hidden bg-white shadow-xl">
               <CheckCircle2 className="w-12 h-12 mb-6 text-emerald-100" />
               <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Encaissements Totaux</p>
               <h2 className="text-4xl font-black italic mt-2 text-emerald-600">{consolidatedData.globalPaid.toLocaleString()} <span className="text-sm opacity-40 not-italic">MAD</span></h2>
            </div>

            <div className="glass p-10 rounded-[3rem] border-white/50 relative overflow-hidden bg-white shadow-xl">
               <Layers className="w-12 h-12 mb-6 text-orange-100" />
               <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Documents Émis</p>
               <h2 className="text-4xl font-black italic mt-2 text-orange-600">{consolidatedData.globalDocsCount} <span className="text-sm opacity-40 not-italic">PIÈCES</span></h2>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Comparison */}
            <div className="lg:col-span-2 glass p-10 rounded-[3rem] border-white/50 space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-3">
                     <Calculator className="w-5 h-5" /> Répartition du C.A par Filiale
                  </h3>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="text-[9px] font-black uppercase text-gray-400">C.A HT</span></div>
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black uppercase text-gray-400">Paiements</span></div>
                  </div>
               </div>
               <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={consolidatedData.companyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                           contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                           cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        />
                        <Bar dataKey="ht" radius={[6, 6, 0, 0]} barSize={32}>
                           {consolidatedData.companyPerformance.map((entry, index) => (
                              <Cell key={`cell-ht-${index}`} fill="#2563eb" />
                           ))}
                        </Bar>
                        <Bar dataKey="paid" radius={[6, 6, 0, 0]} barSize={32}>
                           {consolidatedData.companyPerformance.map((entry, index) => (
                              <Cell key={`cell-paid-${index}`} fill="#10b981" />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Distribution Chart */}
            <div className="glass p-10 rounded-[3rem] border-white/50 space-y-10">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-3">
                  <PieIcon className="w-5 h-5" /> Taux de Recouvrement
               </h3>
               <div className="space-y-6 pt-4">
                  {consolidatedData.companyPerformance.map((item, idx) => (
                     <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-gray-700">{item.name}</span>
                           <span className="text-xs font-black text-blue-600">{item.recoveryRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                           <div
                              className="h-full rounded-full"
                              style={{
                                 width: `${item.recoveryRate}%`,
                                 backgroundColor: item.color || '#3b82f6'
                              }}
                           />
                        </div>
                     </div>
                  ))}
               </div>
               <div className="mt-10 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                     <p className="text-[10px] font-black uppercase text-blue-900">Moyenne Groupe</p>
                     <p className="text-2xl font-black text-gray-900">{((consolidatedData.globalPaid / (consolidatedData.globalHt + consolidatedData.globalTva)) * 100).toFixed(1)}%</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default GlobalReporting;
