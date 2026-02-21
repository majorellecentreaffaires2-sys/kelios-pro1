import { Invoice, Company, ContactInfo, InvoiceTemplate, Shortcut, AuditEntry, Article } from './types';

const API_BASE = '/api';

const getAuthToken = () => localStorage.getItem('mj_token');

const request = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, options);

  if (res.status === 401) {
    localStorage.removeItem('mj_token');
    window.location.reload();
    throw new Error("Non autorisé");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errorMessage = error.message || error.error || `Erreur serveur : ${res.status}`;
    throw new Error(errorMessage);
  }

  return await res.json();
};

export const externalApi = {
  getCountries: async () => {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags,idd');
    const data = await res.json();
    return data.sort((a: any, b: any) => a.name.common.localeCompare(b.name.common));
  },
  getExchangeRates: async (base: string = 'EUR') => {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
    return await res.json();
  }
};

export const api = {
  login: (credentials: any) => request<any>(`${API_BASE}/login`, 'POST', credentials),
  verifySession: () => request<any>(`${API_BASE}/me`, 'GET'),
  getUsers: () => request<any[]>(`${API_BASE}/users`, 'GET'),
  updateUser: (id: string, updates: any) => request<any>(`${API_BASE}/users/${id}`, 'PUT', updates),
  deleteUser: (id: string) => request<void>(`${API_BASE}/users/${id}`, 'DELETE'),

  getLogs: (companyId?: string) => request<AuditEntry[]>(`${API_BASE}/logs${companyId ? `?companyId=${companyId}` : ''}`, 'GET'),

  getCompanies: () => request<Company[]>(`${API_BASE}/companies`, 'GET'),
  createCompany: (company: Company) => request<Company>(`${API_BASE}/companies`, 'POST', company),
  updateCompany: (id: string, updates: Partial<Company>) => request<Company>(`${API_BASE}/companies/${id}`, 'PUT', updates),

  getArticles: (companyId: string) => request<Article[]>(`${API_BASE}/articles?companyId=${companyId}`, 'GET'),
  createArticle: (article: Article) => request<Article>(`${API_BASE}/articles`, 'POST', article),
  updateArticle: (id: string, updates: Partial<Article>) => request<Article>(`${API_BASE}/articles/${id}`, 'PUT', updates),
  deleteArticle: (id: string) => request<void>(`${API_BASE}/articles/${id}`, 'DELETE'),

  getVatRates: (companyId: string) => request<any[]>(`${API_BASE}/vat-rates?companyId=${companyId}`, 'GET'),
  createVatRate: (vatRate: any) => request<any>(`${API_BASE}/vat-rates`, 'POST', vatRate),
  updateVatRate: (id: string, updates: any) => request<any>(`${API_BASE}/vat-rates/${id}`, 'PUT', updates),
  deleteVatRate: (id: string) => request<void>(`${API_BASE}/vat-rates/${id}`, 'DELETE'),

  getAllClients: () => request<ContactInfo[]>(`${API_BASE}/clients/all`, 'GET'),
  getClients: (companyId: string) => request<ContactInfo[]>(`${API_BASE}/clients?companyId=${companyId}`, 'GET'),
  createClient: (client: ContactInfo) => request<ContactInfo>(`${API_BASE}/clients`, 'POST', client),
  updateClient: (id: string, updates: Partial<ContactInfo>) => request<ContactInfo>(`${API_BASE}/clients/${id}`, 'PUT', updates),
  deleteClient: (id: string) => request<void>(`${API_BASE}/clients/${id}`, 'DELETE'),

  getTemplates: (companyId: string) => request<InvoiceTemplate[]>(`${API_BASE}/templates?companyId=${companyId}`, 'GET'),
  createTemplate: (template: InvoiceTemplate) => request<InvoiceTemplate>(`${API_BASE}/templates`, 'POST', template),
  updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => request<any>(`${API_BASE}/templates/${id}`, 'PUT', updates),
  deleteTemplate: (id: string) => request<void>(`${API_BASE}/templates/${id}`, 'DELETE'),
  saveTemplate: (template: InvoiceTemplate) => {
    // If it has an existing ID that looks local (random string), we might want to check
    // But usually templates from DB have their IDs.
    // For simplicity, we can assume if it's new, we POST, else we check.
    // However, the standard is to check if it's in the list.
    // Here we can just use createTemplate for new ones and updateTemplate for existing ones.
    if (template.id && template.id.length > 10) { // Simple heuristic for DB IDs vs random local ones
      return api.updateTemplate(template.id, template);
    }
    return api.createTemplate(template);
  },

  getShortcuts: (companyId: string, userId: string) => request<Shortcut[]>(`${API_BASE}/shortcuts?companyId=${companyId}&userId=${userId}`, 'GET'),
  saveShortcuts: (companyId: string, userId: string, shortcuts: Shortcut[]) => request<Shortcut[]>(`${API_BASE}/shortcuts`, 'POST', { companyId, userId, shortcuts }),

  getInvoices: (companyId: string) => request<Invoice[]>(`${API_BASE}/invoices?companyId=${companyId}`, 'GET'),
  createInvoice: (invoice: Invoice) => request<Invoice>(`${API_BASE}/invoices`, 'POST', invoice),
  updateInvoice: (invoice: Invoice) => request<Invoice>(`${API_BASE}/invoices/${invoice.id}`, 'PUT', invoice),
  deleteInvoice: (id: string) => request<void>(`${API_BASE}/invoices/${id}`, 'DELETE'),
  sendInvoiceByEmail: (id: string, emailData: any) => request<any>(`${API_BASE}/invoices/${id}/send`, 'POST', emailData),
  register: (userData: any) => request<any>(`${API_BASE}/register`, 'POST', userData),
  verifyEmail: (verificationData: { email: string; code: string }) => request<any>(`${API_BASE}/verify-email`, 'POST', verificationData),
  getSubscriptionStatus: () => request<any>(`${API_BASE}/subscription/status`, 'GET'),
  paySubscription: () => request<any>(`${API_BASE}/subscription/pay`, 'POST')
};

// Generic API client for new endpoints
export const apiClient = {
  get: <T>(url: string): Promise<T> => request<T>(`${API_BASE}${url.startsWith('/api') ? url.slice(4) : url}`, 'GET'),
  post: <T>(url: string, body?: any): Promise<T> => request<T>(`${API_BASE}${url.startsWith('/api') ? url.slice(4) : url}`, 'POST', body),
  put: <T>(url: string, body?: any): Promise<T> => request<T>(`${API_BASE}${url.startsWith('/api') ? url.slice(4) : url}`, 'PUT', body),
  delete: <T>(url: string): Promise<T> => request<T>(`${API_BASE}${url.startsWith('/api') ? url.slice(4) : url}`, 'DELETE')
};