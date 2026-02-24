
import React, { useState, useRef } from 'react';
import { Company, AccountingAccount } from '../types';
import { Plus, Building2, Globe, Mail, Phone, Palette, Hash, X, CheckCircle, Power, ShieldAlert, Database, Settings, ToggleLeft, ToggleRight, ImageIcon, Upload, Trash2, Shield, ChevronRight, User } from 'lucide-react';
import { api } from '../apiClient';

interface CompanyManagerProps {
  companies: Company[];
  users?: any[]; // For SuperAdmin
  onCreate: (c: Company) => void;
  onSelect: (c: Company) => void;
  onUpdate: (id: string, updates: Partial<Company>) => void;
  activeId?: string;
}

const DEFAULT_ACCOUNTS: AccountingAccount[] = [
  { id: 'acc-1', code: '512000', label: 'Banque Principale', type: 'Treasury' },
  { id: 'acc-2', code: '512001', label: 'Banque Secondaire', type: 'Treasury' },
  { id: 'acc-4', code: '445710', label: 'TVA Collectée', type: 'Vat' },
  { id: 'acc-5', code: '706000', label: 'Ventes de Services', type: 'Revenue' },
];

const CompanyManager: React.FC<CompanyManagerProps> = ({ companies, users, onCreate, onSelect, onUpdate, activeId }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Partial<Company>>({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    address: '',
    email: '',
    phone: '',
    logoUrl: '',
    currency: 'MAD',
    defaultVatRates: [20, 14, 10, 7, 0],
    numberingFormat: 'FAC-{YYYY}-{000}',
    primaryColor: '#007AFF',
    accountingPlan: [...DEFAULT_ACCOUNTS],
    active: true,
    country: 'maroc',
    companyType: 'Standard',
    userId: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    if (editingCompany) {
      onUpdate(editingCompany.id, form as Company);
      setEditingCompany(null);
    } else {
      onCreate(form as Company);
    }
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      id: Math.random().toString(36).substr(2, 9),
      name: '', address: '', email: '', phone: '', website: '', logoUrl: '',
      ice: '', ifNum: '', rc: '', taxePro: '', siren: '', naf: '', tvaIntra: '',
      currency: 'MAD', defaultVatRates: [20, 14, 10, 7, 0],
      numberingFormat: 'FAC-{YYYY}-{000}', primaryColor: '#007AFF',
      accountingPlan: [...DEFAULT_ACCOUNTS], active: true, country: 'maroc',
      bankAccount: '', bankName: '', swiftCode: '', companyType: 'Standard',
      userId: undefined
    });
  };

  const startEdit = (c: Company) => {
    setEditingCompany(c);
    setForm(c);
    setShowForm(true);
  };

  const toggleActive = (c: Company) => {
    const nextStatus = !c.active;
    onUpdate(c.id, { active: nextStatus });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      setForm(prev => ({ ...prev, logoUrl: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end mb-4">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Mes Sociétés</h1>
              <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-1">Environnements SaaS {users ? "Gérés" : "Multi-Tenant"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {companies.map(c => (
          <div
            key={c.id}
            className={`group relative cursor-pointer transition-all duration-500 hover:scale-[1.02] ${!c.active ? 'opacity-80 grayscale-[0.5]' : ''}`}
            onClick={() => c.active && onSelect(c)}
          >
            <div className={`relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 ${activeId === c.id ? 'ring-4 ring-offset-4 ring-blue-500/30' : ''}`}>

              {/* Premium Header */}
              <div
                className="h-32 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${c.primaryColor || '#1e293b'}, ${c.primaryColor ? c.primaryColor + 'dd' : '#0f172a'})`
                }}
              >
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                <div className="absolute top-5 left-6 flex gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                    {c.currency}
                  </span>
                  {users && c.userId && (
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold text-white/70 uppercase tracking-tighter border border-white/5">
                      {users.find(u => u.id === c.userId)?.username || "Inconnu"}
                    </span>
                  )}
                </div>

                <div className="absolute top-5 right-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleActive(c); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 transition-all ${c.active ? 'bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-100 hover:bg-red-500/30'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${c.active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[9px] font-black uppercase tracking-wider">{c.active ? 'Actif' : 'Inactif'}</span>
                  </button>
                </div>
              </div>

              {/* Body Content */}
              <div className="px-8 pb-8 pt-0 relative">
                {/* Floating Logo */}
                <div className="relative -mt-12 mb-4 flex justify-between items-end">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 border-4 border-white transform transition-transform group-hover:-translate-y-2">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} className="w-full h-full object-contain" alt={c.name} />
                    ) : (
                      <Building2 className={`w-10 h-10`} style={{ color: c.primaryColor || '#1e293b' }} />
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(c); }}
                      className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{c.name}</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                      <Globe className="w-3 h-3" /> {c.website || 'Pas de site web'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-100 border-dashed">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{c.country === 'france' ? 'SIREN' : 'I.C.E'}</span>
                      <p className="text-xs font-bold text-gray-700 font-mono">{(c.country === 'france' ? c.siren : c.ice) || '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{c.country === 'france' ? 'NAF' : 'R.C'}</span>
                      <p className="text-xs font-bold text-gray-700 font-mono">{(c.country === 'france' ? c.naf : c.rc) || '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pays</span>
                      <p className="text-xs font-bold text-gray-700 uppercase">{c.country || 'maroc'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Téléphone</span>
                      <p className="text-xs font-bold text-gray-700 font-mono truncate">{c.phone || '---'}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      disabled={!c.active}
                      onClick={(e) => { e.stopPropagation(); c.active && onSelect(c); }}
                      className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all overflow-hidden relative group/btn
                         ${c.active ? 'text-white shadow-lg hover:shadow-xl hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                         `}
                      style={{ backgroundColor: c.active ? (c.primaryColor || '#1e293b') : undefined }}
                    >
                      {c.active && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>}
                      Access Workspace <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Company Card */}
        <div
          onClick={() => { resetForm(); setEditingCompany(null); setShowForm(true); }}
          className="group cursor-pointer transition-all duration-500 hover:scale-[1.02]"
        >
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-dashed border-gray-200 hover:border-blue-400">
            <div className="h-44 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-black text-gray-700 mb-2">Nouvelle Société</h3>
              <p className="text-sm text-gray-400 mb-4">Créer un nouvel environnement</p>
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm">
                <Plus className="w-4 h-4" />
                Ajouter
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f172a]/60 backdrop-blur-xl overflow-y-auto">
          <form onSubmit={handleSubmit} className="relative bg-white rounded-[2.5rem] max-w-5xl w-full shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Form Header Background */}
            <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"></div>
              <div className="absolute left-10 bottom-10">
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  {editingCompany ? "Paramètres Société" : "Nouvelle Société"}
                </h3>
                <p className="text-blue-200 font-bold text-xs uppercase tracking-[0.2em] mt-2">Configuration de l&apos;entité légale</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-8 right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md transition-all text-white border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-56 px-12 pb-12 space-y-10">
              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Logo & Branding */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Identité Visuelle</label>
                    <div className="w-40 h-40 mx-auto bg-white rounded-3xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white mb-6 relative group">
                      {form.logoUrl ? (
                        <div className="relative w-full h-full">
                          <img src={form.logoUrl} className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))} className="text-white hover:text-red-400"><Trash2 className="w-8 h-8" /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          {uploading ? (
                            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-12 h-12 text-slate-200" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading ? 'Envoi en cours...' : 'Téléverser Logo'}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      <div className="relative">
                        <input
                          placeholder="Ou lien https://..."
                          className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-[10px] font-bold text-center outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={form.logoUrl && !form.logoUrl.startsWith('data:') ? form.logoUrl : ''}
                          onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Couleur de la marque</label>
                    <div className="flex items-center gap-4">
                      <input type="color" className="w-14 h-14 rounded-2xl border-4 border-white shadow-md cursor-pointer" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} />
                      <div>
                        <p className="font-bold text-slate-700">{form.primaryColor}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Couleur Principale</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Form Fields */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Company Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 block">Nom de la Société <span className="text-red-500">*</span></label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-5 py-4 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Ex: Ma Super Entreprise SARL"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 block">Type d&apos;activité</label>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-5 py-4 font-bold text-slate-800 outline-none appearance-none transition-all"
                          value={form.companyType || 'Standard'}
                          onChange={e => setForm({ ...form, companyType: e.target.value as any })}
                        >
                          <option value="Standard">Standard (TPE/PME)</option>
                          <option value="Batiment">Bâtiment & Construction</option>
                          <option value="Services">Services & Consulting</option>
                          <option value="Commerce">Commerce & Retail</option>
                          <option value="Dev">Design & Développement (Dev)</option>
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 block">Pays & Devise</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <select
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-4 font-bold text-slate-800 outline-none appearance-none text-sm"
                            value={form.country}
                            onChange={e => setForm({ ...form, country: e.target.value as 'maroc' | 'france' })}
                          >
                            <option value="maroc">🇲🇦 Maroc</option>
                            <option value="france">🇫🇷 France</option>
                          </select>
                        </div>
                        <div className="relative">
                          <select
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-4 font-bold text-slate-800 outline-none appearance-none text-sm"
                            value={form.currency}
                            onChange={e => setForm({ ...form, currency: e.target.value })}
                          >
                            <option value="MAD">MAD (DH)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Ownership Link (SuperAdmin only) */}
                    {users && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-blue-600 uppercase ml-2 mb-2 flex items-center gap-2">
                          <Shield className="w-3 h-3" /> Client Propriétaire (Affectation)
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-blue-50 border border-blue-200 focus:border-blue-500 focus:bg-white rounded-xl px-5 py-4 font-bold text-blue-900 outline-none appearance-none transition-all"
                            value={form.userId || ''}
                            onChange={e => setForm({ ...form, userId: e.target.value })}
                          >
                            <option value="">-- Sélectionner un utilisateur --</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 rotate-90 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-blue-400 mt-2 ml-4">En tant que SuperAdmin, vous pouvez affecter cette société à un compte client spécifique.</p>
                      </div>
                    )}
                  </div>

                  {/* Legal Info */}
                  <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 mb-6">
                      <Shield className="w-4 h-4" /> Informations Légales
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {form.country === 'france' ? (
                        <>
                          <div><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Siren</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.siren || ''} onChange={e => setForm({ ...form, siren: e.target.value })} /></div>
                          <div><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">NAF</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.naf || ''} onChange={e => setForm({ ...form, naf: e.target.value })} /></div>
                          <div className="col-span-2"><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">TVA Intra.</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.tvaIntra || ''} onChange={e => setForm({ ...form, tvaIntra: e.target.value })} /></div>
                        </>
                      ) : (
                        <>
                          <div><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">I.C.E</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.ice || ''} onChange={e => setForm({ ...form, ice: e.target.value })} /></div>
                          <div><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Taxe Pro</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.taxePro || ''} onChange={e => setForm({ ...form, taxePro: e.target.value })} /></div>
                          <div><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">R.C</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.rc || ''} onChange={e => setForm({ ...form, rc: e.target.value })} /></div>
                          <div><label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Id. Fisc</label><input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500" value={form.ifNum || ''} onChange={e => setForm({ ...form, ifNum: e.target.value })} /></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contact & Bank */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400">Contact</h4>
                      <div className="space-y-3">
                        <input placeholder="Email officiel..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <input placeholder="Téléphone..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <input placeholder="Site web..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
                        <textarea placeholder="Adresse du siège..." rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 resize-none" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400">Banque</h4>
                      <div className="space-y-3">
                        <input placeholder="Nom Banque (Attijari, BMCE...)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" value={form.bankName || ''} onChange={e => setForm({ ...form, bankName: e.target.value })} />
                        <input placeholder="RIB / IBAN" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" value={form.bankAccount || ''} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
                        <input placeholder="Code SWIFT / BIC" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" value={form.swiftCode || ''} onChange={e => setForm({ ...form, swiftCode: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-8 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-4 rounded-xl font-bold uppercase text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:scale-[1.01] transition-all active:scale-[0.99]">
                  {editingCompany ? "Mettre à jour" : "Créer la Société"}
                </button>
              </div>

            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CompanyManager;
