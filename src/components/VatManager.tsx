import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { Percent, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { api } from '../apiClient';

interface VatRate {
  id: string;
  companyId: string;
  rate: number;
  label: string;
  description: string;
  active: boolean;
  defaultRate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VatManagerProps {
  company: Company;
  onUpdateCompany: (id: string, updates: Partial<Company>) => void;
}

const VatManager: React.FC<VatManagerProps> = ({ company, onUpdateCompany }) => {
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRate, setEditingRate] = useState<VatRate | null>(null);
  const [form, setForm] = useState({ rate: 0, label: '', description: '', active: true, defaultRate: false });

  // Load VAT rates from database
  useEffect(() => {
    loadVatRates();
  }, [company.id]);

  const loadVatRates = async () => {
    setIsLoading(true);
    try {
      const rates = await api.getVatRates(company.id);
      setVatRates(rates);

      // If no rates exist, create default ones
      if (rates.length === 0) {
        await createDefaultRates();
      }
    } catch (error) {
      console.error('Failed to load VAT rates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultRates = async () => {
    const defaultRates = [
      { rate: 0, label: 'Exonéré', description: 'Produits et services exonérés de TVA' },
      { rate: 7, label: 'Taux Réduit', description: 'Taux réduit pour certains produits de première nécessité' },
      { rate: 10, label: 'Taux Intermédiaire', description: 'Taux intermédiaire pour les services de restauration' },
      { rate: 14, label: 'Taux Normal', description: 'Taux normal pour certains biens et services' },
      { rate: 20, label: 'Taux Standard', description: 'Taux standard applicable par défaut' }
    ];

    for (let i = 0; i < defaultRates.length; i++) {
      const rate = defaultRates[i];
      await api.createVatRate({
        id: `vat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
        ...rate,
        companyId: company.id,
        active: true,
        defaultRate: i === defaultRates.length - 1 // Set 20% as default
      });
    }

    await loadVatRates();
  };

  const handleAddRate = async () => {
    if (form.rate === undefined || form.rate === null || !form.label) return;

    try {
      await api.createVatRate({
        id: `vat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        companyId: company.id,
        rate: form.rate,
        label: form.label,
        description: form.description,
        active: form.active,
        defaultRate: form.defaultRate
      });

      setShowAddForm(false);
      resetForm();
      await loadVatRates();
    } catch (error) {
      console.error('Failed to add VAT rate:', error);
    }
  };

  const handleUpdateRate = async () => {
    if (!editingRate || form.rate === undefined || form.rate === null || !form.label) return;

    try {
      await api.updateVatRate(editingRate.id, {
        rate: form.rate,
        label: form.label,
        description: form.description,
        active: form.active,
        defaultRate: form.defaultRate
      });

      setEditingRate(null);
      resetForm();
      await loadVatRates();
    } catch (error) {
      console.error('Failed to update VAT rate:', error);
    }
  };

  const handleDeleteRate = async (id: string) => {
    try {
      await api.deleteVatRate(id);
      await loadVatRates();
    } catch (error) {
      console.error('Failed to delete VAT rate:', error);
    }
  };

  const handleToggleActive = async (id: string) => {
    const rate = vatRates.find(r => r.id === id);
    if (!rate) return;

    try {
      await api.updateVatRate(id, { active: !rate.active });
      await loadVatRates();
    } catch (error) {
      console.error('Failed to toggle VAT rate:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, set all rates to non-default
      for (const rate of vatRates) {
        if (rate.id !== id) {
          await api.updateVatRate(rate.id, { defaultRate: false });
        }
      }

      // Then set the selected rate as default
      await api.updateVatRate(id, { defaultRate: true });
      await loadVatRates();
    } catch (error) {
      console.error('Failed to set default VAT rate:', error);
    }
  };

  const resetForm = () => {
    setForm({ rate: 0, label: '', description: '', active: true, defaultRate: false });
  };

  const startEdit = (rate: VatRate) => {
    setEditingRate(rate);
    setForm({
      rate: rate.rate,
      label: rate.label,
      description: rate.description,
      active: rate.active,
      defaultRate: rate.defaultRate
    });
  };

  const ensureMinimumRates = async () => {
    if (vatRates.length < 5) {
      await createDefaultRates();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-gray-900">Gestion des Taux TVA</h1>
          <p className="text-sm text-gray-500 font-medium">Configurez les taux de TVA pour votre entreprise. Minimum 5 taux recommandés.</p>
        </div>
        <div className="flex gap-4">
          {vatRates.length < 5 && (
            <button
              onClick={ensureMinimumRates}
              className="px-6 py-3 bg-amber-100 text-amber-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-amber-200 transition-all"
            >
              <AlertCircle className="w-4 h-4" />
              Ajouter les 5 taux standards
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouveau Taux
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm font-black text-blue-700">Mise à jour en cours...</span>
        </div>
      )}

      {vatRates.length < 5 && (
        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-black text-amber-900 uppercase mb-2">Configuration Incomplète</h3>
            <p className="text-sm font-bold text-amber-700">
              Il est recommandé d'avoir au minimum 5 taux de TVA configurés pour couvrir tous les cas d'usage.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Taux</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Libellé & Description</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Statut</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vatRates.map((vatRate) => (
              <tr
                key={vatRate.id}
                className={`group transition-all hover:bg-blue-50/30 ${!vatRate.active ? 'opacity-50' : ''} ${vatRate.defaultRate ? 'bg-blue-50/20' : ''}`}
              >
                <td className="px-8 py-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${vatRate.defaultRate ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white border-2 border-gray-100 text-gray-900'}`}>
                    {vatRate.rate}%
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 text-base">{vatRate.label}</span>
                      {vatRate.defaultRate && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-medium line-clamp-1">{vatRate.description}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <button
                    onClick={() => handleToggleActive(vatRate.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${vatRate.active
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${vatRate.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    {vatRate.active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!vatRate.defaultRate && vatRate.active && (
                      <button
                        onClick={() => handleSetDefault(vatRate.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all group/btn"
                        title="Définir par défaut"
                      >
                        <Settings className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-500" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(vatRate)}
                      className="p-2 text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm shadow-transparent hover:shadow-blue-100"
                      title="Modifier"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    {!vatRate.defaultRate && (
                      <button
                        onClick={() => handleDeleteRate(vatRate.id)}
                        className="p-2 text-red-100 hover:text-red-600 hover:bg-white rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vatRates.length === 0 && !isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Percent className="w-16 h-16 opacity-10" />
            <p className="font-black uppercase tracking-widest text-xs">Aucun taux configuré</p>
          </div>
        )}
      </div>

      {(showAddForm || editingRate) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {editingRate ? 'Modifier le Taux' : 'Nouveau Taux TVA'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Taux (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-4 py-3 font-bold outline-none focus:border-blue-600"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })}
                  placeholder="20"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Libellé</label>
                <input
                  type="text"
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-4 py-3 font-bold outline-none focus:border-blue-600"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Taux Standard"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full bg-blue-50/20 border-2 border-blue-50 rounded-2xl px-4 py-3 font-medium outline-none focus:border-blue-600"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du taux de TVA..."
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-black text-gray-700">Actif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.defaultRate}
                    onChange={(e) => setForm({ ...form, defaultRate: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-black text-gray-700">Par défaut</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRate(null);
                  resetForm();
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={editingRate ? handleUpdateRate : handleAddRate}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingRate ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VatManager;
