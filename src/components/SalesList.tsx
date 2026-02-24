import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceType, InvoiceStatus, Company, ContactInfo } from '../types';
import {
  Search, Filter, MoreHorizontal, FileText, CheckCircle,
  AlertCircle, Clock, X, Eye, Edit, Trash2, Copy,
  Printer, ArrowUpRight, DollarSign, Calendar, Mail, Plus, Share2
} from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { api } from '../apiClient';

interface SalesListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onView?: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onDuplicate: (invoice: Invoice) => void;
  onCreate?: () => void;
  onStatusChange?: (id: string, newStatus: InvoiceStatus) => void;
  onUpdateStatus?: (id: string, newStatus: string) => void;
  onSendEmail?: (invoice: Invoice) => void;
  onRefresh?: () => void;
  company?: Company;
  clients?: ContactInfo[];
}

const SalesList: React.FC<SalesListProps> = ({
  invoices,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onCreate,
  onStatusChange,
  onUpdateStatus,
  onSendEmail,
  onRefresh,
  company,
  clients
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [autoOpenEmail, setAutoOpenEmail] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Supprimer les ${selectedIds.length} documents sélectionnés ?`)) {
      selectedIds.forEach(id => onDelete(id));
      setSelectedIds([]);
    }
  };

  const handleBulkDuplicate = () => {
    const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.id));
    selectedInvoices.forEach(inv => onDuplicate(inv));
    setSelectedIds([]);
  };

  const handleBulkEmail = () => {
    const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.id));
    const validInvoices = selectedInvoices.filter(inv => inv.client?.email);

    if (validInvoices.length === 0) {
      alert("Aucune des factures sélectionnées n'a de client avec une adresse email.");
      return;
    }

    if (confirm(`Envoyer ${validInvoices.length} document(s) par email ?`)) {
      validInvoices.forEach(inv => onSendEmail?.(inv));
      setSelectedIds([]);
      alert(`${validInvoices.length} email(s) ont été envoyés avec succès.`);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Payée': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payée</span>;
      case 'Non payée': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Non payée</span>;
      case 'En cours': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> En cours</span>;
      case 'Brouillon': return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><FileText className="w-3 h-3" /> Brouillon</span>;
      case 'EnRetard': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> En Retard</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  // Filter Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesType = typeFilter === 'all' || invoice.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [invoices, searchTerm, statusFilter, typeFilter]);

  // Calculations
  const totalRevenue = filteredInvoices.reduce((acc, inv) => {
    const totalTtc = inv.items.reduce((sum, item) =>
      sum + item.subItems.reduce((s, sub) => s + (sub.price * sub.quantity * (1 + sub.taxRate / 100)), 0)
      , 0);
    return acc + totalTtc;
  }, 0);

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.client.email) {
      alert('Le client n\'a pas d\'adresse email');
      return;
    }

    if (confirm(`Envoyer la facture ${invoice.invoiceNumber} à ${invoice.client.email} ?`)) {
      try {
        // This would call your email API endpoint
        alert('Email envoyé avec succès!');
      } catch (error) {
        alert('Erreur lors de l\'envoi de l\'email');
      }
    }
  };

  const handleShareLink = async (invoice: Invoice) => {
    try {
      const res = await api.generatePublicLink(invoice.id);
      if (res.url) {
        // Copy to clipboard
        await navigator.clipboard.writeText(res.url);
        alert(`Lien public généré et copié dans le presse-papier !\n\n${res.url}`);
      }
    } catch (e) {
      alert('Erreur lors de la génération du lien.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Facturé</p>
            <h3 className="text-2xl font-black text-gray-900">{totalRevenue.toLocaleString()} MAD</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Documents</p>
            <h3 className="text-2xl font-black text-gray-900">{filteredInvoices.length}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Date</p>
            <h3 className="text-lg font-black text-gray-900">{new Date().toLocaleDateString()}</h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client, n° facture..."
            className="bg-transparent border-none outline-none text-sm font-medium w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase text-gray-600 outline-none focus:border-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="Standard">Factures</option>
            <option value="Devis">Devis</option>
            <option value="Dev">Dev</option>
            <option value="Avoir">Avoirs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase text-gray-600 outline-none focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="En cours">En cours</option>
            <option value="Payée">Payée</option>
          </select>
        </div>
      </div>

      {/* List - ERP Style Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">N° Document</th>
                <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Client</th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">HT</th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">TVA</th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">TTC</th>
                <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Devise</th>
                <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.map((invoice) => {
                // Calculate totals for this row
                let totalHt = 0;
                let totalTva = 0;

                invoice.items.forEach(item => {
                  item.subItems.forEach(sub => {
                    const lineHt = sub.price * sub.quantity * (1 - (sub.discount || 0) / 100);
                    const lineTva = lineHt * (sub.taxRate / 100);
                    totalHt += lineHt;
                    totalTva += lineTva;
                  });
                });

                const totalTtc = totalHt + totalTva;
                const isSelected = selectedIds.includes(invoice.id);

                return (
                  <tr
                    key={invoice.id}
                    onDoubleClick={() => onEdit(invoice)}
                    className={`group hover:bg-blue-50/30 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(invoice.id);
                        }}
                      />
                    </td>
                    {/* Date */}
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700 font-medium">{new Date(invoice.date).toLocaleDateString()}</div>
                    </td>
                    {/* N° Document */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 text-sm">{invoice.invoiceNumber}</div>
                    </td>
                    {/* Type */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-bold uppercase">
                        {invoice.type}
                      </span>
                    </td>
                    {/* Client */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 text-sm">{invoice.client.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{invoice.client.email}</div>
                    </td>
                    {/* HT */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-gray-700 text-sm">{totalHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                    {/* TVA */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-medium text-gray-600 text-sm">{totalTva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                    {/* TTC */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-gray-900 text-sm">{totalTtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                    {/* Devise */}
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold text-gray-600">{invoice.currency}</span>
                    </td>
                    {/* Statut */}
                    <td className="py-3 px-4 text-center">
                      <select
                        value={invoice.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as InvoiceStatus;
                          onStatusChange?.(invoice.id, newStatus);
                          onUpdateStatus?.(invoice.id, newStatus);
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold uppercase text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:border-gray-300"
                        style={{
                          backgroundColor:
                            invoice.status === 'Payée' ? '#d1fae5' :
                              invoice.status === 'Non payée' ? '#fef3c7' :
                                invoice.status === 'En cours' ? '#dbeafe' :
                                  invoice.status === 'Brouillon' ? '#f3f4f6' :
                                    invoice.status === 'EnRetard' ? '#fee2e2' : '#f3f4f6',
                          color:
                            invoice.status === 'Payée' ? '#047857' :
                              invoice.status === 'Non payée' ? '#b45309' :
                                invoice.status === 'En cours' ? '#1d4ed8' :
                                  invoice.status === 'Brouillon' ? '#374151' :
                                    invoice.status === 'EnRetard' ? '#dc2626' : '#6b7280'
                        }}
                      >
                        <option value="Brouillon">Brouillon</option>
                        <option value="En cours">En cours</option>
                        <option value="Payée">Payée</option>
                        <option value="Non payée">Non payée</option>
                        <option value="EnRetard">En Retard</option>
                      </select>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrint(invoice); }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          title="Aperçu / Imprimer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(invoice); }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicate(invoice); }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                          title="Dupliquer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                            setShowPreview(true);
                            setAutoOpenEmail(true);
                          }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-green-600 hover:border-green-200 transition-all shadow-sm"
                          title="Envoyer Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShareLink(invoice); }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          title="Partager le lien public"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(invoice.id); }}
                          className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-4 bg-blue-50 border-t border-blue-100 flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
            <span className="text-sm font-bold text-blue-700">{selectedIds.length} document(s) sélectionné(s)</span>
            <div className="flex gap-3">
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
              <button
                onClick={handleBulkDuplicate}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-100"
              >
                <Copy className="w-4 h-4" /> Dupliquer
              </button>
              <button
                onClick={handleBulkEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
              >
                <Mail className="w-4 h-4" /> Envoyer Email
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-100"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        )}

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Aucun document trouvé</h3>
            <p className="text-gray-500 text-sm mt-2">Essayez de modifier vos filtres ou créez un nouveau document.</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" /> Aperçu
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Update Title for Filename
                    const oldTitle = document.title;
                    document.title = `${selectedInvoice.invoiceNumber} - ${selectedInvoice.client.name}`;
                    setTimeout(() => {
                      window.print();
                      setTimeout(() => { document.title = oldTitle; }, 500);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <button
                  onClick={() => { setShowPreview(false); setAutoOpenEmail(false); }}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-100">
              <div className="max-w-4xl mx-auto shadow-xl">
                <InvoicePreview invoice={selectedInvoice} autoOpenEmail={autoOpenEmail} />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => { setShowPreview(false); setAutoOpenEmail(false); }}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;
