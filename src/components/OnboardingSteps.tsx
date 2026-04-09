import React, { useState, useEffect } from 'react';
import { api } from '../apiClient';
import { Check, Rocket, CreditCard, Code, Clock, Sparkles } from 'lucide-react';

interface OnboardingStepsProps {
    onFinish: () => void;
    user: any;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ onFinish, user }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Bienvenue sur Kelios",
            desc: "L'outil ultime pour gérer votre business avec une précision professionnelle.",
            icon: <Rocket className="w-12 h-12 text-blue-600" />,
            type: 'intro'
        },
        {
            title: "Choisissez votre offre",
            desc: "Sélectionnez le plan qui accompagnera la croissance de votre entreprise.",
            icon: <CreditCard className="w-12 h-12 text-indigo-600" />,
            type: 'pricing'
        }
    ];

    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [selectedCompanyOption, setSelectedCompanyOption] = useState<'monthly' | 'yearly' | null>(null);
    const [additionalCompanies, setAdditionalCompanies] = useState<number>(0);

    const plans = [
        { 
            id: 'discovery', 
            name: '🟢 Offre Découverte – Essai Gratuit', 
            price: '0 DH HT', 
            saved: 'valable 3 jours', 
            desc: 'Idéal pour tester la plateforme sans engagement.',
            limits: ['1 seule société', 'Accès limité à 3 jours', 'Génération de factures limitée pendant la période d\'essai', 'Intégration de l\'intelligence artificielle', 'Support classique']
        },
        { 
            id: 'monthly', 
            name: '🔵 Pack Mensuel', 
            price: '200 DH HT / mois', 
            saved: '', 
            desc: 'Une solution flexible pour gérer votre activité au quotidien.',
            limits: ['1 seule société', 'Génération de factures illimitée', 'Intégration de l\'intelligence artificielle', 'Support technique 7j/7']
        },
        { 
            id: 'yearly', 
            name: '🟣 Pack Annuel', 
            price: '2200 DH HT / an', 
            saved: 'La solution la plus rentable pour une utilisation long terme', 
            desc: 'La solution la plus rentable pour une utilisation long terme.',
            limits: ['1 seule société', 'Génération de factures illimitée', 'Intégration de l\'intelligence artificielle', 'Support technique 7j/7']
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50/80 flex items-center justify-center p-6 backdrop-blur-xl overflow-hidden font-sans">
            {/* Soft Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/30 blur-[120px] rounded-full"></div>

            <div className="max-w-5xl w-full bg-white border border-slate-200 rounded-[3.5rem] p-12 text-center relative shadow-2xl shadow-slate-200/50 overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-700">
                <div className="flex justify-center mb-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50 animate-bounce-slow">
                        {steps[step].icon}
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <h2 className="text-5xl font-extrabold text-slate-900 tracking-tighter mb-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
                        {steps[step].title}
                    </h2>
                    <p className="text-slate-500 text-xl font-medium leading-relaxed mb-12 animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100">
                        {steps[step].desc}
                    </p>
                </div>

                {steps[step].type === 'pricing' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`group cursor-pointer border-2 rounded-[2.5rem] p-8 transition-all duration-300 relative flex flex-col items-center ${selectedPlan === plan.id
                                    ? 'bg-white border-blue-600 scale-105 shadow-2xl shadow-blue-100'
                                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                            >
                                {plan.saved && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                                        {plan.saved}
                                    </span>
                                )}
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">{plan.desc}</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <p className="text-4xl font-extrabold text-blue-600">{plan.price}</p>
                                </div>

                                <ul className="text-left text-sm text-slate-500 space-y-3 mb-8 w-full border-t border-slate-100 pt-6">
                                    {plan.limits.map((limit, index) => (
                                        <li key={index} className="flex items-center gap-3 font-semibold">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" /> 
                                            {limit}
                                        </li>
                                    ))}
                                </ul>

                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id ? 'border-blue-600 bg-blue-600 shadow-lg shadow-blue-200' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                    {selectedPlan === plan.id && <Check className="w-5 h-5 text-white" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {steps[step].type === 'pricing' && (
                    <div className="mt-8 mb-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
                        <div className={`bg-gradient-to-r from-slate-50 to-blue-50 border ${selectedPlan ? 'border-blue-300' : 'border-slate-200'} rounded-[2rem] p-8 transition-all duration-300 ${!selectedPlan ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-center gap-3">
                                <span className="text-2xl">➕</span>
                                Sociétés Supplémentaires
                            </h3>
                            <p className="text-slate-600 text-center mb-6">
                                Étendez votre activité en ajoutant des sociétés supplémentaires à votre pack
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                                <div 
                                    onClick={() => setSelectedCompanyOption('monthly')}
                                    className={`bg-white border-2 rounded-[1.5rem] p-6 text-center cursor-pointer transition-all ${selectedCompanyOption === 'monthly' ? 'border-blue-600 scale-105 shadow-lg' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <h4 className="font-bold text-slate-900 mb-2">Option Mensuelle</h4>
                                    <p className="text-2xl font-extrabold text-blue-600 mb-2">150 DH HT<span className="text-sm font-normal text-slate-500"> / mois</span></p>
                                    <p className="text-sm text-slate-500">par société supplémentaire</p>
                                </div>
                                <div 
                                    onClick={() => setSelectedCompanyOption('yearly')}
                                    className={`bg-white border-2 rounded-[1.5rem] p-6 text-center cursor-pointer transition-all ${selectedCompanyOption === 'yearly' ? 'border-blue-600 scale-105 shadow-lg' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <h4 className="font-bold text-slate-900 mb-2">Option Annuelle</h4>
                                    <p className="text-2xl font-extrabold text-blue-600 mb-2">1600 DH HT<span className="text-sm font-normal text-slate-500"> / an</span></p>
                                    <p className="text-sm text-slate-500">par société supplémentaire</p>
                                    <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                        Économisez 200 DH HT
                                    </span>
                                </div>
                            </div>

                            {selectedCompanyOption && (
                                <div className="max-w-md mx-auto mb-8 animate-in fade-in slide-in-from-bottom-5 duration-300">
                                    <label className="block text-center text-sm font-medium text-slate-700 mb-4">
                                        Nombre de sociétés supplémentaires
                                    </label>
                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => setAdditionalCompanies(Math.max(0, additionalCompanies - 1))}
                                            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700 transition-all"
                                        >
                                            -
                                        </button>
                                        <div className="w-20 text-center">
                                            <span className="text-2xl font-bold text-slate-900">{additionalCompanies}</span>
                                        </div>
                                        <button
                                            onClick={() => setAdditionalCompanies(additionalCompanies + 1)}
                                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center font-bold text-white transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            {additionalCompanies > 0 && selectedCompanyOption && (
                                <div className="bg-white border-2 border-blue-200 rounded-[1.5rem] p-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
                                    <h4 className="text-lg font-bold text-slate-900 mb-4 text-center">Récapitulatif</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Offre principale:</span>
                                            <span className="font-semibold text-slate-900">
                                                {plans.find(p => p.id === selectedPlan)?.price}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Sociétés supplémentaires ({additionalCompanies}):</span>
                                            <span className="font-semibold text-slate-900">
                                                {additionalCompanies * (selectedCompanyOption === 'monthly' ? 150 : 1600)} DH HT
                                            </span>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between text-lg font-bold">
                                                <span className="text-blue-600">Total:</span>
                                                <span className="text-blue-600">
                                                    {(() => {
                                                        const basePrice = selectedPlan === 'discovery' ? 0 : selectedPlan === 'monthly' ? 200 : 2200;
                                                        const additionalPrice = additionalCompanies * (selectedCompanyOption === 'monthly' ? 150 : 1600);
                                                        return basePrice + additionalPrice;
                                                    })()} DH HT
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-center gap-3 mb-10">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-blue-600' : 'w-2 bg-slate-200'}`}></div>
                    ))}
                </div>

                <div className="flex gap-4 justify-center max-w-xl mx-auto">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-10 py-5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-[1.5rem] font-bold uppercase text-xs tracking-widest transition-all"
                        >
                            Précédent
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (step < steps.length - 1) setStep(step + 1);
                            else onFinish();
                        }}
                        disabled={steps[step].type === 'pricing' && !selectedPlan}
                        className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-extrabold uppercase text-sm tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {step < steps.length - 1 ? 'Continuer' : 'Finaliser la configuration'}
                        <Rocket className={`w-4 h-4 ${step === steps.length - 1 ? 'animate-pulse' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingSteps;
