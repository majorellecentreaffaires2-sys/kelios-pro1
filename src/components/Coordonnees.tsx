import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import {
  Building2, Mail, Phone, Globe, MapPin, Hash, Save, Edit3, X,
  CheckCircle, ShieldCheck, Sparkles, Image as ImageIcon, Palette,
  Globe2, Landmark, Fingerprint, Map as MapIcon, CreditCard, Upload, Trash2
} from 'lucide-react';
import { api } from '../apiClient';

interface CoordonneesProps {
  company: Company;
  onUpdateCompany: (id: string, updates: Partial<Company>) => void;
}

const Coordonnees: React.FC<CoordonneesProps> = ({ company, onUpdateCompany }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Company>>({ ...company });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({ ...company });
  }, [company]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await onUpdateCompany(company.id, form);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 1500);
    } catch (e) {
      setSaveStatus('idle');
    }
  };

  const handleCancel = () => {
    setForm({ ...company });
    setIsEditing(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadFile(file, company.id);
      setForm(prev => ({ ...prev, logoUrl: url }));
      // Also update parent state immediately if not saving the whole form
      onUpdateCompany(company.id, { logoUrl: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const accentColor = company.primaryColor || '#2563eb';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-6xl mx-auto pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100" style={{ backgroundColor: accentColor }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: accentColor }}>Identité Corporative</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
            Configuration <span className="italic opacity-50 font-serif">Société</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-lg">
            Gérez les informations légales, fiscales et visuelles de votre entité de facturation.
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mise à jour...</>
                ) : saveStatus === 'saved' ? (
                  <><CheckCircle className="w-4 h-4 text-emerald-400" /> Enregistré</>
                ) : (
                  <><Save className="w-4 h-4" /> Sauvegarder</>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-900 hover:text-white transition-all shadow-lg group"
            >
              <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Éditer le Profil
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Brand & Hero Preview */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
            <div className="h-40 relative" style={{ backgroundColor: accentColor }}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute top-6 right-6">
                <ShieldCheck className="w-6 h-6 text-white/50" />
              </div>
            </div>

            <div className="px-8 pb-10">
              <div className="relative -mt-14 mb-8">
                <div className="w-28 h-28 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center p-3 border-8 border-white group-hover:scale-105 transition-transform duration-500">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} className="w-full h-full object-contain" alt={company.name} />
                  ) : (
                    <Building2 className="w-12 h-12" style={{ color: accentColor }} />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{company.name}</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Majorlle Actif</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Devise Système</span>
                  <span className="font-extrabold text-slate-900 uppercase">{company.currency}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identité Visuelle</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{accentColor}</span>
                    <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: accentColor }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Decoration */}
            <div className="absolute bottom-0 right-0 p-8 pointer-events-none opacity-5">
              <Sparkles className="w-24 h-24" />
            </div>
          </div>

          {/* Branding Control (When Editing) */}
          {isEditing && (
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-blue-100 p-8 space-y-6 shadow-xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Personnalisation</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo d'Entreprise</label>
                  <div className="flex flex-col gap-4">
                    {form.logoUrl && (
                      <div className="relative w-full aspect-video bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden group/logo">
                        <img src={form.logoUrl} className="w-full h-full object-contain p-4" alt="Logo preview" />
                        <button
                          onClick={() => { setForm({ ...form, logoUrl: '' }); onUpdateCompany(company.id, { logoUrl: '' }); }}
                          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/logo:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <label className={`
                        flex flex-col items-center justify-center gap-3 px-6 py-8 
                        bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] 
                        hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group/upload
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}>
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover/upload:scale-110 transition-transform duration-500">
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                          {uploading ? 'Chargement...' : 'Téléverser Logo'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">PNG, JPG ou SVG (Max 5MB)</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Couleur Primaire</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="w-12 h-12 bg-transparent border-none outline-none cursor-pointer"
                      value={form.primaryColor || '#2563eb'}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                    />
                    <input
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                      value={form.primaryColor || '#2563eb'}
                      onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Information Forms */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section: Contact & Localisation */}
          <div className="bg-white rounded-[3rem] border border-slate-200/60 p-10 shadow-xl space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-[1.25rem] flex items-center justify-center text-blue-600">
                  <Globe2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Canaux de Communication</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Visibilité sur vos documents de sortie</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {/* Field: Email */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Courriel Officiel
                </label>
                {isEditing ? (
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-extrabold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200"
                    value={form.email || ''}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@societe.pro"
                  />
                ) : (
                  <p className="px-6 py-4 bg-slate-50/30 rounded-2xl text-slate-900 font-extrabold text-sm border border-transparent select-all">
                    {company.email || 'Non spécifié'}
                  </p>
                )}
              </div>

              {/* Field: Phone */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Ligne Directe
                </label>
                {isEditing ? (
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-extrabold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200"
                    value={form.phone || ''}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+212 522 00 00 00"
                  />
                ) : (
                  <p className="px-6 py-4 bg-slate-50/30 rounded-2xl text-slate-900 font-extrabold text-sm border border-transparent">
                    {company.phone || 'Non spécifié'}
                  </p>
                )}
              </div>

              {/* Field: Website */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Plateforme Web
                </label>
                {isEditing ? (
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-extrabold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200"
                    value={form.website || ''}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    placeholder="https://www.entreprise.pro"
                  />
                ) : (
                  <p className="px-6 py-4 bg-slate-50/30 rounded-2xl text-blue-600 font-extrabold text-sm border border-transparent underline decoration-blue-200 cursor-pointer">
                    {company.website || 'Non spécifié'}
                  </p>
                )}
              </div>

              {/* Field: Address */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Siège Social
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-extrabold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200 resize-none"
                    value={form.address || ''}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Adresse complète du siège..."
                  />
                ) : (
                  <div className="px-6 py-5 bg-slate-50/30 rounded-3xl text-slate-900 font-bold text-sm border border-transparent flex gap-4 leading-relaxed">
                    <MapIcon className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    {company.address || 'Aucune adresse renseignée'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Legal & Identification */}
          <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl space-y-10 relative overflow-hidden">
            {/* Dark background style */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[1.25rem] flex items-center justify-center text-white">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Registres Légaux</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Vérification de la conformité juridique</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">

              {/* Legal Identifiers Map */}
              {[
                { label: 'I.C.E', field: 'ice', icon: <Landmark className="w-4 h-4" /> },
                { label: 'I.F', field: 'ifNum', icon: <Landmark className="w-4 h-4" /> },
                { label: 'R.C (Maroc)', field: 'rc', icon: <Landmark className="w-4 h-4" /> },
                { label: 'R.C.S (France)', field: 'rcs', icon: <Landmark className="w-4 h-4" /> },
                { label: 'Patente / Taxe Pro', field: 'taxePro', icon: <CreditCard className="w-4 h-4" /> },
                { label: 'Siren / Siret', field: 'siren', icon: <Fingerprint className="w-4 h-4" /> },
                { label: 'Code NAF', field: 'naf', icon: <Fingerprint className="w-4 h-4" /> },
              ].map((id) => (
                <div key={id.field} className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    {id.icon} {id.label}
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-mono font-black text-white outline-none focus:bg-white/10 focus:border-blue-500 transition-all placeholder:text-white/20"
                      value={(form as any)[id.field] || ''}
                      onChange={e => setForm({ ...form, [id.field]: e.target.value })}
                      placeholder="..."
                    />
                  ) : (
                    <p className="px-6 py-4 bg-white/5 rounded-2xl text-white font-mono font-black text-sm border border-white/10">
                      {(company as any)[id.field] || '---------------'}
                    </p>
                  )}
                </div>
              ))}

              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> TVA Intracommunautaire
                </label>
                {isEditing ? (
                  <input
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-mono font-black text-white outline-none focus:bg-white/10 focus:border-blue-500 transition-all placeholder:text-white/20"
                    value={form.tvaIntra || ''}
                    onChange={e => setForm({ ...form, tvaIntra: e.target.value })}
                    placeholder="FR 00 000000000"
                  />
                ) : (
                  <p className="px-6 py-4 bg-white/5 rounded-2xl text-white font-mono font-black text-sm border border-white/10">
                    {company.tvaIntra || '---------------'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coordonnees;

