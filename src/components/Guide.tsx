import React from 'react';
import { BookOpen, Zap, Users, FileText, TrendingUp, Shield, HelpCircle } from 'lucide-react';

const Guide: React.FC = () => {
  const sections = [
    {
      icon: Zap,
      title: "Démarrage Rapide",
      color: "from-blue-500 to-indigo-600",
      items: [
        "Créez votre première société dans 'Portefeuille Sociétés'",
        "Ajoutez vos clients dans la section 'Tiers > Fiches Clients'",
        "Configurez votre catalogue d'articles",
        "Créez votre première facture avec 'Fichier > Nouveau'"
      ]
    },
    {
      icon: FileText,
      title: "Gestion des Documents",
      color: "from-emerald-500 to-teal-600",
      items: [
        "Utilisez les modèles de facture pour un rendu professionnel",
        "Validez vos documents pour les sceller légalement",
        "Exportez en PDF ou envoyez par email directement",
        "Suivez l'état de règlement dans 'Liste des Ventes'"
      ]
    },
    {
      icon: Users,
      title: "Gestion des Clients",
      color: "from-purple-500 to-pink-600",
      items: [
        "Créez des fiches clients complètes avec toutes les données légales",
        "Définissez les conditions de règlement par défaut",
        "Suivez l'encours et le solde de chaque client",
        "Bloquez les clients en cas de dépassement d'encours"
      ]
    },
    {
      icon: TrendingUp,
      title: "Reporting & Analyse",
      color: "from-orange-500 to-red-600",
      items: [
        "Consultez le tableau de bord pour une vue d'ensemble",
        "Analysez vos ventes par période dans 'Reporting'",
        "Suivez vos paiements et encaissements",
        "Exportez vos données pour votre comptabilité"
      ]
    },
    {
      icon: Shield,
      title: "Sécurité & Conformité",
      color: "from-gray-700 to-gray-900",
      items: [
        "Toutes les factures validées sont scellées et archivées 10 ans",
        "Audit trail complet de toutes les opérations",
        "Conformité avec la législation marocaine et européenne",
        "Sauvegarde automatique de toutes vos données"
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex items-end gap-6 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">Guide d'Utilisation</h1>
          <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Kelios ERP - Documentation Complète</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <section.icon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <HelpCircle className="w-10 h-10" />
          <h2 className="text-3xl font-black">Besoin d'Aide ?</h2>
        </div>
        <p className="text-lg font-medium mb-6 opacity-90">
          Notre équipe est disponible pour vous accompagner dans l'utilisation de Kelios ERP.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Email Support</p>
            <p className="font-bold">support@kelios.com</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Téléphone</p>
            <p className="font-bold">+212 5XX XX XX XX</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Horaires</p>
            <p className="font-bold">Lun-Ven 9h-18h</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
        <h3 className="text-xl font-black text-amber-900 mb-4 flex items-center gap-3">
          <Zap className="w-6 h-6" />
          Raccourcis Clavier
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <kbd className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold">Ctrl + N</kbd>
            <p className="text-xs font-medium text-gray-600">Nouvelle facture</p>
          </div>
          <div className="space-y-1">
            <kbd className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold">Ctrl + S</kbd>
            <p className="text-xs font-medium text-gray-600">Sauvegarder</p>
          </div>
          <div className="space-y-1">
            <kbd className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold">Ctrl + P</kbd>
            <p className="text-xs font-medium text-gray-600">Imprimer</p>
          </div>
          <div className="space-y-1">
            <kbd className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold">Ctrl + F</kbd>
            <p className="text-xs font-medium text-gray-600">Rechercher</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
