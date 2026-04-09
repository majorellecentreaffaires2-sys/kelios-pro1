import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  Receipt,
  DollarSign,
  Printer,
  X
} from 'lucide-react';
import { api } from '../../apiClient';

interface AcompteInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  originalInvoiceNumber?: string;
  totalAmount: number;
  acompteAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const AcompteManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<AcompteInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AcompteInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  
  // États pour l'aperçu
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AcompteInvoice | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    originalInvoiceNumber: '',
    totalAmount: 0,
    acompteAmount: 0,
    percentage: 0,
    status: 'draft' as const,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentDate: '',
    paymentMethod: '',
    notes: '',
    createdBy: 'Admin'
  });

  // Charger les données depuis l'API
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'ID de l'entreprise active
        const companiesResponse = await api.getCompanies();
        const activeCompany = companiesResponse.find((c: any) => c.isActive);
        
        if (!activeCompany) {
          console.warn('Aucune entreprise active trouvée');
          setInvoices([]);
          return;
        }
        
        // Récupérer toutes les factures de l'entreprise active
        const response = await api.getInvoices(activeCompany.id);
        const allInvoices = response || [];
        
        // Filtrer pour ne garder que les factures d'acomptes
        const acompteInvoices = allInvoices.filter((invoice: any) => 
          invoice.type === 'Acompte' || 
          (invoice.type === 'Standard' && invoice.notes && invoice.notes.toLowerCase().includes('acompte'))
        );
        
        // Transformer les données pour correspondre à l'interface AcompteInvoice
        const formattedInvoices = acompteInvoices.map((invoice: any) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client?.name || 'Client inconnu',
          clientEmail: invoice.client?.email || '',
          originalInvoiceNumber: invoice.originalInvoiceNumber || '',
          totalAmount: invoice.totalTtc || 0,
          acompteAmount: invoice.depositReceived || 0,
          remainingAmount: (invoice.totalTtc || 0) - (invoice.depositReceived || 0),
          percentage: invoice.totalTtc ? ((invoice.depositReceived || 0) / invoice.totalTtc * 100) : 0,
          status: invoice.status?.toLowerCase() || 'draft',
          issueDate: invoice.date || '',
          dueDate: invoice.dueDate || '',
          paymentDate: invoice.paymentDate || '',
          paymentMethod: invoice.paymentMethod || '',
          notes: invoice.notes || '',
          createdBy: invoice.createdBy || 'Admin',
          createdAt: invoice.createdAt || new Date().toISOString(),
          updatedAt: invoice.updatedAt || new Date().toISOString()
        }));
        
        setInvoices(formattedInvoices);
      } catch (error) {
        console.error('Erreur lors du chargement des factures d\'acomptes:', error);
        // En cas d'erreur, utiliser des données vide
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  // Filtrage
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.originalInvoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Fonctions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600';
      case 'sent': return 'text-blue-600';
      case 'paid': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-50';
      case 'sent': return 'bg-blue-50';
      case 'paid': return 'bg-green-50';
      case 'overdue': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'sent': return 'Envoyee';
      case 'paid': return 'Payee';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  const handleSave = () => {
    if (editingInvoice) {
      setInvoices(invoices.map(inv => 
        inv.id === editingInvoice.id 
          ? { ...inv, ...formData, updatedAt: new Date().toISOString() }
          : inv
      ));
    } else {
      const newInvoice: AcompteInvoice = {
        ...formData,
        id: Date.now().toString(),
        remainingAmount: formData.totalAmount - formData.acompteAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setInvoices([...invoices, newInvoice]);
    }
    resetForm();
  };

  const handleEdit = (invoice: AcompteInvoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      originalInvoiceNumber: invoice.originalInvoiceNumber || '',
      totalAmount: invoice.totalAmount,
      acompteAmount: invoice.acompteAmount,
      percentage: invoice.percentage,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paymentDate: invoice.paymentDate || '',
      paymentMethod: invoice.paymentMethod || '',
      notes: invoice.notes || '',
      createdBy: invoice.createdBy
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture d\'acompte ?')) {
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  // Fonctions pour l'aperçu
  const handlePrint = (invoice: AcompteInvoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      clientName: '',
      clientEmail: '',
      originalInvoiceNumber: '',
      totalAmount: 0,
      acompteAmount: 0,
      percentage: 0,
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentDate: '',
      paymentMethod: '',
      notes: '',
      createdBy: 'Admin'
    });
    setEditingInvoice(null);
    setShowForm(false);
  };

  const totalInvoices = invoices.length;
  const draftInvoices = invoices.filter(i => i.status === 'draft').length;
  const sentInvoices = invoices.filter(i => i.status === 'sent').length;
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
  const totalAcompteAmount = invoices.reduce((sum, i) => sum + i.acompteAmount, 0);
  const totalPaidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.acompteAmount, 0);
  const totalPendingAmount = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.acompteAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edition de factures d'acomptes</h1>
        <p className="text-gray-500">Gerez les factures d'acomptes et les paiements partiels</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Factures</p>
                <p className="text-xs text-gray-500">{totalInvoices}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Acomptes</p>
                <p className="text-xs text-gray-500">{totalAcompteAmount.toLocaleString()} DH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Payees</p>
                <p className="text-xs text-gray-500">{paidInvoices}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">En Retard</p>
                <p className="text-xs text-gray-500">{overdueInvoices}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingInvoice ? 'Modifier' : 'Nouvelle'} Facture d'Acompte
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de facture</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="FAC-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du client</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom du client"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email du client</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@client.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facture originale</label>
              <input
                type="text"
                value={formData.originalInvoiceNumber}
                onChange={(e) => setFormData({...formData, originalInvoiceNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Numéro de la facture originale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant total</label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => {
                  const total = Number(e.target.value);
                  const acompte = total * (formData.percentage / 100);
                  setFormData({...formData, totalAmount: total, acompteAmount: acompte, remainingAmount: total - acompte});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pourcentage (%)</label>
              <input
                type="number"
                value={formData.percentage}
                onChange={(e) => {
                  const percentage = Number(e.target.value);
                  const acompte = formData.totalAmount * (percentage / 100);
                  setFormData({...formData, percentage, acompteAmount: acompte, remainingAmount: formData.totalAmount - acompte});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="30"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant de l'acompte</label>
              <input
                type="number"
                value={formData.acompteAmount}
                onChange={(e) => {
                  const acompte = Number(e.target.value);
                  const percentage = formData.totalAmount > 0 ? (acompte / formData.totalAmount) * 100 : 0;
                  setFormData({...formData, acompteAmount: acompte, percentage, remainingAmount: formData.totalAmount - acompte});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyee</option>
                <option value="paid">Payee</option>
                <option value="overdue">En retard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date d'émission</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
              <input
                type="text"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Virement bancaire, Chèque, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingInvoice ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyee</option>
              <option value="paid">Payee</option>
              <option value="overdue">En retard</option>
            </select>

            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 text-gray-400" />
            </button>

            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''} trouvée{filteredInvoices.length > 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Nouvelle facture d'acompte
          </button>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Acompte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pourcentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.clientEmail}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.totalAmount.toLocaleString()} DH</td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{invoice.acompteAmount.toLocaleString()} DH</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.percentage}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBg(invoice.status)} ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.dueDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePrint(invoice)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                        title="Voir l'aperçu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(invoice)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded" 
                        title="Editer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Telecharger PDF">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(invoice.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded" 
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" /> Aperçu Facture d'Acompte
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const oldTitle = document.title;
                    document.title = `${selectedInvoice.invoiceNumber} - ${selectedInvoice.clientName}`;
                    setTimeout(() => {
                      window.print();
                      setTimeout(() => { document.title = oldTitle; }, 500);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <button
                  onClick={() => { setShowPreview(false); }}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                  title="Fermer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-gray-100">
              <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8">
                {/* En-tête de la facture */}
                <div className="border-b-2 border-gray-800 pb-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">FACTURE D'ACOMPTE</h1>
                      <p className="text-lg text-gray-600">N°: {selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Date d'émission</p>
                      <p className="font-semibold">{selectedInvoice.issueDate}</p>
                      <p className="text-sm text-gray-500 mt-2">Date d'échéance</p>
                      <p className="font-semibold">{selectedInvoice.dueDate}</p>
                    </div>
                  </div>
                </div>

                {/* Informations client */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Informations Client</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{selectedInvoice.clientName}</p>
                    <p className="text-gray-600">{selectedInvoice.clientEmail}</p>
                  </div>
                </div>

                {/* Informations facture originale */}
                {selectedInvoice.originalInvoiceNumber && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Facture Originale</h2>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium text-blue-900">N°: {selectedInvoice.originalInvoiceNumber}</p>
                    </div>
                  </div>
                )}

                {/* Détails de l'acompte */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Détails de l'Acompte</h2>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Montant Total</p>
                        <p className="text-xl font-bold text-gray-900">{selectedInvoice.totalAmount.toLocaleString()} DH</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Montant Acompte</p>
                        <p className="text-xl font-bold text-purple-600">{selectedInvoice.acompteAmount.toLocaleString()} DH</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pourcentage</p>
                        <p className="text-xl font-bold text-purple-600">{selectedInvoice.percentage}%</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm text-gray-600">Reste à payer</p>
                      <p className="text-xl font-bold text-orange-600">{(selectedInvoice.totalAmount - selectedInvoice.acompteAmount).toLocaleString()} DH</p>
                    </div>
                  </div>
                </div>

                {/* Méthode de paiement */}
                {selectedInvoice.paymentMethod && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Méthode de Paiement</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900">{selectedInvoice.paymentMethod}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedInvoice.notes}</p>
                    </div>
                  </div>
                )}

                {/* Statut */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Statut</h2>
                  <div className={`${getStatusBg(selectedInvoice.status)} p-4 rounded-lg`}>
                    <span className={`font-medium ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusText(selectedInvoice.status)}
                    </span>
                  </div>
                </div>

                {/* Informations de création */}
                <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
                  <p>Facture d'acompte créée le {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  <p>Créée par: {selectedInvoice.createdBy}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => { setShowPreview(false); }}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcompteManagement;
