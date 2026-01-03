
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { MarketingStatus } from '../types.ts';
import { Plus, Search, UserCheck, Wallet, Zap, Trash2, Calendar, Target } from 'lucide-react';

const MarketingClient: React.FC = () => {
  const { getCalculatedMarketing, updateMarketing, addMarketing, deleteMarketing } = useAppStore();
  const allData = getCalculatedMarketing();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return (item.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.service_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allData, searchTerm]);

  const stats = useMemo(() => {
    // Only count revenue and charges for completed projects for the KPI cards as per the new rules
    const realizedData = filteredData.filter(i => i.status === MarketingStatus.TERMINE);
    const totalRev = realizedData.reduce((acc, curr) => acc + Number(curr.revenue), 0);
    const totalCharges = realizedData.reduce((acc, curr) => acc + Number(curr.client_charges), 0);
    
    // Net profit is already handled in the store (0 if not TERMINE), so we can just sum it up
    const netProfit = filteredData.reduce((acc, curr) => acc + curr.net_profit, 0);
    
    return { totalRev, totalCharges, netProfit };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer définitivement ce suivi client marketing ?')) {
      deleteMarketing(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Marketing Clients</h2>
          <p className="text-slate-500 text-sm font-medium">Analyse de rentabilité par service et par client.</p>
        </div>
        <button 
          onClick={addMarketing} 
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all self-start"
        >
          <Plus size={18} /> Nouveau Client/Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Chiffre d'Affaires Encaissé" value={formatPrice(stats.totalRev)} icon={Target} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Charges Services Finis" value={formatPrice(stats.totalCharges)} icon={Wallet} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Bénéfice Net Réalisé" value={formatPrice(stats.netProfit)} icon={Zap} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrer par Client ou Service..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client & Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Description du Service</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Revenu Brut</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Charges Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Bénéfice Net</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-3">
                    <EditableCell value={item.client_name} onSave={v => updateMarketing(item.id, 'client_name', v)} className="font-black text-slate-800" />
                    <div className="flex items-center gap-1 px-2 text-[10px] text-slate-400 font-bold">
                      <Calendar size={10} />
                      <EditableCell type="date" value={item.date} onSave={v => updateMarketing(item.id, 'date', v)} className="p-0 min-h-0 bg-transparent" />
                    </div>
                  </td>
                  <td className="p-3">
                    <EditableCell value={item.service_description} onSave={v => updateMarketing(item.id, 'service_description', v)} className="text-slate-600 font-medium italic text-sm" />
                  </td>
                  <td className="p-3 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.revenue} onSave={v => updateMarketing(item.id, 'revenue', v)} className="text-right" />
                  </td>
                  <td className="p-3 text-right font-bold text-orange-600">
                    <EditableCell type="number" value={item.client_charges} onSave={v => updateMarketing(item.id, 'client_charges', v)} className="text-right" />
                  </td>
                  <td className="p-3 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateMarketing(item.id, 'status', e.target.value)}
                      className={`text-[10px] px-3 py-1.5 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === MarketingStatus.TERMINE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === MarketingStatus.EN_COURS ? 'bg-blue-50 text-blue-700' : 
                          item.status === MarketingStatus.ANNULE ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {Object.values(MarketingStatus).map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className={`p-5 text-right font-black text-sm ${item.net_profit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formatPrice(item.net_profit)}
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <UserCheck size={32} />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune donnée marketing client</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketingClient;
