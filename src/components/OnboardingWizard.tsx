
import React, { useState } from 'react';
import { Company, ContactInfo } from '../types';
import {
  Building2, UserPlus, FileText, CheckCircle2,
  ArrowRight, ShieldCheck, Sparkles, Rocket,
  ChevronRight, Lock, Wand2, UserCircle
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
    primaryColor: '#007AFF',
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
    { s: 1, label: 'SuperAdmin', icon: <Lock className="w-3.5 h-3.5" /> },
    { s: 2, label: 'Ma Société', icon: <Building2 className="w-3.5 h-3.5" /> },
    { s: 3, label: 'Mon 1er Client', icon: <UserPlus className="w-3.5 h-3.5" /> },
    { s: 4, label: 'Finalisation', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-[500] bg-[#020817] flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="glass rounded-[3.5rem] border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[680px] animate-in zoom-in-95 duration-700">

          {/* Progress Sidebar */}
          <div className="w-full md:w-80 bg-gradient-to-br from-blue-700 to-indigo-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Rocket className="w-8 h-8 text-blue-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Configuration</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Majorlle SaaS V4.5</p>
              </div>

              <div className="pt-10 relative">
                {/* Vertical Stepper Line */}
                <div className="absolute left-4.5 top-12 bottom-6 w-0.5 bg-white/10 z-0">
                  <div
                    className="w-full bg-white transition-all duration-700 ease-in-out"
                    style={{ height: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                  ></div>
                </div>

                <div className="space-y-10 relative z-10">
                  {steps.map((item) => (
                    <div key={item.s} className={`flex items-center gap-4 transition-all duration-500 ${step === item.s ? 'opacity-100 translate-x-2' : 'opacity-40'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${step >= item.s ? 'bg-white text-blue-900 border-white shadow-lg' : 'border-white/30 text-white'}`}>
                        {step > item.s ? <CheckCircle2 className="w-5 h-5" /> : item.icon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 p-6 bg-white/5 rounded-2xl border border-white/10 mt-10">
              <p className="text-[9px] font-bold text-blue-100 leading-relaxed uppercase">
                Bienvenue sur l'infrastructure Cloud Majorlle. Ce wizard configure vos bases de données en temps réel.
              </p>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Form Content */}
          <div className="flex-1 bg-white flex flex-col relative">

            {/* Top Progress Bar Component */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 z-50">
              <div
                className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>

            {/* Step Counter Indicator */}
            <div className="absolute top-6 right-10 no-print">
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Étape</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-blue-700 leading-none">{step}</span>
                  <span className="text-[10px] font-bold text-blue-300">/ {totalSteps}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-12 md:p-20 flex flex-col justify-center">
              {step === 1 && (
                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Sécurité Admin</h3>
                    <p className="text-gray-500 font-medium">Mettez à jour vos accès administratifs privilégiés pour cet environnement.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Identifiant</label>
                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                        <input
                          disabled
                          className="w-full bg-gray-100 border-2 border-transparent rounded-2xl px-12 py-4 font-bold outline-none cursor-not-allowed"
                          value={adminForm.username}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nouveau Mot de Passe</label>
                        <input
                          type="password"
                          autoFocus
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                          value={adminForm.password}
                          onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Confirmation</label>
                        <input
                          type="password"
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                          value={adminForm.confirmPassword}
                          onChange={e => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={!isStep1Valid}
                    onClick={nextStep}
                    className="w-full py-6 bg-gray-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Suivant <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Identité Société</h3>
                    <p className="text-gray-500 font-medium">Définissez l'entité juridique par défaut pour vos factures.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dénomination Sociale</label>
                      <input
                        autoFocus
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                        value={companyForm.name}
                        onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                        placeholder="Ex: Majorlle Agency SARL"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Devise Principale</label>
                        <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none" value={companyForm.currency} onChange={e => setCompanyForm({ ...companyForm, currency: e.target.value })}>
                          <option value="MAD">MAD (Dirham)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Couleur Signature</label>
                        <div className="flex gap-4">
                          <input type="color" className="flex-1 h-[60px] p-1 bg-gray-50 border-2 border-gray-100 rounded-2xl cursor-pointer" value={companyForm.primaryColor} onChange={e => setCompanyForm({ ...companyForm, primaryColor: e.target.value })} />
                          <div className="w-16 h-[60px] rounded-2xl shadow-inner border border-gray-100" style={{ backgroundColor: companyForm.primaryColor }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={prevStep} className="px-10 py-6 bg-gray-100 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors">Retour</button>
                    <button
                      disabled={!isStep2Valid}
                      onClick={nextStep}
                      className="flex-1 py-6 bg-gray-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
                    >
                      Valider Société <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Partenaire initial</h3>
                    <p className="text-gray-500 font-medium">Ajoutez votre premier client pour tester l'émission immédiate.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nom / Société du Client</label>
                      <input
                        autoFocus
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                        value={clientForm.name}
                        onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        placeholder="Ex: Client Test / ACME Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email Facturation</label>
                      <input
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                        value={clientForm.email}
                        onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                        placeholder="finance@client.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={prevStep} className="px-10 py-6 bg-gray-100 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors">Retour</button>
                    <button
                      disabled={!isStep3Valid}
                      onClick={nextStep}
                      className="flex-1 py-6 bg-gray-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
                    >
                      Confirmer Client <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10 text-center animate-in zoom-in-95 duration-700">
                  <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-100 border-4 border-white">
                    <CheckCircle2 className="w-14 h-14 text-white animate-bounce" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Tout est prêt !</h3>
                    <p className="text-gray-500 font-medium px-10">Votre infrastructure ERP est provisionnée. Voulez-vous générer votre premier devis maintenant ?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleFinish(false)}
                      className="py-6 bg-gray-100 text-gray-600 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Plus tard (Dashboard)
                    </button>
                    <button
                      onClick={() => handleFinish(true)}
                      className="py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:scale-105 transition-all active:scale-95"
                    >
                      <Wand2 className="w-5 h-5" /> Émettre Devis #1
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
