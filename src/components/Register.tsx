import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Sparkles, KeyRound, ShieldAlert } from 'lucide-react';
import { api } from '../apiClient';

interface RegisterProps {
    onRegister: (user: any, token: string) => void;
    onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'register' | 'verify'>('register');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await api.register({ email, password });
            if (data.success) {
                setStep('verify');
            } else {
                setError(data.message || 'Erreur lors de l\'inscription. Ce compte existe peut-être déjà.');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur critique lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.verifyEmail({ email, code: verificationCode });
            if (data.success) {
                onRegister(data.user, data.token);
            } else {
                setError(data.message || 'Code de vérification invalide');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur de vérification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden font-sans text-slate-900">
            {/* Soft Background Accents */}
            <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-100/40 blur-[130px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-100/30 blur-[130px] rounded-full"></div>

            <div className="flex w-full flex-col lg:flex-row relative z-10">

                {/* Left Side: Features & Value */}
                <div className="hidden lg:flex w-5/12 flex-col justify-between p-20 bg-white/40 backdrop-blur-md border-r border-slate-200 relative overflow-hidden">
                    <div className="relative z-20">
                        <div className="mb-20 animate-in slide-in-from-left-5 duration-500">
                            <div className="w-44 h-20 bg-white flex items-center justify-center  overflow-hidden shrink-0">
                                <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                            </div>
                        </div>

                        <div className="space-y-16">
                            <div className="animate-in slide-in-from-left-10 duration-700">
                                <h3 className="text-5xl font-extrabold text-slate-900 tracking-tighter leading-none mb-8">Rejoignez l'élite commerciale.</h3>
                                {step === 'register' ? (
                                    <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm">Activez votre licence professionnelle et accédez à l'infrastructure Majorlle en quelques secondes.</p>
                                ) : (
                                    <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm">Un code de sécurité a été transmis à <span className="text-blue-600 font-bold">{email}</span> pour valider votre identité.</p>
                                )}
                            </div>

                            <div className="space-y-8 animate-in fade-in duration-1000 delay-200">
                                {[
                                    { title: 'IA (Gemini Pro)', desc: 'Génération intelligente de devis & factures', color: 'bg-indigo-50 text-indigo-600' },
                                    { title: 'Multi-Entités', desc: 'Jusqu\'à 5 sociétés sur un seul ID', color: 'bg-blue-50 text-blue-600' },
                                    { title: 'Support VIP', desc: 'Assistance dédiée haute disponibilité 24/7', color: 'bg-slate-50 text-slate-600' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-5 group items-start">
                                        <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shrink-0 shadow-sm border border-transparent group-hover:scale-110 transition-transform duration-300`}>
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-slate-900 font-extrabold text-lg leading-tight">{item.title}</h4>
                                            <p className="text-slate-500 text-sm font-medium mt-1">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-20 mt-auto pt-10 border-t border-slate-200 animate-in fade-in duration-1000 delay-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-900 font-extrabold text-3xl">200 DH <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">/ mois</span></p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Sparkles className="w-4 h-4 text-emerald-500" />
                                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">5 Jours d'essai Pro Inclus</p>
                                </div>
                            </div>
                            <div className="flex -space-x-3 overflow-hidden">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">U{i}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Action Form */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 relative">
                    <div className="absolute top-10 right-10 no-print">
                        <button
                            onClick={onNavigateToLogin}
                            className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-extrabold text-xs uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all flex items-center gap-3 active:scale-95"
                        >
                            Déjà un ID ? <span className="text-blue-600">Connexion</span>
                        </button>
                    </div>

                    <div className="w-full max-w-[480px] bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-200 shadow-2xl shadow-slate-200/50 animate-in zoom-in-95 duration-700">
                        <div className="text-center lg:text-left space-y-4 mb-12">
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                                {step === 'register' ? 'Créer un compte' : 'Code de Sécurité'}
                            </h1>
                            <p className="text-slate-500 font-medium">
                                {step === 'register'
                                    ? "Commencez votre expérience Majorlle Pro dès maintenant."
                                    : "Validez votre adresse pour activer vos services Cloud."}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 px-5 py-4 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-4 mb-8 animate-in slide-in-from-top-4">
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {step === 'register' ? (
                            <form onSubmit={handleRegister} className="space-y-8">
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse Professionnelle</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                                            placeholder="exemple@entreprise.pro"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Clé d'Accès</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                required
                                                type="password"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmation</label>
                                        <div className="relative group">
                                            <input
                                                required
                                                type="password"
                                                className={`w-full bg-slate-50 border-2 ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-slate-100'} rounded-[1.5rem] py-5 px-6 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold`}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                            {password && confirmPassword && password === confirmPassword && (
                                                <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                                    >
                                        {loading ? 'Création de l\'ID...' : (
                                            <>
                                                Suivant <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-center">Code de Validation MFA</label>
                                    <div className="relative group">
                                        <input
                                            required
                                            autoFocus
                                            maxLength={6}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-8 px-6 text-slate-900 text-center font-black text-4xl tracking-[0.4em] outline-none focus:bg-white focus:border-blue-600 focus:ring-8 focus:ring-blue-50 transition-all placeholder:text-slate-100"
                                            placeholder="000000"
                                            value={verificationCode}
                                            onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <KeyRound className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none w-10 h-10 -rotate-12 opacity-20" />
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="submit"
                                        disabled={loading || verificationCode.length !== 6}
                                        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50 group"
                                    >
                                        {loading ? 'Activation...' : (
                                            <>
                                                Finaliser l'Inscription <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep('register')}
                                        className="w-full py-4 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                                    >
                                        Modifier mes informations
                                    </button>
                                </div>
                            </form>
                        )}

                        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-10">
                            En créant un compte, vous acceptez notre <br />
                            <a href="#" className="text-blue-600 hover:underline">Politique de Gouvernance des Données</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
