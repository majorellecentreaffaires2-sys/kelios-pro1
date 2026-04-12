import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
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
  Building2,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  reference?: string;
  user: string;
  department: string;
  receipts?: string[];
}

interface ExpenseCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
  icon: string;
}

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    budget: 0,
    color: 'blue',
    icon: 'Package'
  });

  const expenseCategories: ExpenseCategory[] = categories;

  // Calculer les montants dépensés par catégorie
  const calculateCategorySpending = () => {
    const categorySpending: { [key: string]: number } = {};
    
    // Initialiser tous les montants dépensés à 0
    expenseCategories.forEach(category => {
      categorySpending[category.name] = 0;
    });
    
    // Calculer les dépenses réelles par catégorie
    expenses.forEach(expense => {
      if (categorySpending[expense.category] !== undefined) {
        categorySpending[expense.category] += expense.amount;
      }
    });
    
    return categorySpending;
  };

  // Mettre à jour les catégories avec les montants dépensés
  const updateCategoriesWithSpending = () => {
    const spending = calculateCategorySpending();
    const updatedCategories = expenseCategories.map(category => ({
      ...category,
      spent: spending[category.name] || 0
    }));
    setCategories(updatedCategories);
  };

  useEffect(() => {
    // Initialiser les catégories par défaut si aucune n'existe
    if (categories.length === 0) {
      const defaultCategories = [
        { id: '1', name: 'Fournitures', budget: 5000, spent: 0, color: 'blue', icon: 'Package' },
        { id: '2', name: 'Transport', budget: 3000, spent: 0, color: 'green', icon: 'Truck' },
        { id: '3', name: 'Marketing', budget: 2000, spent: 0, color: 'purple', icon: 'TrendingUp' },
        { id: '4', name: 'Salaires', budget: 15000, spent: 0, color: 'red', icon: 'DollarSign' },
        { id: '5', name: 'Loyer', budget: 5000, spent: 0, color: 'yellow', icon: 'Building2' },
        { id: '6', name: 'Autres', budget: 1000, spent: 0, color: 'gray', icon: 'Receipt' }
      ];
      setCategories(defaultCategories);
    }
    
    loadExpenseData();
  }, []);

  // Synchroniser les catégories lorsque les dépenses changent
  useEffect(() => {
    updateCategoriesWithSpending();
  }, [expenses]);

  const loadExpenseData = async () => {
    setLoading(true);
    try {
      // Initialiser avec les catégories prédéfinies (montants dépensés à 0)
      setCategories(expenseCategories);
      
      // Données initialisées à zéro - l'utilisateur pourra les remplir lui-même
      const mockExpenses: Expense[] = [];

      setExpenses(mockExpenses);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formulaire
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Fournitures',
    amount: 0,
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    paymentMethod: 'Carte bancaire',
    reference: '',
    user: 'Utilisateur actuel',
    department: 'Général'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newExpense: Expense = {
        id: Date.now().toString(),
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: formData.amount,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        user: formData.user,
        department: formData.department
      };

      let updatedExpenses;
      if (editingExpense) {
        updatedExpenses = expenses.map(expense => expense.id === editingExpense.id ? { ...newExpense, id: editingExpense.id } : expense);
      } else {
        updatedExpenses = [...expenses, newExpense];
      }
      
      setExpenses(updatedExpenses);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Fournitures',
        amount: 0,
        status: 'pending' as 'pending' | 'approved' | 'rejected',
        paymentMethod: 'Carte bancaire',
        reference: '',
        user: 'Utilisateur actuel',
        department: 'Général'
      });
      setShowForm(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      status: expense.status,
      paymentMethod: expense.paymentMethod,
      reference: expense.reference || '',
      user: expense.user,
      department: expense.department
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      const updatedExpenses = expenses.filter(expense => expense.id !== id);
      setExpenses(updatedExpenses);
    }
  };

  // Réinitialiser les budgets aux valeurs par défaut
  const resetBudgets = () => {
    const defaultCategories = [
      { id: '1', name: 'Fournitures', budget: 5000, spent: 0, color: 'blue', icon: 'Package' },
      { id: '2', name: 'Transport', budget: 3000, spent: 0, color: 'green', icon: 'Truck' },
      { id: '3', name: 'Marketing', budget: 2000, spent: 0, color: 'purple', icon: 'TrendingUp' },
      { id: '4', name: 'Salaires', budget: 15000, spent: 0, color: 'red', icon: 'DollarSign' },
      { id: '5', name: 'Loyer', budget: 5000, spent: 0, color: 'yellow', icon: 'Building2' },
      { id: '6', name: 'Autres', budget: 1000, spent: 0, color: 'gray', icon: 'Receipt' }
    ];
    
    // Recalculer les montants dépensés avec les catégories par défaut
    const spending: { [key: string]: number } = {};
    defaultCategories.forEach(category => {
      spending[category.name] = 0;
    });
    
    expenses.forEach(expense => {
      if (spending[expense.category] !== undefined) {
        spending[expense.category] += expense.amount;
      }
    });
    
    const updatedCategories = defaultCategories.map(category => ({
      ...category,
      spent: spending[category.name] || 0
    }));
    
    setCategories(updatedCategories);
  };

  // Ajouter ou modifier une catégorie
  const handleSaveCategory = () => {
    if (editingCategory) {
      // Modifier une catégorie existante
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...categoryFormData, id: editingCategory.id } : cat
      ));
    } else {
      // Ajouter une nouvelle catégorie
      const newCategory: ExpenseCategory = {
        id: Date.now().toString(),
        ...categoryFormData,
        spent: 0
      };
      setCategories([...categories, newCategory]);
    }
    
    // Réinitialiser le formulaire
    setCategoryFormData({ name: '', budget: 0, color: 'blue', icon: 'Package' });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  // Supprimer une catégorie
  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  // Modifier une catégorie
  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      budget: category.budget,
      color: category.color,
      icon: category.icon
    });
    setShowCategoryForm(true);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || expense.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50';
      case 'pending': return 'bg-yellow-50';
      case 'rejected': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvée';
      case 'pending': return 'En attente';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').length;
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

  // Fonction d'export CSV
  const exportToCSV = () => {
    const headers = [
      'Description',
      'Montant',
      'Catégorie',
      'Date Dépense',
      'Statut',
      'Méthode Paiement',
      'Référence',
      'Date Création'
    ];

    const csvData = filteredExpenses.map(expense => [
      expense.description,
      expense.amount.toString(),
      expense.category,
      expense.date,
      expense.status === 'paid' ? 'Payée' : 'En attente',
      expense.paymentMethod,
      expense.reference || '',
      new Date(expense.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = window.document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `depenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des dépenses</h1>
        <p className="text-gray-500">Suivez et gérez toutes les dépenses de l'entreprise</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Total Dépenses</p>
                <p className="text-xs text-gray-500">{totalExpenses.toLocaleString()} DH</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Approuvées</p>
                <p className="text-xs text-gray-500">{paidExpenses.toLocaleString()} DH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">En Attente</p>
                <p className="text-xs text-gray-500">{pendingExpenses.toLocaleString()} DH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Budget Utilisé</p>
                <p className="text-xs text-gray-500">{Math.round((totalExpenses / categories.reduce((sum, cat) => sum + cat.budget, 0)) * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Budget Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget par Catégorie</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryFormData({ name: '', budget: 0, color: 'blue', icon: 'Package' });
                setShowCategoryForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter Catégorie
            </button>
            <button
              onClick={resetBudgets}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
              title="Réinitialiser les budgets aux valeurs par défaut"
            >
              <RefreshCw className="w-4 h-4" />
              Réinitialiser Budgets
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category.id} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-${category.color}-100 flex items-center justify-center`}>
                    <span className="text-sm font-medium">{category.icon}</span>
                  </div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{category.budget.toLocaleString()} DH</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Modifier la catégorie"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dépensé</span>
                  <span className={`font-medium ${category.spent > category.budget ? 'text-red-600' : 'text-green-600'}`}>
                    {category.spent.toLocaleString()} DH
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      category.spent > category.budget ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((category.spent / category.budget) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Restant</span>
                  <span className="font-medium text-gray-900">
                    {Math.max(0, category.budget - category.spent).toLocaleString()} DH
                  </span>
                </div>
              </div>
            </div>
          ))}
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
                placeholder="Rechercher une dépense..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="approved">Approuvées</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejetées</option>
            </select>
            
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Dépense
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

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Liste des dépenses</h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{expense.description}</span>
                      {expense.reference && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">
                          {expense.reference}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.amount} DH</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBg(expense.status)} ${getStatusColor(expense.status)}`}>
                      {getStatusText(expense.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.user}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        onClick={() => handleEdit(expense)}
                        title="Modifier la dépense"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Voir le reçu"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        onClick={() => handleDelete(expense.id)}
                        title="Supprimer la dépense"
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

      {/* Add/Edit Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingExpense ? 'Modifier la dépense' : 'Ajouter une nouvelle dépense'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Achat de fournitures de bureau"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Catégorie de la dépense"
                  >
                    <option value="Fournitures">Fournitures</option>
                    <option value="Transport">Transport</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Salaires">Salaires</option>
                    <option value="Loyer">Loyer</option>
                    <option value="Autres">Autres</option>
                  </select>
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
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'pending' | 'approved' | 'rejected'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    title="Statut de la dépense"
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvée</option>
                    <option value="rejected">Rejetée</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de paiement *
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
                    Référence
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: FACT-2024-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Département
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Général"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingExpense(null);
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      category: 'Fournitures',
                      amount: 0,
                      status: 'pending' as 'pending' | 'approved' | 'rejected',
                      paymentMethod: 'Carte bancaire',
                      reference: '',
                      user: 'Utilisateur actuel',
                      department: 'Général'
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
                  {loading ? 'Enregistrement...' : (editingExpense ? 'Mettre à jour' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Modifier la Catégorie' : 'Ajouter une Catégorie'}
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSaveCategory(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la catégorie *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Marketing"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (DH) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={categoryFormData.budget}
                    onChange={(e) => setCategoryFormData({...categoryFormData, budget: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <select
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData({...categoryFormData, color: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="blue">Bleu</option>
                    <option value="green">Vert</option>
                    <option value="purple">Violet</option>
                    <option value="red">Rouge</option>
                    <option value="yellow">Jaune</option>
                    <option value="orange">Orange</option>
                    <option value="gray">Gris</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icône
                  </label>
                  <select
                    value={categoryFormData.icon}
                    onChange={(e) => setCategoryFormData({...categoryFormData, icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Package">📦 Colis</option>
                    <option value="Truck">🚚 Camion</option>
                    <option value="TrendingUp">📈 Tendance</option>
                    <option value="DollarSign">💵 Dollar</option>
                    <option value="Building2">🏢 Bâtiment</option>
                    <option value="Receipt">🧾 Ticket</option>
                    <option value="ShoppingCart">🛒 Panier</option>
                    <option value="Coffee">☕ Café</option>
                    <option value="Heart">❤️ Cœur</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: '', budget: 0, color: 'blue', icon: 'Package' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;
