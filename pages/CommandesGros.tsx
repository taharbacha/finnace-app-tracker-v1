
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { GROS_STATUS_OPTIONS } from '../constants.ts';
import { GrosStatus } from '../types.ts';
import { Plus, Search, Truck, Banknote, AlertCircle, Calendar, Trash2 } from 'lucide-react';

const CommandesGros: React.FC = () => {
  const { getCalculatedGros, updateGros, addGros, deleteGros } = useAppStore();
  const allData = getCalculatedGros();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      const matchesSearch = item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = item.date_created;
      const matchesStart = !dateStart || itemDate >= dateStart;
      const matchesEnd = !dateEnd || itemDate <= dateEnd;
      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [allData, searchTerm, dateStart, dateEnd]);

  const stats = useMemo(() => {
    const totalProfit = filteredData.reduce((acc, curr) => acc + (curr.prix_vente - curr.cost), 0);
    const encaisse = filteredData.reduce((acc, curr) => acc + curr.profit_encaisse, 0);
    const attendu = filteredData.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    return { totalProfit, encaisse, attendu };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Confirmer la suppression définitive de cette commande gros ?')) {
      deleteGros(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Commandes GROS</h2>
          <p className="text-slate-500 text-sm">Gestion des volumes wholesale et suivi financier.</p>
        </div>
        <button 
          type="button"
          onClick={addGros}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          <Plus size={16} /> Nouvelle Commande
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Profit Total" value={formatPrice(stats.totalProfit)} icon={Truck} color="text-slate-600" bg="bg-slate-50" />
        <StatCard label="Encaissé" value={formatPrice(stats.encaisse)} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Attendu" value={formatPrice(stats.attendu)} icon={AlertCircle} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher client ou référence..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="text-xs outline-none bg-transparent font-medium" />
            <span className="text-slate-300">à</span>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="text-xs outline-none bg-transparent font-medium" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Ref</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Profit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="p-2 font-mono text-xs font-black text-slate-400">
                    <EditableCell value={item.reference} onSave={(v) => updateGros(item.id, 'reference', v)} />
                  </td>
                  <td className="p-2 font-bold text-slate-800">
                    <EditableCell value={item.client_name} onSave={(v) => updateGros(item.id, 'client_name', v)} />
                  </td>
                  <td className="p-2 text-slate-600">
                    <EditableCell type="date" value={item.date_created} onSave={(v) => updateGros(item.id, 'date_created', v)} />
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateGros(item.id, 'prix_vente', v)} />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateGros(item.id, 'status', e.target.value)}
                      className="text-[10px] p-1.5 border-none bg-slate-100 rounded-lg cursor-pointer font-black text-slate-700 hover:bg-slate-200 transition-colors uppercase"
                    >
                      {GROS_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.profit_encaisse > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {formatPrice(item.prix_vente - item.cost)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                      title="Supprimer la ligne"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommandesGros;
