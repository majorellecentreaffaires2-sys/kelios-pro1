
import React, { useState } from 'react';
import { ContactInfo } from '../types';
import { Search, Building2, UserCircle2, Mail, Phone, MapPin, Globe, ExternalLink, Filter } from 'lucide-react';

interface GlobalClientManagerProps {
    clients: (ContactInfo & { companyName?: string; ownerName?: string })[];
}

const GlobalClientManager: React.FC<GlobalClientManagerProps> = ({ clients }) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filtered = clients.filter(c => {
        const matchesSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.code || '').toLowerCase().includes(search.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(clients.map(c => c.category).filter(Boolean)));

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col gap-2">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Centre Client Global</h1>
                <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">Base de données unifiée de tous les tiers du cloud</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-6 justify-between items-center">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                                placeholder="Rechercher un client, une entreprise rattachée ou un email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} Fiches trouvées</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white">
                                    <th className="px-8 py-6">Client</th>
                                    <th className="px-8 py-6">Entité de rattachement</th>
                                    <th className="px-8 py-6">Coordonnées</th>
                                    <th className="px-8 py-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 text-sm">{c.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{c.code || 'NO-CODE'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-300" />
                                                <div>
                                                    <p className="font-bold text-slate-700 text-xs uppercase">{c.companyName || '---'}</p>
                                                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{c.ownerName || 'Admin System'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Mail className="w-3 h-3 text-slate-300" /> {c.email || '---'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Phone className="w-3 h-3 text-slate-300" /> {c.phone || '---'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.isBlocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {c.isBlocked ? 'Bloqué' : 'Actif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-20 text-center">
                                <UserCircle2 className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aucun client ne correspond à votre recherche</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
                        <Filter className="w-8 h-8 text-blue-400 mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Filtres Rapides</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 mb-6">Affinez la vue globale</p>

                        <div className="space-y-2">
                            <button
                                onClick={() => setCategoryFilter('all')}
                                className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Tous les clients
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat!)}
                                    className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Répartition</h4>
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center"><Globe className="w-4 h-4 text-slate-400" /></div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Total Cloud</p>
                                <p className="font-black text-slate-900">{clients.length}</p>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full w-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalClientManager;
