import React, { useState } from 'react';
import {
    CreditCard,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Lock,
    Zap,
    Crown,
    Check,
    AlertCircle,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Star,
    Shield,
    Sparkles,
    Building2,
    DollarSign,
    FileText
} from 'lucide-react';
import { api } from '../apiClient';

interface CheckoutProps {
    user: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ user, onSuccess, onCancel }) => {
    const [step, setStep] = useState<'plan' | 'options' | 'payment'>('plan');
    const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedOptions, setSelectedOptions] = useState<{
        monthlyCompanies: number;
        yearlyCompanies: number;
    }>({
        monthlyCompanies: 0,
        yearlyCompanies: 0
    });
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'virement' | 'carte' | 'especes' | 'cheque'>('stripe');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Simulated card states
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    const plans = {
        monthly: {
            name: 'Pro Mensuel',
            price: '200',
            period: 'DH HT/mois',
            savings: null,
            id: 'plan_monthly',
            description: 'Idéal pour les indépendants et petites structures.'
        },
        yearly: {
            name: 'Pro Annuel',
            price: '2200',
            period: 'DH HT/an',
            savings: 'Économisez 20%',
            id: 'plan_yearly',
            description: 'La solution complète pour une croissance durable.'
        }
    };

    const features = [
        'Facturation Illimitée & Devis illimités',
        'Gestion Clients & Articles Illimités',
        'Support Prioritaire Support VIP 24/7',
        'Intelligence Artificielle (Gemini Pro)',
        'Sauvegarde Cloud Haute Disponibilité',
        'Multi-sociétés Jusqu\'à 5 entités',
        'Rapports Financiers Avancés',
        'Personnalisation Totale des Modèles'
    ];

    const additionalOptions = [
        {
            name: 'Société Supplémentaire Mensuelle',
            price: '150',
            period: 'DH HT/mois par société',
            description: 'Ajoutez une société supplémentaire à votre abonnement mensuel',
            features: [
                'Toutes les fonctionnalités Pro',
                'Gestion multi-sociétés',
                'Rapports consolidés',
                'Support dédié'
            ],
            id: 'addon_monthly'
        },
        {
            name: 'Société Supplémentaire Annuelle',
            price: '1600',
            period: 'DH HT/an par société',
            description: 'Ajoutez une société supplémentaire à votre abonnement annuel',
            features: [
                'Toutes les fonctionnalités Pro',
                'Gestion multi-sociétés',
                'Rapports consolidés',
                'Support dédié',
                'Économisez 13% par rapport au mensuel'
            ],
            id: 'addon_yearly'
        }
    ];

    // Calcul des totaux
    const calculateTotal = () => {
        const planPrice = plan === 'monthly' ? 200 : 2200;
        const monthlyOptionsPrice = selectedOptions.monthlyCompanies * 150;
        const yearlyOptionsPrice = selectedOptions.yearlyCompanies * 1600;
        
        return {
            planPrice,
            monthlyOptionsPrice,
            yearlyOptionsPrice,
            totalPrice: planPrice + monthlyOptionsPrice + yearlyOptionsPrice
        };
    };

    const handlePlanSelection = (selectedPlan: 'monthly' | 'yearly') => {
        setPlan(selectedPlan);
        setStep('options');
    };

    const handleOptionsConfirmation = () => {
        setStep('payment');
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const totals = calculateTotal();
            console.log('Payment details:', {
                plan,
                options: selectedOptions,
                paymentMethod,
                totals
            });
            
            // Préparer les données de la facture
            const invoiceData = {
                type: 'Facture',
                documentNature: 'Facture',
                clientName: 'Utilisateur KELIOS PRO',
                clientEmail: localStorage.getItem('user_email') || 'user@example.com',
                items: [
                    {
                        description: `Abonnement ${plans[plan].name}`,
                        quantity: 1,
                        unitPrice: totals.planPrice,
                        vatRate: 20,
                        total: totals.planPrice * 1.2
                    },
                    ...(selectedOptions.monthlyCompanies > 0 ? [{
                        description: `Sociétés supplémentaires mensuelles (${selectedOptions.monthlyCompanies})`,
                        quantity: selectedOptions.monthlyCompanies,
                        unitPrice: 150,
                        vatRate: 20,
                        total: selectedOptions.monthlyCompanies * 150 * 1.2
                    }] : []),
                    ...(selectedOptions.yearlyCompanies > 0 ? [{
                        description: `Sociétés supplémentaires annuelles (${selectedOptions.yearlyCompanies})`,
                        quantity: selectedOptions.yearlyCompanies,
                        unitPrice: 1600,
                        vatRate: 20,
                        total: selectedOptions.yearlyCompanies * 1600 * 1.2
                    }] : [])
                ],
                paymentMethod: paymentMethod === 'virement' ? 'Virement' : 
                             paymentMethod === 'paypal' ? 'PayPal' : 
                             paymentMethod === 'especes' ? 'Espèces' : 
                             paymentMethod === 'cheque' ? 'Chèque' : 'Carte Bancaire',
                notes: `Abonnement ${plans[plan].name}${paymentMethod === 'virement' ? ' - Paiement par virement bancaire' : ''}`,
                currency: 'MAD',
                date: new Date().toISOString().split('T')[0],
                dueDate: paymentMethod === 'virement' ? 
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                    new Date().toISOString().split('T')[0]
            };
            
            if (paymentMethod === 'paypal') {
                // Redirection vers PayPal
                alert(`Redirection vers PayPal pour le paiement de ${totals.totalPrice} DH HT...`);
                // Simuler la redirection PayPal
                setTimeout(() => {
                    setSuccess(true);
                    setTimeout(() => {
                        onSuccess();
                    }, 3000);
                }, 2000);
            } else if (paymentMethod === 'virement') {
                // Envoyer les instructions de virement par email
                const userEmail = localStorage.getItem('user_email') || 'user@example.com';
                const planInfo = {
                    plan,
                    totalPrice: totals.totalPrice,
                    options: selectedOptions
                };
                
                // Générer la facture
                const invoiceRes = await api.generateInvoice(invoiceData);
                
                // Envoyer les instructions de virement
                const res = await api.sendBankTransferInstructions(userEmail, planInfo);
                if (res.success && invoiceRes.success) {
                    setSuccess(true);
                    setTimeout(() => {
                        onSuccess();
                    }, 3000);
                }
            } else {
                // Traitement normal pour Stripe et autres méthodes
                // Générer la facture
                const invoiceRes = await api.generateInvoice(invoiceData);
                const res = await api.paySubscription();
                if (res.success && invoiceRes.success) {
                    setSuccess(true);
                    setTimeout(() => {
                        onSuccess();
                    }, 3000);
                }
            }
        } catch (e) {
            console.error(e);
            alert('Erreur lors du paiement. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Paiement Réussi !</h1>
                    <p className="text-slate-500 text-lg">
                        Félicitations ! Votre compte <strong>Kelios Pro</strong> est maintenant activé. Une facture a été envoyée à votre adresse email.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3 text-blue-700">
                            <FileText className="w-5 h-5" />
                            <span className="text-sm font-medium">Facture envoyée par email</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            Vous retrouverez votre facture dans votre boîte de réception
                        </p>
                    </div>
                    <div className="pt-6">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm text-emerald-600 text-sm font-bold uppercase tracking-widest">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Préparation de votre espace...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcfdfe] relative overflow-hidden font-sans text-slate-900">
            {/* Soft decorative elements */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/40 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/40 blur-[120px] rounded-full"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 border border-blue-500">
                            <span className="text-white font-bold text-xs">K</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tighter">
                            Kelios<span className="text-blue-600">.Pro</span>
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-slate-500 hover:text-slate-900 transition-all text-sm font-bold flex items-center gap-2 group px-4 py-2 hover:bg-slate-100 rounded-xl"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Annuler
                    </button>
                </header>

                <div className="grid lg:grid-cols-12 gap-16 items-start">
                    {/* Left Column: Dynamic Content Based on Step */}
                    <div className="lg:col-span-7 space-y-12">
                        {step === 'plan' && (
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-widest mb-6">
                                    <Sparkles className="w-3.5 h-3.5 fill-current" /> Étape 1/3 - Choisissez votre offre
                                </div>
                                <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tighter text-slate-900 mb-8">
                                    Gérez votre business <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">comme un expert.</span>
                                </h1>
                                <p className="text-slate-500 text-xl font-medium max-w-xl leading-relaxed mb-12">
                                    Le Pack Pro Kelios est conçu pour les entreprises qui exigent excellence et performance. Automatisez vos processus et gagnez un temps précieux.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {Object.entries(plans).map(([key, p]) => (
                                        <div
                                            key={key}
                                            onClick={() => handlePlanSelection(key as any)}
                                            className={`relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 group ${
                                                plan === key
                                                    ? 'bg-white border-blue-600 shadow-2xl shadow-blue-100'
                                                    : 'bg-white/50 border-slate-200 hover:border-slate-300 hover:bg-white'
                                            }`}
                                        >
                                            {p.savings && (
                                                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                                    {p.savings}
                                                </div>
                                            )}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                                                plan === key ? 'bg-blue-600 text-white rotate-3 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {key === 'monthly' ? <Zap className="w-7 h-7" /> : <Crown className="w-7 h-7" />}
                                            </div>
                                            <h3 className="text-xl font-extrabold text-slate-900 mb-1">{p.name}</h3>
                                            <p className="text-slate-400 text-xs font-medium mb-4">{p.description}</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-extrabold text-slate-900">{p.price}</span>
                                                <span className="text-slate-500 font-bold text-sm tracking-tight">{p.period}</span>
                                            </div>
                                            <div className={`mt-6 w-full h-1.5 rounded-full overflow-hidden transition-all duration-500 ${
                                                plan === key ? 'bg-blue-600' : 'bg-slate-100'
                                            }`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 'options' && (
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-purple-600 text-xs font-bold uppercase tracking-widest mb-6">
                                    <Building2 className="w-3.5 h-3.5 fill-current" /> Étape 2/3 - Options supplémentaires
                                </div>
                                <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tighter text-slate-900 mb-8">
                                    Personnalisez votre <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">abonnement.</span>
                                </h1>
                                <p className="text-slate-500 text-xl font-medium max-w-xl leading-relaxed mb-12">
                                    Ajoutez des sociétés supplémentaires pour étendre vos fonctionnalités multi-entreprises.
                                </p>

                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-200">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {additionalOptions.map((option, index) => (
                                            <div key={option.id} className="bg-white rounded-2xl p-6 border border-purple-200">
                                                <div className="text-center mb-6">
                                                    <h5 className="text-lg font-bold text-gray-900 mb-2">{option.name}</h5>
                                                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                                                    <div className="mb-4">
                                                        <span className="text-3xl font-bold text-purple-600">{option.price}</span>
                                                        <span className="text-gray-500 text-sm">{option.period}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                            Nombre de sociétés
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="99"
                                                            value={option.id === 'addon_monthly' ? selectedOptions.monthlyCompanies : selectedOptions.yearlyCompanies}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 0;
                                                                if (option.id === 'addon_monthly') {
                                                                    setSelectedOptions(prev => ({ ...prev, monthlyCompanies: value }));
                                                                } else {
                                                                    setSelectedOptions(prev => ({ ...prev, yearlyCompanies: value }));
                                                                }
                                                            }}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Sous-total: </span>
                                                        <span className="font-bold text-purple-600">
                                                            {option.price} × {option.id === 'addon_monthly' ? selectedOptions.monthlyCompanies : selectedOptions.yearlyCompanies} = {
                                                                option.id === 'addon_monthly' 
                                                                    ? selectedOptions.monthlyCompanies * 150 
                                                                    : selectedOptions.yearlyCompanies * 1600
                                                            } DH HT
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 flex justify-center">
                                        <button
                                            onClick={handleOptionsConfirmation}
                                            className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                                        >
                                            Continuer vers le paiement →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'payment' && (
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-100 rounded-full text-green-600 text-xs font-bold uppercase tracking-widest mb-6">
                                    <Lock className="w-3.5 h-3.5 fill-current" /> Étape 3/3 - Paiement sécurisé
                                </div>
                                <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tighter text-slate-900 mb-8">
                                    Finalisez votre <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">paiement.</span>
                                </h1>
                                <p className="text-slate-500 text-xl font-medium max-w-xl leading-relaxed mb-12">
                                    Choisissez votre méthode de paiement préférée pour compléter votre abonnement.
                                </p>

                                {/* Récapitulatif de la commande */}
                                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                                    <h4 className="text-lg font-bold text-slate-900 mb-4">Récapitulatif de votre commande</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Offre {plans[plan].name}</span>
                                            <span className="font-bold">{calculateTotal().planPrice} DH HT</span>
                                        </div>
                                        {selectedOptions.monthlyCompanies > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Sociétés supplémentaires mensuelles ({selectedOptions.monthlyCompanies})</span>
                                                <span className="font-bold">{calculateTotal().monthlyOptionsPrice} DH HT</span>
                                            </div>
                                        )}
                                        {selectedOptions.yearlyCompanies > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Sociétés supplémentaires annuelles ({selectedOptions.yearlyCompanies})</span>
                                                <span className="font-bold">{calculateTotal().yearlyOptionsPrice} DH HT</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-3 mt-3">
                                            <div className="flex justify-between text-lg">
                                                <span className="font-bold">Total</span>
                                                <span className="font-bold text-green-600">{calculateTotal().totalPrice} DH HT</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Avantages inclus dans le Pack Kelios Pro</h4>
                                    <div className="grid md:grid-cols-2 gap-y-5 gap-x-10">
                                        {features.map((f, i) => (
                                            <div key={i} className="flex items-start gap-4 animate-in slide-in-from-left-5 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                                                <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                                                    <Check className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-base font-semibold text-slate-600">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Checkout Form */}
                    <div className="lg:col-span-5 relative">
                        {step === 'payment' ? (
                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/60 space-y-8 sticky top-12">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Paiement Sécurisé</h3>
                                        <p className="text-slate-400 text-sm font-medium">Finalisez votre abonnement</p>
                                    </div>
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                        <Lock className="w-6 h-6 text-slate-400" />
                                    </div>
                                </div>

                                {/* Payment Method Dropdown */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mode de paiement</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    >
                                        <option value="stripe">💳 Carte Bancaire (Stripe)</option>
                                        <option value="paypal">🅿️ PayPal</option>
                                        <option value="virement">🏦 Virement Bancaire</option>
                                        <option value="especes">💵 Espèces</option>
                                        <option value="cheque">📄 Chèque</option>
                                    </select>
                                </div>

                                <form onSubmit={handlePayment} className="space-y-6">
                                    {(paymentMethod === 'stripe' || paymentMethod === 'carte') && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Titulaire de la carte</label>
                                                <input
                                                    type="text"
                                                    value={cardName}
                                                    onChange={(e) => setCardName(e.target.value)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Nom du titulaire"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Numéro de carte</label>
                                                <input
                                                    type="text"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="1234 5678 9012 3456"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Expiration</label>
                                                    <input
                                                        type="text"
                                                        value={expiry}
                                                        onChange={(e) => setExpiry(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="MM/AA"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CVC</label>
                                                    <input
                                                        type="text"
                                                        value={cvc}
                                                        onChange={(e) => setCvc(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="123"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {paymentMethod === 'virement' && (
                                        <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-200">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Building2 className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <h4 className="text-lg font-bold text-blue-900 mb-2">Virement Bancaire</h4>
                                            <p className="text-blue-700 text-sm mb-4">
                                                Les instructions de virement seront envoyées à votre adresse email après confirmation.
                                            </p>
                                            <div className="bg-white rounded-lg p-4 text-left">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">INFORMATIONS IMPORTANTES :</p>
                                                <ul className="text-xs text-gray-600 space-y-1">
                                                    <li>Instructions détaillées par email</li>
                                                    <li>Activation sous 24-48h après virement</li>
                                                    <li>Gardez votre ordre de virement</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'paypal' && (
                                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <div className="font-extrabold italic text-2xl tracking-tighter text-blue-600">P</div>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-2">Paiement PayPal</h4>
                                            <p className="text-slate-600 text-sm mb-6">
                                                Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
                                            </p>
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <p className="text-xs text-blue-600 font-medium">
                                                    🔒 Paiement sécurisé via PayPal • Aucune information bancaire stockée
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod !== 'stripe' && paymentMethod !== 'carte' && paymentMethod !== 'paypal' && (
                                        <div className="bg-slate-50 rounded-xl p-6 text-center">
                                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                                {paymentMethod === 'virement' && <Building2 className="w-8 h-8 text-slate-600" />}
                                                {paymentMethod === 'especes' && <DollarSign className="w-8 h-8 text-slate-600" />}
                                                {paymentMethod === 'cheque' && <FileText className="w-8 h-8 text-slate-600" />}
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-2">
                                                {paymentMethod === 'virement' && 'Virement Bancaire'}
                                                {paymentMethod === 'especes' && 'Paiement en Espèces'}
                                                {paymentMethod === 'cheque' && 'Paiement par Chèque'}
                                            </h4>
                                            <p className="text-slate-600 text-sm">
                                                {paymentMethod === 'virement' && 'Instructions de virement seront envoyées par email'}
                                                {paymentMethod === 'especes' && 'Payez en espèces à nos bureaux'}
                                                {paymentMethod === 'cheque' && 'Adressez votre chèque à notre service comptabilité'}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {paymentMethod === 'paypal' ? 'Redirection PayPal...' : 'Traitement en cours...'}
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-5 h-5" />
                                                {paymentMethod === 'paypal' ? 'Payer avec PayPal' : 
                                                 paymentMethod === 'stripe' || paymentMethod === 'carte' ? 'Payer par Carte' :
                                                 paymentMethod === 'virement' ? 'Payer par Virement' :
                                                 paymentMethod === 'especes' ? 'Payer en Espèces' :
                                                 'Payer par Chèque'} • {calculateTotal().totalPrice} DH HT
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Lock className="w-3 h-3" />
                                        Paiement 100% sécurisé et crypté
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/60 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    {step === 'plan' && <Zap className="w-8 h-8 text-slate-400" />}
                                    {step === 'options' && <Building2 className="w-8 h-8 text-slate-400" />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {step === 'plan' && 'Choisissez votre offre'}
                                    {step === 'options' && 'Personnalisez votre abonnement'}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    {step === 'plan' && 'Sélectionnez l\'offre qui correspond à vos besoins'}
                                    {step === 'options' && 'Ajoutez des options supplémentaires si nécessaire'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
