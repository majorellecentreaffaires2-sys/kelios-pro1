import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  Users,
  LogOut,
  Lock,
  FileText,
  FilePlus,
  ShoppingCart,
  Zap,
  Plus,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  CalendarClock,
} from "lucide-react";
import { Company } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  onExit: () => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  companies,
  activeCompany,
  onSelectCompany,
  onExit,
  user,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const nav = [
    { id: "dashboard", label: "Tableau de Bord", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "clients", label: "Centre Clients", icon: <Users className="w-5 h-5" /> },
    {
      id: "nouveau-devis",
      label: "Nouveau Devis",
      icon: <FilePlus className="w-5 h-5" />,
    },
    { id: "facture", label: "Facturation", icon: <FileText className="w-5 h-5" /> },
    {
      id: "ventes",
      label: "Document Ventes",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    { id: "shortcuts", label: "Raccourcis IA", icon: <Zap className="w-5 h-5" /> },
    ...(user?.role === 'Admin' || user?.role === 'SuperAdmin' ? [
      { id: "automation", label: "Automatisation", icon: <CalendarClock className="w-5 h-5" /> }
    ] : []),
  ];

  return (
    <aside className="w-20 lg:w-80 h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-[50] sticky top-0 transition-all duration-300 shadow-sm">
      <div className="flex flex-col h-full">

        <div className="p-8 pb-4">
          <div className="flex items-center justify-center lg:justify-start">
            <div className="w-36 h-26 bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div className="px-6 py-4">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between hover:bg-white hover:border-blue-200 group transition-all duration-300"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:border-blue-100">
                  {activeCompany?.logoUrl ? (
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start min-w-0">
                  <span className="font-bold text-[11px] text-slate-900 truncate uppercase tracking-tight">
                    {activeCompany?.name || "Entité Majorlle"}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    ID Entité #{(activeCompany?.id || '00').toString().slice(-4)}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/50 z-[100] overflow-hidden py-3 animate-in zoom-in-95 duration-200">
                <div className="px-5 py-2 mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mes Organisations</p>
                </div>
                <div className="max-h-[320px] overflow-y-auto px-2 space-y-1">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (c.active) {
                          onSelectCompany(c);
                          setIsOpen(false);
                        }
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 rounded-xl transition-all ${activeCompany?.id === c.id ? "bg-blue-50/50 text-blue-700" : "hover:bg-slate-50 text-slate-600"} ${!c.active ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden relative shrink-0 shadow-sm">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <span className="text-[11px] font-black uppercase text-slate-400">{c.name.charAt(0)}</span>
                        )}
                        {!c.active && <div className="absolute inset-0 bg-slate-100/60 flex items-center justify-center"><Lock className="w-3 h-3 text-slate-400" /></div>}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-extrabold text-[11px] uppercase truncate tracking-tight">{c.name}</p>
                        {!c.active && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Compte Suspendu</p>}
                      </div>
                      {activeCompany?.id === c.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-2 pt-3 px-2">
                  <button
                    onClick={() => { setActiveTab("companies"); setIsOpen(false); }}
                    className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all group font-bold"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-blue-600 group-hover:text-white" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest">Configurer nouvelle entité</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="px-4 mb-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Système</p>
          </div>
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <div className={`transition-transform duration-300 ${activeTab === item.id ? "scale-110" : "group-hover:scale-110 group-active:scale-95"}`}>
                {item.icon}
              </div>
              <span className="hidden lg:block font-extrabold text-[11px] uppercase tracking-widest">
                {item.label}
              </span>
              {activeTab === item.id && <div className="hidden lg:block ml-auto w-1 h-1 rounded-full bg-blue-400"></div>}
            </button>
          ))}

          {/* Admin SaaS Link - Visible only in Sidebar when inside a company */}
          <div className="px-4 mt-8 mb-4 border-t border-slate-100 pt-8">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] ml-1">Administration SaaS</p>
          </div>
          <button
            onClick={onExit}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-blue-600 hover:bg-blue-50 transition-all group font-extrabold text-[11px] uppercase tracking-widest"
          >
            <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="hidden lg:block">Quitter vers Console</span>
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-6 mt-auto border-t border-slate-100">
          <div className="bg-slate-50 rounded-[2rem] p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Paramètres Cloud</p>
                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">V5.0 Enterprise</p>
              </div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all font-black text-[11px] uppercase tracking-widest group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block">Sécuriser & Quitter</span>
          </button>
        </div>

      </div>
    </aside >
  );
};

export default Sidebar;
