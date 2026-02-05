import React, { useState, useEffect } from 'react';
import { Shortcut } from '../types';
import { Plus, GripVertical, Settings, Save, LayoutGrid, CheckCircle2, Circle, Eye, EyeOff, Keyboard } from 'lucide-react';

interface ShortcutManagerProps {
  shortcuts: Shortcut[];
  onSave: (s: Shortcut[]) => void;
}

const AVAILABLE_ACTIONS = [
  { id: 'new-invoice', label: 'Nouvelle Facture', defaultLabel: 'Facture' },
  { id: 'new-quote', label: 'Nouveau Devis', defaultLabel: 'Devis' },
  { id: 'new-client', label: 'Nouveau Client', defaultLabel: 'Client' },
  { id: 'new-template', label: 'Nouveau Modèle', defaultLabel: 'Modèle' },
  { id: 'view-history', label: 'Journal Comptable', defaultLabel: 'Journal' },
];

const ShortcutManager: React.FC<ShortcutManagerProps> = ({ shortcuts, onSave }) => {
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    setLocalShortcuts(shortcuts.length > 0 ? [...shortcuts].sort((a, b) => a.order - b.order) : []);
  }, [shortcuts]);

  const toggleAction = (actionId: string, label: string) => {
    const exists = localShortcuts.find(s => s.actionId === actionId);
    if (exists) {
      setLocalShortcuts(localShortcuts.filter(s => s.actionId !== actionId).map((s, idx) => ({ ...s, order: idx })));
    } else {
      const newShortcut: Shortcut = {
        id: Math.random().toString(36).substr(2, 9),
        actionId,
        label,
        key: '',
        order: localShortcuts.length,
        enabled: true
      };
      setLocalShortcuts([...localShortcuts, newShortcut]);
    }
  };

  const toggleEnable = (idx: number) => {
    const updated = [...localShortcuts];
    updated[idx].enabled = !updated[idx].enabled;
    setLocalShortcuts(updated);
  };

  const moveItem = (fromIdx: number, toIdx: number) => {
    const updated = [...localShortcuts];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setLocalShortcuts(updated.map((s, idx) => ({ ...s, order: idx })));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase">Quick Actions</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Personnalisez votre barre de raccourcis</p>
        </div>
        <button
          onClick={() => onSave(localShortcuts)}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Enregistrer mes Raccourcis
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass p-10 rounded-[3rem] border-white/50 space-y-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-800">Actions Disponibles</h3>
          <div className="grid grid-cols-1 gap-4">
            {AVAILABLE_ACTIONS.map(action => {
              const isSelected = localShortcuts.some(s => s.actionId === action.id);
              return (
                <button
                  key={action.id}
                  onClick={() => toggleAction(action.id, action.defaultLabel)}
                  className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-blue-50 hover:border-blue-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-300'}`}>
                      {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight text-gray-800">{action.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass p-10 rounded-[3rem] border-white/50 space-y-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-800 italic underline underline-offset-8">Ordre & Configuration Touches</h3>
          {localShortcuts.length === 0 ? (
            <div className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest italic border-2 border-dashed border-blue-50 rounded-[2rem]">
              Aucun raccourci sélectionné
            </div>
          ) : (
            <div className="space-y-3">
              {localShortcuts.map((shortcut, idx) => (
                <div
                  key={shortcut.id}
                  className={`flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm group transition-opacity ${shortcut.enabled ? 'border-gray-100' : 'border-gray-50 opacity-40'}`}
                >
                  <div className="flex flex-col gap-1">
                    <button onClick={() => idx > 0 && moveItem(idx, idx - 1)} className={`p-1 hover:text-blue-600 ${idx === 0 ? 'opacity-20 cursor-default' : ''}`}>
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <input
                      className="bg-transparent font-black text-xs uppercase tracking-widest text-gray-800 outline-none w-full"
                      value={shortcut.label}
                      onChange={(e) => {
                        const updated = [...localShortcuts];
                        updated[idx].label = e.target.value;
                        setLocalShortcuts(updated);
                      }}
                    />
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Action : {shortcut.actionId}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Keyboard className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] font-black text-gray-400 uppercase">CTRL +</span>
                      <input
                        maxLength={1}
                        className="w-6 bg-white border border-blue-200 text-center font-black text-xs text-blue-600 rounded uppercase outline-none focus:ring-2 ring-blue-50"
                        value={shortcut.key}
                        onChange={(e) => {
                          const updated = [...localShortcuts];
                          updated[idx].key = e.target.value.toLowerCase();
                          setLocalShortcuts(updated);
                        }}
                      />
                    </div>
                    <button
                      onClick={() => toggleEnable(idx)}
                      className={`p-2 rounded-lg transition-all ${shortcut.enabled ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-50'}`}
                    >
                      {shortcut.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[9px] text-gray-400 font-medium italic text-center leading-relaxed">
            Assignez une touche unique à chaque action. Les raccourcis s'activent avec CTRL + [Touche].<br />
            Exemple: CTRL + D pour Dupliquer, CTRL + N pour Nouvelle Facture.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutManager;