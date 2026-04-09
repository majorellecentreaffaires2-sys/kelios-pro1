import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Calendar,
  Receipt,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
  Image,
  File,
  Folder,
  X,
  Archive
} from 'lucide-react';
import { api } from '../../apiClient';

interface Sale {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: SaleItem[];
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  salesperson: string;
  notes?: string;
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');

  // Formulaire
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    items: [] as SaleItem[],
    saleDate: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    paymentMethod: 'Carte bancaire',
    paymentStatus: 'pending' as 'pending' | 'paid' | 'overdue',
    status: 'pending' as 'pending' | 'confirmed' | 'delivered' | 'cancelled',
    salesperson: 'Utilisateur actuel',
    notes: ''
  });

  // États pour la gestion des documents
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Récupérer l'entreprise active
      const companiesResponse = await api.getCompanies();
      const activeCompany = companiesResponse.find((c: any) => c.isActive);
      
      if (!activeCompany) {
        console.warn('Aucune entreprise active trouvée');
        setSales([]);
        return;
      }
      
      // Récupérer toutes les factures de l'entreprise active
      const response = await api.getInvoices(activeCompany.id);
      const allInvoices = response || [];
      
      // Filtrer pour ne garder que les factures de type "Standard" (ventes)
      const salesInvoices = allInvoices.filter((invoice: any) => 
        invoice.type === 'Standard' || 
        (invoice.type === 'Devis' && invoice.documentNature === 'Facture')
      );
      
      // Transformer les factures en objets Sale
      const salesData = salesInvoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client?.name || 'Client inconnu',
        clientEmail: invoice.client?.email || '',
        items: invoice.items?.map((item: any) => ({
          id: item.id || Date.now().toString(),
          productId: item.id || '',
          productName: item.description || 'Produit',
          sku: item.reference || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * (item.quantity || 1)
        })) || [],
        saleDate: invoice.date || new Date().toISOString().split('T')[0],
        totalAmount: invoice.totalTtc || 0,
        paymentMethod: invoice.paymentMethod || 'Carte bancaire',
        paymentStatus: invoice.status === 'Payée' ? 'paid' : invoice.status === 'En attente' ? 'pending' : 'overdue',
        status: invoice.status === 'Payée' ? 'delivered' : invoice.status === 'En attente' ? 'confirmed' : 'pending',
        salesperson: invoice.createdBy || 'Utilisateur actuel',
        notes: invoice.notes || '',
        documents: [],
        createdAt: invoice.createdAt || new Date().toISOString(),
        updatedAt: invoice.updatedAt || new Date().toISOString()
      }));
      
      setSales(salesData);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour la gestion des documents
  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedSale) return;
    
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async () => {
    if (!selectedSale || uploadedFiles.length === 0) return;
    
    setLoading(true);
    try {
      const newDocuments: Document[] = uploadedFiles.map(file => ({
        id: Date.now().toString() + Math.random().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Utilisateur actuel',
        description: ''
      }));

      // Mettre à jour la vente avec les nouveaux documents
      setSales(sales.map(sale => 
        sale.id === selectedSale.id 
          ? { ...sale, documents: [...(sale.documents || []), ...newDocuments] }
          : sale
      ));

      // Mettre à jour la vente sélectionnée
      setSelectedSale(prev => prev ? {
        ...prev,
        documents: [...(prev.documents || []), ...newDocuments]
      } : null);

      // Réinitialiser
      setUploadedFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Erreur lors de l\'upload des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = (saleId: string, documentId: string) => {
    setSales(sales.map(sale => 
      sale.id === saleId 
        ? { ...sale, documents: sale.documents?.filter(doc => doc.id !== documentId) || [] }
        : sale
    ));

    if (selectedSale && selectedSale.id === saleId) {
      setSelectedSale(prev => prev ? {
        ...prev,
        documents: prev.documents?.filter(doc => doc.id !== documentId) || []
      } : null);
    }
  };

  const downloadDocument = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const openDocumentsModal = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDocumentsModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  // Fonction d'export CSV
  const exportToCSV = () => {
    const headers = [
      'Numéro Facture',
      'Nom Client',
      'Email Client',
      'Date Vente',
      'Montant Total',
      'Méthode Paiement',
      'Statut Paiement',
      'Statut Vente',
      'Vendeur',
      'Nombre Articles',
      'Date Création'
    ];

    const csvData = filteredSales.map(sale => [
      sale.invoiceNumber,
      sale.clientName,
      sale.clientEmail,
      sale.saleDate,
      sale.totalAmount.toString(),
      sale.paymentMethod,
      sale.paymentStatus,
      sale.status,
      sale.salesperson,
      sale.items.length.toString(),
      new Date(sale.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = window.document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newSale: Sale = {
        id: Date.now().toString(),
        invoiceNumber: formData.invoiceNumber,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        items: formData.items,
        saleDate: formData.saleDate,
        totalAmount: formData.totalAmount,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        status: formData.status,
        salesperson: formData.salesperson,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingSale) {
        setSales(sales.map(sale => sale.id === editingSale.id ? { ...newSale, id: editingSale.id } : sale));
      } else {
        setSales([...sales, newSale]);
      }

      // Reset form
      setFormData({
        invoiceNumber: '',
        clientName: '',
        clientEmail: '',
        items: [] as SaleItem[],
        saleDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        paymentMethod: 'Carte bancaire',
        paymentStatus: 'pending' as 'pending' | 'paid' | 'overdue',
        status: 'pending' as 'pending' | 'confirmed' | 'delivered' | 'cancelled',
        salesperson: 'Utilisateur actuel',
        notes: ''
      });
      setShowForm(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      invoiceNumber: sale.invoiceNumber,
      clientName: sale.clientName,
      clientEmail: sale.clientEmail,
      items: sale.items,
      saleDate: sale.saleDate,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      status: sale.status,
      salesperson: sale.salesperson,
      notes: sale.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      setSales(sales.filter(sale => sale.id !== id));
    }
  };

  // Ajouter un article au formulaire
  const addItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  // Mettre à jour un article
  const updateItem = (itemId: string, field: keyof SaleItem, value: any) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        // Recalculer le prix total si quantité ou prix unitaire change
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    
    // Recalculer le montant total
    const newTotalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: newTotalAmount
    });
  };

  // Supprimer un article
  const removeItem = (itemId: string) => {
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    const newTotalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: newTotalAmount
    });
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'delivered': return 'text-blue-600';
      case 'cancelled': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50';
      case 'delivered': return 'bg-blue-50';
      case 'cancelled': return 'bg-red-50';
      case 'pending': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const totalSales = sales.length;
  const confirmedSales = sales.filter(s => s.status === 'confirmed').length;
  const deliveredSales = sales.filter(s => s.status === 'delivered').length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des ventes</h1>
        <p className="text-gray-500">Suivez et gérez toutes les ventes de l'entreprise</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Ventes</p>
                <p className="text-xs text-gray-500">{totalSales}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Confirmées</p>
                <p className="text-xs text-gray-500">{confirmedSales}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Livrées</p>
                <p className="text-xs text-gray-500">{deliveredSales}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Chiffre d'Affaires</p>
                <p className="text-xs text-gray-500">{totalRevenue.toLocaleString()} DH</p>
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              title="Statut de la vente"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="delivered">Livrées</option>
              <option value="cancelled">Annulées</option>
            </select>
            
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Vente
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

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Liste des ventes</h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{sale.clientName}</p>
                      <p className="text-xs text-gray-500">{sale.clientEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.saleDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBg(sale.status)} ${getStatusColor(sale.status)}`}>
                      {getStatusText(sale.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.totalAmount} DH</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.salesperson}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => console.log('Voir vente:', sale)}
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        onClick={() => handleEdit(sale)}
                        title="Modifier la vente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        onClick={() => openDocumentsModal(sale)}
                        title="Gérer les documents"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(sale.id)}
                        title="Supprimer la vente"
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

      {/* Add/Edit Sale Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSale ? 'Modifier la vente' : 'Ajouter une nouvelle vente'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informations principales */}
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
                    Date Vente *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.saleDate}
                    onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    placeholder="Ex: client@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Statut de la vente"
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode Paiement *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Méthode de paiement"
                  >
                    <option value="Carte bancaire">Carte bancaire</option>
                    <option value="Espèces">Espèces</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Chèque">Chèque</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut Paiement *
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Statut du paiement"
                  >
                    <option value="pending">En attente</option>
                    <option value="paid">Payé</option>
                    <option value="overdue">En retard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendeur *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.salesperson}
                    onChange={(e) => setFormData({...formData, salesperson: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nom du vendeur"
                  />
                </div>
              </div>
              
              {/* Articles */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Articles</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un article
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produit *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Nom du produit"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Référence"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantité *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prix Unit. *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prix Total
                          </label>
                          <div className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-medium">
                            {item.totalPrice.toFixed(2)} DH
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer l'article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Montant total et notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant Total (DH)
                  </label>
                  <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-lg font-bold text-blue-600">
                    {formData.totalAmount.toFixed(2)} DH
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
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSale(null);
                    setFormData({
                      invoiceNumber: '',
                      clientName: '',
                      clientEmail: '',
                      items: [] as SaleItem[],
                      saleDate: new Date().toISOString().split('T')[0],
                      totalAmount: 0,
                      paymentMethod: 'Carte bancaire',
                      paymentStatus: 'pending' as 'pending' | 'paid' | 'overdue',
                      status: 'pending' as 'pending' | 'confirmed' | 'delivered' | 'cancelled',
                      salesperson: 'Utilisateur actuel',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.items.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : (editingSale ? 'Mettre à jour' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Management Modal */}
      {showDocumentsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Gestion des documents - Vente {selectedSale.invoiceNumber}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Client: {selectedSale.clientName} | {selectedSale.documents?.length || 0} document(s)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocumentsModal(false);
                    setSelectedSale(null);
                    setUploadedFiles([]);
                    setUploadProgress({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Télécharger des documents
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Glissez-déposez des fichiers ici ou cliquez pour sélectionner
                  </p>
                  
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Cliquez pour sélectionner ou glissez des fichiers
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Formats supportés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files to Upload */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fichiers à télécharger</h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={uploadDocuments}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Téléchargement...' : `Télécharger ${uploadedFiles.length} fichier(s)`}
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Documents */}
              {selectedSale.documents && selectedSale.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Documents archivés</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSale.documents.map((document) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getFileIcon(document.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {document.name}
                              </p>
                              <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          <p>Ajouté le {new Date(document.uploadedAt).toLocaleDateString()}</p>
                          <p>Par {document.uploadedBy}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadDocument(document)}
                            className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Télécharger
                          </button>
                          <button
                            onClick={() => deleteDocument(selectedSale.id, document.id)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!selectedSale.documents || selectedSale.documents.length === 0) && uploadedFiles.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
                  <p className="text-sm text-gray-500">
                    Cette vente n'a aucun document archivé. Téléchargez des documents pour commencer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;
