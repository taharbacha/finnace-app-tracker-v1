
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { ClientComptoirStatus } from '../types.ts';
import { 
  Plus, Search, Store, Wallet, Zap, Trash2, Calendar, Target, 
  Filter, CheckSquare, Square, ClipboardCheck, Clock, CheckCircle2 
} from 'lucide-react';

const ClientComptoir: React.FC = () => {
  const { getCalculatedClientComptoir, updateClientComptoir, addClientComptoir, deleteClientComptoir } = useAppStore();
  const allData = getCalculatedClientComptoir();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return (item.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.service_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allData, searchTerm]);

  const kpiData = useMemo(() => {
    if (!analysisMode) return filteredData;
    return filteredData.filter(item => selectedIds.has(item.id));
  }, [filteredData, analysisMode, selectedIds]);

  const stats = useMemo(() => {
    // Total charges regardless of status for transparency
    const totalProd = kpiData.reduce((acc, curr) => acc + Number(curr.client_charges || 0), 0);
    const totalVente = kpiData.reduce((acc, curr) => acc + Number(curr.revenue || 0), 0);
    
    const profitPayee = kpiData
      .filter(i => i.status === ClientComptoirStatus.PAYEE)
      .reduce((acc, curr) => acc + curr.benefice_net, 0);

    const profitNonPayee = kpiData
      .filter(i => i.status === ClientComptoirStatus.NON_PAYEE)
      .reduce((acc, curr) => acc + curr.benefice_net, 0);

    const potentielProfit = kpiData
      .filter(i => [ClientComptoirStatus.EN_PRODUCTION, ClientComptoirStatus.EN_LIVRAISON].includes(i.status))
      .reduce((acc, curr) => acc + curr.benefice_net, 0);

    const counts = {
      total: kpiData.length,
      payee: kpiData.filter(i => i.status === ClientComptoirStatus.PAYEE).length,
      nonPayee: kpiData.filter(i => i.status === ClientComptoirStatus.NON_PAYEE).length,
      enCours: kpiData.filter(i => [ClientComptoirStatus.EN_PRODUCTION, ClientComptoirStatus.EN_LIVRAISON].includes(i.status)).length
    };

    return { totalProd, totalVente, profitPayee, profitNonPayee, potentielProfit, counts };
  }, [kpiData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredData.map(i => i.id)));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer définitivement cette transaction client comptoir ?')) {
      deleteClientComptoir(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Store className="text-blue-600" size={28} />
            Client Comptoir
          </h2>
          <p className="text-slate-500 text-sm font-medium">Flux financiers direct-comptoir et services isolés.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAnalysisMode(!analysisMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
              ${analysisMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}
          >
            <Filter size={16} />
            {analysisMode ? 'Analyse Active' : 'Mode Analyse'}
          </button>
          <button 
            onClick={addClientComptoir} 
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={18} /> Nouvelle Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Charges" value={formatPrice(stats.totalProd)} icon={Wallet} color="text-slate-600" bg="bg-slate-50" />
        <StatCard label="Vente Totale" value={formatPrice(stats.totalVente)} icon={Target} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Profit Payé" value={formatPrice(stats.profitPayee)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Profit Non Payé" value={formatPrice(stats.profitNonPayee)} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Potentiel" value={formatPrice(stats.potentielProfit)} icon={Zap} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher par Client ou Description..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Lignes: {stats.counts.total}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 w-12 text-center">
                  <button onClick={selectAll} className="text-slate-300 hover:text-blue-500">
                    {selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client / Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Description</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Production (Charge)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Net</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className={`transition-colors group ${selectedIds.has(item.id) ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleSelection(item.id)} className="text-slate-300 hover:text-blue-500">
                      {selectedIds.has(item.id) ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.client_name} onSave={v => updateClientComptoir(item.id, 'client_name', v)} className="font-black text-slate-800" />
                    <div className="px-2 text-[10px] text-slate-400 font-bold uppercase">{item.date}</div>
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.service_description} onSave={v => updateClientComptoir(item.id, 'service_description', v)} className="text-slate-600 italic text-xs" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.client_charges} onSave={v => updateClientComptoir(item.id, 'client_charges', v)} className="text-right text-slate-500" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.revenue} onSave={v => updateClientComptoir(item.id, 'revenue', v)} className="text-right font-black text-slate-900" />
                  </td>
                  <td className="p-2 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateClientComptoir(item.id, 'status', e.target.value as ClientComptoirStatus)}
                      className={`w-full text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === ClientComptoirStatus.PAYEE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === ClientComptoirStatus.NON_PAYEE ? 'bg-orange-50 text-orange-700' :
                          item.status === ClientComptoirStatus.EN_PRODUCTION ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {Object.values(ClientComptoirStatus).map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className={`p-4 text-right font-black text-sm ${item.benefice_net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatPrice(item.benefice_net)}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => updateClientComptoir(item.id, 'processed', !item.processed)} 
                        title="Marquer comme traité"
                        className={`p-2 transition-all rounded-lg ${item.processed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                      >
                        <ClipboardCheck size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
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

export default ClientComptoir;
