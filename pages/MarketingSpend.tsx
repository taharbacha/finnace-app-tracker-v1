
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { MarketingSpendSource, MarketingSpendType } from '../types.ts';
import { MARKETING_SPEND_SOURCE_OPTIONS, MARKETING_SPEND_TYPE_OPTIONS } from '../constants.ts';
import { Plus, Search, Megaphone, Target, Trash2, Calendar, DollarSign } from 'lucide-react';

const MarketingSpend: React.FC = () => {
  const { marketingSpends, updateMarketingSpend, addMarketingSpend, deleteMarketingSpend } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return marketingSpends.filter(item => {
      return (item.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.source || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime());
  }, [marketingSpends, searchTerm]);

  const stats = useMemo(() => {
    const totalAds = filteredData.filter(i => i.type === MarketingSpendType.ADS).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalInfluencers = filteredData.filter(i => i.type === MarketingSpendType.INFLUENCER).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalOverall = filteredData.reduce((acc, curr) => acc + Number(curr.amount), 0);
    return { totalAds, totalInfluencers, totalOverall };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer cet enregistrement de dépenses marketing ?')) {
      deleteMarketingSpend(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Marketing Spend</h2>
          <p className="text-slate-500 text-sm font-medium">Suivi des investissements par pilier de revenus (Ads, Influenceurs).</p>
        </div>
        <button 
          onClick={addMarketingSpend} 
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all self-start"
        >
          <Plus size={18} /> Nouveau Spending
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Ads Totaux" value={formatPrice(stats.totalAds)} icon={Megaphone} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Influenceurs / Autres" value={formatPrice(stats.totalInfluencers)} icon={Target} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Total Investi" value={formatPrice(stats.totalOverall)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtre par Source ou Note..." 
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
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Période (Début - Fin)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Cible Revenus</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Canal Spend</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Note</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Montant</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                       <EditableCell type="date" value={item.date_start} onSave={v => updateMarketingSpend(item.id, 'date_start', v)} className="p-0 min-h-0 text-[11px] font-bold text-slate-400" />
                       <span className="text-slate-300">-</span>
                       <EditableCell type="date" value={item.date_end} onSave={v => updateMarketingSpend(item.id, 'date_end', v)} className="p-0 min-h-0 text-[11px] font-bold text-slate-400" />
                    </div>
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.source} 
                      onChange={(e) => updateMarketingSpend(item.id, 'source', e.target.value)}
                      className="text-[10px] p-2 bg-slate-100 rounded-xl font-black uppercase tracking-tight border-none"
                    >
                      {MARKETING_SPEND_SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.type} 
                      onChange={(e) => updateMarketingSpend(item.id, 'type', e.target.value)}
                      className={`text-[10px] p-2 rounded-xl font-black uppercase tracking-tight border-none
                        ${item.type === MarketingSpendType.ADS ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}
                    >
                      {MARKETING_SPEND_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <EditableCell value={item.note} onSave={v => updateMarketingSpend(item.id, 'note', v)} className="text-slate-500 italic text-xs truncate max-w-[150px]" />
                  </td>
                  <td className="p-3 text-right">
                    <EditableCell type="number" value={item.amount} onSave={v => updateMarketingSpend(item.id, 'amount', v)} className="text-right font-black text-slate-900" />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all">
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

export default MarketingSpend;
