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
    Sparkles
} from 'lucide-react';
import { api } from '../apiClient';

interface CheckoutProps {
    user: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ user, onSuccess, onCancel }) => {
    const [step, setStep] = useState<'plan' | 'payment'>('plan');
    const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
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
            period: 'mois',
            savings: null,
            id: 'plan_monthly',
            description: 'Idéal pour les indépendants et petites structures.'
        },
        yearly: {
            name: 'Pro Annuel',
            price: '2000',
            period: 'an',
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

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.paySubscription();
            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 3000);
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
                        Félicitations ! Votre compte <strong>Majorlle Pro</strong> est maintenant activé. Profitez de toute la puissance de notre plateforme.
                    </p>
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
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tighter">
                            Majorlle<span className="text-blue-600">.Pro</span>
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
                    {/* Left Column: Pro Pack Info */}
                    <div className="lg:col-span-7 space-y-12">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-widest mb-6">
                                <Sparkles className="w-3.5 h-3.5 fill-current" /> Pack Professionnel
                            </div>
                            <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tighter text-slate-900 mb-8">
                                Gérez votre business <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">comme un expert.</span>
                            </h1>
                            <p className="text-slate-500 text-xl font-medium max-w-xl leading-relaxed">
                                Le Pack Pro Majorlle est conçu pour les entreprises qui exigent excellence et performance. Automatisez vos processus et gagnez un temps précieux.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {Object.entries(plans).map(([key, p]) => (
                                <div
                                    key={key}
                                    onClick={() => setPlan(key as any)}
                                    className={`relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 group ${plan === key
                                        ? 'bg-white border-blue-600 shadow-2xl shadow-blue-100'
                                        : 'bg-white/50 border-slate-200 hover:border-slate-300 hover:bg-white'
                                        }`}
                                >
                                    {p.savings && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {p.savings}
                                        </div>
                                    )}
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${plan === key ? 'bg-blue-600 text-white rotate-3 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {key === 'monthly' ? <Zap className="w-7 h-7" /> : <Crown className="w-7 h-7" />}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-900 mb-1">{p.name}</h3>
                                    <p className="text-slate-400 text-xs font-medium mb-4">{p.description}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-extrabold text-slate-900">{p.price}</span>
                                        <span className="text-slate-500 font-bold text-sm tracking-tight">MAD / {p.period}</span>
                                    </div>
                                    <div className={`mt-6 w-full h-1.5 rounded-full overflow-hidden transition-all duration-500 ${plan === key ? 'bg-blue-600' : 'bg-slate-100'
                                        }`}></div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6 pt-4">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Avantages inclus dans le Pack Pro</h4>
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

                    {/* Right Column: Checkout Form */}
                    <div className="lg:col-span-5 relative">
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

                            {/* Payment Method Tabs */}
                            <div className="flex gap-4 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <button
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] transition-all font-bold text-sm ${paymentMethod === 'stripe'
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Carte Bancaire
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('paypal')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] transition-all font-bold text-sm ${paymentMethod === 'paypal'
                                        ? 'bg-white text-indigo-600 shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <div className="font-extrabold italic text-xs tracking-tighter">PayPal</div>
                                    Payer via PayPal
                                </button>
                            </div>

                            {paymentMethod === 'stripe' ? (
                                <form onSubmit={handlePayment} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Titulaire de la carte</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                                            placeholder="M. AHMED ALAMI"
                                            value={cardName}
                                            onChange={e => setCardName(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Numéro de carte</label>
                                        <div className="relative">
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-14 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                                                placeholder="0000 0000 0000 0000"
                                                maxLength={19}
                                                value={cardNumber}
                                                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                                            />
                                            <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Expiration</label>
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-center placeholder:text-slate-300"
                                                placeholder="MM/AA"
                                                maxLength={5}
                                                value={expiry}
                                                onChange={e => setExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/'))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CVC / CVV</label>
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all text-center placeholder:text-slate-300"
                                                placeholder="000"
                                                maxLength={3}
                                                value={cvc}
                                                onChange={e => setCvc(e.target.value.replace(/\D/g, ''))}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total à régler</p>
                                                <p className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                                                    {plan === 'monthly' ? 'Sans engagement' : 'Plan annuel privilégié'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-extrabold text-slate-900">{plans[plan].price} MAD</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-bold uppercase text-sm tracking-widest shadow-xl shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" /> Traitement...
                                                </>
                                            ) : (
                                                <>
                                                    Confirmer le Paiement <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-8 text-center py-6">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <div className="text-3xl font-extrabold italic text-indigo-600 tracking-tighter">PP</div>
                                    </div>
                                    <p className="text-slate-500 text-sm font-semibold leading-relaxed px-4">
                                        Sécurisez votre abonnement via PayPal. Vous allez être redirigé vers leur interface de paiement.
                                    </p>

                                    <div className="pt-6 border-t border-slate-100 space-y-6">
                                        <div className="flex justify-between items-center text-left">
                                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Offre {plans[plan].name}</span>
                                            <span className="text-3xl font-extrabold text-slate-900">{plans[plan].price} MAD</span>
                                        </div>

                                        <button
                                            onClick={handlePayment}
                                            disabled={loading}
                                            className="w-full py-5 bg-[#ffc439] hover:bg-[#f4bb33] text-[#003087] rounded-[1.5rem] font-bold uppercase text-sm tracking-widest shadow-xl shadow-yellow-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    Payer via PayPal
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-6 pt-2">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200"></div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sécurisé SSL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
