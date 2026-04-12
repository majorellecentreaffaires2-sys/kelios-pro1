import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ContactInfo, Invoice, ClientCountry } from '../types';
import {
  Users, Search, Mail, Phone, MapPin,
  Building2, UserCircle2, X, Globe, Smartphone,
  Printer, History, ArrowRight, Hash, UserPlus, SaveAll, RefreshCw, Flag,
  Edit3, Trash2
} from 'lucide-react';
import { api, externalApi } from '../apiClient';

interface ClientManagerProps {
  clients: ContactInfo[];
  invoices: Invoice[];
  onCreate: (c: ContactInfo) => void;
  onUpdate: (id: string, updates: Partial<ContactInfo>) => void;
  onDelete?: (id: string) => void;
}

const CLIENT_FAMILIES = ["Particuliers", "Professionnels", "Grands Comptes", "Administration", "International"];

// Morocco-specific civilities
const CIVILITIES_MAROC = ["Monsieur", "Madame", "Mademoiselle", "SA", "SARL", "SARLAU", "SNC", "SCS", "SCA", "Association"];

// France-specific civilities
const CIVILITIES_FRANCE = ["Monsieur", "Madame", "SA", "SARL", "SAS", "SASU", "EURL", "SCI", "SNC", "Association"];

const ClientManager: React.FC<ClientManagerProps> = ({ clients, invoices, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ContactInfo | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFormTab, setActiveFormTab] = useState<'details' | 'entreprise' | 'reglement'>('details');
  const [activeCreationTab, setActiveCreationTab] = useState<'details' | 'entreprise' | 'reglement'>('details');
  const [countries, setCountries] = useState<any[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [clientCountry, setClientCountry] = useState<ClientCountry>('maroc');
  const [editClientCountry, setEditClientCountry] = useState<ClientCountry>('maroc');

  const [form, setForm] = useState<Partial<ContactInfo & { country?: ClientCountry }>>({
    id: Math.random().toString(36).substr(2, 9),
    code: `CL${(clients.length + 1).toString().padStart(5, '0')}`,
    civility: 'Monsieur',
    name: '', email: '', phone: '', address: '', category: 'Particuliers',
    country: 'maroc'
  } as any);

  useEffect(() => {
    externalApi.getCountries().then(setCountries);
  }, []);

  // Manual Save Function
  const handleManualUpdate = async () => {
    if (!selectedClient || !selectedClient.id) return;
    setAutoSaveStatus('saving');
    try {
      await onUpdate(selectedClient.id, selectedClient);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (e) {
      console.error("Manual update client failed", e);
      setAutoSaveStatus('idle');
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [clients, search, categoryFilter]);

  const familyStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    CLIENT_FAMILIES.forEach(f => stats[f] = 0);
    clients.forEach(c => {
      if (c.category && stats[c.category] !== undefined) stats[c.category]++;
    });
    return stats;
  }, [clients]);

  const calculateInvoiceTotals = (inv: Invoice) => {
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
    const ttc = ht + tva - discount;
    const paid = (inv.payments || []).reduce((acc, p) => acc + (parseFloat(String(p.amount)) || 0), 0);
    return { ht, tva, ttc, paid, balance: ttc - paid };
  };

  const clientHistory = useMemo(() => {
    if (!selectedClient) return [];
    return invoices.filter(inv =>
      inv.client.id === selectedClient.id ||
      inv.client.name === selectedClient.name
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedClient, invoices]);

  const clientStats = useMemo(() => {
    if (!selectedClient) return { totalInvoiced: 0, totalPaid: 0, outstanding: 0 };
    return clientHistory.reduce((acc, inv) => {
      const totals = calculateInvoiceTotals(inv);
      acc.totalInvoiced += totals.ttc;
      acc.totalPaid += totals.paid;
      acc.outstanding += totals.balance;
      return acc;
    }, { totalInvoiced: 0, totalPaid: 0, outstanding: 0 });
  }, [clientHistory, selectedClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ ...form, country: clientCountry } as ContactInfo);
    setShowForm(false);
    setClientCountry('maroc');
    setForm({
      id: Math.random().toString(36).substr(2, 9),
      code: `CL${(clients.length + 2).toString().padStart(5, '0')}`,
      civility: 'Monsieur',
      name: '', email: '', phone: '', address: '', category: 'Particuliers',
      country: 'maroc'
    } as any);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase">Base Tiers</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Gestion Clientèle & Grands Comptes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:scale-105 transition-all"
        >
          Nouveau Client
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {CLIENT_FAMILIES.map(family => (
          <div
            key={family}
            className={`glass p-6 rounded-3xl border-white/50 flex flex-col items-center text-center group transition-all cursor-pointer ${categoryFilter === family ? 'bg-blue-600 border-blue-400 text-white' : 'hover:bg-blue-600/5'}`}
            onClick={() => setCategoryFilter(categoryFilter === family ? 'all' : family)}
          >
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${categoryFilter === family ? 'text-blue-100' : 'text-blue-400'}`}>{family}</p>
            <h4 className="text-3xl font-black leading-none">{familyStats[family]}</h4>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search and filters header */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-6 py-3 font-bold text-sm outline-none focus:border-blue-500 transition-all"
              placeholder="Chercher par nom, code client ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Table-based client list */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <th className="text-left px-6 py-4">Code</th>
                <th className="text-left px-6 py-4">Pays</th>
                <th className="text-left px-6 py-4">Client</th>
                <th className="text-left px-6 py-4">Email</th>
                <th className="text-left px-6 py-4">Téléphone</th>
                <th className="text-left px-6 py-4">ICE / SIREN</th>
                <th className="text-left px-6 py-4">Catégorie</th>
                <th className="text-center px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                  onClick={() => { setSelectedClient(c); setEditClientCountry((c as any).country || 'maroc'); }}
                >
                  {/* Code */}
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                      {c.code || '---'}
                    </span>
                  </td>

                  {/* Country */}
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${(c as any).country === 'france'
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                      {(c as any).country === 'france' ? 'FR' : 'MA'}
                    </span>
                  </td>

                  {/* Client Name */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-black text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                        {c.civility && <span className="text-gray-400 font-bold mr-1">{c.civility}</span>}
                        {c.name}
                      </p>
                      {c.address && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">{c.address}</p>
                      )}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-600">{c.email || '---'}</p>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-600">{c.phone || '---'}</p>
                  </td>

                  {/* ICE/SIREN */}
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono font-bold text-gray-500">
                      {(c as any).country === 'france' ? (c.siren || '---') : (c.ice || '---')}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-black text-gray-400 uppercase">{c.category || '---'}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(c);
                          setEditClientCountry((c as any).country || 'maroc');
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${c.name}" ?`)) {
                              onDelete(c.id!);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {filteredClients.length === 0 && (
            <div className="p-12 text-center">
              <UserCircle2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">Aucun client trouvé</p>
              <p className="text-gray-300 text-sm mt-1">Ajoutez un nouveau client ou modifiez vos critères de recherche</p>
            </div>
          )}
        </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-[300] flex justify-end">
          <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={() => setSelectedClient(null)}></div>
          <div className="relative w-full max-w-3xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
            <div className="bg-[#f8faff] p-8 border-b border-gray-200">
              <div className="flex justify-between items-start mb-6">
                <button onClick={() => setSelectedClient(null)} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                <div className="flex items-center gap-3">
                  {autoSaveStatus !== 'idle' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-50 rounded-xl">
                      {autoSaveStatus === 'saving' ? <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" /> : <SaveAll className="w-3 h-3 text-emerald-500" />}
                      <span className="text-[8px] font-black uppercase text-blue-500">{autoSaveStatus === 'saving' ? 'Sync...' : 'Enregistré'}</span>
                    </div>
                  )}
                  <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2 hover:bg-gray-50"><Printer className="w-4 h-4" /> Imprimer</button>
                </div>
              </div>
              <div className="flex gap-8 items-center">
                <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-blue-200">
                  {selectedClient.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic">
                    <span className="text-blue-600 mr-2 opacity-50">{selectedClient.civility}</span>
                    {selectedClient.name}
                  </h2>
                  <p className="text-blue-500 font-black text-[11px] uppercase tracking-[0.4em] mt-2">{selectedClient.category}</p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-2 bg-gray-100/50 p-2 rounded-2xl mt-8">
                {['details', 'entreprise', 'reglement'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFormTab(tab as any)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFormTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-gray-200/50'}`}
                  >
                    {tab === 'details' ? 'Coordonnées' : tab === 'entreprise' ? 'Données Légales' : 'Règlement & Compta'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {activeFormTab === 'details' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Facturé</p>
                      <h4 className="text-xl font-black text-blue-900">{clientStats.totalInvoiced.toLocaleString()} <span className="text-[10px] opacity-40">MAD</span></h4>
                    </div>
                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Réglé</p>
                      <h4 className="text-xl font-black text-emerald-600">{clientStats.totalPaid.toLocaleString()} <span className="text-[10px] opacity-40">MAD</span></h4>
                    </div>
                    <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Solde Dû</p>
                      <h4 className="text-xl font-black text-orange-600">{clientStats.outstanding.toLocaleString()} <span className="text-[10px] opacity-40">MAD</span></h4>
                    </div>
                  </div>

                  {/* Country Selector for Edit */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <Flag className="w-5 h-5 text-blue-600" />
                    <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Pays de Client :</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedClient({ ...selectedClient, country: 'maroc' as any })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedClient.country === 'maroc' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300'}`}
                      >
                        Maroc
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedClient({ ...selectedClient, country: 'france' as any })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedClient.country === 'france' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'}`}
                      >
                        France
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-900 flex items-center gap-3">
                        <History className="w-5 h-5" /> Journal Historique
                      </h3>
                    </div>
                    <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Document</th>
                            <th className="px-6 py-4 text-right">Montant TTC</th>
                            <th className="px-6 py-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-[11px] font-bold">
                          {clientHistory.map(inv => {
                            const totals = calculateInvoiceTotals(inv);
                            return (
                              <tr key={inv.id} className="hover:bg-blue-50/20 transition-all group">
                                <td className="px-6 py-4 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4"><span className="text-blue-600 font-black">{inv.invoiceNumber}</span></td>
                                <td className="px-6 py-4 text-right font-black text-gray-800">{totals.ttc.toLocaleString()} {inv.currency}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${inv.status === 'Paye' || inv.status === 'Payée' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Édition des Coordonnées</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Civilité / Forme Juridique</label>
                          <select
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                            value={selectedClient.civility}
                            onChange={e => setSelectedClient({ ...selectedClient, civility: e.target.value })}
                          >
                            {(selectedClient?.country === 'france' ? CIVILITIES_FRANCE : CIVILITIES_MAROC).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Désignation / Nom</label>
                          <input
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                            value={selectedClient.name}
                            onChange={e => setSelectedClient({ ...selectedClient, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Adresse Postale</label>
                          <textarea
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                            value={selectedClient.address}
                            onChange={e => setSelectedClient({ ...selectedClient, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase">Email Business</label>
                            <input
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                              value={selectedClient.email}
                              onChange={e => setSelectedClient({ ...selectedClient, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase">Tél. / Mobile</label>
                            <input
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                              value={selectedClient.phone || ''}
                              onChange={e => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Données Légales & Profil</h4>
                      <div className="space-y-4 bg-gray-50 p-6 rounded-3xl">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Famille Client</label>
                          <select
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            value={selectedClient.category}
                            onChange={e => setSelectedClient({ ...selectedClient, category: e.target.value })}
                          >
                            {CLIENT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Code Client</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={selectedClient.code || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, code: e.target.value })}
                          />
                        </div>
                        {selectedClient.country === 'france' ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase">SIREN</span>
                              <input
                                className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                                value={selectedClient.siren || ''}
                                onChange={e => setSelectedClient({ ...selectedClient, siren: e.target.value })}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase">TVA Intra</span>
                              <input
                                className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                                value={selectedClient.tvaIntra || ''}
                                onChange={e => setSelectedClient({ ...selectedClient, tvaIntra: e.target.value })}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase">I.C.E</span>
                              <input
                                className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                                value={selectedClient.ice || ''}
                                onChange={e => setSelectedClient({ ...selectedClient, ice: e.target.value })}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase">I.F</span>
                              <input
                                className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                                value={selectedClient.ifNum || ''}
                                onChange={e => setSelectedClient({ ...selectedClient, ifNum: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'entreprise' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Données Légales & Profil</h4>
                  <div className="space-y-4 bg-gray-50 p-6 rounded-3xl">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Famille Client</label>
                      <select
                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                        value={selectedClient.category}
                        onChange={e => setSelectedClient({ ...selectedClient, category: e.target.value })}
                      >
                        {CLIENT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Code Client</span>
                      <input
                        className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                        value={selectedClient.code || ''}
                        onChange={e => setSelectedClient({ ...selectedClient, code: e.target.value })}
                      />
                    </div>
                    {selectedClient.country === 'france' ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">SIREN</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={selectedClient.siren || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, siren: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">SIRET</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={(selectedClient as any).siret || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, siret: e.target.value } as any)}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">TVA Intra</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={selectedClient.tvaIntra || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, tvaIntra: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">I.C.E</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={selectedClient.ice || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, ice: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">I.F</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={selectedClient.ifNum || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, ifNum: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Taxe Pro</span>
                          <input
                            className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                            value={(selectedClient as any).taxePro || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, taxePro: e.target.value } as any)}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Taux Remise</span>
                      <input
                        type="number"
                        className="bg-transparent border-b border-gray-200 outline-none text-[11px] font-black text-right w-24"
                        value={selectedClient.remiseDefault || 0}
                        onChange={e => setSelectedClient({ ...selectedClient, remiseDefault: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'reglement' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Col 1 */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Mode & Délais</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Mode de règlement</label>
                          <select
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                            value={selectedClient.reglementMode || 'Virement'}
                            onChange={e => setSelectedClient({ ...selectedClient, reglementMode: e.target.value as any })}
                          >
                            <option value="Virement">Virement Bancaire</option>
                            <option value="Cheque">Chèque</option>
                            <option value="Especes">Espèces</option>
                            <option value="Carte">Carte Bancaire</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Délai (jours)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-24 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                              value={selectedClient.paymentDelay || 0}
                              onChange={e => setSelectedClient({ ...selectedClient, paymentDelay: parseInt(e.target.value) })}
                            />
                            <span className="text-[10px] font-bold text-gray-400">Jours après facture</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Comptabilité</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Compte comptable</label>
                          <input
                            placeholder="411000..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                            value={selectedClient.accountingAccount || ''}
                            onChange={e => setSelectedClient({ ...selectedClient, accountingAccount: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Situation Financière</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Encours Autorisé</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none pr-12"
                            value={selectedClient.encoursAutorise || 0}
                            onChange={e => setSelectedClient({ ...selectedClient, encoursAutorise: parseFloat(e.target.value) })}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">MAD</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Solde Initial</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold outline-none pr-12"
                            value={selectedClient.soldeInitial || 0}
                            onChange={e => setSelectedClient({ ...selectedClient, soldeInitial: parseFloat(e.target.value) })}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">MAD</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className={`w-12 h-6 rounded-full p-1 transition-all ${selectedClient.isBlocked ? 'bg-red-500' : 'bg-gray-200'}`} onClick={() => setSelectedClient({ ...selectedClient, isBlocked: !selectedClient.isBlocked })}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${selectedClient.isBlocked ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedClient.isBlocked ? 'text-red-500' : 'text-gray-400'}`}>
                          {selectedClient.isBlocked ? 'Client Bloqué' : 'Client Actif'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Explicit Save Button - Always visible in detail view */}
              <div className="pt-8 flex justify-end">
                <button
                  onClick={handleManualUpdate}
                  disabled={autoSaveStatus === 'saving'}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${autoSaveStatus === 'saved'
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1'
                    }`}
                >
                  {autoSaveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : autoSaveStatus === 'saved' ? (
                    <>
                      <SaveAll className="w-4 h-4" />
                      Modifications Enregistrées
                    </>
                  ) : (
                    <>
                      <SaveAll className="w-4 h-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {
        showForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0a1128]/80 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="bg-white p-0 rounded-[2rem] max-w-5xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-[#f0f3f8] px-8 py-6 border-b border-gray-300 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Onboarding Tiers</h3>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} type="button" className="p-4 text-gray-400 hover:text-red-500 transition-all"><X /></button>
              </div>

              {/* Tabs Navigation for Creation */}
              <div className="bg-[#f0f3f8] px-8 border-b border-gray-300 flex text-[10px] font-black uppercase tracking-widest gap-8">
                {['details', 'entreprise', 'reglement'].map(tab => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveCreationTab(tab as any)}
                    className={`py-4 border-b-2 transition-all ${activeCreationTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {tab === 'details' ? 'Coordonnées' : tab === 'entreprise' ? 'Données Légales' : 'Règlement & Compta'}
                  </button>
                ))}
              </div>

              <div className="p-10 h-[500px] overflow-y-auto">
                {activeCreationTab === 'details' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Country Selector */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <Flag className="w-5 h-5 text-blue-600" />
                      <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Type de Client :</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setClientCountry('maroc')}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${clientCountry === 'maroc' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300'}`}
                        >
                          Maroc
                        </button>
                        <button
                          type="button"
                          onClick={() => setClientCountry('france')}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${clientCountry === 'france' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'}`}
                        >
                          France
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-gray-400">Civilité / Forme Juridique</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.civility} onChange={e => setForm({ ...form, civility: e.target.value })}>
                          {(clientCountry === 'maroc' ? CIVILITIES_MAROC : CIVILITIES_FRANCE).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <label className="text-[9px] font-black uppercase text-gray-400">Désignation / Nom complet</label>
                        <input required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <label className="text-[9px] font-black uppercase text-gray-400">Email Business</label>
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <label className="text-[9px] font-black uppercase text-gray-400">Site Web</label>
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-gray-400">Famille Client</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                          {CLIENT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <label className="text-[9px] font-black uppercase text-gray-400">Adresse Complète</label>
                        <textarea rows={2} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 font-bold text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-gray-400">Téléphone</label>
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder={clientCountry === 'maroc' ? '+212...' : '+33...'} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-gray-400">Mobile</label>
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder={clientCountry === 'maroc' ? '+212 6...' : '+33 6...'} value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} />
                          </div>
                        </div>
                        <label className="text-[9px] font-black uppercase text-gray-400">Fax</label>
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.fax || ''} onChange={e => setForm({ ...form, fax: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {activeCreationTab === 'entreprise' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Country indicator */}
                    <div className={`p-4 rounded-2xl border ${clientCountry === 'maroc' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        {clientCountry === 'maroc' ? 'Champs pour Client Marocain' : 'Champs pour Client Français'}
                      </p>
                    </div>

                    {clientCountry === 'maroc' ? (
                      // Morocco-specific fields
                      <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-gray-400">Code Client</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">I.C.E (Identifiant Commun de l'Entreprise)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder="15 chiffres" value={form.ice || ''} onChange={e => setForm({ ...form, ice: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">I.F (Identifiant Fiscal)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.ifNum || ''} onChange={e => setForm({ ...form, ifNum: e.target.value })} />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-gray-400">R.C (Registre de Commerce)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.rc || ''} onChange={e => setForm({ ...form, rc: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">Taxe Professionnelle</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={(form as any).taxePro || ''} onChange={e => setForm({ ...form, taxePro: e.target.value } as any)} />
                          <label className="text-[9px] font-black uppercase text-gray-400">CNSS (Sécurité Sociale)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={(form as any).cnss || ''} onChange={e => setForm({ ...form, cnss: e.target.value } as any)} />
                        </div>
                      </div>
                    ) : (
                      /* France-specific fields */
                      <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-gray-400">Code Client</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">SIREN (9 chiffres)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder="XXX XXX XXX" value={form.siren || ''} onChange={e => setForm({ ...form, siren: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">SIRET (14 chiffres)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder="XXX XXX XXX XXXXX" value={(form as any).siret || ''} onChange={e => setForm({ ...form, siret: e.target.value } as any)} />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase text-gray-400">N° TVA Intracommunautaire</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder="FR XX XXXXXXXXX" value={form.tvaIntra || ''} onChange={e => setForm({ ...form, tvaIntra: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">Code NAF / APE</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder="XXXX X" value={form.naf || ''} onChange={e => setForm({ ...form, naf: e.target.value })} />
                          <label className="text-[9px] font-black uppercase text-gray-400">RCS (Registre Commerce et Sociétés)</label>
                          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" placeholder="Ville B XXX XXX XXX" value={form.rc || ''} onChange={e => setForm({ ...form, rc: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeCreationTab === 'reglement' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                    <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Règlement</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-gray-400">Mode de règlement</label>
                        <select
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm"
                          value={form.reglementMode || 'Virement'}
                          onChange={e => setForm({ ...form, reglementMode: e.target.value as any })}
                        >
                          <option value="Virement">Virement Bancaire</option>
                          <option value="Cheque">Chèque</option>
                          <option value="Especes">Espèces</option>
                          <option value="Carte">Carte Bancaire</option>
                        </select>
                        <label className="text-[9px] font-black uppercase text-gray-400">Délai Règlement (Jours)</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm"
                          value={form.paymentDelay || 0}
                          onChange={e => setForm({ ...form, paymentDelay: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-gray-400">Compte Comptable</label>
                        <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm" value={form.accountingAccount || ''} onChange={e => setForm({ ...form, accountingAccount: e.target.value })} />
                        <label className="text-[9px] font-black uppercase text-gray-400">Remise (%)</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm"
                          value={form.remiseDefault || 0}
                          onChange={e => setForm({ ...form, remiseDefault: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>

                    <h4 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Encours & Solde</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-gray-400">Encours Autorisé</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm"
                          value={form.encoursAutorise || 0}
                          onChange={e => setForm({ ...form, encoursAutorise: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase text-gray-400">Solde Initial</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-bold text-sm"
                          value={form.soldeInitial || 0}
                          onChange={e => setForm({ ...form, soldeInitial: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={form.isBlocked || false}
                          onChange={e => setForm({ ...form, isBlocked: e.target.checked })}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Client Bloqué ?</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#f0f3f8] px-8 py-6 border-t border-gray-300 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-10 py-4 font-bold uppercase text-[10px] text-gray-500">Fermer</button>
                <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Enregistrer</button>
              </div>
            </form>
          </div>
        )
      }
    </div >
  );
};

export default ClientManager;