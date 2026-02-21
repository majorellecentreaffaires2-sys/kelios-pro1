import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Invoice, InvoiceType, ContactInfo, Article, Company, InvoiceSubItem, InvoiceTemplate, InvoiceStatus } from '../types';
import {
  Plus, Trash2, Save, X, Users, FileText, Calculator,
  Package, Mail, Phone, MapPin, Hash, Calendar, ChevronDown,
  Building2, Globe, CreditCard, Eye, SaveAll, UserPlus, Printer, Sparkles, Loader2, Paperclip, Send
} from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { generateInvoiceEmail } from '../geminiService';
import { api } from '../apiClient';

interface DocumentCreatorProps {
  type: InvoiceType;
  onSave: (invoice: Invoice) => void;
  activeCompany: Company;
  clients: ContactInfo[];
  articles: Article[];
  invoices: Invoice[];
  initialInvoice?: Invoice;
  templates: InvoiceTemplate[];
  onCancel?: () => void;
  onCreateClient?: (c: ContactInfo) => Promise<void>;
  onUpdateClient?: (id: string, c: Partial<ContactInfo>) => Promise<void>;
}

const DocumentCreator: React.FC<DocumentCreatorProps> = ({
  type,
  onSave,
  activeCompany,
  clients,
  articles,
  invoices,
  initialInvoice,
  templates,
  onCancel,
  onCreateClient
}) => {
  const isEditing = !!initialInvoice;

  // State
  const [currentType, setCurrentType] = useState<InvoiceType>(initialInvoice?.type || type);
  const [client, setClient] = useState<ContactInfo | null>(initialInvoice?.client || null);
  const [date, setDate] = useState(initialInvoice?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState<InvoiceStatus>(initialInvoice?.status || 'Brouillon');
  const [items, setItems] = useState<InvoiceSubItem[]>(
    initialInvoice?.items[0]?.subItems || [
      { id: '1', description: '', quantity: 1, price: 0, unit: 'U', taxRate: 20, discount: 0 }
    ]
  );
  const [notes, setNotes] = useState(initialInvoice?.notes || (activeCompany.companyType === 'Dev'
    ? "Modalités de règlement spécifiques :\n- Accompte à la signature : 30%\n- Versement : 30%\n- Autre versement : 35%\n- Livraison : 5%"
    : ''));
  const [subject, setSubject] = useState(initialInvoice?.subject || '');
  const [currency, setCurrency] = useState(initialInvoice?.currency || activeCompany.currency || 'MAD');
  const [showPreview, setShowPreview] = useState(false);
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-Email State
  const [autoSendEmail, setAutoSendEmail] = useState(false);
  const [autoOpenEmail, setAutoOpenEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [customFile, setCustomFile] = useState<{ name: string, base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed Values
  const invoiceNumber = useMemo(() => {
    if (initialInvoice && initialInvoice.type === currentType) return initialInvoice.invoiceNumber;
    const count = invoices.filter(i => i.type === currentType).length + 1;
    const prefix =
      currentType === 'Devis' || currentType === 'Dev' ? 'DEV' :
        currentType === 'Proforma' ? 'PRO' :
          currentType === 'Avoir' ? 'AVO' : 'FAC';
    return `${prefix}-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
  }, [invoices, currentType, initialInvoice]);

  const totals = useMemo(() => {
    let ht = 0, tva = 0;
    items.forEach(item => {
      const lineHt = item.price * item.quantity * (1 - (item.discount || 0) / 100);
      const lineTva = lineHt * (item.taxRate / 100);
      ht += lineHt;
      tva += lineTva;
    });
    return { ht, tva, ttc: ht + tva };
  }, [items]);

  // Handlers
  const handleAddItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      price: 0,
      unit: 'U',
      taxRate: 20,
      discount: 0
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceSubItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSave = () => {
    if (!client) {
      alert("Veuillez sélectionner un client.");
      return;
    }

    const invoiceData: Invoice = {
      id: initialInvoice?.id || Math.random().toString(36).substr(2, 9),
      companyId: activeCompany.id,
      invoiceNumber,
      type: currentType,
      status,
      date,
      dueDate,
      sender: { ...activeCompany, civility: '' }, // Adapt Company to ContactInfo mostly
      client,
      items: [{ id: '1', title: 'Prestations', subItems: items }],
      payments: initialInvoice?.payments || [],
      auditTrail: initialInvoice?.auditTrail || [],
      discount: 0,
      notes,
      subject,
      currency,
      language: 'fr',
      primaryColor: activeCompany.primaryColor,
      visualTemplate: 'CorporatePro',
      autoSendEmail,
      emailSubject,
      emailBody,
      customFile
    };

    onSave(invoiceData);
  };

  // Preview Object Construction
  const previewInvoice: Invoice | null = client ? {
    id: 'preview',
    companyId: activeCompany.id,
    invoiceNumber,
    type: currentType,
    status,
    date,
    dueDate,
    sender: { ...activeCompany, civility: '' },
    client,
    items: [{ id: '1', title: 'Prestations', subItems: items }],
    payments: [],
    auditTrail: [],
    discount: 0,
    notes,
    subject,
    currency,
    language: 'fr',
    primaryColor: activeCompany.primaryColor,
    visualTemplate: 'CorporatePro'
  } : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              {isEditing ? `Modifier` : `Nouveau`}
            </h1>
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
              {(['Standard', 'Devis', 'Proforma', 'Avoir', 'Batiment', 'Dev'] as InvoiceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setCurrentType(t)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentType === t
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200/50'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {t === 'Standard' ? 'Facture' : t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-blue-600 font-bold tracking-widest uppercase text-xs">
              N° {invoiceNumber}
            </p>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Devise:</span>
              <div className="flex gap-1">
                {['MAD', 'EUR'].map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-2 py-0.5 rounded text-[9px] font-black transition-all ${currency === c
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {onCancel && (
            <button onClick={onCancel} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs uppercase hover:bg-gray-200 transition-colors">
              Annuler
            </button>
          )}
          <button
            onClick={() => setShowPreview(true)}
            disabled={!client}
            className="px-6 py-3 rounded-xl bg-gray-800 text-white font-bold text-xs uppercase hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Eye className="w-4 h-4" /> Aperçu / Imprimer
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            <Save className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Client
              </h3>
              <button
                onClick={() => setShowClientSelect(!showClientSelect)}
                className="text-blue-600 text-xs font-bold hover:underline"
              >
                {client ? 'Changer' : 'Sélectionner'}
              </button>
            </div>

            {showClientSelect && (
              <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-blue-100">
                <input
                  autoFocus
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 mb-2"
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setClient(c); setShowClientSelect(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg text-sm font-medium flex justify-between"
                    >
                      <span>{c.name}</span>
                      <span className="text-gray-400 text-xs">{c.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {client ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Nom du client</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-all"
                    placeholder="Nom du client"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Adresse</label>
                  <input
                    type="text"
                    value={client.address}
                    onChange={(e) => setClient({ ...client, address: e.target.value })}
                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-all"
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={client.email}
                      onChange={(e) => setClient({ ...client, email: e.target.value })}
                      className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-all"
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Téléphone</label>
                    <input
                      type="tel"
                      value={client.phone}
                      onChange={(e) => setClient({ ...client, phone: e.target.value })}
                      className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-all"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-sm">Aucun client sélectionné</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-4">Notes & Conditions</h3>
            <textarea
              className="w-full bg-gray-50 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]"
              placeholder="Conditions de paiement, livraison..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Settings & Totals */}
        <div className="space-y-6">

          {/* Properties */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-2">Paramètres</h3>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Date du document</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Date d'échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none" />
            </div>

            {/* Subject Dropdown */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Modèle / Sujet</label>
              <select
                value={subject}
                onChange={e => {
                  const val = e.target.value;
                  setSubject(val === 'Sans Sujet' ? '' : val);
                }}
                className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-all"
              >
                <option value="Sans Sujet">Sans Sujet</option>
                <option value="Pour Rénovation">Pour Rénovation</option>
                <option value="Siège Social">Siège Social</option>
                <option value="Contribution">Contribution</option>
                <option value="Custom">Autre (personnalisé)...</option>
              </select>
              {/* Custom Subject Input if needed, logic could be enhanced but simple for now */}
              {!['Sans Sujet', 'Pour Rénovation', 'Siège Social', 'Contribution', ''].includes(subject) && (
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                  placeholder="Saisir le sujet..."
                />
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Items Table - ERP Style - Full Width */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Package className="w-4 h-4" /> Articles
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap min-w-[1000px]">
            <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-24">Code</th>
                <th className="px-3 py-3 min-w-[200px]">Description</th>
                <th className="px-3 py-3 w-16 text-center">Qté</th>
                <th className="px-3 py-3 w-16 text-center">Unité</th>
                <th className="px-3 py-3 w-24 text-right">PV HT</th>
                <th className="px-3 py-3 w-16 text-center">Remise %</th>
                <th className="px-3 py-3 w-24 text-right">Net HT</th>
                <th className="px-3 py-3 w-16 text-center">TVA %</th>
                <th className="px-3 py-3 w-24 text-center">Code Eco</th>
                <th className="px-3 py-3 w-24 text-right">Mt. Eco TTC</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const netHt = item.price * item.quantity * (1 - (item.discount || 0) / 100);
                return (
                  <tr key={item.id} className="group hover:bg-blue-50/50">
                    {/* Code */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="w-full bg-transparent outline-none font-medium text-gray-600 px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all"
                        placeholder="ART-001"
                        value={item.code || ''}
                        onChange={e => updateItem(item.id, 'code', e.target.value)}
                      />
                    </td>
                    {/* Description */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="w-full bg-transparent outline-none font-medium text-gray-900 px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all"
                        placeholder="Désignation..."
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none font-medium text-center px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    {/* Unit */}
                    <td className="px-3 py-2">
                      <select
                        className="w-full bg-transparent outline-none font-medium text-center uppercase text-xs cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
                        value={item.unit || 'U'}
                        onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      >
                        <option value="U">U</option>
                        <option value="Kg">Kg</option>
                        <option value="L">L</option>
                        <option value="m">m</option>
                        <option value="m²">m²</option>
                        <option value="h">h</option>
                        <option value="Jours">Jours</option>
                        <option value="Forfait">Forfait</option>
                      </select>
                    </td>
                    {/* Price */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none font-medium text-right px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all"
                        value={item.price}
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    {/* Discount */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none font-medium text-center text-orange-600 px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-orange-200 transition-all"
                        value={item.discount || 0}
                        onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    {/* Net HT (Calculated) */}
                    <td className="px-3 py-2 text-right font-bold text-gray-700 bg-gray-50/50">
                      {netHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {/* TVA */}
                    <td className="px-3 py-2">
                      <select
                        className="w-full bg-transparent outline-none text-center text-xs cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-all"
                        value={item.taxRate}
                        onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value))}
                      >
                        {activeCompany.defaultVatRates.map(r => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </td>
                    {/* Eco Code */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="w-full bg-transparent outline-none text-center text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all"
                        placeholder="-"
                        value={item.ecoContributionCode || ''}
                        onChange={e => updateItem(item.id, 'ecoContributionCode', e.target.value)}
                      />
                    </td>
                    {/* Eco Amount */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full bg-transparent outline-none text-right text-xs px-2 py-1 rounded hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all"
                        value={item.ecoContributionUnitTtc || 0}
                        onChange={e => updateItem(item.id, 'ecoContributionUnitTtc', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    {/* Actions */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wide hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Ajouter une ligne
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
        <h3 className="font-black text-xs uppercase tracking-widest text-blue-200 mb-6 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Total
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-blue-100">
            <span className="text-sm font-medium">Total HT</span>
            <span className="font-bold text-lg">{totals.ht.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-blue-100">
            <span className="text-sm font-medium">TVA</span>
            <span className="font-bold text-lg">{totals.tva.toLocaleString()}</span>
          </div>
          <div className="pt-4 border-t border-blue-500 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-black text-xl">NET À PAYER</span>
              <span className="font-black text-3xl">{totals.ttc.toLocaleString()} <span className="text-lg">{activeCompany.currency}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Email automation */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div
            onClick={() => setAutoSendEmail(!autoSendEmail)}
            className={`w-10 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${autoSendEmail ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoSendEmail ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs font-bold uppercase text-gray-600">Envoyer par email</span>
        </div>

        {autoSendEmail && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={async () => {
                  if (!previewInvoice) return;
                  setIsGeneratingEmail(true);
                  try {
                    const ai = await generateInvoiceEmail({ ...previewInvoice, totalTtc: totals.ttc });
                    setEmailSubject(ai.subject);
                    setEmailBody(ai.body);
                  } finally {
                    setIsGeneratingEmail(false);
                  }
                }}
                className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                disabled={isGeneratingEmail || !client}
              >
                {isGeneratingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-blue-500" />}
                Générer message IA
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-100 transition-all"
              >
                <Paperclip className="w-3 h-3" />
                {customFile ? 'Changer fichier' : 'Attacher un fichier'}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setCustomFile({
                      name: file.name,
                      base64: reader.result as string
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />

            {customFile && (
              <div className="flex items-center justify-between bg-purple-50/50 p-2 rounded-lg border border-purple-100 animate-in zoom-in-95">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-purple-700 truncate">{customFile.name}</span>
                </div>
                <button
                  onClick={() => setCustomFile(null)}
                  className="p-1 hover:bg-purple-100 rounded text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Sujet de l'email"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
              />
              <textarea
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium outline-none min-h-[100px] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="Message à envoyer avec le document..."
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
              />
            </div>

            <button
              onClick={async () => {
                if (!previewInvoice || !client?.email) {
                  alert("Veuillez d'abord sélectionner un client avec email.");
                  return;
                }
                setIsSendingEmail(true);
                try {
                  // Ensure autoSendEmail is true when this button is clicked
                  setAutoSendEmail(true);
                  // handleSave will pick up the current state of autoSendEmail, subject, body, and customFile
                  setTimeout(() => handleSave(), 100);
                  alert("Enregistrement et envoi en cours... (Génération du PDF en arrière-plan)");
                } catch (e) {
                  alert("Erreur lors de l'envoi.");
                } finally {
                  setIsSendingEmail(false);
                }
              }}
              disabled={isSendingEmail || !client?.email}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
            >
              {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin text-white/50" /> : <Send className="w-4 h-4" />}
              {initialInvoice ? 'Mettre à jour & Envoyer' : 'Enregistrer & Envoyer'}
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" /> Aperçu
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const oldTitle = document.title;
                    document.title = `${previewInvoice.invoiceNumber} - ${previewInvoice.client.name}`;
                    setTimeout(() => {
                      window.print();
                      setTimeout(() => { document.title = oldTitle; }, 1000);
                    }, 500);
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <button onClick={() => { setShowPreview(false); setAutoOpenEmail(false); }} className="p-2 hover:bg-gray-200 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-100">
              <InvoicePreview invoice={previewInvoice} autoOpenEmail={autoOpenEmail} />
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

export default DocumentCreator;
