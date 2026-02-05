
import React, { useState } from 'react';
import { InvoiceTemplate, InvoiceItem } from '../types';
import { Plus, LayoutTemplate, Search, Trash2, Edit2, X, FileText } from 'lucide-react';

interface TemplateManagerProps {
  templates: InvoiceTemplate[];
  onCreate: (t: InvoiceTemplate) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onCreate }) => {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<InvoiceTemplate>>({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    subject: '',
    notes: '',
    items: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(form as InvoiceTemplate);
    setShowForm(false);
    setForm({ id: Math.random().toString(36).substr(2, 9), name: '', subject: '', notes: '', items: [] });
  };

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase">Modèles de Saisie</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Accélérez l'édition avec des gabarits prédéfinis</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200"
        >
          Créer un Modèle
        </button>
      </header>

      <div className="glass p-8 rounded-[3rem] border-white/50 space-y-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
          <input
            className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl pl-12 pr-6 py-4 font-bold text-sm outline-none focus:border-blue-600"
            placeholder="Chercher un modèle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(t => (
            <div key={t.id} className="p-8 rounded-[2.5rem] bg-white border border-gray-100 hover-lift shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <LayoutTemplate className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight text-gray-900 leading-none">{t.name}</h3>
              </div>
              <p className="text-xs font-medium text-gray-400 line-clamp-2">{t.subject || 'Aucun sujet défini'}</p>
              <div className="pt-4 flex justify-between items-center border-t border-gray-50">
                <span className="text-[9px] font-black uppercase text-blue-300">{(t.items || []).length} Postes</span>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-blue-900/20 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="glass p-10 rounded-[3rem] max-w-2xl w-full shadow-2xl border-2 border-white/50 space-y-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Éditeur de Modèle</h3>
              <button onClick={() => setShowForm(false)} type="button" className="p-2 text-gray-400 hover:text-red-500"><X /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Nom du Modèle (Ex: Maintenance Mensuelle)</label>
                <input required className="w-full bg-blue-50/50 border-2 border-blue-50 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Objet / Sujet par défaut</label>
                <input className="w-full bg-blue-50/50 border-2 border-blue-50 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-bold" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Notes & Conditions</label>
                <textarea rows={3} className="w-full bg-blue-50/50 border-2 border-blue-50 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-bold" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200">
              Enregistrer le Modèle
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
