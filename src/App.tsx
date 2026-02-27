import React, { useState, useEffect, useCallback } from 'react';
import { Invoice, Company, ContactInfo, InvoiceTemplate, Shortcut, Article } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
// InvoiceCreator replaced by DocumentCreator for simpler interface
import InvoiceHistory from './components/InvoiceHistory';
import CompanyManager from './components/CompanyManager';
import ClientManager from './components/ClientManager';
import TemplateManager from './components/TemplateManager';
import ShortcutManager from './components/ShortcutManager';
import PaymentsManager from './components/PaymentsManager';
import AuditLogViewer from './components/AuditLogViewer';
import ArticleManager from './components/ArticleManager';
import VatManager from './components/VatManager';
import SalesList from './components/SalesList';
import Reporting from './components/Reporting';
import GlobalReporting from './components/GlobalReporting';
import { shortcuts as defaultShortcuts } from './constants';
import DocumentCreator from './components/DocumentCreator';
import { generateInvoiceEmail } from './geminiService';
import TopMenu from './components/TopMenu';
import OnboardingWizard from './components/OnboardingWizard';
import Calculator from './components/Calculator';
import AutomationCenter from './components/AutomationCenter';
import Coordonnees from './components/Coordonnees';
import Login from './components/Login';
import UserManager from './components/UserManager';
import GlobalClientManager from './components/GlobalClientManager';
import { api, apiClient, LimitReachedError } from './apiClient';
import { LogOut, Shield, Loader2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { sendInvoiceEmailWithPdf } from './utils/emailService';
import InvoicePreview from './components/InvoicePreview';
import { useRef } from 'react';
import Register from './components/Register';
import LockScreen from './components/LockScreen';
import OnboardingSteps from './components/OnboardingSteps';
import Checkout from './components/Checkout';
import PublicInvoiceView from './components/PublicInvoiceView';
import ForgotPassword from './components/ForgotPassword';
import AccountSettings from './components/AccountSettings';
import UpgradePrompt from './components/UpgradePrompt';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ContactInfo[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProgramMode, setIsProgramMode] = useState(false);
  const [portfolioTab, setPortfolioTab] = useState<'companies' | 'users' | 'clients'>('companies');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [view, setView] = useState<'login' | 'register' | 'onboarding_steps' | 'app' | 'checkout' | 'public_view' | 'password_reset'>('login');
  const [publicViewToken, setPublicViewToken] = useState<string | null>(null);
  const [passwordResetToken, setPasswordResetToken] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const [allInvoicesMap, setAllInvoicesMap] = useState<{ [key: string]: Invoice[] }>({});
  const [allGlobalClients, setAllGlobalClients] = useState<any[]>([]);
  const [backgroundEmailQueue, setBackgroundEmailQueue] = useState<Invoice[]>([]);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const bgPdfContainerRef = useRef<HTMLDivElement>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Subscription limit state
  const [limitPrompt, setLimitPrompt] = useState<{ isOpen: boolean; message: string; resource: 'company' | 'invoice' | 'client' }>({
    isOpen: false,
    message: '',
    resource: 'invoice'
  });

  useEffect(() => {
    // ── Intercept special URL params FIRST (before auth check) ──
    const params = new URLSearchParams(window.location.search);
    const viewToken = params.get('view');
    const resetToken = params.get('reset');

    if (viewToken) {
      setPublicViewToken(viewToken);
      setView('public_view');
      setIsLoading(false);
      return; // Don't check session for public invoice view
    }
    if (resetToken) {
      setPasswordResetToken(resetToken);
      setView('password_reset');
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      const token = localStorage.getItem('mj_token');
      if (token) {
        try {
          const res = await api.verifySession();
          if (res.success) {
            setUser(res.user);
            setIsAuthenticated(true);
            setView('app');

            // Check subscription
            try {
              const sub = await api.getSubscriptionStatus();
              setSubscriptionStatus(sub);
            } catch (e) { console.error("Sub check fail", e); }

          } else {
            localStorage.removeItem('mj_token');
            setView('login');
          }
        } catch (e) {
          console.error("Session verification failed", e);
          localStorage.removeItem('mj_token');
          setView('login');
        }
      } else {
        setView('login');
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const refreshPortfolio = async (currentUser?: any) => {
    const activeUser = currentUser || user;
    try {
      const companyData = await api.getCompanies();
      setCompanies(companyData || []);

      if (companyData && companyData.length === 0) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }

      const invMap: { [key: string]: Invoice[] } = {};
      if (companyData) {
        await Promise.all(companyData.map(async (c) => {
          const invs = await api.getInvoices(c.id);
          invMap[c.id] = invs || [];
        }));
      }
      setAllInvoicesMap(invMap);

      // Load users if SuperAdmin
      if (activeUser?.role === 'SuperAdmin') {
        const [userData, clientData] = await Promise.all([
          api.getUsers(),
          api.getAllClients()
        ]);
        setAvailableUsers(userData || []);
        setAllGlobalClients(clientData || []);
      } else {
        setAvailableUsers([]);
        setAllGlobalClients([]);
      }
    } catch (e) {
      console.error("Failed to refresh portfolio", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshPortfolio();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'SuperAdmin') {
      if (portfolioTab === 'users') {
        api.getUsers().then(data => setAvailableUsers(data || []));
      } else if (portfolioTab === 'clients') {
        api.getAllClients().then(data => setAllGlobalClients(data || []));
      }
    }
  }, [portfolioTab, isAuthenticated, user]);

  const loadCompanyData = useCallback(async () => {
    if (!activeCompany || !user) return;
    try {
      const [invData, clientData, templateData, shortcutData, articleData] = await Promise.all([
        api.getInvoices(activeCompany.id),
        api.getClients(activeCompany.id),
        api.getTemplates(activeCompany.id),
        api.getShortcuts(activeCompany.id, user.id),
        api.getArticles(activeCompany.id)
      ]);

      setInvoices(invData || []);
      setClients(clientData || []);
      setShortcuts(shortcutData || []);
      setArticles(articleData || []);

      if (templateData && templateData.length === 0) {
        // Auto-seed for existing companies that have no templates
        await seedDefaultTemplates(activeCompany.id);
        const refreshedTemplates = await api.getTemplates(activeCompany.id);
        setTemplates(refreshedTemplates || []);
      } else {
        // Find all templates that contain BOTH 'sans sujet' AND 'proforma' (the combined ones)
        const combinedTemplates = templateData.filter(t =>
          t.name.toLowerCase().includes('sans sujet') && t.name.toLowerCase().includes('proforma')
        );

        if (combinedTemplates.length > 0) {
          try {
            // Delete all faulty combined templates
            for (const badTpl of combinedTemplates) {
              await api.deleteTemplate(badTpl.id);
            }

            // Check if individual ones exist in the REST of the templates
            const remainingTpls = templateData.filter(t => !combinedTemplates.some(ct => ct.id === t.id));
            const hasSansSujet = remainingTpls.some(t => t.name === 'Sans sujet');
            const hasProforma = remainingTpls.some(t => t.name === 'Proforma');

            if (!hasSansSujet) {
              await api.createTemplate({ id: Math.random().toString(36).substr(2, 9), companyId: activeCompany.id, name: 'Sans sujet', subject: '', notes: '', items: [] });
            }
            if (!hasProforma) {
              await api.createTemplate({ id: Math.random().toString(36).substr(2, 9), companyId: activeCompany.id, name: 'Proforma', subject: 'Facture Proforma', notes: 'Document provisoire pour accord commercial.', items: [] });
            }

            // Re-fetch everything to be absolutely clean
            const finalTemplates = await api.getTemplates(activeCompany.id);
            setTemplates(finalTemplates || []);
          } catch (err) {
            console.error("Migration error:", err);
            setTemplates(templateData || []);
          }
        } else {
          // If no combined one found, still check if "Sans sujet" and "Proforma" exist individually
          const hasSansSujet = templateData.some(t => t.name === 'Sans sujet');
          const hasProforma = templateData.some(t => t.name === 'Proforma');

          if (!hasSansSujet || !hasProforma) {
            if (!hasSansSujet) await api.createTemplate({ id: Math.random().toString(36).substr(2, 9), companyId: activeCompany.id, name: 'Sans sujet', subject: '', notes: '', items: [] });
            if (!hasProforma) await api.createTemplate({ id: Math.random().toString(36).substr(2, 9), companyId: activeCompany.id, name: 'Proforma', subject: 'Facture Proforma', notes: 'Document provisoire pour accord commercial.', items: [] });
            const refreshed = await api.getTemplates(activeCompany.id);
            setTemplates(refreshed || []);
          } else {
            setTemplates(templateData || []);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load company data", e);
    }
  }, [activeCompany, user]);

  useEffect(() => {
    if (activeCompany && user) {
      loadCompanyData();
    }
  }, [activeCompany, user, loadCompanyData]);

  // Command Palette & Configurable Shortcuts Registry
  const executeShortcut = useCallback(async (actionId: string) => {
    if (!activeCompany && !['exit', 'account', 'dashboard'].includes(actionId)) return;

    switch (actionId) {
      case 'create':
      case 'new-invoice':
        setEditingInvoice(null);
        setActiveTab('create');
        break;
      case 'nouveau-devis':
      case 'new-quote':
        setEditingInvoice(null);
        setActiveTab('nouveau-devis');
        break;
      case 'view-history':
      case 'history':
        setActiveTab('history');
        break;
      case 'ventes':
        setActiveTab('ventes');
        break;
      case 'clients':
        setActiveTab('clients');
        break;
      case 'articles':
        setActiveTab('articles');
        break;
      case 'reporting':
        setActiveTab('reporting');
        break;
      case 'tva':
        setActiveTab('tva');
        break;
      case 'coordonnees':
        setActiveTab('coordonnees');
        break;
      case 'tools':
        setActiveTab('tools');
        break;
      case 'automation':
        setActiveTab('automation');
        break;
      case 'dashboard':
        setActiveTab('dashboard');
        break;
      case 'search':
        const searchInput = document.querySelector('input[placeholder*="Chercher"], input[placeholder*="Recherche"], input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
        break;
      case 'duplicate':
        if (editingInvoice) {
          const duplicated = { ...editingInvoice, id: Math.random().toString(36).substr(2, 9), invoiceNumber: 'COPY-' + editingInvoice.invoiceNumber, validatedAt: undefined, status: 'Brouillon' as any };
          setEditingInvoice(duplicated);
          setActiveTab('create');
        } else {
          // Navigate to sales list to choose an invoice
          setActiveTab('ventes');
          setTimeout(() => {
            alert('Veuillez sélectionner une facture à dupliquer dans la liste.');
          }, 300);
        }
        break;
      case 'save':
        if (activeTab === 'create' || activeTab === 'nouveau-devis') {
          alert('Utilisez le bouton "Enregistrer" dans le formulaire de création.');
        } else {
          alert('Aucun document en cours de modification.');
        }
        break;
      case 'delete':
        if (editingInvoice) {
          if (window.confirm(`Supprimer le document ${editingInvoice.invoiceNumber} ?`)) {
            try {
              await api.deleteInvoice(editingInvoice.id);
              setEditingInvoice(null);
              await loadCompanyData();
              refreshPortfolio();
            } catch (e) {
              alert(e instanceof Error ? e.message : "Erreur lors de la suppression.");
            }
          }
        } else {
          // Navigate to sales list to choose an invoice
          setActiveTab('ventes');
          setTimeout(() => {
            alert('Veuillez sélectionner une facture à supprimer dans la liste.');
          }, 300);
        }
        break;
      case 'print':
        window.print();
        break;
      case 'export':
        if (!activeCompany) return;
        const headers = [
          'Numéro', 'Type', 'Date', 'Client', 'État', 'HT', 'TVA', 'Remise', 'TTC', 'Devise'
        ];

        const rows = invoices.map(inv => {
          const ht = inv.items.reduce((sum, item) =>
            sum + item.subItems.reduce((subSum, sub) => subSum + (sub.price * sub.quantity), 0), 0);
          const tva = inv.items.reduce((sum, item) =>
            sum + item.subItems.reduce((subSum, sub) => subSum + (sub.price * sub.quantity * (sub.taxRate / 100)), 0), 0);
          const discount = inv.discount || 0;
          const ttc = ht + tva - discount;

          return [
            inv.invoiceNumber,
            inv.type,
            new Date(inv.date).toLocaleDateString('fr-FR'),
            inv.client?.name || 'Client Inconnu',
            inv.status,
            ht.toFixed(2),
            tva.toFixed(2),
            discount.toFixed(2),
            ttc.toFixed(2),
            inv.currency || activeCompany.currency
          ].map(val => `"${val}"`);
        });

        const csvContent = "\uFEFF" + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `export_${activeCompany.name}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      case 'refresh':
        loadCompanyData();
        refreshPortfolio();
        break;
      case 'new-client':
        setActiveTab('clients');
        break;
      case 'account':
        setActiveTab('account');
        break;
      default:
        console.log(`Shortcut action ${actionId} triggered`);
    }
  }, [activeCompany, editingInvoice, activeTab, loadCompanyData, refreshPortfolio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = e.key.toLowerCase();

      // Check user configurable shortcuts
      const userDefined = shortcuts.find(s => s.enabled && s.key.toLowerCase() === key);
      if (userDefined) {
        e.preventDefault();
        executeShortcut(userDefined.actionId);
        return;
      }

      // Hardcoded defaults
      if (key === 'f') { e.preventDefault(); executeShortcut('search'); }
      if (key === 'n') { e.preventDefault(); executeShortcut('new-invoice'); }
      if (key === 'p') { e.preventDefault(); executeShortcut('print'); }
      if (key === 'd') { e.preventDefault(); executeShortcut('duplicate'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeShortcut, shortcuts]);

  const handleLogin = async (loggedUser: any, token: string) => {
    localStorage.setItem('mj_token', token);
    setUser(loggedUser);
    setIsAuthenticated(true);
    setView('app');
    try {
      const sub = await api.getSubscriptionStatus();
      setSubscriptionStatus(sub);
    } catch (e) {
      console.error(e);
    }
    // Refresh portfolio with the fresh user data
    refreshPortfolio(loggedUser);
  };

  const handleRegister = (newUser: any, token: string) => {
    localStorage.setItem('mj_token', token);
    setUser(newUser);
    setIsAuthenticated(true);
    setSubscriptionStatus({ status: 'trial', trialEndsAt: newUser.trialEndsAt });
    setView('onboarding_steps');
  };

  const handleLogout = () => {
    localStorage.removeItem('mj_token');
    setIsAuthenticated(false);
    setUser(null);
    setIsProgramMode(false);
    setActiveCompany(null);
    setPortfolioTab('companies');
    setActiveTab('dashboard');
    setView('login');
  };

  const handleRefreshUser = async () => {
    try {
      const res = await api.verifySession();
      if (res.success) {
        setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  };

  useEffect(() => {
    const processEmail = async () => {
      if (backgroundEmailQueue.length === 0 || isProcessingBackground) return;

      const currentInvoice = backgroundEmailQueue[0];

      // Give more time for the hidden preview to render correctly
      await new Promise(r => setTimeout(r, 1500));

      const element = bgPdfContainerRef.current?.querySelector('.print-area');
      if (!element) {
        console.error("Could not find print area in background generator");
        setBackgroundEmailQueue(prev => prev.slice(1));
        return;
      }

      setIsProcessingBackground(true);
      try {
        await sendInvoiceEmailWithPdf(currentInvoice, element as HTMLElement);
        console.log("Email background sent successfully");
      } catch (e) {
        console.error("Failed background email", e);
        alert("L'envoi automatique a échoué. Vérifiez votre configuration.");
      } finally {
        setIsProcessingBackground(false);
        setBackgroundEmailQueue(prev => prev.slice(1));
      }
    };
    processEmail();
  }, [backgroundEmailQueue, isProcessingBackground]);

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.client?.email) {
      alert("Ce client n'a pas d'adresse email configurée.");
      return;
    }
    setBackgroundEmailQueue(prev => [...prev, invoice]);
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      const { autoSendEmail, ...invoiceData } = invoice;

      // Check if invoice exists to decide between create or update
      const existing = invoices.find(inv => inv.id === invoice.id);

      if (existing) {
        await api.updateInvoice(invoiceData as Invoice);
      } else {
        await api.createInvoice(invoiceData as Invoice);
      }

      // Handle automatic email sending if requested
      if (autoSendEmail && invoiceData.client?.email) {
        setBackgroundEmailQueue(prev => [...prev, invoiceData as Invoice]);
      }

      alert("Document enregistré avec succès !");
      setEditingInvoice(null);
      await loadCompanyData();
      refreshPortfolio();
      setActiveTab('ventes');
    } catch (e: any) {
      if (e instanceof LimitReachedError) {
        setLimitPrompt({ isOpen: true, message: e.message, resource: 'invoice' });
      } else {
        alert(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
      }
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Supprimer définitivement ce document ?")) {
      try {
        await api.deleteInvoice(id);
        await loadCompanyData();
        refreshPortfolio();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erreur lors de la suppression.");
      }
    }
  };

  const handleEnterCompany = (c: Company) => {
    if (!c.active) {
      alert("Cette société est actuellement inactive.");
      return;
    }
    setActiveCompany(c);
    setIsProgramMode(true);
    setActiveTab('dashboard');
  };

  const handleUpdateCompany = async (id: string, updates: Partial<Company>) => {
    await api.updateCompany(id, updates);
    await refreshPortfolio();
    if (activeCompany?.id === id) {
      const updated = (await api.getCompanies()).find(comp => comp.id === id);
      if (updated) setActiveCompany(updated);
    }
  };

  const seedDefaultTemplates = async (companyId: string) => {
    const defaults = [
      { name: 'Siège Social', subject: 'Domiciliation et Services de Siège Social', notes: 'Prestation mensuelle de domiciliation.' },
      { name: 'Service Comptabilité', subject: 'Prestations de Services Comptables', notes: 'Tenue de comptabilité et déclarations fiscales.' },
      { name: 'Sans sujet', subject: '', notes: '' },
      { name: 'Proforma', subject: 'Facture Proforma', notes: 'Document provisoire pour accord commercial.' },
      { name: 'Proforma pour Construction', subject: 'Offre de Prix - Travaux de Construction', notes: 'Sous réserve de validation technique sur site.' },
      { name: 'Pour Rénovation', subject: 'Prestations de Rénovation et Amélioration', notes: 'Détail des travaux de second œuvre.' }
    ];

    for (const t of defaults) {
      await api.createTemplate({
        id: Math.random().toString(36).substr(2, 9),
        companyId,
        name: t.name,
        subject: t.subject,
        notes: t.notes,
        items: []
      });
    }
  };

  const handleOnboardingComplete = async (company: Company, client: ContactInfo, startQuote: boolean, adminUpdate?: any) => {
    setIsLoading(true);
    try {
      if (adminUpdate && adminUpdate.password) {
        try {
          await api.updateUser(user.id, { password: adminUpdate.password });
        } catch (pwErr) {
          console.warn('[Onboarding] Password update skipped:', pwErr);
          // Non-blocking — continue onboarding even if password update fails
        }
      }
      const newCompany = await api.createCompany(company);
      if (!newCompany || !newCompany.id) throw new Error("Échec création société");

      await api.createClient({ ...client, companyId: newCompany.id });

      // Add default subjects / templates
      await seedDefaultTemplates(newCompany.id);

      await refreshPortfolio();
      setActiveCompany(newCompany);
      setIsProgramMode(true);
      setShowOnboarding(false);
      if (startQuote) {
        setEditingInvoice(null);
        setActiveTab('create');
      } else {
        setActiveTab('dashboard');
      }
    } catch (e: any) {
      console.error('[Onboarding Error]', e);
      if (e instanceof LimitReachedError) {
        setLimitPrompt({ isOpen: true, message: e.message, resource: 'company' });
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        alert(`Erreur lors de la configuration initiale :\n\n${msg}\n\nVérifiez la console pour plus de détails.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (c: ContactInfo) => {
    try {
      await api.createClient({ ...c, companyId: activeCompany!.id });
      await loadCompanyData();
    } catch (e: any) {
      if (e instanceof LimitReachedError) {
        setLimitPrompt({ isOpen: true, message: e.message, resource: 'client' });
      } else {
        alert(e.message || "Erreur lors de la création du client.");
      }
    }
  };

  const handleCreateCompany = async (c: Company) => {
    try {
      await api.createCompany(c);
      await refreshPortfolio();
    } catch (e: any) {
      if (e instanceof LimitReachedError) {
        setLimitPrompt({ isOpen: true, message: e.message, resource: 'company' });
      } else {
        alert(e.message || "Erreur lors de la création de la société.");
      }
    }
  };

  const renderContent = () => {
    if (activeTab === 'global-reporting') {
      return <GlobalReporting companies={companies} allInvoices={allInvoicesMap} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} invoices={invoices} shortcuts={shortcuts.filter(s => s.enabled)} onShortcut={executeShortcut} />;
      case 'create': return <DocumentCreator
        key={activeTab}
        type={editingInvoice?.type || 'Standard'}
        onSave={handleSaveInvoice}
        activeCompany={activeCompany!}
        clients={clients}
        articles={articles}
        invoices={invoices}
        templates={templates}
        initialInvoice={editingInvoice || undefined}
        onCancel={() => { setEditingInvoice(null); setActiveTab('ventes'); }}
        onCreateClient={handleCreateClient}
        onUpdateClient={(id, updates) => api.updateClient(id, updates).then(() => loadCompanyData())}
      />;
      case 'history': return <InvoiceHistory invoices={invoices} onDelete={handleDeleteInvoice} onEdit={(i) => { setEditingInvoice(i); setActiveTab('create'); }} onSave={handleSaveInvoice} onSendEmail={handleSendEmail} />;
      case 'ventes': return <SalesList
        invoices={invoices}
        company={activeCompany!}
        clients={clients}
        onView={(i) => { setEditingInvoice(i); setActiveTab('create'); }}
        onEdit={(i) => { setEditingInvoice(i); setActiveTab('create'); }}
        onDelete={handleDeleteInvoice}
        onCreate={() => { setEditingInvoice(null); setActiveTab('create'); }}
        onSendEmail={handleSendEmail}
        onDuplicate={(inv) => {
          const duplicated: Invoice = {
            ...inv,
            id: Math.random().toString(36).substring(2, 11),
            invoiceNumber: `${inv.invoiceNumber}-COPY`,
            status: 'Brouillon',
            date: new Date().toISOString().split('T')[0],
            validatedAt: undefined,
            payments: []
          };
          api.createInvoice(duplicated)
            .then(() => {
              loadCompanyData();
              setEditingInvoice(duplicated);
              setActiveTab('create');
            })
            .catch((e: any) => {
              if (e.message === 'LIMIT_REACHED' || e.error === 'LIMIT_REACHED') {
                setLimitPrompt({
                  isOpen: true,
                  message: e.message || 'Limite de factures atteinte.',
                  resource: 'invoice'
                });
              } else {
                alert(e.message || "Erreur lors de la duplication.");
              }
            });
        }}
        onRefresh={loadCompanyData}
        onUpdateStatus={(id, status) => {
          const inv = invoices.find(i => i.id === id);
          if (inv) {
            const updated = { ...inv, status: status as any };
            api.updateInvoice(updated).then(() => loadCompanyData());
          }
        }}
      />;
      case 'clients': return <ClientManager
        clients={clients}
        invoices={invoices}
        onCreate={handleCreateClient}
        onUpdate={(id, updates) => api.updateClient(id, updates).then(() => loadCompanyData())}
        onDelete={(id) => api.deleteClient(id).then(() => loadCompanyData())}
      />;
      case 'articles': return <ArticleManager
        articles={articles}
        company={activeCompany!}
        onCreate={(a) => api.createArticle(a).then(() => loadCompanyData())}
        onUpdate={(id, updates) => api.updateArticle(id, updates).then(() => loadCompanyData())}
        onDelete={(id) => api.deleteArticle(id).then(() => loadCompanyData())}
        onImport={async (articlesList) => {
          const res = await apiClient.post('/api/articles/import', { companyId: activeCompany!.id, articles: articlesList });
          await loadCompanyData();
          return res;
        }}
      />;
      case 'automation': return <AutomationCenter
        company={activeCompany!}
        invoices={invoices}
        clients={clients}
        templates={templates}
        onRefresh={loadCompanyData}
      />;
      case 'tva': return <VatManager company={activeCompany!} onUpdateCompany={handleUpdateCompany} />;
      case 'coordonnees': return <Coordonnees company={activeCompany!} onUpdateCompany={handleUpdateCompany} />;
      case 'reporting': return <Reporting invoices={invoices} company={activeCompany!} clients={clients} />;
      case 'payments': return <PaymentsManager invoices={invoices} company={activeCompany!} onUpdateInvoice={(inv) => { api.updateInvoice(inv).then(() => { loadCompanyData(); refreshPortfolio(); }); }} />;
      case 'companies': return <CompanyManager companies={companies} onCreate={handleCreateCompany} onSelect={handleEnterCompany} onUpdate={handleUpdateCompany} activeId={activeCompany?.id} />;
      case 'audit': return <AuditLogViewer companyId={activeCompany?.id} />;
      case 'shortcuts': return <ShortcutManager shortcuts={shortcuts} onSave={(s) => api.saveShortcuts(activeCompany!.id, user.id, s).then(() => loadCompanyData())} />;
      case 'tools': return <Calculator />;
      // case 'help': return <Guide />;
      case 'templates': return <TemplateManager templates={templates} company={activeCompany!} onSave={(t) => api.saveTemplate(t).then(() => loadCompanyData())} />;
      // New document creation views with table-based interface
      case 'nouveau-devis': return <DocumentCreator
        key={activeTab}
        type="Devis"
        onSave={handleSaveInvoice}
        activeCompany={activeCompany!}
        clients={clients}
        articles={articles}
        invoices={invoices}
        templates={templates}
        onCancel={() => setActiveTab('ventes')}
        onCreateClient={handleCreateClient}
        onUpdateClient={(id, updates) => api.updateClient(id, updates).then(() => loadCompanyData())}
      />;
      case 'facture': return <DocumentCreator
        key={activeTab}
        type="Standard"
        onSave={handleSaveInvoice}
        activeCompany={activeCompany!}
        clients={clients}
        articles={articles}
        invoices={invoices}
        templates={templates}
        onCancel={() => setActiveTab('ventes')}
        onCreateClient={handleCreateClient}
        onUpdateClient={(id, updates) => api.updateClient(id, updates).then(() => loadCompanyData())}
      />;
      case 'account': return <AccountSettings user={user} onUpdateUser={handleRefreshUser} onLogout={handleLogout} />;
      default: return <Dashboard invoices={invoices} shortcuts={shortcuts.filter(s => s.enabled)} onShortcut={executeShortcut} />;
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#020817]"><div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;

  // ── Public invoice view (no login required) ──
  if (view === 'public_view' && publicViewToken) {
    return <PublicInvoiceView token={publicViewToken} />;
  }

  // ── Password reset via email link (no login required) ──
  if (view === 'password_reset' && passwordResetToken) {
    return (
      <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden font-sans text-slate-900">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-100/40 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-100/30 blur-[130px] rounded-full" />
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 relative z-10">
          <div className="w-full max-w-[460px] bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-200 shadow-2xl shadow-slate-200/50">
            <ForgotPassword
              onBack={() => {
                // Clear reset param from URL cleanly
                window.history.replaceState({}, document.title, window.location.pathname);
                setView('login');
                setPasswordResetToken(null);
              }}
              resetToken={passwordResetToken}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (view === 'register') return <Register onRegister={handleRegister} onNavigateToLogin={() => setView('login')} />;
    return <Login onLogin={handleLogin} onRegister={() => setView('register')} />;
  }

  if (view === 'onboarding_steps') {
    return <OnboardingSteps user={user} onFinish={async () => {
      await refreshPortfolio(); // This sets showOnboarding=true if no company exists
      setView('app');
    }} />;
  }

  if (view === 'checkout') {
    return <Checkout
      user={user}
      onSuccess={async () => {
        try {
          const sub = await api.getSubscriptionStatus();
          setSubscriptionStatus(sub);
          setView('app');
        } catch (e) {
          console.error(e);
          setView('app');
        }
      }}
      onCancel={() => setView('app')}
    />;
  }

  // Check Lock
  if (subscriptionStatus && subscriptionStatus.isLocked) {
    return <LockScreen
      trialEndsAt={subscriptionStatus.trialEndsAt}
      onPay={() => setView('checkout')}
      onLogout={handleLogout}
    />;
  }

  if (showOnboarding) return <OnboardingWizard user={user} onComplete={handleOnboardingComplete} />;

  const trialDaysLeft = subscriptionStatus?.status === 'trial'
    ? Math.ceil((new Date(subscriptionStatus.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--app-bg)]">
      <TopMenu
        onAction={(id) => id === 'exit' ? handleLogout() : executeShortcut(id)}
        trialDaysLeft={trialDaysLeft}
        onUpgrade={() => setView('checkout')}
        user={user}
        appActiveTab={activeTab}
        isProgramMode={isProgramMode}
      />

      <div className="flex flex-1 overflow-hidden">
        {isProgramMode && <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} companies={companies} activeCompany={activeCompany} onSelectCompany={handleEnterCompany} onExit={() => setIsProgramMode(false)} />}
        <main className="flex-1 p-4 overflow-y-auto bg-[var(--app-bg)]">
          {!isProgramMode && activeTab !== 'account' ? (
            <div className="max-w-7xl mx-auto space-y-12 py-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="animate-in slide-in-from-left-5 duration-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Console d'Administration</span>
                  </div>
                  <h1 className="text-6xl font-extrabold text-slate-900 tracking-tighter leading-none mb-3">Portfolio <span className="text-blue-600 italic">Cloud</span>.</h1>
                  <p className="text-slate-500 font-medium text-lg">Gérez vos environnements de production et structures juridiques.</p>
                </div>

                <div className="flex items-center gap-4 animate-in slide-in-from-right-5 duration-700">
                  {user?.role === 'SuperAdmin' && (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner mr-4">
                      <button
                        onClick={() => setPortfolioTab('companies')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portfolioTab === 'companies' ? 'bg-white text-blue-600 shadow-lg border border-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Sociétés
                      </button>
                      <button
                        onClick={() => setPortfolioTab('users')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portfolioTab === 'users' ? 'bg-white text-blue-600 shadow-lg border border-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Clients SaaS
                      </button>
                      <button
                        onClick={() => setPortfolioTab('clients')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portfolioTab === 'clients' ? 'bg-white text-blue-600 shadow-lg border border-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Centre Client Global
                      </button>
                    </div>
                  )}
                  <div className="hidden lg:flex flex-col items-end mr-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opérateur Système</p>
                    <p className="text-sm font-extrabold text-slate-900">{user?.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-4 bg-slate-900 text-white rounded-[1.25rem] font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>

              <div className="relative">
                {/* Visual Accent */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100/30 blur-[100px] rounded-full pointer-events-none"></div>

                {portfolioTab === 'companies' || user?.role !== 'SuperAdmin' ? (
                  <CompanyManager
                    companies={companies}
                    users={user?.role === 'SuperAdmin' ? availableUsers : undefined}
                    onCreate={handleCreateCompany}
                    onSelect={handleEnterCompany}
                    onUpdate={handleUpdateCompany}
                    activeId={activeCompany?.id}
                  />
                ) : portfolioTab === 'users' ? (
                  <UserManager
                    users={availableUsers}
                    onRefresh={refreshPortfolio}
                  />
                ) : (
                  <GlobalClientManager
                    clients={allGlobalClients}
                  />
                )}
              </div>
            </div>
          ) : renderContent()}
        </main>
      </div>
      {/* Background PDF Generator */}
      <div
        style={{
          position: 'absolute',
          left: '-2000px',
          top: '0',
          width: '800px',
          height: 'auto',
          pointerEvents: 'none',
          opacity: 0,
          overflow: 'hidden'
        }}
        ref={bgPdfContainerRef}
      >
        {backgroundEmailQueue.length > 0 && (
          <div style={{ width: '800px', background: 'white' }}>
            <InvoicePreview invoice={backgroundEmailQueue[0]} />
          </div>
        )}
      </div>

      {(isProcessingBackground || backgroundEmailQueue.length > 0) && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
          <div>
            <p className="text-white text-xs font-black uppercase tracking-widest">Envoi en cours...</p>
            <p className="text-gray-400 text-[10px] font-bold mt-1">Génération du PDF ({backgroundEmailQueue.length} restants)</p>
          </div>
        </div>
      )}

      <UpgradePrompt
        isOpen={limitPrompt.isOpen}
        onClose={() => setLimitPrompt({ ...limitPrompt, isOpen: false })}
        onUpgrade={() => {
          setView('checkout');
          setLimitPrompt({ ...limitPrompt, isOpen: false });
        }}
        message={limitPrompt.message}
        resource={limitPrompt.resource}
      />
    </div>
  );
};

export default App;