
import React, { useState, useMemo, useRef } from 'react';
import { Article, Company, ArticleType } from '../types';
import { Plus, Search, Trash2, Edit2, Package, Tag, Hash, X, Save, Layers, Upload, Download, AlertTriangle, Box, Wrench, BarChart3 } from 'lucide-react';
import { UNITS } from '../constants';

interface ArticleManagerProps {
  articles: Article[];
  company: Company;
  onCreate: (a: Article) => void;
  onUpdate: (id: string, a: Partial<Article>) => void;
  onDelete: (id: string) => void;
  onImport?: (articles: Partial<Article>[]) => Promise<{ imported: number; errors: any[] }>;
}

const ArticleManager: React.FC<ArticleManagerProps> = ({ articles, company, onCreate, onUpdate, onDelete, onImport }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | ArticleType>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Article>>({
    code: '',
    description: '',
    priceHt: 0,
    defaultVat: company.defaultVatRates[0],
    unit: 'U',
    category: 'Standard',
    type: 'product',
    stockQuantity: 0,
    stockMin: 0,
    trackStock: false
  });

  const filtered = useMemo(() => {
    return articles.filter(a => {
      const matchSearch = a.code.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.category?.toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === 'all' || a.type === filterType;
      const matchStock = !showLowStock || (a.trackStock && (a.stockQuantity || 0) <= (a.stockMin || 0));

      return matchSearch && matchType && matchStock;
    });
  }, [articles, search, filterType, showLowStock]);

  const lowStockCount = useMemo(() => {
    return articles.filter(a => a.trackStock && (a.stockQuantity || 0) <= (a.stockMin || 0)).length;
  }, [articles]);

  const stats = useMemo(() => {
    const products = articles.filter(a => a.type === 'product').length;
    const services = articles.filter(a => a.type === 'service').length;
    const totalValue = articles.reduce((sum, a) => sum + (a.priceHt * (a.stockQuantity || 0)), 0);
    return { products, services, totalValue };
  }, [articles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, { ...form, companyId: company.id } as Article);
    } else {
      onCreate({
        ...form,
        id: Math.random().toString(36).substr(2, 9),
        companyId: company.id
      } as Article);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({
      code: '',
      description: '',
      priceHt: 0,
      defaultVat: company.defaultVatRates[0],
      unit: 'U',
      category: 'Standard',
      type: 'product',
      stockQuantity: 0,
      stockMin: 0,
      trackStock: false
    });
  };

  const startEdit = (a: Article) => {
    setEditingId(a.id);
    setForm(a);
    setShowForm(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string): Partial<Article>[] => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
    const articles: Partial<Article>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const article: Partial<Article> = {};

      headers.forEach((header, index) => {
        const value = values[index];
        switch (header) {
          case 'code':
          case 'ref':
          case 'reference':
            article.code = value;
            break;
          case 'description':
          case 'designation':
          case 'name':
          case 'nom':
            article.description = value;
            break;
          case 'price':
          case 'prix':
          case 'priceht':
          case 'prix_ht':
            article.priceHt = parseFloat(value) || 0;
            break;
          case 'vat':
          case 'tva':
          case 'defaultvat':
            article.defaultVat = parseFloat(value) || 20;
            break;
          case 'unit':
          case 'unite':
            article.unit = value || 'U';
            break;
          case 'category':
          case 'categorie':
            article.category = value;
            break;
          case 'type':
            article.type = (value === 'service' ? 'service' : 'product') as ArticleType;
            break;
          case 'stock':
          case 'stockquantity':
          case 'quantity':
          case 'quantite':
            article.stockQuantity = parseInt(value) || 0;
            break;
          case 'stockmin':
          case 'stock_min':
          case 'min':
            article.stockMin = parseInt(value) || 0;
            break;
          case 'trackstock':
          case 'track_stock':
          case 'gestion_stock':
            article.trackStock = value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'oui';
            break;
        }
      });

      if (article.code || article.description) {
        articles.push(article);
      }
    }

    return articles;
  };

  const handleImport = async () => {
    if (!importData || !onImport) return;

    const parsedArticles = parseCSV(importData);
    if (parsedArticles.length === 0) {
      setImportResult({ imported: 0, errors: [{ error: 'Aucun article valide trouvé dans le fichier' }] });
      return;
    }

    const result = await onImport(parsedArticles);
    setImportResult(result);
  };

  const downloadTemplate = () => {
    const template = 'code;description;priceHt;defaultVat;unit;category;type;stockQuantity;stockMin;trackStock\nREF-001;Produit exemple;100.00;20;U;Standard;product;50;10;true\nSRV-001;Service exemple;150.00;20;H;Services;service;0;0;false';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_articles.csv';
    link.click();
  };

  const exportArticles = () => {
    const headers = ['code', 'description', 'priceHt', 'defaultVat', 'unit', 'category', 'type', 'stockQuantity', 'stockMin', 'trackStock'];
    const rows = articles.map(a => [
      a.code,
      a.description.replace(/[;\n]/g, ' '),
      a.priceHt,
      a.defaultVat,
      a.unit,
      a.category || '',
      a.type || 'product',
      a.stockQuantity || 0,
      a.stockMin || 0,
      a.trackStock ? 'true' : 'false'
    ].join(';'));

    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `articles_${company.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Catalogue Articles</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Gestion centralisée des produits et services</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-200 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Importer CSV
          </button>
          <button
            onClick={exportArticles}
            className="px-6 py-4 bg-gray-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exporter
          </button>
          <button
            onClick={() => { setEditingId(null); setShowForm(true); }}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200"
          >
            Nouvel Article
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Produits</p>
              <p className="text-2xl font-black text-gray-900">{stats.products}</p>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-purple-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Services</p>
              <p className="text-2xl font-black text-gray-900">{stats.services}</p>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-green-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Valeur Stock</p>
              <p className="text-2xl font-black text-gray-900">{stats.totalValue.toLocaleString()} <span className="text-sm text-gray-400">{company.currency}</span></p>
            </div>
          </div>
        </div>
        <div className={`glass p-6 rounded-2xl border ${lowStockCount > 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Bas</p>
              <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-[3rem] border-white/50 space-y-8">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
            <input
              className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-xl pl-12 pr-6 py-4 font-bold text-sm outline-none focus:border-blue-600 transition-all"
              placeholder="Chercher par code, désignation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filterType === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('product')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${filterType === 'product' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              <Box className="w-3 h-3" /> Produits
            </button>
            <button
              onClick={() => setFilterType('service')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${filterType === 'service' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
            >
              <Wrench className="w-3 h-3" /> Services
            </button>
          </div>

          {lowStockCount > 0 && (
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${showLowStock ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border border-red-200'}`}
            >
              <AlertTriangle className="w-3 h-3" /> Stock Bas ({lowStockCount})
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-blue-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Code / Catégorie</th>
                <th className="px-6 py-5">Désignation</th>
                <th className="px-6 py-5">Unité</th>
                <th className="px-6 py-5 text-right">Prix HT</th>
                <th className="px-6 py-5 text-center">TVA</th>
                <th className="px-6 py-5 text-center">Stock</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-300 italic font-black uppercase tracking-widest">
                    Aucun article trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-6 py-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.type === 'service' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        {a.type === 'service' ? (
                          <Wrench className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Box className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{a.code}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{a.category || 'Standard'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{a.description}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{a.unit}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black text-gray-900">{a.priceHt.toLocaleString()} <span className="text-[9px] text-blue-300 uppercase">{company.currency}</span></span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-[10px] font-black text-blue-400 bg-blue-50 px-3 py-1 rounded-full">{a.defaultVat}%</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {a.trackStock ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-black ${(a.stockQuantity || 0) <= (a.stockMin || 0) ? 'text-red-600' : 'text-green-600'}`}>
                            {a.stockQuantity || 0}
                          </span>
                          {(a.stockQuantity || 0) <= (a.stockMin || 0) && (
                            <span className="text-[8px] text-red-500 font-bold">Min: {a.stockMin}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(a)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(a.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-blue-900/40 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="glass p-10 rounded-[3rem] max-w-3xl w-full shadow-2xl border-2 border-white/50 space-y-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                  {editingId ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                  {editingId ? 'Modifier Article' : 'Nouveau Produit/Service'}
                </h3>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>

            {/* Type Selection */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-3">Type d'article</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'product', trackStock: form.trackStock })}
                  className={`flex-1 p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${form.type === 'product' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.type === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Box className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-black uppercase tracking-wider ${form.type === 'product' ? 'text-blue-600' : 'text-gray-600'}`}>Produit</p>
                    <p className="text-[10px] text-gray-400">Article physique avec stock</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'service', trackStock: false })}
                  className={`flex-1 p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${form.type === 'service' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.type === 'service' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-black uppercase tracking-wider ${form.type === 'service' ? 'text-purple-600' : 'text-gray-600'}`}>Service</p>
                    <p className="text-[10px] text-gray-400">Prestation sans stock</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Code Article</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                  <input
                    required
                    className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-600 font-bold uppercase tracking-widest text-sm"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="REF-001"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Catégorie</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                  <input
                    className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-600 font-bold text-sm"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Maintenance..."
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Désignation Commerciale</label>
                <textarea
                  required
                  className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-medium text-sm"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Détail du produit ou du service..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Prix Unitaire HT</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-600 font-black text-sm"
                    value={form.priceHt}
                    onChange={e => setForm({ ...form, priceHt: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Unité</label>
                  <select className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 outline-none font-bold text-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">TVA (%)</label>
                  <select
                    className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 outline-none font-bold text-sm"
                    value={String(form.defaultVat ?? company.defaultVatRates[0] ?? 20)}
                    onChange={e => setForm({ ...form, defaultVat: parseFloat(e.target.value) })}
                  >
                    {Array.from(new Set(company.defaultVatRates || [])).sort((a: any, b: any) => b - a).map(v => (
                      <option key={v} value={String(v)}>{v}%</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stock Management - Only for Products */}
            {form.type === 'product' && (
              <div className="border-t border-blue-100 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-800">Gestion du Stock</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, trackStock: !form.trackStock })}
                    className={`relative w-14 h-7 rounded-full transition-all ${form.trackStock ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${form.trackStock ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {form.trackStock && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Quantité en Stock</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-black text-sm"
                        value={form.stockQuantity || 0}
                        onChange={e => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">Stock Minimum (Alerte)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-black text-sm"
                        value={form.stockMin || 0}
                        onChange={e => setForm({ ...form, stockMin: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 font-black uppercase text-xs text-gray-400">Annuler</button>
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-200 flex items-center justify-center gap-3">
                <Save className="w-4 h-4" /> Enregistrer l'Article
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-blue-900/40 backdrop-blur-md">
          <div className="glass p-10 rounded-[3rem] max-w-2xl w-full shadow-2xl border-2 border-white/50 space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Import CSV</h3>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportData(''); setImportResult(null); }} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Importez vos articles depuis un fichier CSV. Les colonnes reconnues sont: code, description, priceHt, defaultVat, unit, category, type, stockQuantity, stockMin, trackStock
              </p>

              <button
                onClick={downloadTemplate}
                className="text-blue-600 text-sm font-bold flex items-center gap-2 hover:underline"
              >
                <Download className="w-4 h-4" /> Télécharger le modèle CSV
              </button>

              <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-bold"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  Cliquez pour sélectionner un fichier CSV
                </button>
                {importData && (
                  <p className="mt-4 text-green-600 text-sm font-bold">
                    Fichier chargé - {parseCSV(importData).length} articles détectés
                  </p>
                )}
              </div>

              {importResult && (
                <div className={`p-4 rounded-xl ${importResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className="font-bold text-sm">
                    {importResult.imported} articles importés avec succès
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      <p className="font-bold">{importResult.errors.length} erreurs:</p>
                      <ul className="list-disc list-inside">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err.code}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportData(''); setImportResult(null); }}
                className="flex-1 py-4 font-black uppercase text-xs text-gray-400"
              >
                Fermer
              </button>
              <button
                onClick={handleImport}
                disabled={!importData || !onImport}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-green-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleManager;
