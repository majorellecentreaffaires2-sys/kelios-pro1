
import React, { useState, useEffect } from 'react';
import { AuditEntry } from '../types';
import { ShieldCheck, History, Info, AlertTriangle, AlertCircle, Clock, Filter, Search } from 'lucide-react';
import { api } from '../apiClient';

interface AuditLogViewerProps {
  companyId?: string;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ companyId }) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [companyId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs(companyId);
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredLogs = logs.filter(l =>
    l.details.toLowerCase().includes(filter.toLowerCase()) ||
    l.action.toLowerCase().includes(filter.toLowerCase()) ||
    l.entity.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Audit Trail</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Traçabilité complète des actions du système</p>
        </div>
        <button onClick={loadLogs} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
          <History className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="glass p-8 rounded-[2.5rem] border-white/50 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
          <input
            className="w-full bg-blue-50/20 border-2 border-transparent focus:border-blue-100 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm outline-none transition-all"
            placeholder="Filtrer l'historique par action, utilisateur ou entité..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-blue-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-6 py-4">Date & Heure</th>
                <th className="px-6 py-4">Action / Entité</th>
                <th className="px-6 py-4">Détails de l'événement</th>
                <th className="px-6 py-4 text-center">Sévérité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50/30">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center text-gray-300 animate-pulse">Chargement des logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-gray-300 italic">Aucun log enregistré pour cette période.</td></tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-3 h-3 text-blue-300" />
                        <span className="text-[11px] font-bold text-gray-500">{new Date(l.timestamp).toLocaleString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{l.action}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{l.entity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-800">{l.details}</p>
                      <span className="text-[8px] font-black text-gray-300 uppercase">Utilisateur : {l.userId}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {getSeverityIcon(l.severity)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
