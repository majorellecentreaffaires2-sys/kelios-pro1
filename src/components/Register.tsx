import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../apiClient';

interface RegisterProps {
    onRegister: (user: any, token: string) => void;
    onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await api.register({ username, password });
            if (data.success) {
                onRegister(data.user, data.token);
            } else {
                setError(data.message || 'Erreur lors de l\'inscription');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur critique.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#050b1a] relative overflow-hidden font-sans">
            {/* Decorative background blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>

            <div className="flex w-full flex-col lg:flex-row relative z-10">

                {/* Left Side: Features */}
                <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 bg-white/[0.02] border-r border-white/5 relative overflow-hidden">
                    <div className="relative z-20">
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                                logiciel-<span className="text-blue-500">gfd</span>
                            </h2>
                        </div>

                        <div className="space-y-12">
                            <div>
                                <h3 className="text-3xl font-black text-white mb-6">Rejoignez l'élite.</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">Démarrez votre essai gratuit de 5 jours et accédez à une suite complète d'outils de gestion.</p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { title: 'Facturation Illimitée', desc: 'Créez devis et factures sans limite' },
                                    { title: 'Multi-Sociétés', desc: 'Gérez plusieurs entités depuis un seul compte' },
                                    { title: 'Support Prioritaire', desc: 'Assistance technique dédiée 24/7' },
                                    { title: 'Sécurité Bancaire', desc: 'Chiffrement AES-256 de vos données' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                                            <CheckCircle2 className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{item.title}</h4>
                                            <p className="text-slate-500 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-20 mt-auto pt-10 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-bold text-2xl">200 DH <span className="text-sm text-slate-500 font-medium">/mois</span></p>
                                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mt-1">Essai gratuit 5 jours inclus</p>
                            </div>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#050b1a] flex items-center justify-center text-[10px] text-white font-bold">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-[#050b1a] flex items-center justify-center text-[10px] text-white font-bold">+2k</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Register Form */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
                    <div className="absolute top-10 right-10">
                        <button
                            onClick={onNavigateToLogin}
                            className="px-6 py-3 rounded-full border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            Déjà un compte ? <span className="text-blue-400">Connexion</span>
                        </button>
                    </div>

                    <div className="w-full max-w-[420px] space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <div className="text-center lg:text-left space-y-2">
                            <h1 className="text-5xl font-black text-white tracking-tighter">Créer un compte</h1>
                            <p className="text-slate-400 text-lg">Commencez votre période d'essai gratuite dès maintenant.</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nom d'utilisateur</label>
                                <div className="relative group">
                                    <input
                                        required
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:bg-white/[0.07] focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                        placeholder="Choisissez un identifiant..."
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                    <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mot de passe</label>
                                <div className="relative group">
                                    <input
                                        required
                                        type="password"
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:bg-white/[0.07] focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirmer</label>
                                <div className="relative group">
                                    <input
                                        required
                                        type="password"
                                        className={`w-full bg-white/[0.04] border ${password && confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-5 px-6 text-white font-bold outline-none focus:bg-white/[0.07] focus:border-blue-500/50 transition-all placeholder:text-slate-600`}
                                        placeholder="••••••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                    <CheckCircle2 className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${password && confirmPassword && password === confirmPassword ? 'text-emerald-500' : 'text-slate-600'}`} />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 font-bold text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-blue-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? 'Création...' : (
                                    <>
                                        Commencer l'essai <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-slate-500 text-xs font-medium">
                                En créant un compte, vous acceptez nos <a href="#" className="text-blue-400 hover:underline">conditions d'utilisation</a>.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
