import React, { useState, useEffect } from 'react';
import { api } from '../apiClient';
import {
  User, Mail, Lock, Camera, Shield, CheckCircle, X,
  Save, Upload, Trash2, Calendar, CreditCard, Crown, LogOut, Download, AlertTriangle
} from 'lucide-react';

interface AccountSettingsProps {
  user: any;
  onUpdateUser: () => void;
  onLogout: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setForm({
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarUrl(user?.avatarUrl || '');
  }, [user]);

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const updates: any = {};

      // Only include fields that have changed
      if (form.username !== user?.username) {
        updates.username = form.username;
      }
      if (form.email !== user?.email) {
        updates.email = form.email;
      }
      if (form.newPassword) {
        if (!form.currentPassword) {
          throw new Error('Veuillez saisir votre mot de passe actuel pour confirmer.');
        }
        if (form.newPassword.length < 8) {
          throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        }
        if (form.newPassword !== form.confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas.');
        }
        updates.password = form.newPassword;
        updates.currentPassword = form.currentPassword;
      }
      if (avatarUrl !== user?.avatarUrl) {
        updates.avatarUrl = avatarUrl;
      }

      if (Object.keys(updates).length === 0) {
        setSaveStatus('idle');
        return;
      }

      await api.updateUser(user.id, updates);
      setSaveStatus('saved');

