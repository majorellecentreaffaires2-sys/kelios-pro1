import React, { useState } from 'react';
import { Company } from '../types';
import { Building2, Mail, Phone, Globe, MapPin, Hash, Save, Edit3, X, CheckCircle } from 'lucide-react';

interface CoordonneesProps {
  company: Company;
  onUpdateCompany: (id: string, updates: Partial<Company>) => void;
}

const Coordonnees: React.FC<CoordonneesProps> = ({ company, onUpdateCompany }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Company>>({ ...company });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-gray-900">Coordonnées Société</h1>
          <p className="text-sm text-gray-500 font-medium">Informations complètes de votre entreprise</p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"
              >
                {saveStatus === 'saving' ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
                ) : saveStatus === 'saved' ? (
                  <><CheckCircle className="w-4 h-4" /> Enregistré</>
                ) : (
                  <><Save className="w-4 h-4" /> Enregistrer</>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"
            >
              <Edit3 className="w-4 h-4" /> Modifier
            </button>
          )}
        </div>
      </div>

      {/* Company Card Preview */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100">
        {/* Header with color */}
        <div
          className="h-32 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${company.primaryColor || '#1e293b'}, ${company.primaryColor ? company.primaryColor + 'dd' : '#0f172a'})`
          }}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-5 left-6 flex gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
              {company.currency}
            </span>
          </div>
        </div>

        {/* Logo and Name */}
        <div className="px-10 pb-10 pt-0 relative">
          <div className="relative -mt-12 mb-6 flex items-end gap-6">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 border-4 border-white">
              {company.logoUrl ? (
                <img src={company.logoUrl} className="w-full h-full object-contain" alt={company.name} />
              ) : (
                <Building2 className="w-10 h-10" style={{ color: company.primaryColor || '#1e293b' }} />
              )}
            </div>
            <div className="pb-2">
              <h2 className="text-3xl font-black text-gray-900">{company.name}</h2>
              <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-1">Environnement SaaS</p>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Coordonnées de Contact</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  {isEditing ? (
                    <input
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.email || ''}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@societe.com"
                    />
                  ) : (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Email</p>
                      <p className="font-bold text-gray-700">{company.email || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  {isEditing ? (
                    <input
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.phone || ''}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+212 5XX XX XX XX"
                    />
                  ) : (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Téléphone</p>
                      <p className="font-bold text-gray-700">{company.phone || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  {isEditing ? (
                    <input
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.website || ''}
                      onChange={e => setForm({ ...form, website: e.target.value })}
                      placeholder="www.societe.com"
                    />
                  ) : (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Site Web</p>
                      <p className="font-bold text-gray-700">{company.website || 'Non renseigné'}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  {isEditing ? (
                    <textarea
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      rows={3}
                      value={form.address || ''}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Adresse complète..."
                    />
                  ) : (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Adresse</p>
                      <p className="font-bold text-gray-700">{company.address || 'Non renseignée'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legal Info */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase text-blue-400 border-b pb-2 tracking-[0.2em]">Identifiants Légaux</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> I.C.E
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.ice || ''}
                      onChange={e => setForm({ ...form, ice: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.ice || '---'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> I.F
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.ifNum || ''}
                      onChange={e => setForm({ ...form, ifNum: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.ifNum || '---'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> R.C
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.rc || ''}
                      onChange={e => setForm({ ...form, rc: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.rc || '---'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Taxe Pro
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.taxePro || ''}
                      onChange={e => setForm({ ...form, taxePro: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.taxePro || '---'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> SIREN
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.siren || ''}
                      onChange={e => setForm({ ...form, siren: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.siren || '---'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Code NAF
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.naf || ''}
                      onChange={e => setForm({ ...form, naf: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.naf || '---'}</p>
                  )}
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-2">
                    <Hash className="w-3 h-3" /> N° TVA Intracommunautaire
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                      value={form.tvaIntra || ''}
                      onChange={e => setForm({ ...form, tvaIntra: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-gray-700 font-mono">{company.tvaIntra || '---'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coordonnees;
