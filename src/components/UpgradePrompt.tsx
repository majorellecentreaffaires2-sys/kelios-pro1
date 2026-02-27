import React from 'react';
import { Zap, X, ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    message: string;
    resource: 'company' | 'invoice' | 'client';
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ isOpen, onClose, onUpgrade, message, resource }) => {
    if (!isOpen) return null;

    const resourceLabel = {
        company: 'Société',
        invoice: 'Facture',
        client: 'Client'
    }[resource];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 relative">
                            <Zap className="w-10 h-10 text-blue-600 fill-blue-600" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">
                            Limite <span className="text-blue-600 italic">Atteinte</span>
                        </h2>
                        <p className="text-slate-500 font-medium px-4">
                            {message}
                        </p>
                    </div>

                    {/* Features check */}
                    <div className="space-y-4 mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Le plan Professionnel déverrouille :</p>
                        {[
                            "Facturation illimitée sans restriction",
                            "Multi-sociétés (jusqu'à 15 structures)",
                            "Support prioritaire & Accès Cloud",
                            "Export comptable automatisé"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-700">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => { onUpgrade(); onClose(); }}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            Passer la vitesse supérieure
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                        >
                            Peut-être plus tard
                        </button>
                    </div>
                </div>

                {/* Footer Badge */}
                <div className="bg-blue-50/50 p-4 border-t border-blue-50 flex items-center justify-center gap-4">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Infrastructure Majorlle Certifiée</p>
                </div>
            </div>
        </div>
    );
};

export default UpgradePrompt;
