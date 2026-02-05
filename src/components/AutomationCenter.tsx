import React, { useState, useEffect, useMemo } from 'react';
import { Company, Invoice, ContactInfo, ReminderSettings, RecurringSchedule, InvoiceTemplate } from '../types';
import {
  Bell, Mail, Calendar, Clock, RefreshCw, Send, Settings, AlertTriangle,
  CheckCircle, XCircle, Plus, Trash2, Edit2, X, Save, Play, Pause,
  FileText, Users, TrendingUp, BarChart3, ChevronRight, Zap
} from 'lucide-react';
import { apiClient } from '../apiClient';

interface AutomationCenterProps {
  company: Company;
  invoices: Invoice[];
  clients: ContactInfo[];
  templates: InvoiceTemplate[];
  onRefresh: () => void;
}

type TabType = 'overview' | 'reminders' | 'recurring' | 'reports';

const AutomationCenter: React.FC<AutomationCenterProps> = ({
  company,
  invoices,
  clients,
  templates,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [company.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, schedulesRes] = await Promise.all([
        apiClient.get(`/api/reminder-settings?companyId=${company.id}`),
        apiClient.get(`/api/recurring-schedules?companyId=${company.id}`)
      ]);
      setReminderSettings(settingsRes);
      setRecurringSchedules(schedulesRes);
    } catch (error) {
      console.error('Error loading automation data:', error);
    }
    setLoading(false);
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return dueDate < today && !['Payée', 'Annulée', 'Brouillon'].includes(inv.status);
    });

    const dueSoonInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 7 && !['Payée', 'Annulée', 'Brouillon'].includes(inv.status);
    });

    const activeSchedules = recurringSchedules.filter(s => s.isActive).length;

    let totalOverdueAmount = 0;
    overdueInvoices.forEach(inv => {
      let total = 0;
      inv.items.forEach(item => {
        item.subItems.forEach(sub => {
          const lineHT = sub.quantity * sub.price * (1 - (sub.discount || 0) / 100);
          total += lineHT * (1 + sub.taxRate / 100);
        });
      });
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      totalOverdueAmount += total - paid;
    });

    return {
      overdueCount: overdueInvoices.length,
      dueSoonCount: dueSoonInvoices.length,
      activeSchedules,
      totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100
    };
  }, [invoices, recurringSchedules]);

  // Save reminder settings
  const saveReminderSettings = async () => {
    if (!reminderSettings) return;
    setSaving(true);
    try {
      await apiClient.post('/api/reminder-settings', reminderSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    setSaving(false);
  };

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState<Partial<RecurringSchedule>>({
    frequency: 'monthly',
    isActive: true
  });

  const openScheduleForm = (schedule?: RecurringSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleForm(schedule);
    } else {
      setEditingSchedule(null);
      setScheduleForm({
        frequency: 'monthly',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        nextRunDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowScheduleForm(true);
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      if (editingSchedule) {
        await apiClient.put(`/api/recurring-schedules/${editingSchedule.id}`, scheduleForm);
      } else {
        const newSchedule = {
          ...scheduleForm,
          id: Math.random().toString(36).substr(2, 9),
          companyId: company.id,
          createdAt: new Date().toISOString()
        };
        await apiClient.post('/api/recurring-schedules', newSchedule);
      }
      await loadData();
      setShowScheduleForm(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
    setSaving(false);
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Supprimer cette planification récurrente ?')) return;
    try {
      await apiClient.delete(`/api/recurring-schedules/${id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const toggleScheduleActive = async (schedule: RecurringSchedule) => {
    try {
      await apiClient.put(`/api/recurring-schedules/${schedule.id}`, {
        isActive: !schedule.isActive
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Centre d'Automatisation</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Rappels, Factures Récurrentes & Rapports</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6">
        <div className={`glass p-6 rounded-2xl border ${stats.overdueCount > 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.overdueCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Factures en retard</p>
              <p className={`text-2xl font-black ${stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.overdueCount}</p>
            </div>
          </div>
        </div>
        <div className={`glass p-6 rounded-2xl border ${stats.dueSoonCount > 0 ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.dueSoonCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <Clock className={`w-6 h-6 ${stats.dueSoonCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Échéance proche (7j)</p>
              <p className={`text-2xl font-black ${stats.dueSoonCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{stats.dueSoonCount}</p>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Récurrences actives</p>
              <p className="text-2xl font-black text-gray-900">{stats.activeSchedules}</p>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border border-green-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Montant en retard</p>
              <p className="text-2xl font-black text-gray-900">{stats.totalOverdueAmount.toLocaleString()} <span className="text-sm text-gray-400">{company.currency}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Zap },
          { id: 'reminders', label: 'Rappels Auto', icon: Bell },
          { id: 'recurring', label: 'Factures Récurrentes', icon: RefreshCw },
          { id: 'reports', label: 'Rapports Mensuels', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass p-8 rounded-[3rem] border-white/50">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h2 className="text-xl font-black uppercase tracking-tighter">Tableau de Bord Automatisation</h2>

            {/* Overdue Invoices */}
            {stats.overdueCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="font-black text-red-800 uppercase text-sm flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" /> Factures en Retard
                </h3>
                <div className="space-y-3">
                  {invoices
                    .filter(inv => {
                      const dueDate = new Date(inv.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return dueDate < today && !['Payée', 'Annulée', 'Brouillon'].includes(inv.status);
                    })
                    .slice(0, 5)
                    .map(inv => {
                      const daysOverdue = Math.ceil((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl p-4">
                          <div>
                            <p className="font-black text-sm">{inv.invoiceNumber}</p>
                            <p className="text-xs text-gray-500">{inv.client.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-600 font-black text-sm">{daysOverdue} jours de retard</p>
                            <p className="text-xs text-gray-400">Échéance: {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Due Soon */}
            {stats.dueSoonCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <h3 className="font-black text-orange-800 uppercase text-sm flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" /> Échéances Proches (7 jours)
                </h3>
                <div className="space-y-3">
                  {invoices
                    .filter(inv => {
                      const dueDate = new Date(inv.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return daysUntilDue >= 0 && daysUntilDue <= 7 && !['Payée', 'Annulée', 'Brouillon'].includes(inv.status);
                    })
                    .slice(0, 5)
                    .map(inv => {
                      const daysUntilDue = Math.ceil((new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={inv.id} className="flex items-center justify-between bg-white rounded-xl p-4">
                          <div>
                            <p className="font-black text-sm">{inv.invoiceNumber}</p>
                            <p className="text-xs text-gray-500">{inv.client.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-600 font-black text-sm">
                              {daysUntilDue === 0 ? "Aujourd'hui" : `Dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-xs text-gray-400">Échéance: {new Date(inv.dueDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-6">
              <button
                onClick={() => setActiveTab('reminders')}
                className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-left hover:bg-blue-100 transition-all group"
              >
                <Bell className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-black text-blue-900">Configurer les Rappels</h3>
                <p className="text-sm text-blue-600 mt-1">Automatisez les relances de factures impayées</p>
                <ChevronRight className="w-5 h-5 text-blue-400 mt-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setActiveTab('recurring')}
                className="p-6 bg-purple-50 border border-purple-200 rounded-2xl text-left hover:bg-purple-100 transition-all group"
              >
                <RefreshCw className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-black text-purple-900">Factures Récurrentes</h3>
                <p className="text-sm text-purple-600 mt-1">Planifiez des factures automatiques</p>
                <ChevronRight className="w-5 h-5 text-purple-400 mt-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="p-6 bg-green-50 border border-green-200 rounded-2xl text-left hover:bg-green-100 transition-all group"
              >
                <BarChart3 className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-black text-green-900">Rapports Mensuels</h3>
                <p className="text-sm text-green-600 mt-1">Recevez un résumé mensuel par email</p>
                <ChevronRight className="w-5 h-5 text-green-400 mt-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && reminderSettings && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Configuration des Rappels Automatiques</h2>
              <button
                onClick={saveReminderSettings}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

            {/* Auto Reminder Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-blue-900">Rappels Automatiques</h3>
                    <p className="text-sm text-blue-600">Envoyer des emails de relance pour les factures impayées</p>
                  </div>
                </div>
                <button
                  onClick={() => setReminderSettings({ ...reminderSettings, enableAutoReminder: !reminderSettings.enableAutoReminder })}
                  className={`relative w-14 h-7 rounded-full transition-all ${reminderSettings.enableAutoReminder ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${reminderSettings.enableAutoReminder ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {reminderSettings.enableAutoReminder && (
                <div className="mt-6 space-y-6 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-3">
                      Envoyer rappel après (jours de retard)
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {[3, 7, 14, 21, 30, 45, 60].map(day => (
                        <button
                          key={day}
                          onClick={() => {
                            const days = reminderSettings.reminderDays || [];
                            if (days.includes(day)) {
                              setReminderSettings({ ...reminderSettings, reminderDays: days.filter(d => d !== day) });
                            } else {
                              setReminderSettings({ ...reminderSettings, reminderDays: [...days, day].sort((a, b) => a - b) });
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-black text-sm transition-all ${(reminderSettings.reminderDays || []).includes(day) ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                        >
                          {day}j
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">
                      Objet de l'email
                    </label>
                    <input
                      className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-medium text-sm"
                      value={reminderSettings.reminderEmailSubject}
                      onChange={e => setReminderSettings({ ...reminderSettings, reminderEmailSubject: e.target.value })}
                      placeholder="Rappel: Facture {invoiceNumber} en attente"
                    />
                    <p className="text-xs text-gray-400 mt-1">Variables: {'{invoiceNumber}'}, {'{amount}'}, {'{currency}'}, {'{dueDate}'}, {'{clientName}'}, {'{companyName}'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-800 block mb-2">
                      Corps de l'email
                    </label>
                    <textarea
                      className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 outline-none focus:border-blue-600 font-medium text-sm"
                      rows={6}
                      value={reminderSettings.reminderEmailBody}
                      onChange={e => setReminderSettings({ ...reminderSettings, reminderEmailBody: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Due Date Notification Toggle */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-orange-900">Notifications d'Échéance</h3>
                    <p className="text-sm text-orange-600">Alerter avant la date d'échéance</p>
                  </div>
                </div>
                <button
                  onClick={() => setReminderSettings({ ...reminderSettings, enableDueDateNotification: !reminderSettings.enableDueDateNotification })}
                  className={`relative w-14 h-7 rounded-full transition-all ${reminderSettings.enableDueDateNotification ? 'bg-orange-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${reminderSettings.enableDueDateNotification ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {reminderSettings.enableDueDateNotification && (
                <div className="mt-6 animate-in fade-in">
                  <label className="text-[10px] font-black uppercase tracking-widest text-orange-800 block mb-2">
                    Notifier X jours avant l'échéance
                  </label>
                  <select
                    className="w-48 bg-white border-2 border-orange-100 rounded-xl px-4 py-3 outline-none focus:border-orange-600 font-bold text-sm"
                    value={reminderSettings.dueDateDaysBefore}
                    onChange={e => setReminderSettings({ ...reminderSettings, dueDateDaysBefore: parseInt(e.target.value) })}
                  >
                    {[1, 2, 3, 5, 7, 10, 14].map(d => (
                      <option key={d} value={d}>{d} jour{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recurring Tab */}
        {activeTab === 'recurring' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Factures Récurrentes</h2>
              <button
                onClick={() => openScheduleForm()}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nouvelle Planification
              </button>
            </div>

            {recurringSchedules.length === 0 ? (
              <div className="text-center py-16">
                <RefreshCw className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Aucune facture récurrente configurée</p>
                <p className="text-sm text-gray-300 mt-1">Créez une planification pour générer automatiquement des factures</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recurringSchedules.map(schedule => {
                  const client = clients.find(c => c.id === schedule.clientId);
                  const template = templates.find(t => t.id === schedule.invoiceTemplateId);
                  return (
                    <div
                      key={schedule.id}
                      className={`p-6 rounded-2xl border-2 transition-all ${schedule.isActive ? 'bg-white border-purple-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${schedule.isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            <RefreshCw className={`w-6 h-6 ${schedule.isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-gray-900">{client?.name || 'Client inconnu'}</h3>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                {schedule.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {template?.name || 'Modèle: -'} • {schedule.frequency === 'weekly' ? 'Hebdomadaire' : schedule.frequency === 'monthly' ? 'Mensuel' : schedule.frequency === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-gray-400">Prochaine exécution</p>
                            <p className="font-black text-purple-600">{new Date(schedule.nextRunDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleScheduleActive(schedule)}
                              className={`p-2 rounded-lg transition-all ${schedule.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                              {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openScheduleForm(schedule)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSchedule(schedule.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && reminderSettings && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter">Rapports Mensuels Automatiques</h2>
              <button
                onClick={saveReminderSettings}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-green-900">Rapport Mensuel par Email</h3>
                    <p className="text-sm text-green-600">Recevoir un résumé des ventes chaque mois</p>
                  </div>
                </div>
                <button
                  onClick={() => setReminderSettings({ ...reminderSettings, enableMonthlyReport: !reminderSettings.enableMonthlyReport })}
                  className={`relative w-14 h-7 rounded-full transition-all ${reminderSettings.enableMonthlyReport ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${reminderSettings.enableMonthlyReport ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {reminderSettings.enableMonthlyReport && (
                <div className="mt-6 space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-green-800 block mb-2">
                        Jour d'envoi
                      </label>
                      <select
                        className="w-full bg-white border-2 border-green-100 rounded-xl px-4 py-3 outline-none focus:border-green-600 font-bold text-sm"
                        value={reminderSettings.monthlyReportDay}
                        onChange={e => setReminderSettings({ ...reminderSettings, monthlyReportDay: parseInt(e.target.value) })}
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}{d === 1 ? 'er' : ''} du mois</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-green-800 block mb-2">
                        Email destinataire
                      </label>
                      <input
                        type="email"
                        className="w-full bg-white border-2 border-green-100 rounded-xl px-4 py-3 outline-none focus:border-green-600 font-medium text-sm"
                        value={reminderSettings.monthlyReportEmail}
                        onChange={e => setReminderSettings({ ...reminderSettings, monthlyReportEmail: e.target.value })}
                        placeholder="email@entreprise.com"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-green-100">
                    <h4 className="font-black text-sm mb-4">Aperçu du rapport</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Chiffre d'affaires HT</p>
                        <p className="text-xl font-black text-green-600">--,-- {company.currency}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Factures émises</p>
                        <p className="text-xl font-black text-blue-600">--</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Encaissements</p>
                        <p className="text-xl font-black text-purple-600">--,-- {company.currency}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-purple-900/40 backdrop-blur-md">
          <div className="glass p-10 rounded-[3rem] max-w-2xl w-full shadow-2xl border-2 border-white/50 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                  {editingSchedule ? 'Modifier la Planification' : 'Nouvelle Planification'}
                </h3>
              </div>
              <button onClick={() => setShowScheduleForm(false)} className="text-gray-400 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-800 block mb-2">Client</label>
                <select
                  className="w-full bg-purple-50/50 border-2 border-purple-100 rounded-xl px-4 py-3 outline-none focus:border-purple-600 font-bold text-sm"
                  value={scheduleForm.clientId || ''}
                  onChange={e => setScheduleForm({ ...scheduleForm, clientId: e.target.value })}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-800 block mb-2">Modèle de facture</label>
                <select
                  className="w-full bg-purple-50/50 border-2 border-purple-100 rounded-xl px-4 py-3 outline-none focus:border-purple-600 font-bold text-sm"
                  value={scheduleForm.invoiceTemplateId || ''}
                  onChange={e => setScheduleForm({ ...scheduleForm, invoiceTemplateId: e.target.value })}
                >
                  <option value="">Sélectionner un modèle</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-800 block mb-2">Fréquence</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 'weekly', label: 'Hebdo' },
                    { value: 'monthly', label: 'Mensuel' },
                    { value: 'quarterly', label: 'Trimestriel' },
                    { value: 'yearly', label: 'Annuel' }
                  ].map(freq => (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => setScheduleForm({ ...scheduleForm, frequency: freq.value as any })}
                      className={`py-3 rounded-xl font-black text-xs uppercase transition-all ${scheduleForm.frequency === freq.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-purple-800 block mb-2">Date de début</label>
                  <input
                    type="date"
                    className="w-full bg-purple-50/50 border-2 border-purple-100 rounded-xl px-4 py-3 outline-none focus:border-purple-600 font-bold text-sm"
                    value={scheduleForm.startDate || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, startDate: e.target.value, nextRunDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-purple-800 block mb-2">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    className="w-full bg-purple-50/50 border-2 border-purple-100 rounded-xl px-4 py-3 outline-none focus:border-purple-600 font-bold text-sm"
                    value={scheduleForm.endDate || ''}
                    onChange={e => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setShowScheduleForm(false)}
                className="flex-1 py-4 font-black uppercase text-xs text-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={saveSchedule}
                disabled={saving || !scheduleForm.clientId || !scheduleForm.invoiceTemplateId}
                className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-purple-200 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationCenter;
