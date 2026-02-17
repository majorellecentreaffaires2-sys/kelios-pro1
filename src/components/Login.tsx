
import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, LogIn, ChevronRight } from 'lucide-react';
import { api } from '../apiClient';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
  onRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.login({ username, password });
      if (data.success) {
        onLogin(data.user, data.token);
      } else {
        setError(data.message || 'Échec de la connexion');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur critique de sécurité.');
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

        {/* Left Side: Branding & Visuals */}
        <div className="hidden lg:flex w-7/12 flex-col justify-between p-12 relative overflow-hidden">
          <div className="relative z-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                logiciel-<span className="text-blue-500">gfd</span>
              </h2>
            </div>

            <div className="max-w-md space-y-6 mt-20">
              <h1 className="text-6xl font-black text-white leading-tight tracking-tighter">
                Gérez votre <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">performance</span> <br />
                en temps réel.
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                La solution intelligente pour la gestion commerciale et financière de votre entreprise. Sécurisée, rapide et intuitive.
              </p>

              <div className="flex gap-4 pt-4">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Cloud Native
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3 text-indigo-400" />
                  AES-256 Secured
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto relative z-20">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} GFD SOLUTIONS · V4.5 ENTERPRISE
            </p>
          </div>

          {/* Abstract Image Background for Left Side */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#050b1a] via-[#050b1a]/80 to-transparent"></div>
            <img
              src="/login_bg_abstract.png"
              alt="Background"
              className="w-full h-full object-cover mix-blend-overlay opacity-50"
            />
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 lg:bg-white/[0.02] border-l border-white/5">
          <div className="w-full max-w-[420px] space-y-10">

            <div className="text-center lg:text-left space-y-3">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                  logiciel-<span className="text-blue-500">gfd</span>
                </h2>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">Accès Sécurisé</h1>
              <p className="text-slate-400 font-medium">Veuillez entrer vos identifiants pour continuer</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Utilisateur</label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-blue-500 transition-all rounded-l-2xl"></div>
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="Nom d'utilisateur"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-slate-600 outline-none focus:bg-white/[0.07] focus:border-blue-500/30 transition-all font-bold"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Mot de passe</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-focus-within:bg-indigo-500 transition-all rounded-l-2xl"></div>
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-5 pl-14 pr-14 text-white placeholder:text-slate-600 outline-none focus:bg-white/[0.07] focus:border-indigo-500/30 transition-all font-bold"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-red-500 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative w-5 h-5 border-2 border-white/10 rounded bg-white/5 group-hover:border-blue-500/50 transition-colors">
                    <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="absolute inset-0.5 bg-blue-600 rounded-sm scale-0 transition-transform origin-center"></div>
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Rester connecté</span>
                </label>
                <button type="button" onClick={onRegister} className="text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-widest transition-colors">
                  Créer un compte
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-blue-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="tracking-[0.1em]">Initialisation...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10 font-black">Connexion au Système</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 flex items-center justify-center gap-8">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Infrastructure Sécurisée</p>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
