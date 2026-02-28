export type InvoiceType =
  | "Standard"
  | "Devis"
  | "Proforma"
  | "Acompte"
  | "Finale"
  | "Avoir"
  | "Recurrente"
  | "Livraison"
  | "Batiment"
  | "Dev";

export type InvoiceStatus =
  | "Brouillon"
  | "En cours"
  | "Payée"
  | "Non payée"
  | "Annulée"
  | "Envoye"
  | "Accepte"
  | "Refuse"
  | "Expire"
  | "Valide"
  | "PartiellementPaye"
  | "EnRetard";

export type PaymentMethod =
  | "Virement"
  | "Carte"
  | "Especes"
  | "Cheque"
  | "Prelevement"
  | "LCR";

export type VisualTemplate =
  | "BlueSky"
  | "DeepOnyx"
  | "SwissMinimal"
  | "RoyalGold"
  | "CorporatePro"
  | "ClassicPrint"
  | "ExecutiveModern";

export interface AccountingAccount {
  id: string;
  code: string;
  label: string;
  type: "Treasury" | "Vat" | "Revenue" | "Expense";
}

export interface RelanceEntry {
  id: string;
  date: string;
  method: "Email" | "Telephone" | "Courrier";
  notes?: string;
}

export type CompanyType = "Standard" | "Batiment" | "Services" | "Commerce" | "Transport" | "Dev";

export interface Company {
  id: string;
  userId?: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  country?: "maroc" | "france";
  ice?: string;
  ifNum?: string;
  rc?: string;
  taxePro?: string;
  siren?: string;
  rcs?: string;
  naf?: string;
  tvaIntra?: string;
  bankAccount?: string;
  bankName?: string;
  swiftCode?: string;
  logoUrl?: string;
  currency: string;
  postalCode?: string;
  city?: string;
  defaultVatRates: number[];
  numberingFormat: string;
  primaryColor: string;
  accountingPlan: AccountingAccount[];
  active?: boolean;
  companyType?: CompanyType;
}

export type ArticleType = "product" | "service";

export interface Article {
  id: string;
  companyId: string;
  code: string;
  description: string;
  priceHt: number;
  defaultVat: number;
  unit: string;
  category?: string;
  type: ArticleType;
  stockQuantity?: number;
  stockMin?: number;
  trackStock: boolean;
}

export interface RecurringSchedule {
  id: string;
  companyId: string;
  invoiceTemplateId: string;
  clientId: string;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  nextRunDate: string;
  endDate?: string;
  isActive: boolean;
  lastRunDate?: string;
  createdAt: string;
}

export interface ReminderSettings {
  id: string;
  companyId: string;
  enableAutoReminder: boolean;
  reminderDays: number[];
  reminderEmailSubject: string;
  reminderEmailBody: string;
  enableDueDateNotification: boolean;
  dueDateDaysBefore: number;
  enableMonthlyReport: boolean;
  monthlyReportDay: number;
  monthlyReportEmail: string;
}

export interface ScheduledEmail {
  id: string;
  companyId: string;
  invoiceId?: string;
  type: "reminder" | "due_date" | "monthly_report";
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledDate: string;
  sentAt?: string;
  status: "pending" | "sent" | "failed";
  errorMessage?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  accountId?: string;
}

export interface InvoiceSubItem {
  id: string;
  code?: string;
  description: string;
  quantity: number;
  price: number;
  unit: string;
  discount?: number;
  taxRate: number;
  ecoContributionCode?: string;
  ecoContributionUnitTtc?: number;
  isSpacer?: boolean;
}

export interface InvoiceItem {
  id: string;
  title: string;
  subItems: InvoiceSubItem[];
}

export type ClientCountry = "maroc" | "france";

export interface ContactInfo {
  id?: string;
  companyId?: string;
  code?: string;
  name: string;
  email: string;
  address: string;
  postalCode?: string;
  city?: string;
  phone: string;
  mobile?: string;
  fax?: string;
  website?: string;
  // Morocco-specific fields
  ice?: string;
  ifNum?: string;
  rc?: string;
  taxePro?: string;
  cnss?: string;
  // France-specific fields
  siren?: string;
  siret?: string;
  naf?: string;
  tvaIntra?: string;
  // Common fields
  logoUrl?: string;
  civility?: string;
  category?: string;
  country?: ClientCountry;
  reglementMode?: PaymentMethod;
  echeance?: string;
  remiseDefault?: number;
  paymentDelay?: number;
  accountingAccount?: string;
  encoursAutorise?: number;
  soldeInitial?: number;
  isBlocked?: boolean;
  bankAccount?: string;
  bankName?: string;
  swiftCode?: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  type: InvoiceType;
  documentNature?: 'Facture' | 'Devis';
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  sender: ContactInfo;
  client: ContactInfo;
  items: InvoiceItem[];
  payments: Payment[];
  auditTrail: any[];
  relanceHistory?: RelanceEntry[];
  discount: number;
  notes: string;
  currency: string;
  language: "fr" | "en";
  primaryColor: string;
  fontFamily?: "Inter" | "Roboto" | "Outfit" | "Serif" | "Mono";
  visualOptions?: {
    showWatermark?: boolean;
    showSeal?: boolean;
    compactMode?: boolean;
    borderRadius?: "none" | "small" | "massive";
    tableStyle?: "minimal" | "striped" | "bordered";
    logoSize?: "small" | "medium" | "large";
  };
  visualTemplate: VisualTemplate;
  subject?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  convertedFromId?: string;
  validatedAt?: string;
  legalArchiveUntil?: string;
  autoSendEmail?: boolean;
  emailSubject?: string;
  emailBody?: string;
  customFile?: { name: string; base64: string } | null;
}

export interface InvoiceTemplate {
  id: string;
  companyId: string;
  name: string;
  subject?: string;
  notes?: string;
  currency?: string;
  items?: InvoiceItem[];
}

export interface Shortcut {
  id: string;
  actionId: string;
  label: string;
  key: string;
  order: number;
  enabled: boolean;
}

export interface AuditEntry {
  id: string;
  companyId: string | null;
  userId: string;
  timestamp: string;
  action: string;
  entity: string;
  details: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}
