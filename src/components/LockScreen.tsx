import React from 'react';
import { ShieldAlert, CreditCard, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface LockScreenProps {
    onPay: () => void;
    onLogout: () => void;
    trialEndsAt: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onPay, onLogout, trialEndsAt }) => {
    const formatDate = (d: string) => new Date(d).toLocaleDateString();

    return (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse"></div>

            <div className="max-w-2xl w-full bg-[#0f172a] border border-red-500/20 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">

                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Lock className="w-64 h-64 text-red-500 rotate-12" />
                </div>

                <div className="relative z-10">
                    <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mb-8 border border-red-500/30 shadow-lg shadow-red-900/20">
                        <ShieldAlert className="w-10 h-10 text-red-500" />
                    </div>

                    <h1 className="text-4xl font-black text-white tracking-tighter mb-4">Accès Verrouillé</h1>
                    <p className="text-xl text-slate-400 font-medium mb-10 leading-relaxed max-w-lg">
                        Votre période d'essai a expiré le <span className="text-white font-bold">{formatDate(trialEndsAt)}</span>.
                        Pour continuer à utiliser la plateforme et accéder à vos données, veuillez régulariser votre abonnement.
                    </p>

                    <div className="grid grid-cols-2 gap-6 mb-10">
                        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">À partir de</p>
                            <p className="text-4xl font-black text-white">200.00 <span className="text-lg text-slate-500 font-bold">DH</span></p>
                            <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Offre GFD Pro
                            </p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl flex flex-col justify-center gap-3">
                            <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Accès immédiat
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Facturation sécurisée
                            </div>
                            <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Support Premium
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onPay}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <CreditCard className="w-5 h-5" /> Choisir mon Plan
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-8 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LockScreen;
