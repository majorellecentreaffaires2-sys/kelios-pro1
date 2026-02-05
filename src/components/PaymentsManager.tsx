
import React, { useState } from 'react';
import { Invoice, Payment, PaymentMethod, Company } from '../types';
import {
  Banknote, Plus, Calendar, CreditCard,
  Wallet, Landmark, Receipt, Search,
  ChevronRight, ArrowUpRight, CheckCircle2, X, ShieldCheck, History, ListFilter, FileSpreadsheet
} from 'lucide-react';
import { PAYMENT_METHODS } from '../constants';

interface PaymentsManagerProps {
  invoices: Invoice[];
  company: Company;
  onUpdateInvoice: (invoice: Invoice) => void;
}

const PaymentsManager: React.FC<PaymentsManagerProps> = ({ invoices, company, onUpdateInvoice }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [newPayment, setNewPayment] = useState({
    invoiceId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'Virement' as any,
    reference: '',
    accountId: company.accountingPlan?.filter(a => a.type === 'Treasury')[0]?.id || ''
  });

  const allPayments = invoices.flatMap(inv =>
    (inv.payments || []).map(p => ({
      ...p,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      invoiceId: inv.id,
      currency: inv.currency,
      accountLabel: company.accountingPlan?.find(a => a.id === p.accountId)?.label || 'Non affecté',
      accountCode: company.accountingPlan?.find(a => a.id === p.accountId)?.code || '512'
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredPayments = allPayments.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

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
    return ht + tva - discount;
  };

  const getRemainingBalance = (inv: Invoice) => {
    const total = calculateInvoiceTotal(inv);
    const paid = (inv.payments || []).reduce((acc, p) => acc + (parseFloat(String(p.amount)) || 0), 0);
    return Math.max(0, total - paid);
  };

  const exportGrandLivreCSV = () => {
    const csvRows = [
      ["Date", "Code Compte", "Libellé Compte", "Référence Document", "Client", "Mode", "Référence Paiement", "Montant Débit", "Devise"],
      ...filteredPayments.map(p => [
        p.date,
        p.accountCode,
        p.accountLabel,
        p.invoiceNumber,
        p.clientName,
        p.method,
        p.reference || "N/A",
        p.amount.toFixed(2),
        p.currency
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `grand_livre_tresorerie_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddPayment = () => {
    const invoice = invoices.find(inv => inv.id === newPayment.invoiceId);
    if (!invoice) return alert("Veuillez sélectionner une facture.");
    if (newPayment.amount <= 0) return alert("Le montant doit être supérieur à 0.");

    const payment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      amount: newPayment.amount,
      date: newPayment.date,
      method: newPayment.method,
      reference: newPayment.reference,
      accountId: newPayment.accountId
    };

    const updatedPayments = [...(invoice.payments || []), payment];
    const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalDue = calculateInvoiceTotal(invoice);

    let newStatus = invoice.status;
    if (totalPaid >= totalDue) newStatus = 'Payée';
    else if (totalPaid > 0) newStatus = 'PartiellementPaye';

    const updatedInvoice: Invoice = {
      ...invoice,
      payments: updatedPayments,
      status: newStatus as any,
      auditTrail: [
        ...(invoice.auditTrail || []),
        {
          id: Math.random().toString(36).substr(2, 5),
          timestamp: new Date().toISOString(),
          action: 'ENCAISSEMENT',
          entity: 'PAYMENT',
          userId: 'Admin',
          details: `Paiement de ${payment.amount} ${invoice.currency} lié au compte ${company.accountingPlan.find(a => a.id === payment.accountId)?.label}.`,
          severity: 'INFO'
        }
      ]
    };

    onUpdateInvoice(updatedInvoice);
    setShowAddForm(false);
    setNewPayment({ invoiceId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Virement', reference: '', accountId: company.accountingPlan[0]?.id || '' });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">Journal Trésorerie</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Liaison Plan Comptable & Affectations</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={exportGrandLivreCSV}
            className="px-6 py-4 bg-white border-2 border-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-50 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" /> Export Grand Livre
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus className="w-5 h-5" /> Nouvel Encaissement
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Résumé des comptes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border-blue-50">
            <h3 className="text-[10px] font-black uppercase text-blue-900 mb-6 tracking-widest">Disponibilités</h3>
            <div className="space-y-4">
              {company.accountingPlan?.filter(a => a.type === 'Treasury').map(acc => {
                const total = allPayments.filter(p => p.accountId === acc.id).reduce((sum, p) => sum + p.amount, 0);
                return (
                  <div key={acc.id} className="p-4 bg-white rounded-2xl border border-gray-100 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase">{acc.code}</span>
                    <span className="text-xs font-black text-gray-800 uppercase truncate">{acc.label}</span>
                    <span className="text-lg font-black text-blue-600 mt-1">{total.toLocaleString()} <span className="text-[10px] opacity-40">{company.currency}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Historique des flux */}
        <div className="lg:col-span-3 glass p-8 rounded-[3rem] border-white/50 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-xl uppercase italic tracking-tighter text-gray-800">Grand Livre des Flux</h2>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Filtrer journal..."
                className="w-full bg-blue-50/20 border-2 border-transparent focus:border-blue-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-blue-50">
                  <th className="pb-4 px-4">Date</th>
                  <th className="pb-4 px-4">Journal / Compte</th>
                  <th className="pb-4 px-4">Pièce</th>
                  <th className="pb-4 px-4">Client</th>
                  <th className="pb-4 px-4 text-right">Encaissement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50/30">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-gray-300 italic font-black uppercase text-xs">Aucun mouvement comptable</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="group hover:bg-blue-50/30 transition-all">
                      <td className="py-5 px-4 text-xs font-bold text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-blue-900 uppercase leading-none">{p.accountLabel}</span>
                          <span className="text-[8px] font-black text-blue-300 uppercase mt-1 tracking-tighter">Journal: {p.accountCode}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4"><span className="text-[10px] font-black text-gray-400 uppercase">#{p.invoiceNumber}</span></td>
                      <td className="py-5 px-4"><span className="text-xs font-black text-gray-800 uppercase">{p.clientName}</span></td>
                      <td className="py-5 px-4 text-right font-black text-emerald-600">+{p.amount.toLocaleString()} <span className="text-[9px] opacity-40">{p.currency}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-blue-900/40 backdrop-blur-md">
          <div className="glass p-10 rounded-[3rem] max-w-xl w-full shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Saisie d'Écriture</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 block">Facture Destinataire</label>
                <select
                  className="w-full bg-blue-50/50 border-2 border-blue-50 rounded-xl px-4 py-3 outline-none font-bold text-sm"
                  value={newPayment.invoiceId}
                  onChange={e => {
                    const inv = invoices.find(i => i.id === e.target.value);
                    setNewPayment({ ...newPayment, invoiceId: e.target.value, amount: inv ? getRemainingBalance(inv) : 0 });
                  }}
                >
                  <option value="">Sélectionnez une facture non soldée...</option>
                  {invoices.filter(i => i.status !== 'Payée' && i.status !== 'Annulée' && i.type !== 'Devis').map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.client.name} (Reste: {getRemainingBalance(inv).toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 block">Montant Net</label>
                  <input type="number" className="w-full bg-blue-50/50 border-2 border-blue-50 rounded-xl px-4 py-3 font-black text-lg" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 block">Compte Journal</label>
                  <select className="w-full bg-blue-50/50 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-sm" value={newPayment.accountId} onChange={e => setNewPayment({ ...newPayment, accountId: e.target.value })}>
                    {company.accountingPlan?.filter(a => a.type === 'Treasury').map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.label} ({acc.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 block">Date de Valeur</label>
                  <input type="date" className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 font-bold" value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 block">Mode</label>
                  <select className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 font-bold" value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value as any })}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleAddPayment} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest">
                <ShieldCheck className="w-5 h-5" /> Enregistrer au Journal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManager;