      // Reset password fields
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
        onUpdateUser();
      }, 1500);

    } catch (e) {
      setSaveStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Erreur lors de la mise à jour');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    setForm({
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarUrl(user?.avatarUrl || '');
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { url } = await api.uploadFile(file);
      setAvatarUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:3000'}/api/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mj_token')}`
        }
      });
      if (!response.ok) throw new Error("Erreur lors de l'exportation");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes_donnees_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur d'export ");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT votre compte et toutes vos données (factures, clients, entreprises) ? Cette action est IRREVERSIBLE.')) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:3000'}/api/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('mj_token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');

      onLogout();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur de suppression');
      setIsDeleting(false);
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'monthly_200': return 'Mensuel - 200 DH';
      case 'yearly_2000': return 'Annuel - 2,000 DH';
      default: return plan || 'Gratuit';
    }
  };

  const getPlanColor = (plan: string) => {
    if (plan?.includes('yearly')) return 'text-purple-600';
    if (plan?.includes('monthly')) return 'text-blue-600';
    return 'text-slate-600';
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 bg-blue-600">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Paramètres du Compte</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
            Mon <span className="italic opacity-50 font-serif">Profil</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-lg">
            Gérez vos informations personnelles, votre avatar et vos paramètres de sécurité.
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
              >
                <X className="w-4 h-4" /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving' || uploadingAvatar}
                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mise à jour...</>
                ) : saveStatus === 'saved' ? (
                  <><CheckCircle className="w-4 h-4 text-emerald-400" /> Enregistré</>
                ) : (
                  <><Save className="w-4 h-4" /> Sauvegarder</>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-900 hover:text-white transition-all shadow-lg group"
            >
              <Upload className="w-4 h-4 group-hover:rotate-180 transition-transform" /> Éditer le Profil
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold text-sm flex items-center gap-3">
          <X className="w-5 h-5" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Subscription */}
        <div className="lg:col-span-1 space-y-8">
          {/* Avatar Card */}
          <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-[1.25rem] flex items-center justify-center text-blue-600">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Avatar</h3>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-100 shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white">
                      {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                  {isEditing && avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <label className={`
                  flex flex-col items-center justify-center gap-3 px-4 py-6
                  bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl
                  hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer
                  ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}
                `}>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {uploadingAvatar ? (
                      <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center">
                    {uploadingAvatar ? 'Chargement...' : 'Téléverser Avatar'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase text-center">PNG, JPG ou WEBP (Max 5MB)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
              )}
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] border border-slate-700 shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[1.25rem] flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Abonnement</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut du compte</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Actuel</span>
                  <span className={`font-extrabold ${getPlanColor(user?.plan)}`}>{getPlanLabel(user?.plan)}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</span>
                  <span className={`font-extrabold uppercase ${user?.subscriptionStatus === 'active' ? 'text-emerald-400' :
                    user?.subscriptionStatus === 'trial' ? 'text-amber-400' :
                      user?.subscriptionStatus === 'locked' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                    {user?.subscriptionStatus === 'active' ? 'Actif' :
                      user?.subscriptionStatus === 'trial' ? 'Essai Gratuit' :
                        user?.subscriptionStatus === 'locked' ? 'Verrouillé' : user?.subscriptionStatus}
                  </span>
                </div>

                {user?.subscriptionStatus === 'trial' && user?.trialEndsAt && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin d'essai</span>
                    <span className="font-extrabold text-amber-400">
                      {new Date(user.trialEndsAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {user?.lastPaymentDate && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Dernier Paiement
                    </span>
                    <span className="font-extrabold">
                      {new Date(user.lastPaymentDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {user?.createdAt && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Membre depuis
                    </span>
                    <span className="font-extrabold">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Section */}
          <div className="bg-white rounded-[3rem] border border-slate-200/60 p-10 shadow-xl space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-[1.25rem] flex items-center justify-center text-blue-600">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Informations Personnelles</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Identité et contacts</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Username Field */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Nom d'utilisateur
                </label>
                {isEditing ? (
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-extrabold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="votre-nom"
                  />
                ) : (
                  <p className="px-6 py-4 bg-slate-50/30 rounded-2xl text-slate-900 font-extrabold text-sm border border-transparent">
                    {user?.username || 'Non spécifié'}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Adresse Email
                </label>
                {isEditing ? (
                  <input
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-extrabold outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-200"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemple.com"
                    type="email"
                  />
                ) : (
                  <p className="px-6 py-4 bg-slate-50/30 rounded-2xl text-blue-600 font-extrabold text-sm border border-transparent">
                    {user?.email || 'Non spécifié'}
                  </p>
                )}
              </div>

              {/* Role Field (Read Only) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Rôle
                </label>
                <div className="px-6 py-4 bg-slate-50/30 rounded-2xl text-slate-900 font-extrabold text-sm border border-transparent">
                  {user?.role === 'SuperAdmin' ? (
                    <span className="text-purple-600">Super Admin</span>
                  ) : (
                    <span>Utilisateur</span>
                  )}
                </div>
              </div>

              {/* User ID Field (Read Only) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Utilisateur</label>
                <div className="px-6 py-4 bg-slate-50/30 rounded-2xl text-slate-500 font-mono font-bold text-xs border border-transparent select-all">
                  {user?.id || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[1.25rem] flex items-center justify-center text-white">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Sécurité</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Mot de passe et authentification</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 relative z-10">
              {/* Current Password (Required for password change) */}
              {isEditing && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> Mot de passe actuel
                  </label>
                  <input
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-mono font-black text-white outline-none focus:bg-white/10 focus:border-blue-500 transition-all placeholder:text-white/20"
                    value={form.currentPassword}
                    onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                    placeholder="Saisir pour confirmer le changement"
                    type="password"
                  />
                  <p className="text-[9px] font-bold text-slate-500 ml-1">Requis pour changer le mot de passe</p>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                {isEditing ? (
                  <input
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-mono font-black text-white outline-none focus:bg-white/10 focus:border-blue-500 transition-all placeholder:text-white/20"
                    value={form.newPassword}
                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="Laisser vide pour conserver"
                    type="password"
                  />
                ) : (
                  <div className="px-6 py-4 bg-white/5 rounded-2xl text-white font-mono font-black text-sm border border-white/10 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500">Changer le mot de passe</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              {isEditing && form.newPassword && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
                  <input
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-sm font-mono font-black text-white outline-none focus:bg-white/10 focus:border-blue-500 transition-all placeholder:text-white/20"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirmer le nouveau mot de passe"
                    type="password"
                  />
                  {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                    <p className="text-[10px] font-bold text-red-400 ml-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> Les mots de passe ne correspondent pas
                    </p>
                  )}
                  {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 8 && (
                    <p className="text-[10px] font-bold text-emerald-400 ml-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Les mots de passe correspondent
                    </p>
                  )}
                </div>
              )}

              {/* Password Requirements */}
              {isEditing && form.newPassword && (
                <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exigences</p>
                  <div className="space-y-1">
                    <p className={`text-[9px] font-bold ${form.newPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {form.newPassword.length >= 8 ? '✓' : '○'} Au moins 8 caractères
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GDPR & Data Section */}
          <div className="bg-white rounded-[3rem] border border-slate-200/60 p-10 shadow-xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Données & Confidentialité</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Conformité RGPD</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <h4 className="font-extrabold text-slate-900">Exporter mes données</h4>
                  <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm">
                    Téléchargez une copie de vos informations personnelles, entreprises, factures et clients.
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-6 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                >
                  {isExporting ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? 'Exportation...' : 'Télécharger ZIP'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delete Account */}
            <div className="bg-red-50 rounded-3xl border border-red-100 p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-red-700">Supprimer</h3>
              </div>
              <p className="text-xs text-red-600/70 font-bold mb-6">
                Suppression définitive de votre compte et toutes les données associées. Action irréversible.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-4 px-6 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer le compte'}
              </button>
            </div>

            {/* Logout Button */}
            <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-600">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Déconnexion</h3>
                </div>
                <p className="text-xs text-slate-500 font-bold mb-6">
                  Fermez votre session sécurisée sur cet appareil.
                </p>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-4 px-6 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;