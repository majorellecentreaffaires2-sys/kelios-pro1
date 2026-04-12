import React, { useState, useEffect, useCallback } from "react";
import {
  Invoice,
  Company,
  InvoiceItem,
  InvoiceSubItem,
  InvoiceType,
  ContactInfo,
  InvoiceTemplate,
  Article,
  VisualTemplate,
} from "../types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  LayoutTemplate,
  Search,
  Hash,
  ShieldCheck,
  Package,
  X,
  Wand2,
  Percent,
  CheckCircle2,
  Lock,
  Save,
  LayoutList,
  ChevronRight,
  ChevronLeft,
  SaveAll,
  RefreshCw,
  Palette,
  User,
  FileText,
  Info,
  ClipboardList,
  Settings,
  CreditCard,
  Send,
  Printer,
  Check,
} from "lucide-react";
import { enhanceInvoiceDescription } from "../geminiService";
import InvoicePreview from "./InvoicePreview";
import { api } from "../apiClient";

interface InvoiceCreatorProps {
  onSave: (invoice: Invoice) => void;
  activeCompany: Company;
  clients: ContactInfo[];
  articles: Article[];
  templates: InvoiceTemplate[];
  initialInvoice?: Invoice;
  onCancel: () => void;
}

const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({
  onSave,
  activeCompany,
  clients,
  articles,
  templates,
  initialInvoice,
  onCancel,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [justValidated, setJustValidated] = useState(false);
  const [viewMode, setViewMode] = useState<"standard" | "wizard" | "design">(
    "wizard",
  );
  const [wizardStep, setWizardStep] = useState(1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [vatRates, setVatRates] = useState<any[]>([]);
  const [saveDepositPreference, setSaveDepositPreference] = useState(false);
  
  // États pour l'échéancier
  const [firstPayment, setFirstPayment] = useState(30);
  const [secondPayment, setSecondPayment] = useState(35);
  const [deliveryPayment, setDeliveryPayment] = useState(5);

  const isLocked = false; // Bypassing frontend lock as requested

  const [form, setForm] = useState<Invoice>(() => {
    if (initialInvoice) return initialInvoice;

    const getDefaultVatRate = () => {
      if (vatRates.length > 0) {
        const defaultRate = vatRates.find((r) => r.defaultRate);
        return defaultRate ? defaultRate.rate : vatRates[0].rate;
      }
      return activeCompany?.defaultVatRates[0] || 20;
    };

    // Charger le taux d'acompte par défaut depuis localStorage pour les devis
    const getDefaultDepositRate = () => {
      const isQuoteType = activeCompany?.companyType === 'DevisAvecAcompte' || activeCompany?.companyType === 'Dev';
      if (isQuoteType) {
        return parseFloat(localStorage.getItem('defaultDepositRate') || '0');
      }
      return 0;
    };

    return {
      id: Math.random().toString(36).substr(2, 9),
      companyId: activeCompany?.id || "",
      invoiceNumber: "AUTO-GENERATE",
      type: activeCompany?.companyType === 'DevisAvecAcompte' ? 'DevisAvecAcompte' : 'Standard',
      documentNature: activeCompany?.companyType === 'DevisAvecAcompte' || activeCompany?.companyType === 'Dev' ? 'Devis' : 'Facture',
      status: "En cours",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      sender: { ...activeCompany } as ContactInfo,
      client: {
        name: "",
        email: "",
        address: "",
        phone: "",
        ice: "",
        ifNum: "",
        rc: "",
      },
      items: [
        {
          id: "item-1",
          title: "SECTION 1",
          subItems: [
            {
              id: "sub-1",
              code: "",
              description: "",
              quantity: 1,
              price: 0,
              unit: "U",
              discount: 0,
              taxRate: getDefaultVatRate(),
              ecoContributionCode: "",
              ecoContributionUnitTtc: 0,
            },
          ],
        },
      ],
      payments: [],
      auditTrail: [],
      relanceHistory: [],
      discount: 0,
      depositRate: getDefaultDepositRate(), // Utiliser le taux par défaut
      firstPayment: 30,
      secondPayment: 35,
      deliveryPayment: 5,
      // Variables proforma
      conversionAmount: 0,
      balanceDue: 0,
      depositReceived: 0,
      notes: activeCompany?.companyType === 'Dev'
        ? "Modalités de règlement spécifiques :\n- Accompte à la signature : 30%\n- Versement : 30%\n- Autre versement : 35%\n- Livraison : 5%"
        : "Total HT arrêté à la somme de :",
      currency: activeCompany?.currency || "MAD",
      language: "fr",
      primaryColor: activeCompany?.primaryColor || "#007AFF",
      visualTemplate:
        activeCompany?.companyType === 'DevisAvecAcompte' ? 'CorporatePro' :
          activeCompany?.companyType === 'Services' ? 'SwissMinimal' :
            activeCompany?.companyType === 'Commerce' ? 'ClassicPrint' :
              activeCompany?.companyType === 'Dev' ? 'DeepOnyx' : 'BlueSky',
    };
  });

  // Global Auto-save listener - Triggers every 3s of inactivity if form changed
  useEffect(() => {
    if (isLocked) return;
    const timeout = setTimeout(async () => {
      const hasContent =
        form.client.name || form.items[0].subItems[0].description;
      if (hasContent) {
        setAutoSaveStatus("saving");
        try {
          // Persistence in real backend
          await api.updateInvoice(form);
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        } catch (e) {
          console.error("Auto-save failed", e);
          setAutoSaveStatus("idle");
        }
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [form, isLocked]);

  // Handlers pour l'échéancier
  const updateFirstPayment = (value: number) => {
    setFirstPayment(value);
    setForm(prev => ({ ...prev, firstPayment: value }));
  };

  const updateSecondPayment = (value: number) => {
    setSecondPayment(value);
    setForm(prev => ({ ...prev, secondPayment: value }));
  };

  const updateDeliveryPayment = (value: number) => {
    setDeliveryPayment(value);
    setForm(prev => ({ ...prev, deliveryPayment: value }));
  };

  useEffect(() => {
    if (!initialInvoice && !isLocked) generateNextNumber(form.type);
  }, [form.type, activeCompany.id, initialInvoice, isLocked]);

  useEffect(() => {
    loadVatRates();
  }, [activeCompany.id]);

  const loadVatRates = async () => {
    try {
      const rates = await api.getVatRates(activeCompany.id);
      setVatRates(rates.filter((r) => r.active));
    } catch (error) {
      console.error("Failed to load VAT rates:", error);
      // Fallback to company default rates
      setVatRates(
        activeCompany.defaultVatRates.map((rate) => ({
          rate,
          label: `${rate}%`,
        })),
      );
    }
  };

  const generateNextNumber = async (type: InvoiceType) => {
    if (isLocked) return;
    try {
      const allInvoices = await api.getInvoices(activeCompany.id);
      const typePrefix =
        type === "Devis" || type === "Dev" ? "DEV" : type === "Livraison" ? "BL" : "FAC";
      const year = new Date().getFullYear();
      const sequence = (allInvoices.length + 1).toString().padStart(4, "0");
      setForm((prev) => ({
        ...prev,
        invoiceNumber: `${activeCompany.name.slice(0, 3).toUpperCase()}-${typePrefix}-${year}-${sequence}`,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const calculateTotals = () => {
    let totalHt = 0;
    let totalTva = 0;
    let totalEcoContrib = 0;
    form.items.forEach((item) => {
      item.subItems.forEach((sub) => {
        const price = parseFloat(String(sub.price)) || 0;
        const quantity = parseFloat(String(sub.quantity)) || 0;
        const discountPercentage = parseFloat(String(sub.discount)) || 0;
        const txRate = parseFloat(String(sub.taxRate));
        const taxRate = isNaN(txRate) ? 0 : txRate;
        const ecoUnitTtc = parseFloat(String(sub.ecoContributionUnitTtc)) || 0;

        const lineGrossHt = price * quantity;
        const lineNetHt = lineGrossHt * (1 - discountPercentage / 100);
        const lineTva = lineNetHt * (taxRate / 100);
        const lineEcoTotal = ecoUnitTtc * quantity;

        totalHt += lineNetHt;
        totalTva += lineTva;
        totalEcoContrib += lineEcoTotal;
      });
    });
    const globalDiscount = parseFloat(String(form.discount)) || 0;
    const ttc = totalHt + totalTva + totalEcoContrib - globalDiscount;
    
    // Calcul de l'acompte pour les devis
    const depositRate = parseFloat(String(form.depositRate)) || 0;
    const depositAmount = (form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') ? ttc * (depositRate / 100) : 0;
    const remainingAmount = ttc - depositAmount;
    
    // Calcul de l'échéancier pour les devis
    const firstPaymentRate = parseFloat(String(form.firstPayment)) || 30;
    const secondPaymentRate = parseFloat(String(form.secondPayment)) || 35;
    const deliveryPaymentRate = parseFloat(String(form.deliveryPayment)) || 5;
    
    const firstPaymentAmount = (form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') ? ttc * (firstPaymentRate / 100) : 0;
    const secondPaymentAmount = (form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') ? ttc * (secondPaymentRate / 100) : 0;
    const deliveryPaymentAmount = (form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') ? ttc * (deliveryPaymentRate / 100) : 0;
    const totalPaidAmount = firstPaymentAmount + secondPaymentAmount + deliveryPaymentAmount;
    const finalRemainingAmount = ttc - totalPaidAmount;
    
    // Calcul des variables proforma (uniquement pour les factures proforma)
    // Utiliser les valeurs manuelles si elles sont définies, sinon calculer automatiquement
    let conversionAmount = 0;
    let depositReceived = 0;
    let balanceDue = 0;
    
    if (form.type === 'Proforma') {
      // Utiliser les valeurs manuelles si elles existent et sont > 0
      conversionAmount = (form.conversionAmount && form.conversionAmount > 0) ? form.conversionAmount : ttc * 0.1;
      depositReceived = (form.depositReceived && form.depositReceived > 0) ? form.depositReceived : ttc * 0.2;
      balanceDue = (form.balanceDue && form.balanceDue > 0) ? form.balanceDue : ttc - conversionAmount - depositReceived;
    }
    
    return {
      totalHt: isNaN(totalHt) ? 0 : totalHt,
      totalTva: isNaN(totalTva) ? 0 : totalTva,
      totalEcoContrib: isNaN(totalEcoContrib) ? 0 : totalEcoContrib,
      ttc: isNaN(ttc) ? 0 : ttc,
      depositAmount: isNaN(depositAmount) ? 0 : depositAmount,
      remainingAmount: isNaN(remainingAmount) ? 0 : remainingAmount,
      firstPaymentAmount: isNaN(firstPaymentAmount) ? 0 : firstPaymentAmount,
      secondPaymentAmount: isNaN(secondPaymentAmount) ? 0 : secondPaymentAmount,
      deliveryPaymentAmount: isNaN(deliveryPaymentAmount) ? 0 : deliveryPaymentAmount,
      totalPaidAmount: isNaN(totalPaidAmount) ? 0 : totalPaidAmount,
      finalRemainingAmount: isNaN(finalRemainingAmount) ? 0 : finalRemainingAmount,
      conversionAmount: isNaN(conversionAmount) ? 0 : conversionAmount,
      depositReceived: isNaN(depositReceived) ? 0 : depositReceived,
      balanceDue: isNaN(balanceDue) ? 0 : balanceDue,
    };
  };

  const { totalHt, totalTva, totalEcoContrib, ttc, depositAmount, remainingAmount, firstPaymentAmount, secondPaymentAmount, deliveryPaymentAmount, totalPaidAmount, finalRemainingAmount, conversionAmount, depositReceived, balanceDue } = calculateTotals();

  // Debug pour voir les données dans InvoiceCreator
  console.log('Debug Acompte - InvoiceCreator:', {
    documentNature: form.documentNature,
    type: form.type,
    depositRate: form.depositRate,
    depositAmount,
    remainingAmount,
    ttc
  });

  const handleSaveDraft = async () => {
    if (isLocked) return;
    if (!form.client.name) {
      alert("Veuillez saisir au moins le nom du client.");
      return;
    }
    try {
      const draftInvoice: Invoice = {
        ...form,
        status: form.status,
      };
      await onSave(draftInvoice);
      setForm(draftInvoice);
      alert("Facture enregistrée avec succès !");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const handleValidate = () => {
    if (isLocked) return;
    if (!form.client.name || !form.client.address) {
      alert("Erreur critique : Les coordonnées du tiers sont incomplètes.");
      return;
    }
    const validatedAt = new Date().toISOString();
    const validatedInvoice: Invoice = {
      ...form,
      status: "Valide",
      validatedAt,
    };
    onSave(validatedInvoice);
    setForm(validatedInvoice);
    setJustValidated(true);
    setIsPreview(true);
  };

  const renderWizardMode = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500 max-w-6xl mx-auto">
      <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm overflow-hidden relative">
        <div className="flex gap-6 relative z-10">
          {[
            {
              s: 1,
              label: "Tiers & Destinataire",
              icon: <User className="w-4 h-4" />,
            },
            {
              s: 2,
              label: "Lignes de Facturation",
              icon: <FileText className="w-4 h-4" />,
            },
            {
              s: 3,
              label: "Paiement & Notes",
              icon: <CreditCard className="w-4 h-4" />,
            },
            {
              s: 4,
              label: "Design & Modèle",
              icon: <Palette className="w-4 h-4" />,
            },
          ].map((step) => (
            <div
              key={step.s}
              className={`flex items-center gap-3 transition-all ${wizardStep === step.s ? "opacity-100 scale-105" : "opacity-30"}`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${wizardStep === step.s ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "bg-gray-100 text-gray-500"}`}
              >
                {step.s}
              </div>
              <div className="hidden lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                  Étape {step.s}
                </p>
                <p className="text-xs font-bold text-gray-800">{step.label}</p>
              </div>
              {step.s < 4 && (
                <ChevronRight className="w-4 h-4 text-gray-200 ml-2" />
              )}
            </div>
          ))}
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">
            Assistant de Saisie
          </p>
          <div className="flex items-center gap-2">
            <span className="w-32 h-1.5 bg-blue-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(wizardStep / 4) * 100}%` }}
              ></div>
            </span>
          </div>
        </div>
      </div>

      <div className="glass p-12 rounded-[3.5rem] border-white/50 min-h-[450px] shadow-2xl relative">
        <div className="absolute top-6 right-10">
          {autoSaveStatus !== "idle" && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-50 rounded-xl shadow-sm">
              {autoSaveStatus === "saving" ? (
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
              ) : (
                <SaveAll className="w-3 h-3 text-emerald-500" />
              )}
              <span className="text-[8px] font-black uppercase text-blue-500 tracking-tighter">
                {autoSaveStatus === "saving" ? "Sync..." : "Sauvegardé"}
              </span>
            </div>
          )}
        </div>

        {wizardStep === 1 && (
          <div className="space-y-10 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900">
                1. Liaison Partenaire
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Recherchez un tiers existant ou créez une fiche temporaire pour
                ce document.
              </p>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Type Document
                </label>
                <select
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-600 text-sm"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as any })
                  }
                >
                  <option value="Standard">Facture Standard</option>
                  <option value="Devis">Devis</option>
                  <option value="Proforma">Facture Proforma</option>
                  <option value="Livraison">Bon de Livraison</option>
                  <option value="Avoir">Avoir</option>
                  <option value="DevisAvecAcompte">BATIMENT</option>
                  <option value="Dev">Facture Dev</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Nature du Document
                </label>
                <select
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-600 text-sm"
                  value={form.documentNature}
                  onChange={(e) =>
                    setForm({ ...form, documentNature: e.target.value as any })
                  }
                >
                  <option value="Facture">Facture</option>
                  <option value="Devis">Devis</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  N° Document
                </label>
                <input
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-black outline-none focus:border-blue-600 text-sm"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Devise
                </label>
                <select
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-black outline-none focus:border-blue-600 text-sm"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                >
                  <option value="MAD">MAD (Dirham Marocain)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar US)</option>
                  <option value="GBP">GBP (Livre Sterling)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Date Émission
                </label>
                <input
                  type="date"
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-600 text-sm"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Date Échéance
                </label>
                <input
                  type="date"
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-600 text-sm"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Statut
                </label>
                <select
                  className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-600 text-sm"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as any })
                  }
                >
                  <option value="Brouillon">Brouillon</option>
                  <option value="En cours">En cours</option>
                  <option value="Payée">Payée</option>
                  <option value="Non payée">Non payée</option>
                  <option value="Annulée">Annulée</option>
                </select>
              </div>
            </div>

            {/* Client Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Sélection Rapide Client
                </label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                  <select
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl py-5 pl-12 pr-6 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm appearance-none"
                    onChange={(e) => {
                      if (!e.target.value) {
                        setForm({
                          ...form,
                          client: {
                            name: "",
                            email: "",
                            address: "",
                            phone: "",
                            ice: "",
                            ifNum: "",
                            rc: "",
                          },
                        });
                        return;
                      }
                      const c = clients.find((cl) => cl.id === e.target.value);
                      if (c) setForm({ ...form, client: { ...c } });
                    }}
                  >
                    <option value="">-- Utiliser la saisie manuelle --</option>
                    {clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Raison Sociale / Nom *
                </label>
                <input
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-6 py-5 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, name: e.target.value },
                    })
                  }
                  placeholder="Ex: ACME Worldwide"
                  required
                />
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  ICE
                </label>
                <input
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.ice || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, ice: e.target.value },
                    })
                  }
                  placeholder="001234567890123"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  I.F (Identifiant Fiscal)
                </label>
                <input
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.ifNum || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, ifNum: e.target.value },
                    })
                  }
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  R.C (Registre Commerce)
                </label>
                <input
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.rc || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, rc: e.target.value },
                    })
                  }
                  placeholder="123456"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.email || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, email: e.target.value },
                    })
                  }
                  placeholder="contact@client.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.phone || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, phone: e.target.value },
                    })
                  }
                  placeholder="+212 5XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Mobile
                </label>
                <input
                  type="tel"
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                  value={form.client.mobile || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, mobile: e.target.value },
                    })
                  }
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Adresse de Facturation Légale *
              </label>
              <textarea
                rows={3}
                className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-6 py-5 font-medium outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                value={form.client.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    client: { ...form.client, address: e.target.value },
                  })
                }
                placeholder="Saisir l'adresse complète pour la certification..."
                required
              />
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900">
                2. Postes & Prestations
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Détaillez vos services. Chaque ligne peut avoir son propre taux
                de TVA.
              </p>
            </div>

            <div className="space-y-6">
              {form.items[0].subItems.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-6 group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Ligne d'article
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const next = [...form.items];
                        next[0].subItems = next[0].subItems.filter(
                          (s) => s.id !== sub.id,
                        );
                        if (next[0].subItems.length === 0) {
                          next[0].subItems.push({
                            id: Math.random().toString(),
                            description: "",
                            price: 0,
                            quantity: 1,
                            unit: "U",
                            taxRate: activeCompany.defaultVatRates[0] || 20,
                          });
                        }
                        setForm({ ...form, items: next });
                      }}
                      className="p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-6 items-end">
                    {/* Line 1: Code, Designation, Unit */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        Code
                      </label>
                      <input
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600"
                        value={sub.code || ""}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].code = e.target.value;
                          setForm({ ...form, items: next });
                        }}
                        placeholder="CODE-01"
                      />
                    </div>
                    <div className="md:col-span-8 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        Désignation
                      </label>
                      <textarea
                        rows={1}
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600 focus:ring-4 ring-blue-50 transition-all h-auto"
                        value={sub.description}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].description = e.target.value;
                          setForm({ ...form, items: next });
                        }}
                        placeholder="Détail du produit ou service..."
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        Unité
                      </label>
                      <input
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-600"
                        value={sub.unit}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].unit = e.target.value;
                          setForm({ ...form, items: next });
                        }}
                        placeholder="U, Kg, H..."
                      />
                    </div>

                    {/* Line 2: Qte, price, discount, net ht, tva */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        Qté
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-600"
                        value={sub.quantity}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].quantity =
                            parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: next });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        PV HT
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-600"
                        value={sub.price}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].price =
                            parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: next });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        % Remise
                      </label>
                      <input
                        type="number"
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-600"
                        value={sub.discount || 0}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].discount =
                            parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: next });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        Net HT
                      </label>
                      <div className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-xl px-4 py-3 text-xs font-black text-blue-600">
                        {(
                          sub.price *
                          sub.quantity *
                          (1 - (sub.discount || 0) / 100)
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                        TVA
                      </label>
                      <select
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-3 text-xs font-black outline-none focus:border-blue-600"
                        value={String(sub.taxRate ?? 20)}
                        onChange={(e) => {
                          const newRate = parseFloat(e.target.value);
                          const nextItems = form.items.map((item, i) => {
                            if (i === 0) {
                              return {
                                ...item,
                                subItems: item.subItems.map((s, j) =>
                                  j === idx ? { ...s, taxRate: newRate } : s,
                                ),
                              };
                            }
                            return item;
                          });
                          setForm({ ...form, items: nextItems });
                        }}
                      >
                        {Array.from(new Set(vatRates.map((r) => r.rate)))
                          .sort((a: any, b: any) => b - a)
                          .map((rate) => (
                            <option key={rate} value={String(rate)}>
                              {rate}%
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1 text-right block">
                        TTC Ligne
                      </label>
                      <div className="w-full bg-emerald-50/30 border-2 border-emerald-50 rounded-xl px-4 py-3 text-xs font-black text-emerald-600 text-right">
                        {(
                          sub.price *
                          sub.quantity *
                          (1 - (sub.discount || 0) / 100) *
                          (1 + sub.taxRate / 100) +
                          (sub.ecoContributionUnitTtc || 0) * sub.quantity
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* Line 3: Eco-contrib code, eco-contrib unit ttc, total eco-contrib */}
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1 italic">
                        Code Éco-contribution
                      </label>
                      <input
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:border-blue-400"
                        value={sub.ecoContributionCode || ""}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].ecoContributionCode =
                            e.target.value;
                          setForm({ ...form, items: next });
                        }}
                        placeholder="DEEE-..."
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1 italic">
                        Montant U. Eco-Contrib TTC
                      </label>
                      <input
                        type="number"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-blue-400"
                        value={sub.ecoContributionUnitTtc || 0}
                        onChange={(e) => {
                          const next = [...form.items];
                          next[0].subItems[idx].ecoContributionUnitTtc =
                            parseFloat(e.target.value) || 0;
                          setForm({ ...form, items: next });
                        }}
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1 italic">
                        Total Éco-Contribution
                      </label>
                      <div className="text-xs font-black text-amber-600 p-2">
                        {(
                          (sub.ecoContributionUnitTtc || 0) * sub.quantity
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-blue-50/30 rounded-3xl border border-blue-100">
              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase text-blue-900">
                  Récapitulatif TVA
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const vats: { [key: number]: number } = {};
                    form.items[0].subItems.forEach((sub) => {
                      const price = parseFloat(String(sub.price)) || 0;
                      const quantity = parseFloat(String(sub.quantity)) || 0;
                      const discount = parseFloat(String(sub.discount)) || 0;
                      const txRate = parseFloat(String(sub.taxRate));
                      const taxRate = isNaN(txRate) ? 0 : txRate;

                      const lineNetHt = price * quantity * (1 - discount / 100);
                      const lineTva = lineNetHt * (taxRate / 100);
                      vats[taxRate] = (vats[taxRate] || 0) + lineTva;
                    });
                    return Object.entries(vats).map(([rate, amount]) => (
                      <div key={rate} className="flex justify-between text-xs">
                        <span className="font-bold text-gray-600">
                          TVA {rate}%:
                        </span>
                        <span className="font-black text-blue-600">
                          {amount.toLocaleString()} {form.currency}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase text-blue-900">
                  Totaux
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></div>
                      <span className="font-bold text-gray-600">Total HT Net:</span>
                    </div>
                    <span className="font-black">{totalHt.toLocaleString()} {form.currency}</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full group-hover:scale-125 transition-transform"></div>
                      <span className="font-bold text-gray-600">Total TVA:</span>
                    </div>
                    <span className="font-black">{totalTva.toLocaleString()} {form.currency}</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full group-hover:scale-125 transition-transform"></div>
                      <span className="font-bold text-gray-600">Total Éco-Contribution:</span>
                    </div>
                    <span className="font-black text-amber-600">{totalEcoContrib.toLocaleString()} {form.currency}</span>
                  </div>
                  <div className="h-px bg-blue-200 my-2"></div>
                  <div className="flex justify-between p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full group-hover:scale-125 transition-transform"></div>
                      <span className="font-black text-blue-900">Total TTC:</span>
                    </div>
                    <span className="text-lg font-black text-blue-600">{ttc.toLocaleString()} {form.currency}</span>
                  </div>
                  
                  {/* Contrôle du taux d'acompte - uniquement pour les devis */}
                  {(form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') && (
                    <>
                      <div className="h-px bg-amber-200 my-2"></div>
                      <div className="space-y-2 p-2 border-2 border-dashed border-amber-300 rounded-lg hover:border-amber-500 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full group-hover:scale-125 transition-transform"></div>
                            <label className="text-[9px] font-black uppercase text-gray-600 tracking-widest ml-1">
                              Taux d'acompte
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="saveDepositPref"
                              checked={saveDepositPreference}
                              onChange={(e) => setSaveDepositPreference(e.target.checked)}
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              disabled={isLocked}
                            />
                            <label htmlFor="saveDepositPref" className="text-[8px] text-gray-500 cursor-pointer">
                              Par défaut
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={form.depositRate || 0}
                            onChange={(e) => {
                              const newRate = parseFloat(e.target.value) || 0;
                              setForm({ ...form, depositRate: newRate });
                              // Sauvegarder comme préférence si coché
                              if (saveDepositPreference) {
                                localStorage.setItem('defaultDepositRate', newRate.toString());
                              }
                            }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isLocked}
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={form.depositRate || 0}
                              onChange={(e) => {
                                const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                setForm({ ...form, depositRate: value });
                                // Sauvegarder comme préférence si coché
                                if (saveDepositPreference) {
                                  localStorage.setItem('defaultDepositRate', value.toString());
                                }
                              }}
                              className="w-16 bg-white border-2 border-gray-100 rounded-lg px-2 py-1 text-xs font-black text-center outline-none focus:border-blue-600"
                              disabled={isLocked}
                            />
                            <span className="text-xs font-black text-gray-600">%</span>
                          </div>
                        </div>
                      </div>
                      
                      {depositAmount > 0 && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-amber-600">Montant acompte:</span>
                            <span className="font-black text-amber-600">
                              {depositAmount.toLocaleString()} {form.currency}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-black text-green-600">Solde à payer:</span>
                            <span className="font-black text-green-600">
                              {remainingAmount.toLocaleString()} {form.currency}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const next = [...form.items];
                const defaultRate = vatRates.find((r) => r.defaultRate) ||
                  vatRates[0] || { rate: 20 };
                next[0].subItems.push({
                  id: Math.random().toString(),
                  description: "",
                  price: 0,
                  quantity: 1,
                  unit: "U",
                  taxRate: defaultRate.rate,
                });
                setForm({ ...form, items: next });
              }}
              className="w-full py-8 border-4 border-dashed border-blue-50 rounded-[2.5rem] text-xs font-black uppercase text-blue-400 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-4 group"
            >
              <div className="w-10 h-10 bg-white border-2 border-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              Ajouter une prestation
            </button>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-12 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900">
                3. Finalisation & Certification
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Configurez les conditions de paiement et scellez le document
                légalement.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Conditions de Paiement
                    </label>
                    <select
                      className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-6 py-5 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm appearance-none"
                      value={form.paymentTerms || "À réception"}
                      onChange={(e) =>
                        setForm({ ...form, paymentTerms: e.target.value })
                      }
                    >
                      <option value="À réception">À réception</option>
                      <option value="30 jours">30 jours</option>
                      <option value="30 jours fin de mois">
                        30 jours fin de mois
                      </option>
                      <option value="45 jours">45 jours</option>
                      <option value="45 jours fin de mois">
                        45 jours fin de mois
                      </option>
                      <option value="60 jours">60 jours</option>
                      <option value="60 jours fin de mois">
                        60 jours fin de mois
                      </option>
                      <option value="90 jours">90 jours</option>
                      <option value="À la commande">À la commande</option>
                      <option value="50% à la commande, 50% livraison">
                        50% à la commande, 50% livraison
                      </option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Mode de Règlement
                    </label>
                    <select
                      className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-6 py-5 font-bold outline-none focus:border-blue-600 focus:bg-white transition-all text-sm appearance-none"
                      value={form.paymentMethod || "Virement bancaire"}
                      onChange={(e) =>
                        setForm({ ...form, paymentMethod: e.target.value })
                      }
                    >
                      <option value="Virement bancaire">
                        Virement bancaire
                      </option>
                      <option value="Chèque">Chèque</option>
                      <option value="Espèces">Espèces</option>
                      <option value="Carte bancaire">Carte bancaire</option>
                      <option value="Prélèvement automatique">
                        Prélèvement automatique
                      </option>
                      <option value="PayPal">PayPal</option>
                      <option value="Stripe">Stripe</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Mentions Spéciales / Notes
                  </label>
                  <textarea
                    rows={6}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-[2rem] px-8 py-6 font-medium text-sm outline-none focus:border-blue-600 transition-all"
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Conditions de règlement, validité du devis, pénalités de retard..."
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-12 bg-gray-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
                          Base HT
                        </p>
                        <p className="text-xl font-bold">
                          {totalHt.toLocaleString()} {form.currency}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
                          TVA Totale
                        </p>
                        <p className="text-xl font-bold text-blue-400">
                          {totalTva.toLocaleString()} {form.currency}
                        </p>
                      </div>
                      {form.paymentTerms && (
                        <div className="flex justify-between items-end">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
                            Échéance
                          </p>
                          <p className="text-sm font-bold text-amber-400">
                            {form.paymentTerms}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Contrôle du taux d'acompte - uniquement pour les devis dans le mode wizard */}
                      {(form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') && (
                      <>
                        <div className="h-px bg-amber-400/50 my-4"></div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest ml-1">
                              Taux d'acompte
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="saveDepositPrefWizard"
                                checked={saveDepositPreference}
                                onChange={(e) => setSaveDepositPreference(e.target.checked)}
                                className="w-3 h-3 text-blue-400 border-gray-600 rounded focus:ring-blue-500"
                                disabled={isLocked}
                              />
                              <label htmlFor="saveDepositPrefWizard" className="text-[8px] text-gray-300 cursor-pointer">
                                Par défaut
                              </label>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={form.depositRate || 0}
                              onChange={(e) => {
                                const newRate = parseFloat(e.target.value) || 0;
                                setForm({ ...form, depositRate: newRate });
                                if (saveDepositPreference) {
                                  localStorage.setItem('defaultDepositRate', newRate.toString());
                                }
                              }}
                              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              disabled={isLocked}
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={form.depositRate || 0}
                                onChange={(e) => {
                                  const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                  setForm({ ...form, depositRate: value });
                                  if (saveDepositPreference) {
                                    localStorage.setItem('defaultDepositRate', value.toString());
                                  }
                                }}
                                className="w-16 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs font-black text-center outline-none focus:border-blue-600"
                                disabled={isLocked}
                              />
                              <span className="text-xs font-black text-gray-300">%</span>
                            </div>
                          </div>
                          
                          {depositAmount > 0 && (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-amber-400">Montant acompte:</span>
                                <span className="font-black text-amber-400">
                                  {depositAmount.toLocaleString()} {form.currency}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="font-black text-green-400">Solde à payer:</span>
                                <span className="font-black text-green-400">
                                  {remainingAmount.toLocaleString()} {form.currency}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between items-end border-t border-white/10 pt-8">
                      <p className="text-xs font-black uppercase tracking-widest text-blue-400">
                        {(form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') && depositAmount > 0 ? 'SOLDE À PAYER (TTC)' : 'NET À PAYER (TTC)'}
                      </p>
                      <p className="text-5xl font-black italic tracking-tighter">
                        {(form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') && depositAmount > 0 
                          ? remainingAmount.toLocaleString() 
                          : ttc.toLocaleString()
                        } {form.currency}
                      </p>
                    </div>
                    {(form.documentNature === 'Devis' || form.type === 'Devis' || form.type === 'Dev') && depositAmount > 0 && (
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        <span className="font-medium">Total TTC: {ttc.toLocaleString()} {form.currency}</span>
                        <span className="mx-2">|</span>
                        <span className="font-medium">Acompte: {depositAmount.toLocaleString()} {form.currency}</span>
                        <span className="mx-2">|</span>
                        <span className="font-medium">Reste dû: {remainingAmount.toLocaleString()} {form.currency}</span>
                      </div>
                    )}
                  </div>
                </div>

                {form.paymentMethod && (
                  <div className="p-6 bg-blue-50/30 rounded-[2rem] flex items-center gap-4 border border-blue-50">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">
                        Règlement
                      </p>
                      <p className="text-xs font-black text-blue-900 uppercase">
                        {form.paymentMethod}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {wizardStep === 4 && (
          <div className="space-y-12 animate-in slide-in-from-right-5 duration-300">
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic text-gray-900">
                4. Design & Identité Visuelle
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Choisissez un modèle qui correspond à l'image de votre
                entreprise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  id: "ExecutiveModern",
                  label: "Executive Modern",
                  desc: "Premium & Épuré",
                  color: "bg-slate-900 border-4 border-slate-200",
                },
                {
                  id: "BlueSky",
                  label: "Blue Sky",
                  desc: "Moderne & Aérien",
                  color: "bg-blue-600",
                },
                {
                  id: "DeepOnyx",
                  label: "Deep Onyx",
                  desc: "Prestige & Contraste",
                  color: "bg-gray-900",
                },
                {
                  id: "SwissMinimal",
                  label: "Swiss Minimal",
                  desc: "Pur & Bauhaus",
                  color: "bg-white border-2 border-gray-200",
                },
                {
                  id: "RoyalGold",
                  label: "Royal Gold",
                  desc: "Exclusif & Doré",
                  color: "bg-[#8b6b3e]",
                },
                {
                  id: "CorporatePro",
                  label: "Corporate Pro",
                  desc: "Sérieux & Affaires",
                  color: "bg-indigo-600",
                },
                {
                  id: "ClassicPrint",
                  label: "Classic Print",
                  desc: "Traditionnel & Papier",
                  color: "bg-slate-500",
                },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() =>
                    setForm({
                      ...form,
                      visualTemplate: tpl.id as VisualTemplate,
                    })
                  }
                  className={`flex flex-col items-center p-8 rounded-[3rem] transition-all border-4 ${form.visualTemplate === tpl.id ? "border-blue-600 scale-105 shadow-2xl ring-8 ring-blue-50 bg-white" : "border-transparent bg-white shadow-sm hover:border-gray-100"}`}
                >
                  <div
                    className={`w-20 h-28 rounded-xl ${tpl.color} mb-6 shadow-lg flex items-center justify-center text-white/20 font-black relative overflow-hidden`}
                  >
                    {form.sender.logoUrl ? (
                      <img
                        src={form.sender.logoUrl}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      "ABC"
                    )}
                  </div>
                  <h4 className="font-black uppercase tracking-tighter text-lg text-gray-800">
                    {tpl.label}
                  </h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 text-center opacity-60 leading-relaxed">
                    {tpl.desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
              <button
                onClick={handleSaveDraft}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
              >
                <Save className="w-5 h-5" /> Enregistrer Brouillon
              </button>
              <button
                onClick={handleValidate}
                className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
              >
                <ShieldCheck className="w-6 h-6" /> Certifier & Archiver
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-4">
        <button
          disabled={wizardStep === 1}
          onClick={() => setWizardStep((s) => s - 1)}
          className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${wizardStep === 1 ? "opacity-0 pointer-events-none" : "text-gray-400 hover:text-blue-600"}`}
        >
          <ChevronLeft className="w-6 h-6" /> Précédent
        </button>
        {wizardStep < 4 && (
          <button
            onClick={() => setWizardStep((s) => s + 1)}
            className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-blue-200 flex items-center gap-4 hover:scale-105 transition-all"
          >
            Étape Suivante <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );

  const renderDesignTab = () => (
    <div className="flex flex-col xl:flex-row gap-12 animate-in fade-in duration-500 max-w-[1800px] mx-auto min-h-[85vh]">
      {/* Sidebar Controls */}
      <div className="xl:w-[480px] space-y-10 glass p-10 rounded-[4rem] border-white/50 h-fit no-print shadow-2xl overflow-y-auto max-h-[120vh]">
        <div className="space-y-4">
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            Customiseur d'IdentitéVisuelle
          </h3>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mt-2">
            Design Engine v2.0
          </p>
        </div>

        {/* Template List */}
        <div className="space-y-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block ml-2">
            1. Structure du Document (Template)
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "ExecutiveModern", label: "Executive" },
              { id: "BlueSky", label: "Blue Sky" },
              { id: "DeepOnyx", label: "Deep Onyx" },
              { id: "RoyalGold", label: "Royal Gold" },
              { id: "CorporatePro", label: "Corporate" },
              { id: "ClassicPrint", label: "Classic" },
              { id: "SwissMinimal", label: "Swiss Min." },
            ].map((tpl) => (
              <button
                key={tpl.id}
                onClick={() =>
                  setForm({ ...form, visualTemplate: tpl.id as VisualTemplate })
                }
                className={`p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${form.visualTemplate === tpl.id ? "bg-blue-600 text-white border-blue-600 shadow-xl scale-105" : "bg-white text-gray-400 border-gray-100/50 hover:border-blue-200 hover:text-blue-500"}`}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Lab */}
        <div className="space-y-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block ml-2">
            2. Palette & Couleurs (Branding)
          </label>
          <div className="flex items-center gap-8 bg-white/50 p-8 rounded-[2.5rem] border-2 border-white shadow-inner">
            <div className="relative group">
              <input
                type="color"
                className="w-20 h-20 rounded-3xl cursor-pointer border-none bg-transparent"
                value={form.primaryColor || "#007AFF"}
                onChange={(e) =>
                  setForm({ ...form, primaryColor: e.target.value })
                }
              />
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none ring-4 ring-white shadow-md"
                style={{ backgroundColor: form.primaryColor }}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-gray-900 mb-2">
                Couleur Maîtresse
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  className="w-full bg-blue-50/50 border-none rounded-xl px-4 py-2 text-xs font-mono font-bold text-blue-600 outline-none"
                  value={form.primaryColor}
                  onChange={(e) =>
                    setForm({ ...form, primaryColor: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block ml-2">
            3. Typographie Executive (Fonts)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["Inter", "Roboto", "Outfit", "Serif", "Mono"].map((font) => (
              <button
                key={font}
                onClick={() => setForm({ ...form, fontFamily: font as any })}
                className={`p-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${form.fontFamily === font ? "bg-gray-900 text-white border-gray-900 shadow-xl" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"}`}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block ml-2">
            4. Identité Visuelle (Logo URL)
          </label>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Lien vers votre logo HD..."
                className="w-full bg-white border-2 border-blue-50 rounded-[2rem] px-8 py-5 font-bold text-xs outline-none focus:border-blue-600 transition-all shadow-sm pr-12"
                value={form.sender.logoUrl || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sender: { ...form.sender, logoUrl: e.target.value },
                  })
                }
              />
              <Plus className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    sender: {
                      ...form.sender,
                      logoUrl:
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                    },
                  })
                }
                className="text-[9px] font-black text-blue-500 uppercase tracking-widest underline decoration-2 underline-offset-4"
              >
                Logo Démo
              </button>
              <button
                onClick={() =>
                  setForm({ ...form, sender: { ...form.sender, logoUrl: "" } })
                }
                className="text-[9px] font-black text-red-400 uppercase tracking-widest underline decoration-2 underline-offset-4"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
        {/* Advanced Design Options */}
        <div className="space-y-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block ml-2">
            5. Options de Design Avancées
          </label>
          <div className="space-y-4 glass p-6 rounded-[2rem] border-white/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-600">
                Filigrane Certifié
              </span>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    visualOptions: {
                      ...form.visualOptions,
                      showWatermark: !form.visualOptions?.showWatermark,
                    },
                  })
                }
                className={`w-12 h-6 rounded-full transition-all relative ${form.visualOptions?.showWatermark ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.visualOptions?.showWatermark ? "right-1" : "left-1"}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-600">
                Sceau d'Authenticité
              </span>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    visualOptions: {
                      ...form.visualOptions,
                      showSeal: !form.visualOptions?.showSeal,
                    },
                  })
                }
                className={`w-12 h-6 rounded-full transition-all relative ${form.visualOptions?.showSeal ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.visualOptions?.showSeal ? "right-1" : "left-1"}`}
                />
              </button>
            </div>
            <div className="pt-4 space-y-3">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Taille du Logo
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      setForm({
                        ...form,
                        visualOptions: {
                          ...form.visualOptions,
                          logoSize: size,
                        },
                      })
                    }
                    className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all border-2 ${form.visualOptions?.logoSize === size ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-50 hover:border-blue-100"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <span className="text-[10px] font-black uppercase text-gray-400">
                Style du Tableau
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["minimal", "striped", "bordered"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() =>
                      setForm({
                        ...form,
                        visualOptions: {
                          ...form.visualOptions,
                          tableStyle: style,
                        },
                      })
                    }
                    className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all border-2 ${form.visualOptions?.tableStyle === style ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-50 hover:border-blue-100"}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 flex flex-col gap-5">
          <button
            onClick={() => setViewMode("standard")}
            className="w-full py-7 bg-gray-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Appliquer les
            Changements
          </button>
          <button
            onClick={() => setViewMode("wizard")}
            className="w-full py-6 bg-blue-50 text-blue-600 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-white transition-all"
          >
            Retourner à l'Assistant de Saisie
          </button>
        </div>
      </div>

      {/* Real-time Preview Area */}
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between px-10 no-print">
          <div>
            <p className="text-[12px] font-black uppercase text-gray-400 tracking-[0.5em]">
              Aperçu du Document
            </p>
            <h4 className="text-xl font-black text-gray-900 mt-1 uppercase tracking-tighter">
              Votre identité sur papier numérique
            </h4>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/50 p-1.5 rounded-2xl border border-white">
              <button
                onClick={() => setForm({ ...form, language: "fr" })}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${form.language === "fr" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400"}`}
              >
                FR
              </button>
              <button
                onClick={() => setForm({ ...form, language: "en" })}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${form.language === "en" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400"}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <div className="relative group perspective-1000">
          <div className="absolute inset-x-0 -bottom-20 h-40 bg-blue-600/5 blur-3xl rounded-full -z-10" />
          <div className="shadow-[0_60px_150px_rgba(0,0,0,0.18)] rounded-[4rem] overflow-hidden border-8 border-white/50 shadow-blue-900/5 transition-all duration-700 bg-white min-h-[1000px]">
            <InvoicePreview invoice={form} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-8">
          <button
            onClick={onCancel}
            className="p-5 glass rounded-[2rem] text-gray-400 hover:text-blue-600 transition-all hover:scale-110"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black tracking-tighter uppercase italic text-gray-900">
                {form.invoiceNumber}
              </h1>
              {!isLocked && (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-2xl shadow-inner border border-blue-100">
                  {autoSaveStatus === "saving" ? (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  ) : (
                    <SaveAll className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">
                    {autoSaveStatus === "saving" ? "Sync..." : "Auto-Save"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setIsPreview(true);
              setTimeout(() => window.print(), 300);
            }}
            className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          {!isLocked && (
            <>
              <button
                onClick={() => setViewMode("design")}
                className="px-6 py-4 bg-white border-2 border-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
              >
                <Palette className="w-4 h-4" /> Visuel
              </button>
              <button
                onClick={() =>
                  setViewMode(viewMode === "wizard" ? "standard" : "wizard")
                }
                className="px-6 py-4 bg-white border-2 border-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm"
              >
                {viewMode === "wizard" ? (
                  <LayoutList className="w-4 h-4" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}{" "}
                {viewMode === "wizard" ? "Standard" : "Assistant"}
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </>
          )}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
          >
            {isPreview ? "Éditeur" : "Aperçu"}
          </button>
        </div>
      </header>

      {isPreview ? (
        <InvoicePreview invoice={form} autoOpenEmail={justValidated} />
      ) : viewMode === "design" ? (
        renderDesignTab()
      ) : viewMode === "wizard" ? (
        renderWizardMode()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 max-w-[1600px] mx-auto">
          <div className="lg:col-span-3 space-y-10">
            {/* Document Info Section */}
            <div
              className={`glass p-8 rounded-[3rem] border-white/50 transition-opacity duration-500 ${isLocked ? "opacity-70 pointer-events-none" : ""}`}
            >
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-800 italic flex items-center gap-4 mb-6">
                <Settings className="w-5 h-5" /> Informations Document
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Type
                  </label>
                  <select
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as any })
                    }
                  >
                    <option value="Standard">Facture</option>
                    <option value="Devis">Devis</option>
                    <option value="Proforma">Facture Proforma</option>
                    <option value="Livraison">Bon de Livraison</option>
                    <option value="Avoir">Avoir</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    N° Document
                  </label>
                  <input
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-black text-sm outline-none focus:border-blue-500"
                    value={form.invoiceNumber}
                    onChange={(e) =>
                      setForm({ ...form, invoiceNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Statut
                  </label>
                  <select
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as any })
                    }
                  >
                    <option value="Brouillon">Brouillon</option>
                    <option value="En cours">En cours</option>
                    <option value="Payée">Payée</option>
                    <option value="Non payée">Non payée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Date Émission
                  </label>
                  <input
                    disabled={isLocked}
                    type="date"
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Date Échéance
                  </label>
                  <input
                    disabled={isLocked}
                    type="date"
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* TEST ÉCHÉANCIER - INVOICECREATOR */}
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl">
                <h4 className="text-sm font-black uppercase text-red-700 mb-4">TEST ÉCHÉANCIER</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong>form.firstPayment:</strong> {form.firstPayment}
                  </div>
                  <div>
                    <strong>form.secondPayment:</strong> {form.secondPayment}
                  </div>
                  <div>
                    <strong>form.deliveryPayment:</strong> {form.deliveryPayment}
                  </div>
                  <div>
                    <strong>firstPaymentAmount:</strong> {firstPaymentAmount}
                  </div>
                  <div>
                    <strong>secondPaymentAmount:</strong> {secondPaymentAmount}
                  </div>
                  <div>
                    <strong>deliveryPaymentAmount:</strong> {deliveryPaymentAmount}
                  </div>
                </div>
              </div>

            {/* Variables Proforma - uniquement pour les factures proforma */}
            {form.type === 'Proforma' && (
              <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-500 rounded-xl">
                <h4 className="text-sm font-black uppercase text-blue-700 mb-4">Variables Proforma</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Montant Conversion (10%)
                    </label>
                    <input
                      type="number"
                      disabled={isLocked}
                      className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-600"
                      value={form.conversionAmount || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setForm({ ...form, conversionAmount: value });
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Acompte Reçu (20%)
                    </label>
                    <input
                      type="number"
                      disabled={isLocked}
                      className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-600"
                      value={form.depositReceived || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setForm({ ...form, depositReceived: value });
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Solde Dû
                    </label>
                    <input
                      type="number"
                      disabled={isLocked}
                      className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-600"
                      value={form.balanceDue || 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setForm({ ...form, balanceDue: value });
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    Total TTC: {ttc.toLocaleString()} {form.currency} | 
                    Conversion: {conversionAmount.toLocaleString()} {form.currency} | 
                    Acompte: {depositReceived.toLocaleString()} {form.currency} | 
                    Solde: {balanceDue.toLocaleString()} {form.currency}
                  </p>
                </div>
              </div>
            )}

            {/* Client Info Section */}
            <div
              className={`glass p-8 rounded-[3rem] border-white/50 space-y-6 transition-opacity duration-500 ${isLocked ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-800 italic flex items-center gap-4">
                  <User className="w-5 h-5" /> Infos Client / Destinataire
                </h3>
                <div className="flex items-center gap-3">
                  <select
                    disabled={isLocked}
                    className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 font-bold text-xs outline-none focus:border-blue-500"
                    onChange={(e) => {
                      const c = clients.find((cl) => cl.id === e.target.value);
                      if (c) setForm({ ...form, client: { ...c } });
                    }}
                  >
                    <option value="">-- Sélectionner client --</option>
                    {clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name}
                      </option>
                    ))}
                  </select>
                  {!isLocked && (
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          client: {
                            name: "",
                            email: "",
                            address: "",
                            phone: "",
                            ice: "",
                            ifNum: "",
                            rc: "",
                          },
                        })
                      }
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Effacer le client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Raison Sociale / Nom *
                  </label>
                  <input
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-black text-sm outline-none focus:border-blue-500"
                    value={form.client.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client: { ...form.client, name: e.target.value },
                      })
                    }
                    placeholder="ACME Inc."
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Email
                  </label>
                  <input
                    disabled={isLocked}
                    type="email"
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-4 font-bold text-sm outline-none focus:border-blue-500"
                    value={form.client.email || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client: { ...form.client, email: e.target.value },
                      })
                    }
                    placeholder="contact@client.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    ICE
                  </label>
                  <input
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:border-blue-500"
                    value={form.client.ice || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client: { ...form.client, ice: e.target.value },
                      })
                    }
                    placeholder="001234..."
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    I.F
                  </label>
                  <input
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:border-blue-500"
                    value={form.client.ifNum || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client: { ...form.client, ifNum: e.target.value },
                      })
                    }
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    R.C
                  </label>
                  <input
                    disabled={isLocked}
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:border-blue-500"
                    value={form.client.rc || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client: { ...form.client, rc: e.target.value },
                      })
                    }
                    placeholder="123456"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Téléphone
                  </label>
                  <input
                    disabled={isLocked}
                    type="tel"
                    className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:border-blue-500"
                    value={form.client.phone || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client: { ...form.client, phone: e.target.value },
                      })
                    }
                    placeholder="+212..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Adresse de Facturation *
                </label>
                <textarea
                  disabled={isLocked}
                  rows={2}
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                  value={form.client.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      client: { ...form.client, address: e.target.value },
                    })
                  }
                  placeholder="Saisir l'adresse légale..."
                />
              </div>
            </div>

            {form.items.map((item, iIdx) => (
              <div
                key={item.id}
                className={`glass rounded-[3rem] overflow-hidden border-blue-100/50 shadow-2xl ${isLocked ? "opacity-70 pointer-events-none" : ""}`}
              >
                <div className="bg-blue-600/5 p-8 flex justify-between items-center border-b border-blue-50">
                  <div className="flex items-center gap-4">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <input
                      disabled={isLocked}
                      className="bg-transparent font-black uppercase text-blue-900 outline-none text-lg tracking-tight"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...form.items];
                        next[iIdx].title = e.target.value;
                        setForm({ ...form, items: next });
                      }}
                    />
                  </div>
                </div>
                <div className="p-10 space-y-8">
                  {item.subItems.map((sub, sIdx) => (
                    <div
                      key={sub.id}
                      className="p-6 bg-gray-50/30 rounded-3xl border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:border-blue-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4 items-end">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Code
                          </label>
                          <input
                            disabled={isLocked}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            value={sub.code || ""}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].code = e.target.value;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-8 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Désignation
                          </label>
                          <textarea
                            disabled={isLocked}
                            rows={1}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            value={sub.description}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].description =
                                e.target.value;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Unité
                          </label>
                          <input
                            disabled={isLocked}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            value={sub.unit}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].unit = e.target.value;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Qté
                          </label>
                          <input
                            disabled={isLocked}
                            type="number"
                            className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-black text-center outline-none"
                            value={sub.quantity}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].quantity =
                                parseFloat(e.target.value) || 0;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            P.U HT
                          </label>
                          <input
                            disabled={isLocked}
                            type="number"
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs font-black text-right outline-none"
                            value={sub.price}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].price =
                                parseFloat(e.target.value) || 0;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            % Rem.
                          </label>
                          <input
                            disabled={isLocked}
                            type="number"
                            className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-black text-center outline-none"
                            value={sub.discount || 0}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].discount =
                                parseFloat(e.target.value) || 0;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Net HT
                          </label>
                          <div className="w-full bg-blue-50/50 rounded-xl px-4 py-2 text-xs font-black text-blue-600 text-right">
                            {(
                              sub.price *
                              sub.quantity *
                              (1 - (sub.discount || 0) / 100)
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            TVA
                          </label>
                          <select
                            disabled={isLocked}
                            className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-xs font-black outline-none"
                            value={String(sub.taxRate ?? 20)}
                            onChange={(e) => {
                              const newRate = parseFloat(e.target.value);
                              const nextItems = form.items.map((item, i) => {
                                if (i === iIdx) {
                                  return {
                                    ...item,
                                    subItems: item.subItems.map((s, j) =>
                                      j === sIdx
                                        ? { ...s, taxRate: newRate }
                                        : s,
                                    ),
                                  };
                                }
                                return item;
                              });
                              setForm({ ...form, items: nextItems });
                            }}
                          >
                            {Array.from(new Set(vatRates.map((r) => r.rate)))
                              .sort((a: any, b: any) => b - a)
                              .map((rate) => (
                                <option key={rate} value={String(rate)}>
                                  {rate}%
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 text-right block italic">
                            TTC avec Éco-Contrib
                          </label>
                          <div className="w-full bg-emerald-50 rounded-xl px-4 py-2 text-sm font-black text-emerald-600 text-right">
                            {(
                              sub.price *
                              sub.quantity *
                              (1 - (sub.discount || 0) / 100) *
                              (1 + sub.taxRate / 100) +
                              (sub.ecoContributionUnitTtc || 0) * sub.quantity
                            ).toLocaleString()}
                          </div>
                        </div>

                        {/* Eco-contrib settings */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[7px] font-black text-gray-300 uppercase italic">
                            Code Éco-Part.
                          </label>
                          <input
                            disabled={isLocked}
                            className="w-full bg-transparent border-b border-gray-100 text-[10px] outline-none"
                            placeholder="Code..."
                            value={sub.ecoContributionCode || ""}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].ecoContributionCode =
                                e.target.value;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[7px] font-black text-gray-300 uppercase italic">
                            U. Eco-Contrib TTC
                          </label>
                          <input
                            disabled={isLocked}
                            type="number"
                            className="w-full bg-transparent border-b border-gray-100 text-[10px] outline-none"
                            value={sub.ecoContributionUnitTtc || 0}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[iIdx].subItems[sIdx].ecoContributionUnitTtc =
                                parseFloat(e.target.value) || 0;
                              setForm({ ...form, items: next });
                            }}
                          />
                        </div>
                        <div className="md:col-span-3">
                          {!isLocked && (
                            <button
                              onClick={() => {
                                const next = [...form.items];
                                next[iIdx].subItems = next[
                                  iIdx
                                ].subItems.filter((s) => s.id !== sub.id);
                                if (next[iIdx].subItems.length === 0) {
                                  next[iIdx].subItems.push({
                                    id: Math.random().toString(),
                                    description: "",
                                    price: 0,
                                    quantity: 1,
                                    unit: "U",
                                    taxRate: 20,
                                  });
                                }
                                setForm({ ...form, items: next });
                              }}
                              className="p-2 text-red-200 hover:text-red-500 float-right"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!isLocked && (
                    <button
                      onClick={() => {
                        const next = [...form.items];
                        next[iIdx].subItems.push({
                          id: Math.random().toString(),
                          description: "",
                          price: 0,
                          quantity: 1,
                          unit: "U",
                          taxRate:
                            activeCompany.defaultVatRates &&
                              activeCompany.defaultVatRates.length > 0
                              ? activeCompany.defaultVatRates[0]
                              : 20,
                        });
                        setForm({ ...form, items: next });
                      }}
                      className="w-full py-6 border-2 border-dashed border-blue-100 rounded-[2rem] text-[10px] font-black uppercase text-blue-300 hover:border-blue-200 hover:bg-blue-50/20 transition-all flex items-center justify-center gap-3"
                    >
                      <Plus className="w-4 h-4" /> Ajouter une ligne
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-10 no-print">
            <div className="glass p-10 rounded-[4rem] sticky top-10 border-blue-100 shadow-2xl flex flex-col gap-10">
              <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-3">
                  Total à régler (TTC)
                </p>
                <h2 className="text-5xl font-black italic tracking-tighter leading-none">
                  {ttc.toLocaleString()}{" "}
                  <span className="text-lg opacity-30 not-italic">
                    {form.currency}
                  </span>
                </h2>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full translate-x-10 -translate-y-10" />
              </div>
              {!isLocked && (
                <>
                  <button
                    onClick={handleSaveDraft}
                    className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save className="w-5 h-5" /> Enregistrer
                  </button>
                  <button
                    onClick={handleValidate}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Check className="w-5 h-5" /> Valider Facture
                  </button>
                </>
              )}
              {form.sender.logoUrl && (
                <div className="p-6 bg-blue-50/20 rounded-[2.5rem] flex items-center gap-5 border border-blue-50/50">
                  <img
                    src={form.sender.logoUrl}
                    className="w-16 h-16 object-contain grayscale opacity-50"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">
                      Émetteur
                    </p>
                    <p className="text-xs font-black text-gray-800 uppercase truncate tracking-tight">
                      {form.sender.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCreator;
