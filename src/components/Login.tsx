import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, LogIn, ChevronRight, KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { api } from '../apiClient';
import ForgotPassword from './ForgotPassword';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
  onRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'verify' | 'forgot'>('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login({ email, password });
      if (data.success) {
        onLogin(data.user, data.token);
      } else if (data.needsVerification) {
        setUnverifiedEmail(data.email);
        setStep('verify');
      } else {
        setError(data.message || 'Échec de la connexion. Vérifiez vos identifiants.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur critique de sécurité. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.verifyEmail({ email: unverifiedEmail, code: verificationCode });
      if (data.success) {
        onLogin(data.user, data.token);
      } else {
        setError(data.message || 'Code de vérification invalide');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  // Render ForgotPassword as a full panel replacement
  if (step === 'forgot') {
    return (
      <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden font-sans text-slate-900">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-100/40 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-100/30 blur-[130px] rounded-full" />
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 relative z-10">
          <div className="w-full max-w-[460px] bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-200 shadow-2xl shadow-slate-200/50">
            <ForgotPassword onBack={() => setStep('login')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      {/* Soft Background Accents */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-100/40 blur-[130px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-100/30 blur-[130px] rounded-full"></div>

      <div className="flex w-full flex-col lg:flex-row relative z-10">

        {/* Left Side: Branding & Value Proposition */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-20 relative overflow-hidden">
          <div className="relative z-20">
            <a href="/" className=" text-blue-600 px-4 py-2 rounded-lg font-bold " > BACK TO HOME</a>

            <div className="w-56 h-46 bg-white/10 backdrop-blur-md flex items-center justify-center  border border-white/20 overflow-hidden shrink-0">
              <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
            </div>

            <div className="max-w-xl space-y-10 mt-12">
              <h1 className="text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tighter animate-in slide-in-from-left-10 duration-700">
                Gérez votre <br />
                <span className="text-blue-600 italic">croissance</span> <br />
                en temps réel.
              </h1>
              <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-md animate-in slide-in-from-left-10 duration-700 delay-100">
                La solution ultime pour la facturation intelligente et la gestion commerciale. Plus rapide, plus sûr, plus performant.
              </p>

              <div className="flex flex-wrap gap-4 pt-4 animate-in fade-in duration-1000 delay-300">
                <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Certifié Cloud
                </div>
                <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Sécurité AES-256
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto relative z-20 animate-in fade-in duration-1000">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
              &copy; {new Date().getFullYear()} Kelios Cloud Solutions · V5.0 PRO
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/2 -right-20 w-80 h-80 border-[40px] border-blue-50/50 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-1/4 -right-10 w-40 h-40 bg-indigo-50/50 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        {/* Right Side: Authentication Interface */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20">
          <div className="w-full max-w-[460px] bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-200 shadow-2xl shadow-slate-200/50 animate-in zoom-in-95 duration-700">

            <div className="text-center space-y-4 mb-12">
              <div className="lg:hidden flex items-center justify-center mb-10">
                <div className="w-20 h-20 bg-white flex items-center justify-center shadow-xl shadow-blue-100 border border-slate-100 overflow-hidden">
                  <img src="/logo.jpeg" className="w-full h-full object-cover" alt="Logo" />
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                {step === 'login' ? 'Accès Système' : 'Vérification'}
              </h1>
              <p className="text-slate-500 font-medium">
                {step === 'login'
                  ? 'Entrez vos paramètres pour entrer sur votre cloud'
                  : `Entrez le code envoyé sur votre console sécurisée`}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 px-5 py-4 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-4 mb-8 animate-in slide-in-from-top-4">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {step === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identifiant Kelios</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="nom@entreprise.pro"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-6 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clé de Sécurité</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-2">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPassword ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] py-5 pl-16 pr-16 text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-6 h-6 border-2 border-slate-200 rounded-lg bg-slate-50 group-hover:border-blue-600 transition-all">
                      <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="absolute inset-1 bg-blue-600 rounded scale-0 transition-transform origin-center" />
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Session Persistante</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('forgot')}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors"
                  >
                    Pass Oublié ?
                  </button>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group relative overflow-hidden disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span className="tracking-[0.1em]">Validation...</span>
                      </div>
                    ) : (
                      <>
                        <span className="relative z-10">Connexion Système</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onRegister}
                    className="w-full py-4 text-slate-400 hover:text-slate-900 font-bold uppercase text-[10px] tracking-widest transition-all"
                  >
                    Nouveau sur Kelios ? <span className="text-blue-600 ml-1">Créer un ID</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-center">Code d'accès MFA</label>
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
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En attente de confirmation</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50 group"
                  >
                    {loading ? 'Vérification...' : (
                      <>
                        Confirmer Access Center <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('login')}
                    className="w-full py-4 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                  >
                    Annuler la procédure
                  </button>
                </div>
              </form>
            )}

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-10 opacity-30">
              <img src="/pci_dss.png" alt="PCI" className="h-4 grayscale hover:grayscale-0 transition-all" />
              <div className="w-px h-6 bg-slate-200"></div>
              <img src="/ssl_secured.png" alt="SSL" className="h-4 grayscale hover:grayscale-0 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
