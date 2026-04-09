
import React, { useState } from 'react';
import { Search, Building2, UserCircle2, Edit3, Trash2, Plus, Activity, Crown, UserCheck, UserX, User, Mail, Key, RefreshCw, Shield } from 'lucide-react';
import { api } from '../apiClient';

interface UserManagerProps {
    users: any[];
    onRefresh: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, onRefresh }) => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'User',
        subscriptionStatus: 'trial'
    });

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.updateUser(editingUser.id, form);
            } else {
                await api.register(form);
            }
            setShowForm(false);
            setEditingUser(null);
            onRefresh();
            alert("Client SaaS mis à jour avec succès");
        } catch (e) {
            alert(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer ce compte client ? Cela révoquera tous ses accès SaaS.")) return;
        try {
            await api.deleteUser(id);
            onRefresh();
        } catch (e) {
            alert("Erreur lors de la suppression");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrôle SaaS</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Gestion Clients SaaS</h1>
                    <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Console d'administration des abonnés de la plateforme</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onRefresh}
                        className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-2xl transition-all shadow-sm"
                        title="Actualiser la liste"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { setEditingUser(null); setForm({ username: '', email: '', password: '', role: 'User', subscriptionStatus: 'trial' }); setShowForm(true); }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4" /> Nouveau Client (SaaS)
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <Activity className="w-8 h-8 text-blue-500 mb-2" />
                    <h4 className="text-2xl font-black text-slate-800">{users.length}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilisateurs Cloud</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <Crown className="w-8 h-8 text-amber-500 mb-2" />
                    <h4 className="text-2xl font-black text-slate-800">{users.filter(u => u.role === 'SuperAdmin').length}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Administrateurs</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <UserCheck className="w-8 h-8 text-emerald-500 mb-2" />
                    <h4 className="text-2xl font-black text-slate-800">{users.filter(u => u.subscriptionStatus === 'active').length}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Abonnements Payés</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <UserX className="w-8 h-8 text-red-500 mb-2" />
                    <h4 className="text-2xl font-black text-slate-800">{users.filter(u => u.subscriptionStatus === 'locked').length}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accès Bloqués</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                            placeholder="Rechercher par identifiant ou email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-50">
                                <th className="px-8 py-6">Compte Client Kelios</th>
                                <th className="px-8 py-6">Empreinte Cloud</th>
                                <th className="px-8 py-6">Niveau Système</th>
                                <th className="px-8 py-6 text-right">Contrôle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {(u.username || u.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 text-sm">{u.username || 'Sans nom'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{u.email || 'Pas d\'email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter ${u.companyCount > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                                                {u.companyCount || 0} sociétés actives
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                                u.subscriptionStatus === 'trial' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {u.subscriptionStatus}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'SuperAdmin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                            {u.role === 'SuperAdmin' ? 'Administrateur' : 'Souscripteur'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setEditingUser(u); setForm({ ...u, password: '' }); setShowForm(true); }}
                                                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                                <User className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aucun compte trouvé ou synchronisation en cours...</p>
                                            <button onClick={onRefresh} className="text-blue-600 font-black text-[10px] uppercase tracking-widest underline">Forcer la synchronisation</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[350] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                                {editingUser ? 'Modifier Client SaaS' : 'Nouveau Compte Client'}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Accès Cloud ERP Enterprise</p>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600" />
                                    <input
                                        placeholder="Nom d'utilisateur"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-sm outline-none focus:bg-white focus:border-blue-600 transition-all"
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                    />
                                </div>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600" />
                                    <input
                                        placeholder="Email Client"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-sm outline-none focus:bg-white focus:border-blue-600 transition-all"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600" />
                                    <input
                                        type="password"
                                        placeholder={editingUser ? "Laisser vide pour garder" : "Définir mot de passe"}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-sm outline-none focus:bg-white focus:border-blue-600 transition-all"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de Compte</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-xs outline-none focus:bg-white focus:border-blue-600 transition-all"
                                            value={form.role}
                                            onChange={e => setForm({ ...form, role: e.target.value })}
                                        >
                                            <option value="User">Client SaaS (Standard)</option>
                                            <option value="SuperAdmin">Administrateur Système</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">État de l'accès</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 font-bold text-xs outline-none focus:bg-white focus:border-blue-600 transition-all"
                                            value={form.subscriptionStatus}
                                            onChange={e => setForm({ ...form, subscriptionStatus: e.target.value })}
                                        >
                                            <option value="trial">Période d'essai</option>
                                            <option value="active">Compte Actif (Payé)</option>
                                            <option value="locked">Suspendu / Impayé</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all active:scale-[0.98]"
                            >
                                {editingUser ? 'Mettre à jour le client' : 'Enregistrer le nouveau client'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UserManager;
