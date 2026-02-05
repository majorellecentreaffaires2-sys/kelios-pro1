
import React, { useState } from 'react';
import { Building2, ChevronDown, Users, LogOut, Lock, FileText, FilePlus, ShoppingCart, Zap, Plus } from 'lucide-react';
import { Company } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  onExit: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, companies, activeCompany, onSelectCompany, onExit }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only 5 main navigation items as requested
  const nav = [
    { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
    { id: 'nouveau-devis', label: 'Nouveau Devis', icon: <FilePlus className="w-5 h-5" /> },
    { id: 'facture', label: 'Facture', icon: <FileText className="w-5 h-5" /> },
    { id: 'ventes', label: 'Document de Vente', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'shortcuts', label: 'Raccourcis', icon: <Zap className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-20 md:w-72 h-screen glass sticky top-0 flex flex-col border-r border-blue-100/50 z-50">
      <div className="p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">M</div>
          <div className="hidden md:block">
            <h1 className="font-black text-lg text-gray-900 leading-none">Majorlle</h1>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">SaaS Edition</span>
          </div>
        </div>

        <div className="relative mb-8">
          <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white border border-blue-50 p-3 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-all shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                {activeCompany?.logoUrl ? <img src={activeCompany.logoUrl} className="w-5 h-5 object-contain" /> : <Building2 className="w-4 h-4 text-blue-600" />}
              </div>
              <span className="hidden md:block font-black text-xs truncate uppercase tracking-tighter">{activeCompany?.name || 'Sélectionner'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-blue-50 rounded-2xl shadow-2xl z-[60] overflow-hidden py-2">
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => { if (c.active) { onSelectCompany(c); setIsOpen(false); } }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 text-left transition-all ${activeCompany?.id === c.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''} ${!c.active ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden relative shrink-0">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">{c.name.charAt(0)}</span>
                    )}
                    {!c.active && <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 rounded-lg"><Lock className="w-3 h-3 text-gray-600" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs uppercase truncate tracking-tighter">{c.name}</p>
                    {!c.active && <p className="text-[7px] font-black text-red-400 uppercase tracking-widest">Désactivée</p>}
                  </div>
                </button>
              ))}
              <div className="border-t border-blue-50 mt-2 pt-2">
                <button
                  onClick={() => { setActiveTab('companies'); setIsOpen(false); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-600 hover:text-white text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[10px] uppercase tracking-widest">Nouvelle Société</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {nav.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              <div className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'}>{item.icon}</div>
              <span className="hidden md:block font-black text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <button onClick={onExit} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-black text-xs uppercase tracking-widest">
          <LogOut className="w-5 h-5" />
          <span className="hidden md:block">Quitter Program</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
