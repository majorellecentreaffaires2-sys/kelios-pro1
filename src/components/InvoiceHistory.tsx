
import React, { useState } from 'react';
import { Invoice, RelanceEntry } from '../types';
import {
  Search, Eye, Trash2, Edit2, ShieldCheck,
  Lock, BellRing, PhoneCall, Mail, RefreshCw,
  Printer, FileSpreadsheet, Clock, Download, Filter, ShieldAlert
} from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { api } from '../apiClient';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onEdit: (invoice: Invoice) => void;
  onSave?: (invoice: Invoice) => void;
  onSendEmail?: (invoice: Invoice) => void;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ invoices, onDelete, onEdit, onSave, onSendEmail }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'valide' | 'encours'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const calculateTotals = (inv: Invoice) => {
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

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.client.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'paid' ? (inv.status === 'Paye' || inv.status === 'Payée') :
        statusFilter === 'valide' ? !!inv.validatedAt :
          statusFilter === 'encours' ? inv.status === 'En cours' :
            (inv.status !== 'Paye' && inv.status !== 'Payée'));

    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    const matchesCurrency = currencyFilter === 'all' || inv.currency === currencyFilter;

    return matchesSearch && matchesStatus && matchesType && matchesCurrency;
  });

  const exportAllToCSV = () => {
    const csvRows = [
      ["Date", "Numéro", "Type", "Client", "HT", "TVA", "TTC", "Status", "Validé", "Archive Légal Jusqu'au"],
      ...filteredInvoices.map(inv => {
        const t = calculateTotals(inv);
        return [
          inv.date,
          inv.invoiceNumber,
          inv.type,
          inv.client.name,
          t.ht.toFixed(2),
          t.tva.toFixed(2),
          t.ttc.toFixed(2),
          inv.status,
          inv.validatedAt ? "OUI" : "NON",
          inv.legalArchiveUntil || "N/A"
        ];
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_comptable_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewingInvoice) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center no-print">
          <button onClick={() => setViewingInvoice(null)} className="px-8 py-3 bg-white border-2 border-blue-200 text-blue-600 rounded-2xl transition-all font-black text-xs uppercase shadow-sm">← Retour</button>
        </div>
        <InvoicePreview invoice={viewingInvoice} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-gray-800 tracking-tighter italic uppercase">Journal</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Archives Fiscales Immuables</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={exportAllToCSV}
            className="px-6 py-4 bg-white border-2 border-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all flex items-center gap-3"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input type="text" placeholder="Recherche client, N°..." className="glass border-2 border-white/50 pl-12 pr-6 py-4 rounded-2xl outline-none w-full md:w-80 text-sm font-bold shadow-sm focus:border-blue-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="bg-white border-2 border-blue-100 rounded-2xl px-4 py-3 font-bold text-[10px] uppercase outline-none shadow-sm focus:border-blue-500 transition-all"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="Standard">Factures</option>
              <option value="Devis">Devis</option>
              <option value="Livraison">Livraisons</option>
              <option value="Avoir">Avoirs</option>
            </select>
            <select
              className="bg-white border-2 border-blue-100 rounded-2xl px-4 py-3 font-bold text-[10px] uppercase outline-none shadow-sm focus:border-blue-500 transition-all"
              value={currencyFilter}
              onChange={e => setCurrencyFilter(e.target.value)}
            >
              <option value="all">Toutes les devises</option>
              {Array.from(new Set(invoices.map(inv => inv.currency))).filter(Boolean).map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
            <div className="flex bg-white border-2 border-blue-100 p-1 rounded-2xl shadow-sm">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'valide', label: 'Scellés' },
                { id: 'encours', label: 'En cours' },
                { id: 'paid', label: 'Payés' }
              ].map((s) => (
                <button key={s.id} onClick={() => setStatusFilter(s.id as any)} className={`px-4 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all ${statusFilter === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Journal Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="text-left px-6 py-4">Date</th>
                <th className="text-left px-4 py-4">N° Document</th>
                <th className="text-left px-4 py-4">Type</th>
                <th className="text-left px-4 py-4">Client</th>
                <th className="text-right px-4 py-4">HT</th>
                <th className="text-right px-4 py-4">TVA</th>
                <th className="text-right px-4 py-4">TTC</th>
                <th className="text-center px-4 py-4">Devise</th>
                <th className="text-center px-4 py-4">Statut</th>
                <th className="text-center px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.map((inv) => {
                const isLocked = !!inv.validatedAt;
                const totals = calculateTotals(inv);
                return (
                  <tr key={inv.id} className="group hover:bg-blue-50/30 transition-colors">
                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-700">
                        {new Date(inv.date).toLocaleDateString('fr-FR')}
                      </span>
                    </td>

                    {/* N° Document */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-black text-blue-600">{inv.invoiceNumber}</span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${inv.type === 'Standard' ? 'bg-blue-100 text-blue-700' :
                          inv.type === 'Devis' ? 'bg-emerald-100 text-emerald-700' :
                            inv.type === 'Proforma' ? 'bg-purple-100 text-purple-700' :
                              inv.type === 'Avoir' ? 'bg-red-100 text-red-700' :
                                inv.type === 'Acompte' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-600'
                        }`}>
                        {inv.type}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-black text-xs">
                          {inv.client.name.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-gray-800 truncate max-w-[150px]">
                          {inv.client.name}
                        </span>
                      </div>
                    </td>

                    {/* HT */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-bold text-gray-600">
                        {totals.ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* TVA */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-bold text-gray-500">
                        {totals.tva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* TTC */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-black text-blue-600">
                        {totals.ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Devise */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-black text-gray-400 uppercase">{inv.currency}</span>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase flex items-center justify-center gap-1 ${isLocked ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'Payée' ? 'bg-blue-100 text-blue-700' :
                            inv.status === 'En cours' ? 'bg-amber-100 text-amber-700' :
                              inv.status === 'Annulée' ? 'bg-red-100 text-red-700' :
                                inv.status === 'Non payée' ? 'bg-rose-100 text-rose-700' :
                                  'bg-gray-100 text-gray-500'
                        }`}>
                        {isLocked ? <><ShieldCheck className="w-3 h-3" /> Certifié</> :
                          <><Clock className="w-3 h-3" /> {inv.status}</>}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                          title="Aperçu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isLocked && (
                          <>
                            <button
                              onClick={() => onEdit(inv)}
                              className="p-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onSendEmail?.(inv)}
                              className={`p-2 rounded-lg transition-all ${inv.client?.email ? 'bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
                              title={inv.client?.email ? "Envoyer par email" : "Email non configuré"}
                              disabled={!inv.client?.email}
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(inv.id)}
                              className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isLocked && (
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg" title="Document certifié">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-16">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Aucun document trouvé</p>
            <p className="text-sm text-gray-300 mt-1">Essayez de modifier vos filtres</p>
          </div>
        )}

        {/* Table Footer with totals */}
        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400">
              {filteredInvoices.length} document{filteredInvoices.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[9px] font-black text-gray-400 uppercase">Total HT</span>
                <p className="text-sm font-black text-gray-700">
                  {filteredInvoices.reduce((sum, inv) => sum + calculateTotals(inv).ht, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-gray-400 uppercase">Total TVA</span>
                <p className="text-sm font-black text-gray-600">
                  {filteredInvoices.reduce((sum, inv) => sum + calculateTotals(inv).tva, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-gray-400 uppercase">Total TTC</span>
                <p className="text-lg font-black text-blue-600">
                  {filteredInvoices.reduce((sum, inv) => sum + calculateTotals(inv).ttc, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;
