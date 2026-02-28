import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, X, Clock, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../apiClient';

interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.isRead).length || 0);
        } catch (e) {
            console.error('Failed to load notifications', e);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll every 2 minutes
        const interval = setInterval(loadNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const markAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice_overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'payment_received': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'trial_expiry': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'subscription_renewed': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `Il y a ${minutes}m`;
        if (hours < 24) return `Il y a ${hours}h`;
        return `Il y a ${days}j`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-t-md transition-all border-t border-x border-transparent hover:border-[var(--ribbon-border)]"
            >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-0 w-80 bg-white border border-[var(--ribbon-border)] rounded-b-xl rounded-tl-xl shadow-2xl z-[120] animate-in slide-in-from-top-1 duration-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                Notifications {unreadCount > 0 && <span className="text-red-500">•</span>}
                            </h4>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Tout marquer lu
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-8 py-12 text-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune notification</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`px-4 py-3 border-b border-slate-50 flex gap-3 transition-colors ${n.isRead ? 'opacity-70' : 'bg-blue-50/30'}`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <p className={`text-[11px] font-black truncate ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                                    {formatTime(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-2">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                {!n.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(n.id)}
                                                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700"
                                                    >
                                                        <Check className="w-2.5 h-2.5" /> Lu
                                                    </button>
                                                )}
                                                {n.link && (
                                                    <a
                                                        href={n.link}
                                                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-600"
                                                    >
                                                        <ExternalLink className="w-2.5 h-2.5" /> Voir
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Historique des 50 dernières</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
