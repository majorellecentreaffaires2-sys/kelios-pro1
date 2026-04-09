import React, { useEffect, useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Calendar,
    Building2,
    User,
    FileText,
    AlertCircle,
    Loader2,
    ExternalLink
} from 'lucide-react';

interface PublicInvoiceViewProps {
    token: string;
}

const PublicInvoiceView: React.FC<PublicInvoiceViewProps> = ({ token }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [responded, setResponded] = useState(false);
    const [finalResponse, setFinalResponse] = useState<'accepted' | 'declined' | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) return;
        fetch(`/api/view/${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error);
                else setData(d);
            })
            .catch(() => setError('Impossible de charger ce document. Vérifiez votre connexion.'))
            .finally(() => setLoading(false));
    }, [token]);

    const respond = async (response: 'accepted' | 'declined') => {
        setResponding(true);
        try {
            const res = await fetch(`/api/view/${encodeURIComponent(token)}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response }),
            }).then(r => r.json());

            if (res.success) {
                setFinalResponse(response);
                setResponded(true);
            } else {
                setError(res.error || 'Erreur lors de la réponse.');
            }
        } catch {
            setError('Erreur réseau. Réessayez.');
        } finally {
            setResponding(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-lg">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Chargement du document...</p>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 shadow text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Lien invalide</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">© Kelios Pro</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { invoice, tokenInfo } = data;
    const isQuote = ['Devis', 'Proforma'].includes(invoice.type);
    const alreadyResponded = !!(tokenInfo.response || responded);
    const responseToShow = finalResponse || tokenInfo.response;

    // Compute totals
    const computeTotals = () => {
        let totalHt = 0;
        let totalTva = 0;
        (invoice.items || []).forEach((group: any) => {
            (group.subItems || []).forEach((item: any) => {
                const lineHt = (item.price || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100);
                const lineTva = lineHt * ((item.vat || 0) / 100);
                totalHt += lineHt;
                totalTva += lineTva;
            });
        });
        const discount = invoice.discount || 0;
        const afterDiscount = totalHt * (1 - discount / 100);
        return {
            totalHt: afterDiscount,
            totalTva: totalTva * (1 - discount / 100),
            totalTtc: afterDiscount + totalTva * (1 - discount / 100)
        };
    };

    const totals = computeTotals();
    const color = invoice.primaryColor || '#2563eb';
    const currency = invoice.currency || 'MAD';

    const fmt = (n: number) => n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const typeLabel: Record<string, string> = {
        Devis: 'Devis', Proforma: 'Proforma', Standard: 'Facture',
        Acompte: 'Facture Acompte', Finale: 'Facture Finale', Avoir: 'Avoir',
        Recurrente: 'Facture Récurrente', Livraison: 'Bon de Livraison',
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header badge */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                            <FileText className="w-5 h-5" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelios Pro</p>
                            <p className="font-extrabold text-slate-900 text-sm">{typeLabel[invoice.type] || invoice.type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500">Lien sécurisé</span>
                    </div>
                </div>

                {/* Main card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Color bar */}
                    <div className="h-2 w-full" style={{ backgroundColor: color }} />

                    <div className="p-8 space-y-8">

                        {/* Invoice header */}
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                                    {typeLabel[invoice.type] || invoice.type}
                                </h1>
                                <p className="text-slate-400 font-bold mt-1">N° {invoice.invoiceNumber}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="flex items-center gap-2 justify-end text-slate-500 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>Émis le {invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : '—'}</span>
                                </div>
                                {invoice.dueDate && (
                                    <div className="flex items-center gap-2 justify-end text-slate-500 text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span>Échéance le {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* From / To */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Building2 className="w-4 h-4" style={{ color }} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Émetteur</span>
                                </div>
                                <p className="font-extrabold text-slate-900">{invoice.sender?.name || '—'}</p>
                                <p className="text-slate-500 text-sm">{invoice.sender?.address || ''}</p>
                                <p className="text-slate-500 text-sm">{invoice.sender?.email || ''}</p>
                                <p className="text-slate-500 text-sm">{invoice.sender?.phone || ''}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-5 space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4" style={{ color }} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</span>
                                </div>
                                <p className="font-extrabold text-slate-900">{invoice.client?.name || '—'}</p>
                                <p className="text-slate-500 text-sm">{invoice.client?.address || ''}</p>
                                <p className="text-slate-500 text-sm">{invoice.client?.email || ''}</p>
                            </div>
                        </div>

                        {/* Subject */}
                        {invoice.subject && (
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Objet</p>
                                <p className="text-slate-700 font-medium">{invoice.subject}</p>
                            </div>
                        )}

                        {/* Items table */}
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Articles & Services</p>
                            <div className="space-y-3">
                                {(invoice.items || []).map((group: any, gi: number) => (
                                    <div key={gi}>
                                        {group.title && (
                                            <p className="font-extrabold text-slate-900 text-sm mb-2 px-1">{group.title}</p>
                                        )}
                                        {(group.subItems || []).map((item: any, ii: number) => {
                                            const lineHt = (item.price || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100);
                                            return (
                                                <div key={ii} className="flex items-center justify-between py-3 border-b border-slate-100 gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 text-sm truncate">{item.description}</p>
                                                        {item.details && <p className="text-slate-400 text-xs mt-0.5">{item.details}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-6 text-sm shrink-0">
                                                        <span className="text-slate-400 font-medium">{item.quantity} × {fmt(item.price)} {currency}</span>
                                                        {item.vat > 0 && <span className="text-slate-400 text-xs">TVA {item.vat}%</span>}
                                                        <span className="font-extrabold text-slate-900 w-24 text-right">{fmt(lineHt)} {currency}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-72 space-y-2">
                                <div className="flex justify-between text-sm text-slate-600 py-1">
                                    <span>Total HT</span>
                                    <span className="font-bold">{fmt(totals.totalHt)} {currency}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 py-1">
                                    <span>Total TVA</span>
                                    <span className="font-bold">{fmt(totals.totalTva)} {currency}</span>
                                </div>
                                {(invoice.discount || 0) > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 py-1">
                                        <span>Remise ({invoice.discount}%)</span>
                                        <span className="font-bold">−{fmt(totals.totalHt * invoice.discount / 100)} {currency}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-2">
                                    <span className="font-extrabold text-slate-900">Total TTC</span>
                                    <span className="font-extrabold text-xl" style={{ color }}>{fmt(totals.totalTtc)} {currency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="bg-slate-50 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                                <p className="text-slate-600 text-sm leading-relaxed">{invoice.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Response section for quotes */}
                {isQuote && !alreadyResponded && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5">
                        <div className="text-center">
                            <h2 className="text-xl font-extrabold text-slate-900">Votre réponse</h2>
                            <p className="text-slate-500 text-sm mt-1">Cette action est définitive. Votre réponse sera enregistrée.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => respond('accepted')}
                                disabled={responding}
                                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                            >
                                {responding ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                Accepter le devis
                            </button>
                            <button
                                onClick={() => respond('declined')}
                                disabled={responding}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-3 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-5 h-5" />
                                Décliner
                            </button>
                        </div>
                    </div>
                )}

                {/* Already responded */}
                {isQuote && alreadyResponded && (
                    <div className={`rounded-3xl border p-8 text-center space-y-3 ${responseToShow === 'accepted'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        {responseToShow === 'accepted' ? (
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        ) : (
                            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                        )}
                        <p className={`font-extrabold text-lg ${responseToShow === 'accepted' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {responseToShow === 'accepted' ? 'Devis accepté' : 'Devis décliné'}
                        </p>
                        {tokenInfo.respondedAt && (
                            <p className="text-slate-400 text-xs font-medium">
                                Répondu le {new Date(tokenInfo.respondedAt).toLocaleString('fr-FR')}
                            </p>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">
                        Document généré par <span style={{ color }}>Kelios Pro</span> — Lien sécurisé et confidentiel
                    </p>
                    {tokenInfo.expiresAt && (
                        <p className="text-[10px] text-slate-300 mt-1 font-medium">
                            Expire le {new Date(tokenInfo.expiresAt).toLocaleDateString('fr-FR')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicInvoiceView;
