import React, { useState } from 'react';
import { api } from '../apiClient';
import {
    ArrowLeft,
    CheckCircle2,
    Lock,
    Mail,
    ShieldCheck,
    Eye,
    EyeOff,
    KeyRound
} from 'lucide-react';

interface ForgotPasswordProps {
    onBack: () => void;
    resetToken?: string;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, resetToken }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const isResetMode = !!resetToken;

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.forgotPassword(email.trim());
            setDone(true);
        } catch (err: any) {
            // Even on error, show success to prevent enumeration leaks
            setDone(true);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
        if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
        setLoading(true);
        setError('');
        try {
            await api.resetPassword(resetToken!, password);
            setDone(true);
        } catch (err: any) {
            setError(err.message || 'Lien invalide ou expiré. Refaites la demande.');
        } finally {
            setLoading(false);
        }
    };

    // ── Success state ──
    if (done && !isResetMode) {
        return (
            <div className="text-center space-y-6 py-8 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tighter">Email envoyé !</h3>
                    <p className="text-slate-500 font-medium mt-2 text-sm leading-relaxed">
                        Si cet email existe, un lien de réinitialisation sécurisé vous sera envoyé.<br />
                        Vérifiez votre boîte mail (et vos spams).
                    </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-left">
                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">🔐 Sécurité</p>
                    <p className="text-slate-500 text-xs">Le lien expire dans 1 heure et n'est valide qu'une seule fois.</p>
                </div>
                <button
                    onClick={onBack}
                    className="w-full py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors"
                >
                    Retour à la connexion
                </button>
            </div>
        );
    }

    if (done && isResetMode) {
        return (
            <div className="text-center space-y-6 py-8 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tighter">Mot de passe mis à jour</h3>
                    <p className="text-slate-500 font-medium mt-2 text-sm">
                        Votre nouveau mot de passe est actif. Vous pouvez maintenant vous connecter.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl shadow-slate-200 active:scale-[0.98] transition-all"
                >
                    Se connecter →
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </button>

            <div className="space-y-3">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                    <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                    {isResetMode ? 'Nouveau mot de passe' : 'Mot de passe oublié'}
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    {isResetMode
                        ? 'Choisissez un nouveau mot de passe sécurisé (min. 8 caractères).'
                        : 'Entrez votre adresse email. Si elle est enregistrée, vous recevrez un lien sécurisé.'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 px-5 py-4 rounded-2xl text-red-600 text-sm font-bold animate-in slide-in-from-top-4">
                    {error}
                </div>
            )}

            <form onSubmit={isResetMode ? handleReset : handleForgot} className="space-y-5">
                {!isResetMode ? (
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Email enregistré
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="email"
                                required
                                autoFocus
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                                placeholder="votre@email.com"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Nouveau mot de passe
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoFocus
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-16 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                                    placeholder="Min. 8 caractères"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {/* Password strength hint */}
                            {password.length > 0 && (
                                <div className="flex gap-1.5 ml-1 mt-2">
                                    {[8, 10, 14].map((len, i) => (
                                        <div
                                            key={len}
                                            className={`h-1 flex-1 rounded-full transition-colors ${password.length >= len
                                                    ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : 'bg-emerald-500'
                                                    : 'bg-slate-100'
                                                }`}
                                        />
                                    ))}
                                    <span className="text-[10px] font-bold text-slate-400 ml-1">
                                        {password.length < 8 ? 'Trop court' : password.length < 10 ? 'Faible' : password.length < 14 ? 'Moyen' : 'Fort'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className={`w-full bg-slate-50 border-2 rounded-[1.5rem] py-5 pl-16 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 transition-all font-bold ${confirm.length > 0 && confirm !== password
                                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                                            : 'border-slate-100 focus:border-blue-600 focus:ring-blue-100'
                                        }`}
                                    placeholder="Répétez le mot de passe"
                                />
                            </div>
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading || (isResetMode && (password.length < 8 || password !== confirm))}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            {isResetMode ? 'Mise à jour...' : 'Envoi en cours...'}
                        </div>
                    ) : isResetMode ? 'Réinitialiser le mot de passe' : 'Envoyer le lien sécurisé'}
                </button>
            </form>
        </div>
    );
};

export default ForgotPassword;
