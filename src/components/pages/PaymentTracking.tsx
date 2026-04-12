import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  FileText,
  Eye
} from 'lucide-react';
import { api } from '../../apiClient';

interface Payment {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  paymentDate: string;
  dueDate: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal';
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  reference: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentInstallment {
  id: string;
  paymentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
}

const PaymentTracking: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');

  // Formulaire
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMethod: 'credit_card' as 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal',
    status: 'pending' as 'paid' | 'pending' | 'overdue' | 'partial',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      // Récupérer l'entreprise active
      const companiesResponse = await api.getCompanies();
      const activeCompany = companiesResponse.find((c: any) => c.isActive);
      
      if (!activeCompany) {
        console.warn('Aucune entreprise active trouvée');
        setPayments([]);
        setInstallments([]);
        return;
      }
      
      // Récupérer toutes les factures de l'entreprise active
      const response = await api.getInvoices(activeCompany.id);
      const allInvoices = response || [];
      
      // Transformer les factures en objets Payment
      const paymentsData = allInvoices
        .filter((invoice: any) => invoice.paymentDate || invoice.status === 'Payée')
        .map((invoice: any) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client?.name || 'Client inconnu',
          clientEmail: invoice.client?.email || '',
          amount: invoice.totalTtc || 0,
          paymentDate: invoice.paymentDate || invoice.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          dueDate: invoice.dueDate || invoice.date || new Date().toISOString().split('T')[0],
          paymentMethod: invoice.paymentMethod || 'credit_card',
          status: invoice.status === 'Payée' ? 'paid' : 
                   invoice.status === 'En attente' ? 'pending' : 
                   invoice.status === 'En retard' ? 'overdue' : 'partial',
          reference: invoice.id || '',
          notes: invoice.notes || `Paiement de la facture ${invoice.invoiceNumber}`,
          createdAt: invoice.createdAt || new Date().toISOString(),
          updatedAt: invoice.updatedAt || new Date().toISOString()
        }));
      
      setPayments(paymentsData);
      
      // Pour les échéanciers, on peut créer des échéanciers à partir des factures avec acomptes
      const installmentsData = allInvoices
        .filter((invoice: any) => 
          invoice.type === 'Acompte' || 
          (invoice.type === 'DevisAvecAcompte' && invoice.items)
        )
        .map((invoice: any) => {
          // Créer des échéanciers basés sur les factures avec acomptes
          const totalAmount = invoice.totalTtc || 0;
          const acompteAmount = invoice.items?.find((item: any) => item.description?.toLowerCase().includes('acompte'))?.unitPrice || 0;
          const remainingAmount = totalAmount - acompteAmount;
          
          return {
            id: `install-${invoice.id}`,
            paymentId: invoice.id,
            amount: remainingAmount,
            dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paidDate: invoice.paymentDate,
            status: invoice.status === 'Payée' ? 'paid' : 'pending'
          };
        });
      
      setInstallments(installmentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      // Afficher un message d'erreur plus clair
      alert('Erreur lors du chargement des paiements. Veuillez vérifier votre connexion et réessayer.');
      setPayments([]);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validation des données
      if (!formData.invoiceNumber || !formData.clientName || !formData.amount || formData.amount <= 0) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const newPayment: Payment = {
        id: Date.now().toString(),
        invoiceNumber: formData.invoiceNumber,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        dueDate: formData.dueDate,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        reference: formData.reference,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingPayment) {
        setPayments(payments.map(payment => payment.id === editingPayment.id ? { ...newPayment, id: editingPayment.id } : payment));
        alert('Paiement mis à jour avec succès');
      } else {
        setPayments([...payments, newPayment]);
        alert('Paiement enregistré avec succès');
      }

      // Reset form
      setFormData({
        invoiceNumber: '',
        clientName: '',
        clientEmail: '',
        amount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentMethod: 'credit_card' as 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal',
        status: 'pending' as 'paid' | 'pending' | 'overdue' | 'partial',
        reference: '',
        notes: ''
      });
      setShowForm(false);
      setEditingPayment(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement du paiement'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      invoiceNumber: payment.invoiceNumber,
      clientName: payment.clientName,
      clientEmail: payment.clientEmail,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      dueDate: payment.dueDate,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      setPayments(payments.filter(payment => payment.id !== id));
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod === selectedMethod;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
      case 'partial': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-50';
      case 'pending': return 'bg-yellow-50';
      case 'overdue': return 'bg-red-50';
      case 'partial': return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'partial': return 'Partiel';
      default: return status;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <TrendingUp className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'check': return <FileText className="w-4 h-4" />;
      case 'paypal': return <TrendingUp className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Carte bancaire';
      case 'bank_transfer': return 'Virement bancaire';
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'paypal': return 'PayPal';
      default: return method;
    }
  };

  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.status === 'paid').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const overduePayments = payments.filter(p => p.status === 'overdue').length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);

  // Fonction d'export CSV
  const exportToCSV = () => {
    const headers = [
      'Numéro Facture',
      'Nom Client',
      'Email Client',
      'Montant',
      'Date Paiement',
      'Date Échéance',
      'Méthode Paiement',
      'Statut',
      'Référence',
      'Date Création'
    ];

    const csvData = filteredPayments.map(payment => [
      payment.invoiceNumber,
      payment.clientName,
      payment.clientEmail,
      payment.amount.toString(),
      payment.paymentDate,
      payment.dueDate,
      getMethodText(payment.paymentMethod),
      getStatusText(payment.status),
      payment.reference,
      new Date(payment.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = window.document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des paiements</h1>
        <p className="text-gray-500">Suivez et gérez vos paiements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Paiements</p>
                <p className="text-xs text-gray-500">{totalPayments}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Payés</p>
                <p className="text-xs text-gray-500">{paidPayments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">En attente</p>
                <p className="text-xs text-gray-500">{pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">En retard</p>
                <p className="text-xs text-gray-500">{overduePayments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Montant Total</p>
                <p className="text-xs text-gray-500">{totalAmount.toLocaleString()} DH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Montant Encaissé</p>
                <p className="text-xs text-gray-500">{paidAmount.toLocaleString()} DH</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client ou référence..."
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Statut du paiement"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payés</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
              <option value="partial">Partiels</option>
            </select>
            
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Méthode de paiement"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="credit_card">Carte bancaire</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="cash">Espèces</option>
              <option value="check">Chèque</option>
              <option value="paypal">PayPal</option>
            </select>
            
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau Paiement
            </button>
            
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Liste des paiements</h3>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Filtrer par date
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Échéance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{payment.clientName}</p>
                      <p className="text-xs text-gray-500">{payment.clientEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.amount.toLocaleString()} DH</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.paymentDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.dueDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getMethodIcon(payment.paymentMethod)}
                      {getMethodText(payment.paymentMethod)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBg(payment.status)} ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => console.log('Voir paiement:', payment)}
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        onClick={() => handleEdit(payment)}
                        title="Modifier le paiement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(payment.id)}
                        title="Supprimer le paiement"
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

      {/* Add/Edit Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPayment ? 'Modifier le paiement' : 'Ajouter un nouveau paiement'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro Facture *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: FAC-2024-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Client *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Client *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="client@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (DH) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Paiement *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Échéance *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode Paiement *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Méthode de paiement"
                  >
                    <option value="credit_card">Carte bancaire</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="cash">Espèces</option>
                    <option value="check">Chèque</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Statut du paiement"
                  >
                    <option value="pending">En attente</option>
                    <option value="paid">Payé</option>
                    <option value="overdue">En retard</option>
                    <option value="partial">Partiel</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Référence du paiement"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPayment(null);
                    setFormData({
                      invoiceNumber: '',
                      clientName: '',
                      clientEmail: '',
                      amount: 0,
                      paymentDate: new Date().toISOString().split('T')[0],
                      dueDate: '',
                      paymentMethod: 'credit_card' as 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal',
                      status: 'pending' as 'paid' | 'pending' | 'overdue' | 'partial',
                      reference: '',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : (editingPayment ? 'Mettre à jour' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTracking;
