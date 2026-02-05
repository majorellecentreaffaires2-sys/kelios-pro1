
import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { api } from '../apiClient';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
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
    <div className="h-screen w-full flex items-center justify-center bg-[#020817] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-[480px] px-6 relative z-10">
        <div className="glass p-10 md:p-14 rounded-[3.5rem] border-white/5 shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] space-y-10 animate-in fade-in zoom-in-95 duration-1000">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] group hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-12 h-12 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center justify-center gap-2">
                Majorlle <span className="text-blue-500">ERP</span>
              </h1>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-500" /> Cloud Infrastructure
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-7">
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Utilisateur</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Identifiant administratif"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] py-5 pl-14 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all font-bold text-base"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clé d'Accès</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[9px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors">
                  {showPassword ? <EyeOff className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[1.25rem] py-5 pl-14 pr-14 text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all font-bold text-base"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-red-400 text-center text-[10px] font-black uppercase tracking-wider animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-[1.25rem] font-black uppercase text-sm tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Validation...</span>
                </div>
              ) : (
                <>
                  <span>Démarrer la Session</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Réseau</p>
                <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5">
                  Node-Active
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Architecture</p>
                <p className="text-[10px] font-black text-slate-300 uppercase">MySQL Cluster</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em] opacity-50">
          MAJORLLE SOLUTIONS · V4.5 ENTERPRISE SaaS
        </p>
      </div>
    </div>
  );
};

export default Login;
