import React, { useState, useEffect } from 'react';
import { api } from '../apiClient';
import { Check, Rocket, CreditCard, Code, Clock } from 'lucide-react';

interface OnboardingStepsProps {
    onFinish: () => void;
    user: any;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ onFinish, user }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Bienvenue sur Majorlle",
            desc: "L'outil ultime pour gérer votre business comme un pro.",
            icon: <Rocket className="w-12 h-12 text-blue-500" />
        },
        {
            title: "Gestion Complète",
            desc: "Devis, Factures, Clients, et Stock en un seul endroit.",
            icon: <Code className="w-12 h-12 text-blue-500" />
        },
        {
            title: "Votre Plan",
            desc: "Essai gratuit de 5 jours activé. Ensuite 200 DH/mois.",
            icon: <Clock className="w-12 h-12 text-emerald-500" />
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center p-6 backdrop-blur-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse"></div>

            <div className="max-w-lg w-full bg-white/[0.03] border border-white/5 rounded-[3rem] p-12 text-center backdrop-blur-2xl relative shadow-2xl">
                <div className="flex justify-center mb-10">
                    <div className="w-24 h-24 bg-white/[0.05] rounded-full flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/10 animate-bounce-slow">
                        {steps[step].icon}
                    </div>
                </div>

                <h2 className="text-4xl font-black text-white tracking-tighter mb-4 animate-in slide-in-from-bottom-5 fade-in duration-500 key-{step}">{steps[step].title}</h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100">{steps[step].desc}</p>

                <div className="flex justify-center gap-2 mb-10">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}></div>
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (step < steps.length - 1) setStep(step + 1);
                        else onFinish();
                    }}
                    className="w-full py-5 bg-white text-black hover:bg-slate-200 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-white/10 transition-all active:scale-[0.95]"
                >
                    {step < steps.length - 1 ? 'Continuer' : 'Commencer'}
                </button>
            </div>
        </div>
    );
};

export default OnboardingSteps;
