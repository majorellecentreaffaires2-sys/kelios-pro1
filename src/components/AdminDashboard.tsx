import React, { useState, useEffect } from 'react';
import { api } from '../apiClient';
import { DollarSign, Users, UserCheck, UserX, Loader2, ArrowUpRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC<{}> = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAdminMetrics()
            .then((res: any) => {
                if (res.success) {
                    setMetrics(res.data);
                }
            })
            .catch(err => console.error("Error loading admin metrics", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
                <p className="font-bold">Erreur : Impossible de charger les statistiques administrateur.</p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Revenu Mensuel (MRR)",
            value: `${metrics.mrr} MAD`,
            icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            trend: "+12%"
        },
        {
            title: "Abonnements Actifs",
            value: metrics.activeSubscriptions,
            icon: <UserCheck className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-50",
            border: "border-blue-100",
            trend: "En hausse"
        },
        {
            title: "Comptes en Essai",
            value: metrics.trials,
            icon: <Users className="w-6 h-6 text-amber-600" />,
            bg: "bg-amber-50",
            border: "border-amber-100",
            trend: "Actifs"
        },
        {
            title: "Taux d'Attrition",
            value: `${metrics.churnRate}%`,
            icon: <UserX className="w-6 h-6 text-rose-600" />,
            bg: "bg-rose-50",
            border: "border-rose-100",
            trend: "Normal"
        }
    ];

    const chartData = metrics.monthlySignups || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Vue d'ensemble des revenus</h2>
                    <p className="text-gray-500 font-medium">Statistiques clés en temps réel de votre SaaS.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className={`p-6 rounded-3xl border ${stat.border} bg-white shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out`} />
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center mb-6`}>
                                {stat.icon}
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.title}</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                <span className="flex items-center text-xs font-bold text-gray-500 gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Inscriptions Mensuelles</h3>
                        <p className="text-sm text-gray-500">Nouveaux utilisateurs créés par mois</p>
                    </div>
                </div>

                {chartData.length > 0 ? (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="count" name="Utilisateurs" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                        <Activity className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm font-semibold">Aucune donnée de graphique disponible</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
