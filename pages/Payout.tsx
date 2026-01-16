
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { PayoutStatus } from '../types.ts';
import { Plus, Search, Banknote, Trash2, Wallet, Users, CheckCircle2, Clock } from 'lucide-react';

const Payout: React.FC = () => {
  const { payouts, addPayout, updatePayout, deletePayout } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return payouts.filter(item => {
      return (item.vendeur || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payouts, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const paidAmount = filteredData.filter(i => i.status === PayoutStatus.PAYEE).reduce((acc, curr) => acc + Number(curr.amount_total), 0);
    const unpaidAmount = filteredData.filter(i => i.status === PayoutStatus.NON_PAYEE).reduce((acc, curr) => acc + Number(curr.amount_total), 0);
    const paidCount = filteredData.filter(i => i.status === PayoutStatus.PAYEE).length;
    const unpaidCount = filteredData.filter(i => i.status === PayoutStatus.NON_PAYEE).length;
    return { total, paidAmount, unpaidAmount, paidCount, unpaidCount };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Banknote className="text-emerald-600" size={28} />
            Gestion des Payouts
          </h2>
          <p className="text-slate-500 text-sm font-medium">Suivi manuel des paiements vendeurs. (Module opérationnel isolé)</p>
        </div>
        <button 
          onClick={addPayout}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} /> Nouveau Payout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Payouts" value={stats.total} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Montant Payé" value={formatPrice(stats.paidAmount)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Montant Non Payé" value={formatPrice(stats.unpaidAmount)} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Ratios (P/NP)" value={`${stats.paidCount} / ${stats.unpaidCount}`} icon={Banknote} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un vendeur..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Vendeur</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Orders</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Montant Total</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Reste</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2">
                    <EditableCell value={item.vendeur} onSave={(v) => updatePayout(item.id, 'vendeur', v)} className="font-bold text-slate-800" />
                  </td>
                  <td className="p-2 text-center">
                    <EditableCell type="number" value={item.orders_count} onSave={(v) => updatePayout(item.id, 'orders_count', v)} className="text-center font-bold text-slate-500" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.amount_total} onSave={(v) => updatePayout(item.id, 'amount_total', v)} className="text-right font-black text-slate-900" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.amount_remaining} onSave={(v) => updatePayout(item.id, 'amount_remaining', v)} className="text-right font-bold text-red-500" />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updatePayout(item.id, 'status', e.target.value as PayoutStatus)}
                      className={`w-full text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === PayoutStatus.PAYEE ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}
                    >
                      <option value={PayoutStatus.PAYEE}>PAYÉ</option>
                      <option value={PayoutStatus.NON_PAYEE}>NON PAYÉ</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => deletePayout(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                      <Trash2 size={18} />
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

export default Payout;
