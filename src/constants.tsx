import React from "react";
import {
  Layout,
  Plus,
  History,
  Settings,
  HelpCircle,
  FileText,
  ClipboardList,
  Banknote,
  RotateCcw,
  Percent,
  Calculator,
} from "lucide-react";

export const APP_NAME = "Kelios SaaS ERP";

export const INVOICE_TYPES = [
  {
    id: "Standard",
    label: "Facture Standard",
    icon: <FileText className="w-4 h-4" />,
    color: "text-blue-600",
  },
  {
    id: "Devis",
    label: "Devis / Quote",
    icon: <ClipboardList className="w-4 h-4" />,
    color: "text-emerald-600",
  },
  {
    id: "Proforma",
    label: "Proforma",
    icon: <Calculator className="w-4 h-4" />,
    color: "text-purple-600",
  },
  {
    id: "Acompte",
    label: "Facture d'Acompte",
    icon: <Percent className="w-4 h-4" />,
    color: "text-orange-600",
  },
  {
    id: "Avoir",
    label: "Avoir (Credit Note)",
    icon: <RotateCcw className="w-4 h-4" />,
    color: "text-red-600",
  },
  {
    id: "DevisAvecAcompte",
    label: "BATIMENT",
    icon: <Calculator className="w-4 h-4" />,
    color: "text-blue-500",
  },
];

export const shortcuts: any[] = [];

export const PAYMENT_METHODS = ["Virement", "Carte", "Especes", "Cheque"];

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: <Layout className="w-5 h-5" /> },
  { id: "create", label: "Émission", icon: <Plus className="w-5 h-5" /> },
  {
    id: "history",
    label: "Journal Comptable",
    icon: <History className="w-5 h-5" />,
  },
  {
    id: "payments",
    label: "Paiements",
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Configuration",
    icon: <Settings className="w-5 h-5" />,
  },
];

export const UNITS = [
  "U",
  "Ens",
  "Forfait",
  "m²",
  "ml",
  "m³",
  "Kg",
  "Ton",
  "H",
  "Lot",
];

export const BRAND_COLORS = [
  { name: "Kelios Blue", value: "#007AFF" },
  { name: "Deep Onyx", value: "#1a1a1a" },
  { name: "Royal Gold", value: "#b69329" },
  { name: "Forest", value: "#065f46" },
];

export const CURRENCIES = [
  { code: "MAD", symbol: "DH" },
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
];
