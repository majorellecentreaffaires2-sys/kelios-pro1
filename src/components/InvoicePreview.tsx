import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { Mail, Phone, Globe, Printer, ShieldCheck, X, Languages, Sparkles, Copy, Check, Send, Lock, Loader2, FileText, Plus } from 'lucide-react';
import { generateInvoiceEmail, translateInvoiceData } from '../geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../apiClient';

interface InvoicePreviewProps {
  invoice: Invoice;
  autoOpenEmail?: boolean;
}

const LOC_LABELS = {
  fr: {
    invoice: "Facture",
    quote: "Devis",
    proforma: "Facture Proforma",
    creditNote: "Avoir",
    batiment: "DEVIS",
    dev: "DEVIS",
    date: "Date",
    dueDate: "Échéance",
    number: "N°",
    billTo: "FACTURER À",
    from: "DE",
    description: "Désignation",
    qty: "Qté",
    unit: "Unité",
    unitPrice: "Prix Unit. HT",
    discount: "Remise",
    vat: "TVA",
    totalHt: "Total HT",
    total: "Total",
    subtotal: "Sous-total HT",
    totalVat: "Total TVA",
    netToPay: "NET À PAYER",
    paymentTerms: "Conditions de paiement",
    bankDetails: "Coordonnées bancaires",
    notes: "Notes",
    page: "Page",
    of: "sur",
    ref: "Réf",
    ice: "ICE",
    if: "IF",
    rc: "RC",
    patente: "Patente",
    cnss: "CNSS",
    rib: "RIB / Compte",
    swift: "SWIFT / BIC",
    siren: "SIREN",
    naf: "Code NAF",
    tvaIntra: "TVA Intra.",
    tp: "T.P"
  },
  en: {
    invoice: "Invoice",
    quote: "Quote",
    proforma: "Proforma Invoice",
    creditNote: "Credit Note",
    batiment: "Building Invoice",
    date: "Date",
    dueDate: "Due Date",
    number: "No.",
    billTo: "BILL TO",
    from: "FROM",
    description: "Description",
    qty: "Qty",
    unit: "Unit",
    unitPrice: "Unit Price",
    discount: "Discount",
    vat: "VAT",
    totalHt: "Subtotal",
    total: "Total",
    subtotal: "Subtotal",
    totalVat: "Total VAT",
    netToPay: "TOTAL DUE",
    paymentTerms: "Payment Terms",
    bankDetails: "Bank Details",
    notes: "Notes",
    page: "Page",
    of: "of",
    ref: "Ref",
    ice: "Tax ID",
    if: "Tax No.",
    rc: "Reg. No.",
    patente: "License",
    cnss: "Social Sec.",
    rib: "Bank Account",
    swift: "SWIFT / BIC",
    siren: "SIREN",
    naf: "NAF Code",
    tvaIntra: "VAT No.",
    tp: "T.P"
  }
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, autoOpenEmail = false }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [customFile, setCustomFile] = useState<{ name: string, base64: string } | null>(null);
  const [localInvoice, setLocalInvoice] = useState<Invoice>(invoice);
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  // Sync state if prop changes (needed for background queue)
  useEffect(() => {
    setLocalInvoice(invoice);
  }, [invoice.id]);

  // Use state for interactive features (translation), but prefer prop for fresh data
  const displayInvoice = localInvoice.id === invoice.id ? localInvoice : invoice;

  const lang = displayInvoice.language || 'fr';
  const l = LOC_LABELS[lang as keyof typeof LOC_LABELS];
  const primaryColor = displayInvoice.primaryColor || (displayInvoice.sender as any).primaryColor || '#111827'; // Prefer invoice-level color, then sender, then fallback
  const tpl = displayInvoice.visualTemplate || 'Professional';
  const isValidated = !!displayInvoice.validatedAt;

  const getDocTitle = () => {
    // Prioritize explicit document nature if set
    if (displayInvoice.documentNature === 'Devis') return l.quote;
    if (displayInvoice.documentNature === 'Facture') return l.invoice;

    switch (displayInvoice.type) {
      case 'Devis': return l.quote;
      case 'Proforma': return l.proforma;
      case 'Avoir': return l.creditNote;
      case 'Batiment': return (l as any).batiment || l.invoice;
      case 'Dev': return (l as any).dev || l.invoice;
      default: return l.invoice;
    }
  };

  const billToLabel = (displayInvoice.documentNature === 'Devis' || displayInvoice.type === 'Devis')
    ? (lang === 'fr' ? 'DEVIS À' : 'QUOTE TO')
    : l.billTo;

  const docNatureName = (displayInvoice.documentNature === 'Devis' || displayInvoice.type === 'Devis')
    ? (lang === 'fr' ? 'devis' : 'quote')
    : (lang === 'fr' ? 'facture' : 'invoice');

  // Validate if invoice is complete enough to print
  const isInvoiceValid = displayInvoice.invoiceNumber && displayInvoice.client?.name && displayInvoice.sender?.name && displayInvoice.items?.length > 0;
  const printButtonTitle = !isInvoiceValid
    ? (lang === 'fr'
      ? `Le document (${docNatureName}) doit avoir un numéro, un client, un fournisseur et au moins un article`
      : `The document (${docNatureName}) must have a number, a client, a supplier and at least one item`)
    : 'Imprimer ou exporter en PDF';

  useEffect(() => {
    if (autoOpenEmail) {
      handleOpenEmailModal();
    }
  }, [autoOpenEmail]);

  const handleOpenEmailModal = async () => {
    setIsEmailModalOpen(true);
    setIsGenerating(true);
    const totals = calculateTotals();
    const content = await generateInvoiceEmail({ ...displayInvoice, totalTtc: totals.totalTtc });
    setEmailContent(content);
    setIsGenerating(false);
  };

  const handleTranslate = async (targetLang: 'fr' | 'en') => {
    if (targetLang === localInvoice.language) return;
    setIsTranslating(true);
    try {
      const translated = await translateInvoiceData(
        localInvoice.items,
        localInvoice.notes,
        localInvoice.sender,
        localInvoice.client,
        targetLang
      );
      setLocalInvoice({
        ...localInvoice,
        language: targetLang,
        items: translated.items,
        notes: translated.notes,
        sender: { ...localInvoice.sender, ...translated.sender } as any,
        client: { ...localInvoice.client, ...translated.client } as any
      });
    } catch (e) {
      alert("Erreur lors de la traduction.");
    } finally {
      setIsTranslating(false);
    }
  };

  const safeNumber = (val: any): number => parseFloat(String(val)) || 0;

  const calculateTotals = () => {
    let subtotalHt = 0;
    let totalEcoContrib = 0;
    let taxAmounts: { [key: number]: number } = {};
    let baseHtPerRate: { [key: number]: number } = {};

    displayInvoice.items.forEach(item => {
      item.subItems.forEach(sub => {
        if (sub.isSpacer) return;
        const price = safeNumber(sub.price);
        const quantity = safeNumber(sub.quantity);
        const taxRate = safeNumber(sub.taxRate);
        const discountPercentage = safeNumber(sub.discount);
        const ecoUnitTtc = safeNumber(sub.ecoContributionUnitTtc);

        const lineNetHt = (price * quantity) * (1 - discountPercentage / 100);
        const lineTva = lineNetHt * (taxRate / 100);
        const lineEcoTotal = ecoUnitTtc * quantity;

        subtotalHt += lineNetHt;
        taxAmounts[taxRate] = (taxAmounts[taxRate] || 0) + lineTva;
        baseHtPerRate[taxRate] = (baseHtPerRate[taxRate] || 0) + lineNetHt;
        totalEcoContrib += lineEcoTotal;
      });
    });

    const totalTax = Object.values(taxAmounts).reduce((a, b) => a + b, 0);
    const globalDiscount = safeNumber(displayInvoice.discount);
    const totalTtc = subtotalHt + totalTax + totalEcoContrib - globalDiscount;

    return { subtotalHt, taxAmounts, baseHtPerRate, totalEcoContrib, totalTtc: isNaN(totalTtc) ? 0 : totalTtc, totalTax };
  };

  const { subtotalHt, taxAmounts, baseHtPerRate, totalEcoContrib, totalTtc, totalTax } = calculateTotals();

  const handleCopyEmail = () => {
    const text = `Subject: ${emailContent.subject}\n\n${emailContent.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!invoiceRef.current) return;
    setIsSending(true);

    try {
      // 1. Generate PDF from HTML
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // FINAL FIX: CHARACTER-WALKING SANITIZER
          // 1. We extract ALL CSS (preserving layout).
          // 2. We explicitly walk the string to surgically remove `oklch(...)` etc.
          //    by counting parentheses. This is 100% accurate and prevents crashes.

          let fullCss = '';
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              // Extract rules (try/catch for CORS)
              const rules = sheet.cssRules;
              if (rules) {
                for (let i = 0; i < rules.length; i++) {
                  fullCss += rules[i].cssText + '\n';
                }
              }
            } catch (e) {
              console.warn("Skipping protected stylesheet");
            }
          });

          // 2. Remove external links & existing styles to prevent interaction
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());

          // 3. SURGICAL REPLACEMENT of unsupported functions
          // 3. SURGICAL REPLACEMENT of unsupported functions
          const processCss = (input: string) => {
            const forbidden = ['oklch', 'oklab', 'display-p3', 'lch', 'lab', 'hwb', 'color', 'color-mix'];
            let output = '';
            let i = 0;
            const len = input.length;

            while (i < len) {
              // Check if we are at the start of a forbidden function
              let matchedFn = null;

              // Look ahead to see if any forbidden function starts here
              for (const fn of forbidden) {
                if (input.substr(i, fn.length).toLowerCase() === fn) {
                  // Check what comes after: whitespace* then '('
                  let j = i + fn.length;
                  while (j < len && /\s/.test(input[j])) j++; // skip whitespace

                  if (j < len && input[j] === '(') {
                    matchedFn = { name: fn, totalLength: j - i + 1 }; // includes '('
                    break;
                  }
                }
              }

              if (matchedFn) {
                // We found a forbidden function (e.g. "oklch (...)").
                // Instead of safe gray, we try to use the primaryColor which is usually what the user wants for branding
                output += primaryColor || '#4b5563';

                // Skip the function content
                i += matchedFn.totalLength; // Advance past "oklch ("
                let depth = 1;
                while (i < len && depth > 0) {
                  if (input[i] === '(') depth++;
                  else if (input[i] === ')') depth--;
                  i++;
                }
              } else {
                output += input[i];
                i++;
              }
            }
            return output;
          };

          const safeCss = processCss(fullCss);

          // 4. Inject the Sanitized CSS
          const style = clonedDoc.createElement('style');
          style.textContent = safeCss;
          clonedDoc.head.appendChild(style);

          // 5. SANITIZE INLINE STYLES AND ATTRIBUTES
          const attributesToCheck = ['style', 'fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
          clonedDoc.querySelectorAll('*').forEach(el => {
            attributesToCheck.forEach(attr => {
              const val = el.getAttribute(attr);
              if (val) {
                // Check efficiently if it contains any forbidden keyword (case insensitive)
                const lowerVal = val.toLowerCase();
                if (lowerVal.includes('oklch') || lowerVal.includes('oklab') || lowerVal.includes('display-p3') || lowerVal.includes('lch') || lowerVal.includes('lab') || lowerVal.includes('hwb')) {
                  el.setAttribute(attr, processCss(val));
                }
              }
            });
          });

          // 5. Inject Fallback Variables (Just in case)
          const fallback = clonedDoc.createElement('style');
          fallback.innerHTML = `
            :root {
              --color-primary: #2563eb;
              --color-blue-50: #eff6ff; --color-blue-100: #dbeafe; --color-blue-500: #3b82f6; --color-blue-600: #2563eb;
              --color-gray-50: #f9fafb; --color-gray-100: #f3f4f6; --color-gray-200: #e5e7eb; --color-gray-300: #d1d5db;
              --color-gray-400: #9ca3af; --color-gray-500: #6b7280; --color-gray-600: #4b5563;
              --color-gray-700: #374151; --color-gray-800: #1f2937; --color-gray-900: #111827;
              --color-emerald-50: #ecfdf5; --color-emerald-600: #059669; --color-purple-600: #9333ea;
            }
            * { border-color: #e5e7eb !important; }
            .print-area { background: white !important; color: black !important; }
          `;
          clonedDoc.head.appendChild(fallback);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfBase64 = pdf.output('datauristring');

      // 2. Send via API
      await api.sendInvoiceByEmail(displayInvoice.id, {
        recipientEmail: displayInvoice.client.email,
        subject: emailContent.subject,
        body: emailContent.body,
        invoiceData: {
          ...displayInvoice,
          totalTtc: calculateTotals().totalTtc
        },
        pdfBase64,
        customFile // Pass custom uploaded file if any
      });

      alert("Email envoyé avec succès !");
      setIsEmailModalOpen(false);
      setCustomFile(null); // Reset
    } catch (e) {
      console.error("Email send failed", e);
      alert("Erreur lors de l'envoi de l'email.");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const renderBatimentBlock = () => {
    if (displayInvoice.type?.toLowerCase() !== 'batiment') return null;
    return (
      <div className="mt-2 text-[10px] text-gray-800 page-break-inside-avoid border-t-2 border-gray-100 pt-2">
        <div className="mb-3 font-medium">
          Arrêtée la présente {docNatureName} à la somme de : <span className="font-bold italic">{formatCurrency(totalTtc)} {displayInvoice.currency}</span>
        </div>

        <div className="flex justify-between items-start gap-8">
          {/* Left: Payment Breakdown */}
          <div className="w-1/2 space-y-1">
            <h4 className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-500 uppercase text-[9px]">Échéancier</h4>
            <div className="flex justify-between">
              <span>Acompte 8% (Com.)</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.08)}</span>
            </div>
            <div className="flex justify-between">
              <span>Début Tx 37%</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.37)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mi-chantier 50%</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.50)}</span>
            </div>
            <div className="flex justify-between font-bold text-black border-t border-gray-100 pt-1">
              <span>Solde 5% (Fin)</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.05)}</span>
            </div>
          </div>

          {/* Right: Signature */}
          <div className="w-1/2">
            <h4 className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-500 uppercase text-[9px]">Validation client</h4>
            <div className="text-[9px] italic mb-4">
              "Bon pour acceptation et exécution des travaux"
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="mb-6">Le ____/____/________</p>
                <p>À _______________</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-32 border border-gray-300 bg-gray-50 rounded flex items-center justify-center text-gray-300 text-[8px]">
                  Cachet & Signature
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[8px] text-gray-400 mt-3 italic">
          sous réserve de tout supplément et en vous remerciant pour votre confiance
        </div>
      </div>
    );
  };

  const renderDevBlock = () => {
    if (displayInvoice.type?.toLowerCase() !== 'dev') return null;
    return (
      <div className="mt-4 text-[10px] text-gray-800 page-break-inside-avoid border-t-2 border-gray-100 pt-3">
        <div className="flex justify-between items-start gap-8">
          <div className="w-1/2 space-y-1">
            <h4 className="font-bold border-b border-gray-200 pb-1 mb-1 text-gray-500 uppercase text-[9px]">Plan de Règlement S.D.P</h4>
            <div className="flex justify-between italic">
              <span>Accompte à la signature (30%)</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.30)} {displayInvoice.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Premier Versement (30%)</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.30)} {displayInvoice.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Second Versement (35%)</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.35)} {displayInvoice.currency}</span>
            </div>
            <div className="flex justify-between font-bold text-black border-t border-gray-100 pt-1">
              <span>Solde à la livraison (5%)</span>
              <span className="font-mono">{formatCurrency(totalTtc * 0.05)} {displayInvoice.currency}</span>
            </div>
          </div>
          <div className="w-1/2 text-right">
            <div className="inline-block p-4 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-[8px] uppercase text-gray-400 font-bold mb-8">Accord Client (Signature & Cachet)</p>
              <div className="h-12"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Template: Professional Standard
  const renderProfessional = () => (
    <div className="bg-white text-gray-900 w-full min-h-[1100px] p-0 shadow-xl print-area relative" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Background Watermark Logo */}
      {displayInvoice.sender.logoUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5" style={{ zIndex: 0 }}>
          <img
            src={displayInvoice.sender.logoUrl}
            className="w-[600px] h-[600px] object-contain absolute bottom-32 right-10"
            alt="watermark"
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-12 pt-12 pb-10" style={{ borderBottom: `4px solid ${primaryColor}` }}>
        <div className="flex justify-between items-end">
          {/* Company Info: Logo (Left) + Company Title (Right of Logo) */}
          <div className="flex items-center gap-12">
            {displayInvoice.sender.logoUrl ? (
              <img src={displayInvoice.sender.logoUrl} className="h-96 w-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-white font-bold text-6xl rounded-[4rem] shadow-2xl" style={{ backgroundColor: primaryColor }}>
                {displayInvoice.sender.name.charAt(0)}
              </div>
            )}
            <div className="max-w-xl">
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight uppercase opacity-80">{displayInvoice.sender.name}</h1>
              <div className="h-1.5 w-16 mt-3" style={{ backgroundColor: primaryColor }}></div>
            </div>
          </div>

          {/* Invoice Title & Number in Table */}
          <div className="text-right flex flex-col items-end gap-6">
            <h2 className="text-8xl font-black uppercase tracking-tighter" style={{ color: primaryColor }}>{getDocTitle()}</h2>
            <table className="border-collapse shadow-2xl shadow-gray-100 rounded-2xl overflow-hidden">
              <tbody>
                <tr>
                  <td className="px-6 py-3 bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest border border-gray-900">N° {docNatureName}</td>
                  <td className="px-8 py-3 border-2 border-gray-900 text-xl font-black">{displayInvoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="px-6 py-2 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-100">{l.date}</td>
                  <td className="px-8 py-2 border-x-2 border-b-2 border-gray-100 text-sm font-bold">{formatDate(displayInvoice.date)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-2 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-gray-100">{l.dueDate}</td>
                  <td className="px-8 py-2 border-x-2 border-b-2 border-gray-100 text-sm font-bold">{formatDate(displayInvoice.dueDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Subject Line with Margin and Button style */}
      {displayInvoice.subject && (
        <div className="px-12 py-15 mt-6 bg-gray-50/50 border-y border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: primaryColor }}></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Objet du document</p>
              <p className="text-lg font-bold text-gray-800">{displayInvoice.subject}</p>
            </div>
          </div>
          <div className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-gray-200" style={{ backgroundColor: primaryColor }}>
            Référence: {displayInvoice.invoiceNumber}
          </div>
        </div>
      )}

      <div className="px-12 py-10">
        {/* Bill To */}
        <div className="w-1/2 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 ring-4 ring-gray-50 shadow-inner">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></span>
            {billToLabel}
          </p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{displayInvoice.client.name}</h3>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">{displayInvoice.client.address}</p>
          <div className="mt-2 text-sm text-gray-400 font-bold">
            {displayInvoice.client.postalCode} {displayInvoice.client.city}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200/50 text-sm text-gray-500 grid grid-cols-2 gap-4">
            {displayInvoice.client.ice && <div><p className="text-[9px] font-black text-gray-300 uppercase">I.C.E</p><p className="font-bold text-gray-600">{displayInvoice.client.ice}</p></div>}
            {displayInvoice.client.ifNum && <div><p className="text-[9px] font-black text-gray-300 uppercase">I.F</p><p className="font-bold text-gray-600">{displayInvoice.client.ifNum}</p></div>}
          </div>
        </div>
        {/* Company Tax Info Hidden from this section as requested */}
      </div>

      {/* Items Table */}
      <div className="px-0">
        {(() => {
          const blocks: { type: 'items' | 'spacer', data?: any[], id?: string }[] = [];
          let currentBatch: any[] = [];

          displayInvoice.items.forEach(item => {
            item.subItems.forEach(sub => {
              if (sub.isSpacer) {
                if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });
                blocks.push({ type: 'spacer', id: sub.id });
                currentBatch = [];
              } else {
                currentBatch.push(sub);
              }
            });
          });
          if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });

          return blocks.map((block, bIdx) => {
            if (block.type === 'spacer') {
              return <div key={block.id} className="h-8 bg-transparent"></div>;
            }

            return (
              <table key={bIdx} className="w-full border-collapse mb-1 table-fixed">
                <thead>
                  <tr style={{ backgroundColor: primaryColor }}>
                    <th className="text-left text-white text-[10px] font-bold uppercase py-2 px-2 w-[10%]">{l.ref || 'Code'}</th>
                    <th className="text-left text-white text-[10px] font-bold uppercase py-2 px-2 w-[25%]">{l.description}</th>
                    <th className="text-center text-white text-[10px] font-bold uppercase py-2 px-2 w-[7%]">{l.qty}</th>
                    <th className="text-center text-white text-[10px] font-bold uppercase py-2 px-2 w-[5%]">{l.unit}</th>
                    <th className="text-right text-white text-[10px] font-bold uppercase py-2 px-2 w-[10%]">PV HT</th>
                    <th className="text-center text-white text-[10px] font-bold uppercase py-2 px-2 w-[6%]">{l.discount}</th>
                    <th className="text-right text-white text-[10px] font-bold uppercase py-2 px-2 w-[10%]">Net HT</th>
                    <th className="text-center text-white text-[10px] font-bold uppercase py-2 px-2 w-[5%]">{l.vat}</th>
                    <th className="text-center text-white text-[10px] font-bold uppercase py-2 px-2 w-[10%]">Code Eco</th>
                    <th className="text-right text-white text-[10px] font-bold uppercase py-2 px-2 w-[12%]">Mt Eco</th>
                  </tr>
                </thead>
                <tbody>
                  {block.data?.map((sub: any, sIdx: number) => {
                    const qty = safeNumber(sub.quantity);
                    const price = safeNumber(sub.price);
                    const disc = safeNumber(sub.discount);
                    const tax = safeNumber(sub.taxRate);
                    const netHt = (price * qty) * (1 - disc / 100);
                    const isEven = sIdx % 2 === 0;

                    return (
                      <tr key={sub.id} className={isEven ? 'bg-gray-50' : 'bg-white'}>
                        <td className="text-left py-3 px-2 border-b border-gray-200 text-[10px] font-medium text-gray-600 truncate">{sub.code || '-'}</td>
                        <td className="text-left py-3 px-2 border-b border-gray-200 text-[10px] font-medium text-gray-900 whitespace-pre-line break-words">{sub.description}</td>
                        <td className="text-center py-3 px-2 border-b border-gray-200 text-[10px]">{qty}</td>
                        <td className="text-center py-3 px-2 border-b border-gray-200 text-[10px] text-gray-600">{sub.unit}</td>
                        <td className="text-right py-3 px-2 border-b border-gray-200 text-[10px]">{formatCurrency(price)}</td>
                        <td className="text-center py-3 px-2 border-b border-gray-200 text-[10px] text-gray-600">{disc > 0 ? `${disc}%` : '-'}</td>
                        <td className="text-right py-3 px-2 border-b border-gray-200 text-[10px] font-semibold">{formatCurrency(netHt)}</td>
                        <td className="text-center py-3 px-2 border-b border-gray-200 text-[10px] text-gray-600">{tax}%</td>
                        <td className="text-center py-3 px-2 border-b border-gray-200 text-[10px] text-gray-500">{sub.ecoContributionCode || '-'}</td>
                        <td className="text-right py-3 px-2 border-b border-gray-200 text-[10px] text-gray-600">{sub.ecoContributionUnitTtc ? formatCurrency(sub.ecoContributionUnitTtc) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          });
        })()}
      </div>

      {/* Totals */}
      <div className="px-12 py-10 mb-30 flex justify-end">
        <div className="w-80">
          {displayInvoice.type?.toLowerCase() === 'batiment' && (
            <div className="space-y-4 text-xs">
              <p className="font-black uppercase tracking-widest text-gray-400 mb-2">Récapitulatif TVA</p>
              <table className="w-full border-collapse border border-gray-100">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="py-2 px-3 text-left font-bold uppercase text-[9px]">Taux</th>
                    <th className="py-2 px-3 text-right font-bold uppercase text-[9px]">Base HT</th>
                    <th className="py-2 px-3 text-right font-bold uppercase text-[9px]">Valeur TVA</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(taxAmounts).map(([rate, amount]) => (
                    <tr key={rate} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-medium">{rate}%</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(baseHtPerRate[Number(rate)])}</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-2 text-sm mt-6">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">{l.subtotal}</span>
              <span className="font-black">{formatCurrency(subtotalHt)} {displayInvoice.currency}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 bg-black px-2 rounded-lg text-white">
              <span className="font-black uppercase text-xs tracking-wider">{l.totalVat}</span>
              <span className="font-black">{formatCurrency(totalTax)} {displayInvoice.currency}</span>
            </div>
            {totalEcoContrib > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Eco-contribution</span>
                <span className="font-medium">{formatCurrency(totalEcoContrib)} {displayInvoice.currency}</span>
              </div>
            )}
            {safeNumber(displayInvoice.discount) > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span>Remise globale</span>
                <span>-{formatCurrency(safeNumber(displayInvoice.discount))} {displayInvoice.currency}</span>
              </div>
            )}
          </div>
          <div className="mt-4 p-4 bg-black rounded-xl text-white shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-black uppercase tracking-tighter">{l.netToPay}</span>
              <span className="text-3xl font-black">{formatCurrency(totalTtc)} {displayInvoice.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Payment Info */}
      <div className="px-12 pb-8 mt-auto">
        <div className="grid grid-cols-2 gap-8">
          {displayInvoice.notes && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{l.notes}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{displayInvoice.notes}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-sm text-gray-600 mt-1">{l.dueDate}: {formatDate(displayInvoice.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-12 py-6 border-t border-gray-200 text-center text-[10px] text-gray-500 bg-gray-50/50 mt-auto">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="text-left">
            <p className="font-bold uppercase mb-1" style={{ color: primaryColor }}>{l.bankDetails}</p>
            <p className="font-black text-gray-900">BANQUE POPULAIRE</p>
            <p className="font-semibold text-gray-700">{displayInvoice.sender.bankName || 'BQ'}</p>
            <p className="text-gray-600">{displayInvoice.sender.bankAccount || 'RIB'}</p>
            {displayInvoice.sender.swiftCode && <p className="text-gray-500">SWIFT: {displayInvoice.sender.swiftCode}</p>}
          </div>
          <div className="flex justify-center">
            <div className="text-left">
              <p className="font-bold uppercase mb-2" style={{ color: primaryColor }}>Contact</p>
              <div className="flex flex-col items-start gap-1.5">
                <p className="font-black text-gray-800">{displayInvoice.sender.address}</p>
                <p className="text-gray-900 font-black mb-1">{displayInvoice.sender.postalCode} {displayInvoice.sender.city}</p>
                <div className="w-full h-px bg-gray-200 mb-1"></div>
                <p className="flex items-center gap-4 font-black text-gray-800">
                  <span className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /> {displayInvoice.sender.email}</span>
                  <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {displayInvoice.sender.phone}</span>
                </p>
                {displayInvoice.sender.website && (
                  <p className="flex items-center gap-2 font-black text-blue-600">
                    <Globe className="w-3 h-3 text-blue-400" /> {displayInvoice.sender.website}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase mb-2" style={{ color: primaryColor }}>Légal & Siège</p>
            <div className="flex flex-col items-end gap-1">
              <p className="font-black text-gray-900 text-lg">{displayInvoice.sender.name}</p>
              {displayInvoice.sender.country === 'france' && (displayInvoice.sender.siren || displayInvoice.sender.naf) && (
                <p className="font-black text-gray-800">SIREN: {displayInvoice.sender.siren} • NAF: {displayInvoice.sender.naf}</p>
              )}
              {displayInvoice.sender.country !== 'france' && (displayInvoice.sender.ice || displayInvoice.sender.ifNum) && (
                <p className="font-black text-gray-800">ICE: {displayInvoice.sender.ice} • IF: {displayInvoice.sender.ifNum}</p>
              )}
              {displayInvoice.sender.country !== 'france' && displayInvoice.sender.rc && (
                <p className="font-black text-gray-800">RC: {displayInvoice.sender.rc}</p>
              )}
            </div>
          </div>
        </div>
        <p className="pt-2 border-t border-gray-100 opacity-50 italic">Généré par Majorlle ERP - Document certifié conforme</p>
      </div>
    </div>
  );

  // Template: Classic Corporate
  const renderClassicCorporate = () => (
    <div className="bg-white text-gray-900 w-full min-h-[1100px] shadow-xl print-area relative" style={{ fontFamily: 'Georgia, serif' }}>

      {/* Background Watermark Logo */}
      {displayInvoice.sender.logoUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5" style={{ zIndex: 0 }}>
          <img
            src={displayInvoice.sender.logoUrl}
            className="w-100 h-100 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            alt="watermark"
          />
        </div>
      )}

      {/* Letterhead */}
      <div className="relative z-10 border-b-4 border-gray-800">
        <div className="px-12 py-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            {displayInvoice.sender.logoUrl ? (
              <img src={displayInvoice.sender.logoUrl} className="h-26 w-200 object-contain" alt="Logo" />
            ) : (
              <div className="w-16 h-16 bg-gray-800 flex items-center justify-center text-white font-bold text-xl">
                {displayInvoice.sender.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{displayInvoice.sender.name}</h1>
              <p className="text-sm text-gray-500 italic">{displayInvoice.sender.address?.split('\n')[0]}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>{displayInvoice.sender.phone}</p>
            <p>{displayInvoice.sender.email}</p>
            {displayInvoice.sender.website && <p>{displayInvoice.sender.website}</p>}
          </div>
        </div>
      </div>

      {/* Document Title */}
      <div className="px-12 py-8 text-center border-b border-gray-200">
        <h2 className="text-3xl font-bold uppercase tracking-[0.2em] text-gray-800">{getDocTitle()}</h2>
      </div>

      {/* Parties */}
      <div className="px-12 py-8 grid grid-cols-2 gap-16 border-b border-gray-200">
        <div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-200 pb-2">{l.from}</p>
            <p className="font-bold text-gray-900">{displayInvoice.sender.name}</p>
            <p className="text-sm text-gray-700">{displayInvoice.sender.address}</p>
            <p className="text-sm text-gray-900 font-bold">{displayInvoice.sender.postalCode} {displayInvoice.sender.city}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-gray-200 pb-2">{billToLabel}</p>
          <div className="text-sm space-y-1 text-gray-700">
            <p className="font-bold text-gray-900 text-lg">{displayInvoice.client.name}</p>
            <p className="whitespace-pre-line">{displayInvoice.client.address}</p>
            <p className="font-bold">{displayInvoice.client.postalCode} {displayInvoice.client.city}</p>
            {displayInvoice.client.ice && <p>{l.ice}: {displayInvoice.client.ice}</p>}
            {displayInvoice.client.email && <p>{displayInvoice.client.email}</p>}
          </div>
        </div>
      </div>

      {displayInvoice.subject && (
        <div className="px-12 py-6 border-b border-gray-200 text-center bg-gray-50/30">
          <p className="text-lg font-bold text-gray-800 underline underline-offset-8">OBJET : {displayInvoice.subject}</p>
        </div>
      )}

      {/* Dates */}
      <div className="px-12 py-4 flex justify-end gap-12 text-sm border-b border-gray-200 bg-gray-50">
        <div>
          <span className="text-gray-500">{l.date}:</span>
          <span className="ml-2 font-semibold">{formatDate(displayInvoice.date)}</span>
        </div>
        <div>
          <span className="text-gray-500">{l.dueDate}:</span>
          <span className="ml-2 font-semibold">{formatDate(displayInvoice.dueDate)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="px-12 py-8">
        {(() => {
          const blocks: { type: 'items' | 'spacer', data?: any[], id?: string }[] = [];
          let currentBatch: any[] = [];

          displayInvoice.items.forEach(item => {
            item.subItems.forEach(sub => {
              if (sub.isSpacer) {
                if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });
                blocks.push({ type: 'spacer', id: sub.id });
                currentBatch = [];
              } else {
                currentBatch.push(sub);
              }
            });
          });
          if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });

          return blocks.map((block, bIdx) => {
            if (block.type === 'spacer') {
              return <div key={block.id} className="h-8"></div>;
            }

            return (
              <table key={bIdx} className="w-full border border-gray-300 mb-6 table-fixed">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left text-xs font-bold uppercase py-3 px-4 border-b border-gray-300 w-[45%]">{l.description}</th>
                    <th className="text-center text-xs font-bold uppercase py-3 px-3 border-b border-gray-300 w-[10%]">{l.qty}</th>
                    <th className="text-right text-xs font-bold uppercase py-3 px-3 border-b border-gray-300 w-[15%]">{l.unitPrice}</th>
                    <th className="text-center text-xs font-bold uppercase py-3 px-3 border-b border-gray-300 w-[10%]">{l.vat}</th>
                    <th className="text-right text-xs font-bold uppercase py-3 px-4 border-b border-gray-300 w-[20%]">{l.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {block.data?.map((sub: any) => {
                    const qty = safeNumber(sub.quantity);
                    const price = safeNumber(sub.price);
                    const disc = safeNumber(sub.discount);
                    const tax = safeNumber(sub.taxRate);
                    const netHt = (price * qty) * (1 - disc / 100);

                    return (
                      <tr key={sub.id} className="border-b border-gray-200">
                        <td className="py-4 px-4 whitespace-pre-line break-words text-sm">
                          <p className="font-semibold">{sub.description}</p>
                          {sub.code && <p className="text-xs text-gray-400 italic mt-1">{sub.code}</p>}
                        </td>
                        <td className="text-center py-4 px-3 text-sm">{qty}</td>
                        <td className="text-right py-4 px-3 text-sm">{formatCurrency(price)}</td>
                        <td className="text-center py-4 px-3 text-sm">{tax}%</td>
                        <td className="text-right py-4 px-4 text-sm font-semibold">{formatCurrency(netHt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          });
        })()}
      </div>

      {/* Totals */}
      <div className="px-12 flex justify-end mb-12">
        <table className="w-72 border border-gray-300">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4 text-sm text-gray-600">{l.subtotal}</td>
              <td className="py-2 px-4 text-sm text-right font-medium">{formatCurrency(subtotalHt)} {displayInvoice.currency}</td>
            </tr>
            {displayInvoice.type?.toLowerCase() === 'batiment' && (
              <>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-2 px-4 text-[10px] font-bold uppercase text-gray-400" colSpan={2}>Récapitulatif TVA</td>
                </tr>
                {Object.entries(taxAmounts).map(([rate, amount]) => (
                  <tr key={rate} className="border-b border-gray-100 text-[11px]">
                    <td className="py-1 px-4 text-gray-600">TVA {rate}% sur {formatCurrency(baseHtPerRate[Number(rate)])}</td>
                    <td className="py-1 px-4 text-right font-medium">{formatCurrency(amount)} {displayInvoice.currency}</td>
                  </tr>
                ))}
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-4 text-sm text-gray-800 font-bold">{l.totalVat}</td>
                  <td className="py-2 px-4 text-sm text-right font-bold text-indigo-600">{formatCurrency(totalTax)} {displayInvoice.currency}</td>
                </tr>
              </>
            )}
            <tr className="bg-gray-800 text-white">
              <td className="py-3 px-4 text-sm font-bold uppercase">{l.netToPay}</td>
              <td className="py-3 px-4 text-lg text-right font-bold">{formatCurrency(totalTtc)} {displayInvoice.currency}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-12 pb-4">
        {renderBatimentBlock()}
        {renderDevBlock()}
      </div>

      {/* Notes */}
      {
        displayInvoice.notes && (
          <div className="px-12 py-8">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{l.notes}</p>
            <p className="text-sm text-gray-600 italic whitespace-pre-line">{displayInvoice.notes}</p>
          </div>
        )
      }

      {/* Footer */}
      <div className="px-12 py-8 mt-auto border-t-2 border-gray-800 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-8 text-[11px] text-gray-600">
          <div>
            <p className="font-bold uppercase mb-2" style={{ color: primaryColor }}>{l.bankDetails}</p>
            <table className="w-full">
              <tbody>
                <tr><td className="w-20 font-medium whitespace-nowrap">Banque</td><td className="font-black text-gray-900">: BANQUE POPULAIRE</td></tr>
                <tr><td className="w-20 font-medium">Agence (BQ)</td><td>: {displayInvoice.sender.bankName || '-'}</td></tr>
                <tr><td className="font-medium">Compte (RIB)</td><td>: {displayInvoice.sender.bankAccount || '-'}</td></tr>
                <tr><td className="font-medium">SWIFT / BIC</td><td>: {displayInvoice.sender.swiftCode || '-'}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <p className="font-bold uppercase mb-2" style={{ color: primaryColor }}>Mentions Légales</p>
            <p>{displayInvoice.sender.name}</p>
            <p>{displayInvoice.sender.address.split('\n')[0]}</p>
            <p>
              {displayInvoice.sender.country === 'france'
                ? `SIREN: ${displayInvoice.sender.siren || '-'} | NAF: ${displayInvoice.sender.naf || '-'}`
                : `ICE: ${displayInvoice.sender.ice || '-'} | IF: ${displayInvoice.sender.ifNum || '-'} | RC: ${displayInvoice.sender.rc || '-'}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Template: Modern Minimal
  const renderModernMinimal = () => (
    <div className="bg-white text-gray-900 w-full min-h-[1100px] shadow-xl print-area relative" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Background Watermark Logo */}
      {displayInvoice.sender.logoUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5" style={{ zIndex: 0 }}>
          <img
            src={displayInvoice.sender.logoUrl}
            className="w-50 h-50 object-contain absolute -top-20 -right-20"
            alt="watermark"
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-16 pt-12 pb-8 flex justify-between items-end">
        <div className="flex items-center gap-10">
          {displayInvoice.sender.logoUrl ? (
            <img src={displayInvoice.sender.logoUrl} className="h-56 w-auto object-contain" alt="Logo" />
          ) : (
            <div className="text-5xl font-black" style={{ color: primaryColor }}>{displayInvoice.sender.name.charAt(0)}</div>
          )}
          <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase opacity-70">{displayInvoice.sender.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-7xl font-black uppercase tracking-tighter leading-none" style={{ color: primaryColor }}>{getDocTitle()}</p>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-16 h-px bg-gray-200"></div>

      {/* Info Row */}
      <div className="px-16 py-8 grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{billToLabel}</p>
          <p className="font-semibold text-gray-900">{displayInvoice.client.name}</p>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{displayInvoice.client.address}</p>
          <p className="text-sm text-gray-900 font-bold mt-1">{displayInvoice.client.postalCode} {displayInvoice.client.city}</p>
          {displayInvoice.client.ice && <p className="text-sm text-gray-500 mt-2">{l.ice}: {displayInvoice.client.ice}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">N° {docNatureName}</p>
          <p className="font-bold text-gray-900">{displayInvoice.invoiceNumber}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 mt-4">{l.date}</p>
          <p className="font-medium">{formatDate(displayInvoice.date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{l.dueDate}</p>
          <p className="font-medium">{formatDate(displayInvoice.dueDate)}</p>
        </div>
      </div>

      {/* Modern Minimal Subject */}
      {displayInvoice.subject && (
        <div className="px-16 py-4 bg-gray-50 mb-4 border-l-4" style={{ borderColor: primaryColor }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Objet / Sujet</p>
          <p className="text-lg font-bold text-gray-900">{displayInvoice.subject}</p>
        </div>
      )}

      {/* Table */}
      <div className="px-16">
        {(() => {
          const blocks: { type: 'items' | 'spacer', data?: any[], id?: string }[] = [];
          let currentBatch: any[] = [];

          displayInvoice.items.forEach(item => {
            item.subItems.forEach(sub => {
              if (sub.isSpacer) {
                if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });
                blocks.push({ type: 'spacer', id: sub.id });
                currentBatch = [];
              } else {
                currentBatch.push(sub);
              }
            });
          });
          if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });

          return blocks.map((block, bIdx) => {
            if (block.type === 'spacer') {
              return <div key={block.id} className="h-8"></div>;
            }

            return (
              <table key={bIdx} className="w-full mb-8 table-fixed">
                <thead>
                  <tr className="border-b-2" style={{ borderBottomColor: primaryColor }}>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider py-4 text-gray-700 w-[55%]">{l.description}</th>
                    <th className="text-center text-xs font-semibold uppercase tracking-wider py-4 text-gray-500 w-[10%]">{l.qty}</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider py-4 text-gray-500 w-[15%]">{l.unitPrice}</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider py-4 text-gray-500 w-[20%]">{l.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {block.data?.map((sub: any) => {
                    const qty = safeNumber(sub.quantity);
                    const price = safeNumber(sub.price);
                    const disc = safeNumber(sub.discount);
                    const netHt = (price * qty) * (1 - disc / 100);

                    return (
                      <tr key={sub.id} className="border-b border-gray-100">
                        <td className="py-5 break-words">
                          <p className="font-medium whitespace-pre-line">{sub.description}</p>
                          {sub.code && <p className="text-xs text-gray-400 mt-1">{sub.code}</p>}
                          {disc > 0 && <p className="text-xs text-green-600 mt-1">-{disc}% remise</p>}
                        </td>
                        <td className="text-center py-5 text-gray-600 truncate">{qty} {sub.unit}</td>
                        <td className="text-right py-5 text-gray-600 truncate">{formatCurrency(price)}</td>
                        <td className="text-right py-5 font-semibold truncate">{formatCurrency(netHt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          });
        })()}
      </div>

      {/* Totals */}
      <div className="px-16 py-10 flex justify-end mb-12">
        <div className="w-72 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{l.subtotal}</span>
            <span>{formatCurrency(subtotalHt)} {displayInvoice.currency}</span>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-100">
            <p className="text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">Détail TVA</p>
            <table className="w-full text-[10px]">
              <tbody>
                {Object.entries(taxAmounts).map(([rate, amount]) => (
                  <tr key={rate} className="text-gray-500">
                    <td className="py-1">TVA {rate}% sur {formatCurrency(baseHtPerRate[Number(rate)])}</td>
                    <td className="py-1 text-right">{formatCurrency(amount)}</td>
                  </tr>
                ))}
                <tr className="font-bold text-gray-900 border-t border-gray-50 mt-1">
                  <td className="py-2">{l.totalVat}</td>
                  <td className="py-2 text-right">{formatCurrency(totalTax)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{l.netToPay}</span>
              <span className="text-3xl font-bold" style={{ color: primaryColor }}>{formatCurrency(totalTtc)} {displayInvoice.currency}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-16 pb-4">
        {renderBatimentBlock()}
      </div>


      {/* Notes */}
      {
        displayInvoice.notes && (
          <div className="px-16 pb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{l.notes}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{displayInvoice.notes}</p>
            </div>
          </div>
        )
      }

      {/* Footer */}
      <div className="px-16 py-10 mt-auto bg-gray-900 text-white rounded-t-[3rem]">
        <div className="flex justify-between items-start text-[10px] opacity-70 leading-relaxed">
          <div className="flex-1 text-left">
            <h4 className="font-black uppercase tracking-widest text-[8px] mb-3 text-white opacity-40">{l.bankDetails}</h4>
            <p className="text-white font-black uppercase text-[9px] mb-1">BANQUE POPULAIRE</p>
            <p>{displayInvoice.sender.bankName}</p>
            <p className="text-[12px] font-bold mt-1 text-white opacity-100">{displayInvoice.sender.bankAccount}</p>
            <p className="mt-1">SWIFT: {displayInvoice.sender.swiftCode}</p>
          </div>
          <div className="flex-1 flex justify-center text-left">
            <div>
              <h4 className="font-black uppercase tracking-widest text-[8px] mb-3 text-white opacity-40">Contact info</h4>
              <div className="flex flex-col items-start gap-1.5">
                <p>{displayInvoice.sender.address}</p>
                <p className="font-bold mb-1">{displayInvoice.sender.postalCode} {displayInvoice.sender.city}</p>
                <div className="w-full h-px bg-white/20 mb-1"></div>
                <p className="flex items-center gap-2"><Mail className="w-3 h-3 opacity-50" /> {displayInvoice.sender.email} | <Phone className="w-3 h-3 opacity-50" /> {displayInvoice.sender.phone}</p>
                {displayInvoice.sender.website && (
                  <p className="flex items-center gap-2 text-blue-400 opacity-100">
                    <Globe className="w-3 h-3 opacity-50" /> {displayInvoice.sender.website}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-black uppercase tracking-widest text-[8px] mb-3 text-white opacity-40">Légal</h4>
            <div className="flex flex-col items-end gap-1">
              <p className="font-bold text-white opacity-100">{displayInvoice.sender.name}</p>
              <p>
                {displayInvoice.sender.country === 'france'
                  ? `${l.siren}: ${displayInvoice.sender.siren} • ${l.naf}: ${displayInvoice.sender.naf}`
                  : `${l.ice}: ${displayInvoice.sender.ice} • ${l.if}: ${displayInvoice.sender.ifNum} • ${l.rc}: ${displayInvoice.sender.rc}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Template: Detailed Pro
  const renderDetailedPro = () => (
    <div className="bg-white text-gray-900 w-full min-h-[1100px] shadow-xl print-area relative text-sm" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Background Watermark Logo */}
      {displayInvoice.sender.logoUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5" style={{ zIndex: 0 }}>
          <img
            src={displayInvoice.sender.logoUrl}
            className="w-96 h-96 object-contain absolute bottom-40 right-20"
            alt="watermark"
          />
        </div>
      )}

      {/* Header with color bar */}
      <div className="relative z-10 h-2" style={{ backgroundColor: primaryColor }}></div>

      <div className="px-10 pt-6 pb-4 flex justify-between items-start border-b border-gray-200">
        <div className="flex items-center gap-10">
          {displayInvoice.sender.logoUrl ? (
            <img src={displayInvoice.sender.logoUrl} className="h-40 w-auto object-contain" alt="Logo" />
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: primaryColor }}>
              {displayInvoice.sender.name.charAt(0)}
            </div>
          )}
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase opacity-70">{displayInvoice.sender.name}</h1>
        </div>
        <div className="text-right">
          <h2 className="text-5xl font-black uppercase tracking-tighter" style={{ color: primaryColor }}>{getDocTitle()}</h2>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-10 py-4 grid grid-cols-4 gap-4 bg-gray-50 border-b border-gray-200 text-xs">
        <div>
          <p className="text-gray-400 uppercase font-semibold">N° {docNatureName}</p>
          <p className="font-bold">{displayInvoice.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase font-semibold">{l.date}</p>
          <p className="font-medium">{formatDate(displayInvoice.date)}</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase font-semibold">{l.dueDate}</p>
          <p className="font-medium">{formatDate(displayInvoice.dueDate)}</p>
        </div>
        <div className="">
        </div>
      </div>

      {/* Detailed Pro Subject */}
      {displayInvoice.subject && (
        <div className="px-10 py-3 bg-white border-b border-gray-100 flex items-center gap-4">
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest px-2 py-0.5 bg-blue-50 rounded">Objet</span>
          <p className="font-bold text-gray-800">{displayInvoice.subject}</p>
        </div>
      )}

      {/* Parties */}
      <div className="px-10 py-6 grid grid-cols-2 gap-10">
        <div className="border border-gray-200 rounded p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">{l.from}</p>
          <p className="font-bold text-gray-900">{displayInvoice.sender.name}</p>
          <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{displayInvoice.sender.address}</p>
          <p className="text-xs text-gray-900 font-bold mt-1">
            {displayInvoice.sender.postalCode} {displayInvoice.sender.city}
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1 text-[10px] text-gray-400 font-medium">
            <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {displayInvoice.sender.email}</p>
            <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {displayInvoice.sender.phone}</p>
          </div>
        </div>
        <div className="border border-gray-200 rounded p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">{billToLabel}</p>
          <p className="font-bold">{displayInvoice.client.name}</p>
          <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{displayInvoice.client.address}</p>
          <p className="text-xs text-gray-900 font-bold mt-1">{displayInvoice.client.postalCode} {displayInvoice.client.city}</p>
          <div className="mt-3 text-xs text-gray-500">
            {displayInvoice.client.ice && <p>{l.ice}: {displayInvoice.client.ice}</p>}
            {displayInvoice.client.ifNum && <p>{l.if}: {displayInvoice.client.ifNum}</p>}
            {displayInvoice.client.email && <p className="mt-1">{displayInvoice.client.email}</p>}
            {displayInvoice.client.phone && <p>{displayInvoice.client.phone}</p>}
          </div>
        </div>
      </div>

      {/* Table with all details */}
      <div className="px-10">
        {(() => {
          const blocks: { type: 'items' | 'spacer', data?: any[], id?: string }[] = [];
          let currentBatch: any[] = [];

          displayInvoice.items.forEach(item => {
            item.subItems.forEach(sub => {
              if (sub.isSpacer) {
                if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });
                blocks.push({ type: 'spacer', id: sub.id });
                currentBatch = [];
              } else {
                currentBatch.push(sub);
              }
            });
          });
          if (currentBatch.length > 0) blocks.push({ type: 'items', data: currentBatch });

          return blocks.map((block, bIdx) => {
            if (block.type === 'spacer') {
              return <div key={block.id} className="h-8"></div>;
            }

            return (
              <table key={bIdx} className="w-full text-xs border border-gray-300 mb-6 table-fixed">
                <thead>
                  <tr style={{ backgroundColor: primaryColor }} className="text-white">
                    <th className="text-left py-2 px-2 font-semibold border-r border-white/20 w-[8%]">Réf</th>
                    <th className="text-left py-2 px-2 font-semibold border-r border-white/20 w-[35%]">{l.description}</th>
                    <th className="text-center py-2 px-2 font-semibold border-r border-white/20 w-[7%]">{l.qty}</th>
                    <th className="text-center py-2 px-2 font-semibold border-r border-white/20 w-[7%]">{l.unit}</th>
                    <th className="text-right py-2 px-2 font-semibold border-r border-white/20 w-[8%]">P.U. HT</th>
                    <th className="text-center py-2 px-2 font-semibold border-r border-white/20 w-[7%]">{l.discount}</th>
                    <th className="text-right py-2 px-2 font-semibold border-r border-white/20 w-[10%]">Mt HT</th>
                    <th className="text-center py-2 px-2 font-semibold border-r border-white/20 w-[8%]">{l.vat}</th>
                    <th className="text-right py-2 px-2 font-semibold w-[12%]">Mt TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {block.data?.map((sub: any, sIdx: number) => {
                    const qty = safeNumber(sub.quantity);
                    const price = safeNumber(sub.price);
                    const disc = safeNumber(sub.discount);
                    const tax = safeNumber(sub.taxRate);
                    const netHt = (price * qty) * (1 - disc / 100);
                    const ttc = netHt * (1 + tax / 100);
                    const isEven = sIdx % 2 === 0;

                    return (
                      <tr key={sub.id} className={`border-b border-gray-200 ${isEven ? 'bg-gray-50 ' : ''}`}>
                        <td className="py-2 px-2 border-r border-gray-200 text-gray-500 truncate">{sub.code || '-'}</td>
                        <td className="py-2 px-2 border-r border-gray-200 whitespace-pre-line break-words">{sub.description}</td>
                        <td className="text-center py-2 px-2 border-r border-gray-200">{qty}</td>
                        <td className="text-center py-2 px-2 border-r border-gray-200 text-gray-500 truncate">{sub.unit}</td>
                        <td className="text-right py-2 px-2 border-r border-gray-200">{formatCurrency(price)}</td>
                        <td className="text-center py-2 px-2 border-r border-gray-200">{disc > 0 ? `${disc}%` : '-'}</td>
                        <td className="text-right py-2 px-2 border-r border-gray-200 font-medium">{formatCurrency(netHt)}</td>
                        <td className="text-center py-2 px-2 border-r border-gray-200">{tax}%</td>
                        <td className="text-right py-2 px-2 font-semibold">{formatCurrency(ttc)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          });
        })()}
      </div>

      {/* Summary */}
      <div className="px-10 py-6 flex justify-between mb-12">
        {/* VAT Breakdown */}
        {displayInvoice.type?.toLowerCase() === 'batiment' && (
          <div className="text-xs">
            <p className="font-bold mb-2">Récapitulatif TVA</p>
            <table className="border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-1 px-3 border-r border-gray-200">Taux</th>
                  <th className="py-1 px-3 border-r border-gray-200">Base HT</th>
                  <th className="py-1 px-3">Montant TVA</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(taxAmounts).map(([rate, amount]) => (
                  <tr key={rate} className="border-t border-gray-200">
                    <td className="py-1 px-3 border-r border-gray-200">{rate}%</td>
                    <td className="py-1 px-3 border-r border-gray-200">{formatCurrency(amount / (parseFloat(rate) / 100))}</td>
                    <td className="py-1 px-3">{formatCurrency(amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="w-64">
          <table className="w-full text-xs border border-gray-300">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-3 bg-gray-50 font-medium">Total HT</td>
                <td className="py-2 px-3 text-right">{formatCurrency(subtotalHt)} {displayInvoice.currency}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-3 bg-gray-50 font-medium">Total TVA</td>
                <td className="py-2 px-3 text-right">{formatCurrency(totalTax)} {displayInvoice.currency}</td>
              </tr>
              {safeNumber(displayInvoice.discount) > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-3 bg-gray-50 font-medium">Remise</td>
                  <td className="py-2 px-3 text-right text-green-600">-{formatCurrency(safeNumber(displayInvoice.discount))} {displayInvoice.currency}</td>
                </tr>
              )}
              <tr style={{ backgroundColor: primaryColor }} className="text-white">
                <td className="py-3 px-3 font-bold">{l.netToPay}</td>
                <td className="py-3 px-3 text-right font-bold text-lg">{formatCurrency(totalTtc)} {displayInvoice.currency}</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

      <div className="px-10 pb-4">
        {renderBatimentBlock()}
        {renderDevBlock()}
      </div>

      {/* Amount in words & Notes */}
      <div className="px-10 pb-4">
        {displayInvoice.notes && (
          <div className="mt-4 text-xs">
            <p className="font-semibold">{l.notes}:</p>
            <p className="text-gray-600 whitespace-pre-line mt-1">{displayInvoice.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-10 py-6 border-t border-gray-300 bg-gray-50 mt-auto">
        <div className="grid grid-cols-4 gap-6 text-[10px] text-gray-500">
          <div className="col-span-1">
            <p className="font-bold uppercase mb-2" style={{ color: primaryColor }}>{l.bankDetails}</p>
            <p className="font-black text-gray-900 border-b border-gray-100 pb-1 mb-1">BANQUE POPULAIRE</p>
            <p className="font-mono text-gray-600 mt-1">{displayInvoice.sender.bankAccount || '-'}</p>
            <p className="text-[9px] mt-1">SWIFT: {displayInvoice.sender.swiftCode || '-'}</p>
          </div>
          <div className="col-span-2 flex justify-center text-left">
            <div>
              <p className="font-bold uppercase mb-3" style={{ color: primaryColor }}>COORDONNÉES & CONTACT</p>
              <div className="flex flex-col items-start gap-2 text-gray-700">
                <p className="font-bold text-gray-900">{displayInvoice.sender.name}</p>
                <div className="flex flex-col items-start gap-0">
                  <p className="text-gray-600">{displayInvoice.sender.address}</p>
                  <p className="font-bold text-gray-800">{displayInvoice.sender.postalCode} {displayInvoice.sender.city}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-200 min-w-full lg:min-w-0 pr-8">
                  <div className="flex flex-col items-start gap-2">
                    <p className="flex items-center gap-4">
                      <span className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /> {displayInvoice.sender.email}</span>
                      <span className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {displayInvoice.sender.phone}</span>
                    </p>
                    {displayInvoice.sender.website && (
                      <p className="flex items-center gap-2 text-blue-600">
                        <Globe className="w-3 h-3 text-blue-400" /> {displayInvoice.sender.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1 text-right">
            <p className="font-bold uppercase mb-2" style={{ color: primaryColor }}>IDENTIFICATION</p>
            <div className="flex flex-col items-end gap-1">
              {displayInvoice.sender.country === 'france' ? (
                <>
                  <p>{l.siren}: {displayInvoice.sender.siren || '-'}</p>
                  <p>{l.naf}: {displayInvoice.sender.naf || '-'}</p>
                </>
              ) : (
                <>
                  <p>{l.ice}: {displayInvoice.sender.ice || '-'}</p>
                  <p>{l.if}: {displayInvoice.sender.ifNum || '-'}</p>
                  <p>{l.rc}: {displayInvoice.sender.rc || '-'}</p>
                  <p>{l.tp}: {displayInvoice.sender.taxePro || '-'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 relative">
        <div className="flex justify-end gap-4 no-print flex-wrap items-center mb-4">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm mr-auto">
            <button
              disabled={isTranslating}
              onClick={() => handleTranslate('fr')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${lang === 'fr' ? 'text-white shadow' : 'text-gray-500 hover:text-gray-700'} disabled:opacity-50`}
              style={{ backgroundColor: lang === 'fr' ? primaryColor : undefined }}
            >
              {isTranslating && lang !== 'fr' ? '...' : 'Français'}
            </button>
            <button
              disabled={isTranslating}
              onClick={() => handleTranslate('en')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${lang === 'en' ? 'text-white shadow' : 'text-gray-500 hover:text-gray-700'} disabled:opacity-50`}
              style={{ backgroundColor: lang === 'en' ? primaryColor : undefined }}
            >
              {isTranslating && lang !== 'en' ? '...' : 'English'}
            </button>
          </div>
          <button
            disabled={!isInvoiceValid}
            title={printButtonTitle}
            onClick={() => {
              if (!isInvoiceValid) return;
              const printArea = invoiceRef.current?.querySelector('.print-area');
              if (!printArea) return;

              const printWindow = window.open('', '', 'width=1000,height=1400');
              if (!printWindow) return;

              const htmlContent = (printArea as HTMLElement).innerHTML;

              printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>${displayInvoice.invoiceNumber} - ${displayInvoice.client.name}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @page {
                    size: A4;
                    margin: 0;
                  }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  html, body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    width: 100%;
                  }
                  .print-area {
                    width: 210mm;
                    height: 297mm;
                    margin: 0;
                    padding: 0;
                    background: white;
                    page-break-after: always;
                    display: block;
                  }
                  body {
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                  }
                </style>
              </head>
              <body>
                <div class="print-area">${htmlContent}</div>
              </body>
            </html>
          `);
              printWindow.document.close();
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }, 500);
            }}
            className="px-5 py-3 bg-gray-800 text-white rounded-xl font-semibold text-sm shadow flex items-center gap-2 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" /> Imprimer / PDF
          </button>
          <button onClick={handleOpenEmailModal} className="px-5 py-3 text-white rounded-xl font-semibold text-sm shadow flex items-center gap-2 hover:opacity-90 transition" style={{ backgroundColor: primaryColor }}>
            <Mail className="w-4 h-4" /> Envoyer par Email
          </button>
        </div>

        <div className="flex justify-center" ref={invoiceRef}>
          {(() => {
            switch (tpl) {
              case 'Professional':
              case 'BlueSky':
              case 'ExecutiveModern':
                return renderProfessional();
              case 'ClassicCorporate':
              case 'SwissMinimal':
              case 'RoyalGold':
                return renderClassicCorporate();
              case 'ModernMinimal':
              case 'DeepOnyx':
                return renderModernMinimal();
              case 'DetailedPro':
              case 'CorporatePro':
              case 'ClassicPrint':
                return renderDetailedPro();
              default:
                return renderProfessional();
            }
          })()}
        </div>

        {isEmailModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 no-print">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow" style={{ backgroundColor: primaryColor }}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Email Assistant</h3>
                    <p className="text-xs text-gray-500">Généré par IA</p>
                  </div>
                </div>
                <button onClick={() => setIsEmailModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isGenerating ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: primaryColor }}></div>
                  <p className="text-sm text-gray-500">Rédaction en cours...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Objet</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{emailContent.subject}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Message</label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">{emailContent.body}</div>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest block mb-2">Pièces jointes</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-white p-2 rounded-lg border border-gray-200">
                        <FileText className="w-4 h-4 text-blue-500" />
                        {displayInvoice.type}_{displayInvoice.invoiceNumber}.pdf (Généré)
                      </div>
                      {customFile && (
                        <div className="flex items-center justify-between gap-2 text-xs font-bold text-gray-600 bg-white p-2 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Plus className="w-4 h-4 text-emerald-500" />
                            <span className="truncate">{customFile.name}</span>
                          </div>
                          <button onClick={() => setCustomFile(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {!customFile && (
                        <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                          <Plus className="w-4 h-4 text-gray-400" />
                          <span className="text-[10px] font-black uppercase text-gray-400">Ajouter un fichier</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCustomFile({
                                    name: file.name,
                                    base64: reader.result as string
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCopyEmail}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copié!' : 'Copier'}
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InvoicePreview;