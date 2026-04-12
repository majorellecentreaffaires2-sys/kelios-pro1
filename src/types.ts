export type InvoiceType =
  | "Standard"
  | "Devis"
  | "Proforma"
  | "Acompte"
  | "Finale"
  | "Avoir"
  | "Recurrente"
  | "Livraison"
  | "DevisAvecAcompte"
  | "Dev"
  | "BonCommande";

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

export type DocumentType = "Facture" | "Devis" | "Proforma" | "Avoir" | "BonCommande" | "Acompte";

// Types pour la gestion des stocks
export interface Product {
  id: string;
  reference: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  taxRate: number;
  supplier?: string;
  barcode?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: "ENTREE" | "SORTIE" | "TRANSFERT";
  quantity: number;
  reason: string;
  documentId?: string;
  fromLocation?: string;
  toLocation?: string;
  createdAt: string;
  createdBy: string;
}

export interface StockLocation {
  id: string;
  name: string;
  address: string;
  type: "MAGASIN" | "ENTREPOT" | "BOUTIQUE";
  manager: string;
  products: StockLocationProduct[];
}

export interface StockLocationProduct {
  productId: string;
  quantity: number;
  minQuantity: number;
}

// Types pour la gestion des commandes
export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  status: "BROUILLON" | "CONFIRMEE" | "EN_PREPARATION" | "EXPEDIEE" | "LIVREE" | "ANNULEE";
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  deliveryDate: string;
  trackingNumber?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
}

// Types pour la gestion des ventes
export interface Sale {
  id: string;
  saleNumber: string;
  clientId: string;
  invoiceId?: string;
  items: SaleItem[];
  totalAmount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "EN_ATTENTE" | "PAYEE" | "PARTIELLEMENT_PAYEE";
  commissionAmount?: number;
  salespersonId: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
}

// Types pour la gestion des clients
export interface Customer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  ice: string;
  ifNum: string;
  rc: string;
  type: "PARTICULIER" | "PROFESSIONNEL";
  category: string;
  creditLimit: number;
  balance: number;
  paymentTerms: number;
  salespersonId?: string;
  notes: string;
  documents: CustomerDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDocument {
  id: string;
  type: DocumentType;
  documentId: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
}

// Types pour la gestion des fournisseurs
export interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  ice: string;
  ifNum: string;
  rc: string;
  category: string;
  paymentTerms: number;
  rating: number;
  products: string[];
  documents: SupplierDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDocument {
  id: string;
  type: "FACTURE" | "DEVIS" | "COMMANDE";
  documentId: string;
  amount: number;
  date: string;
  status: "EN_ATTENTE" | "PAYEE" | "ANNULEE";
}

// Types pour la gestion des projets
export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  clientId: string;
  status: "PLANIFIE" | "EN_COURS" | "TERMINE" | "ANNULE" | "EN_PAUSE";
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  progress: number;
  manager: string;
  team: ProjectMember[];
  tasks: ProjectTask[];
  documents: ProjectDocument[];
  invoices: ProjectInvoice[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  email: string;
  hourlyRate: number;
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  status: "A_FAIRE" | "EN_COURS" | "TERMINE" | "ANNULE";
  assignee: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ProjectInvoice {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
}

// Types pour la gestion des dépenses
export interface Expense {
  id: string;
  reference: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  supplierId?: string;
  projectId?: string;
  paymentMethod: PaymentMethod;
  status: "EN_ATTENTE" | "VALIDEE" | "PAYEE" | "REFUSEE";
  receipt?: string;
  notes: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | "FOURNITURES"
  | "SERVICES"
  | "LOYER"
  | "ENERGIE"
  | "TELECOMMUNICATIONS"
  | "MARKETING"
  | "TRANSPORT"
  | "MAINTENANCE"
  | "ASSURANCE"
  | "TAXES"
  | "AUTRE";

// Types pour le suivi des paiements
export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  accountId?: string;
  type: "CLIENT" | "FOURNISSEUR";
  entityId: string;
  status: "EN_ATTENTE" | "VALIDE" | "ANNULE";
  bankReference?: string;
  checkNumber?: string;
  cardReference?: string;
  documentId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour le reporting
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  period: ReportPeriod;
  data: ReportData;
  generatedAt: string;
  generatedBy: string;
}

export type ReportType =
  | "VENTES"
  | "ACHATS"
  | "STOCK"
  | "CLIENTS"
  | "FOURNISSEURS"
  | "PROJETS"
  | "DEPENSES"
  | "CAISSE"
  | "BILAN"
  | "COMPTE_RESULTAT";

export type ReportPeriod = "JOURNALIER" | "HEBDOMADAIRE" | "MENSUEL" | "TRIMESTRIEL" | "ANNUEL" | "PERSONNALISE";

export interface ReportData {
  total: number;
  details: any[];
  charts: ChartData[];
}

export interface ChartData {
  type: "BAR" | "LINE" | "PIE" | "AREA";
  title: string;
  data: any[];
  labels: string[];
}

// Types pour l'audit
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// Types pour les abonnements
export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: "ACTIVE" | "INACTIVE" | "CANCELLED" | "EXPIRED";
  startDate: string;
  endDate: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  autoRenew: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan =
  | "GRATUIT"
  | "STARTER"
  | "PROFESSIONNEL"
  | "ENTREPRISE"
  | "PERSONNALISE";

export interface SubscriptionFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

// Types pour les paiements d'abonnement
export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  method: PaymentMethod;
  status: "EN_ATTENTE" | "VALIDE" | "ANNULE";
  date: string;
  invoiceId: string;
  receiptUrl?: string;
}

// Types existants conservés et fusionnés
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

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
  country?: "maroc" | "france";
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

export type CompanyType = "Standard" | "DevisAvecAcompte" | "Services" | "Commerce" | "Transport" | "Dev";

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

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  type: InvoiceType;
  documentNature: 'Facture' | 'Devis';
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
  depositRate?: number; // Taux d'acompte pour les devis (0-100)
  firstPayment?: number; // Premier versement en pourcentage
  secondPayment?: number; // Deuxième versement en pourcentage
  deliveryPayment?: number; // Solde à la livraison en pourcentage
  // Variables spécifiques aux factures proforma
  conversionAmount?: number; // Montant convers
  balanceDue?: number; // Solde à payer
  depositReceived?: number; // Acompte reçu
  // Variables spécifiques aux factures d'acompte
  originalInvoiceNumber?: string; // Numéro de la facture originale
  acompteAmount?: number; // Montant de l'acompte
  acomptePercentage?: number; // Pourcentage de l'acompte
  remainingAmount?: number; // Reste à payer
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

// Types pour le système d'upgrade
export interface UpgradePlan {
  name: string;
  price: string;
  period: string;
  features: string[];
}

export interface UpgradePayment {
  plan: string;
  method: "Virement" | "Carte" | "Especes" | "Cheque";
  amount: number;
}
