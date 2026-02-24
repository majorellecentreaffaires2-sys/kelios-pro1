import React, { useState } from 'react';
import { Company, ContactInfo } from '../types';
import {
  Building2, UserPlus, FileText, CheckCircle2,
  ArrowRight, ShieldCheck, Sparkles, Rocket,
  ChevronRight, Lock, Wand2, UserCircle, Settings,
  Globe, Palette
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (company: Company, client: ContactInfo, startQuote: boolean, adminUpdate?: any) => void;
  user: any;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, user }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [adminForm, setAdminForm] = useState({
    username: user.username,
    password: '',
    confirmPassword: ''
  });

  const [companyForm, setCompanyForm] = useState<Partial<Company>>({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    address: '',
    email: user.email || '',
    phone: '',
    currency: 'MAD',
    primaryColor: '#2563eb',
    active: true,
    defaultVatRates: [20, 14, 10, 7, 0]
  });

  const [clientForm, setClientForm] = useState<Partial<ContactInfo>>({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    email: '',
    address: '',
    category: 'Professionnels'
  });

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = (startQuote: boolean) => {
    onComplete(companyForm as Company, clientForm as ContactInfo, startQuote, adminForm);
  };

  const isStep1Valid = adminForm.password.length >= 4 && adminForm.password === adminForm.confirmPassword;
  const isStep2Valid = (companyForm.name?.length || 0) > 2;
  const isStep3Valid = (clientForm.name?.length || 0) > 2;

  const steps = [
    { s: 1, label: 'SuperAdmin', icon: <Lock className="w-4 h-4" /> },
    { s: 2, label: 'Ma Société', icon: <Building2 className="w-4 h-4" /> },
    { s: 3, label: 'Mon 1er Client', icon: <UserPlus className="w-4 h-4" /> },
    { s: 4, label: 'Finalisation', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[500] bg-slate-100/80 flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row min-h-[720px] animate-in zoom-in-95 duration-700">

          {/* Progress Sidebar */}
          <div className="w-full md:w-80 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl">
                <Rocket className="w-8 h-8 text-blue-50" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold tracking-tighter uppercase leading-none">Configuration</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 opacity-80">Majorlle Pro Cloud</p>
              </div>

              <div className="pt-8 relative">
                {/* Vertical Stepper Line */}
                <div className="absolute left-4.5 top-12 bottom-6 w-0.5 bg-white/10 z-0">
                  <div
                    className="w-full bg-white transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ height: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                  ></div>
                </div>

                <div className="space-y-12 relative z-10">
                  {steps.map((item) => (
                    <div key={item.s} className={`flex items-center gap-5 transition-all duration-500 ${step === item.s ? 'opacity-100 translate-x-3' : 'opacity-40'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${step >= item.s ? 'bg-white text-blue-700 border-white shadow-xl rotate-3' : 'border-white/30 text-white'}`}>
                        {step > item.s ? <CheckCircle2 className="w-6 h-6" /> : item.icon}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 p-6 bg-white/10 rounded-[2rem] border border-white/10 mt-10 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-blue-50 leading-relaxed uppercase tracking-wide">
                Bienvenue sur l'infrastructure Professionnelle Majorlle. Ce wizard configure vos bases de données en temps réel.
              </p>
            </div>

            {/* Decorative white rings */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 border-[40px] border-white/5 rounded-full pointer-events-none"></div>
          </div>

          {/* Form Content */}
          <div className="flex-1 bg-white flex flex-col relative">

            {/* Top Progress Bar Component */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-50 z-50">
              <div
                className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-700 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>

            {/* Step Counter Indicator */}
            <div className="absolute top-8 right-10 no-print">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Étape</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-blue-600 leading-none">{step}</span>
                  <span className="text-[10px] font-bold text-slate-300">/ {totalSteps}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-12 md:p-24 flex flex-col justify-center">
              {step === 1 && (
                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tighter uppercase italic">Sécurité Admin</h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Mettez à jour vos accès administratifs privilégiés pour sécuriser votre environnement de travail.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Identifiant Actuel</label>
                      <div className="relative">
                        <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                          disabled
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-14 py-4.5 font-bold text-slate-500 outline-none cursor-not-allowed"
                          value={adminForm.username}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Mot de Passe</label>
                        <input
                          type="password"
                          autoFocus
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                          value={adminForm.password}
                          onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmation</label>
                        <input
                          type="password"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                          value={adminForm.confirmPassword}
                          onChange={e => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={!isStep1Valid}
                    onClick={nextStep}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Suivant <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tighter uppercase italic">Identité Société</h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Définissez l'entité juridique par défaut pour l'ensemble de vos documents fiscaux.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Dénomination Sociale</label>
                      <input
                        autoFocus
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                        value={companyForm.name}
                        onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                        placeholder="Ex: Majorlle Agency SARL AU"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Devise de Gestion</label>
                        <div className="relative">
                          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-14 py-4.5 font-bold text-slate-900 outline-none appearance-none" value={companyForm.currency} onChange={e => setCompanyForm({ ...companyForm, currency: e.target.value })}>
                            <option value="MAD">MAD (Dirham Marocain)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Couleur Signature</label>
                        <div className="flex gap-4">
                          <div className="relative flex-1">
                            <Palette className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            <input type="color" className="w-full h-[64px] p-2 bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer" value={companyForm.primaryColor} onChange={e => setCompanyForm({ ...companyForm, primaryColor: e.target.value })} />
                          </div>
                          <div className="w-16 h-[64px] rounded-2xl shadow-inner border border-slate-100" style={{ backgroundColor: companyForm.primaryColor }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={prevStep} className="px-10 py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-extrabold uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Retour</button>
                    <button
                      disabled={!isStep2Valid}
                      onClick={nextStep}
                      className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
                    >
                      Valider Société <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <UserPlus className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tighter uppercase italic">Partenaire Initial</h3>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed">Ajoutez votre premier client pour tester immédiatement la génération intelligente.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom Complet ou Société</label>
                      <input
                        autoFocus
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                        value={clientForm.name}
                        onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        placeholder="Ex: Client VIP / Global Tech SARL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Email pour l'envoi des factures</label>
                      <input
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4.5 font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                        value={clientForm.email}
                        onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                        placeholder="finance@client.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={prevStep} className="px-10 py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-extrabold uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Retour</button>
                    <button
                      disabled={!isStep3Valid}
                      onClick={nextStep}
                      className="flex-1 py-6 bg-blue-600 text-white rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] shadow-xl shadow-blue-200 flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
                    >
                      Confirmer Client <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10 text-center animate-in zoom-in-95 duration-700">
                  <div className="w-28 h-28 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 border-8 border-white">
                    <CheckCircle2 className="w-16 h-16 text-white animate-bounce" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tighter uppercase italic">Tout est prêt !</h3>
                    <p className="text-slate-500 font-medium text-lg px-10 leading-relaxed">Votre infrastructure professionnelle a été provisionnée avec succès. Voulez-vous émettre votre premier document maintenant ?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-lg mx-auto">
                    <button
                      onClick={() => handleFinish(false)}
                      className="py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-extrabold uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Aller au Dashboard
                    </button>
                    <button
                      onClick={() => handleFinish(true)}
                      className="py-6 bg-blue-600 text-white rounded-[2rem] font-extrabold uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 hover:scale-105 transition-all active:scale-95"
                    >
                      <Sparkles className="w-5 h-5" /> Émettre Devis #001
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
