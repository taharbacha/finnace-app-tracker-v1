
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { CreditStatus } from '../types.ts';
import { Plus, Search, Trash2, Wallet, Users, CheckCircle2, AlertCircle } from 'lucide-react';

const Credit: React.FC = () => {
  const { credits, addCredit, updateCredit, deleteCredit } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return credits.filter(item => {
      return (item.client || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [credits, searchTerm]);

  const stats = useMemo(() => {
    const totalCount = filteredData.length;
    // UPDATED: Use item.somme instead of amount
    const totalUnpaidAmount = filteredData.filter(i => i.status === CreditStatus.NON_PAYEE).reduce((acc, curr) => acc + Number(curr.somme || 0), 0);
    const totalPaidAmount = filteredData.filter(i => i.status === CreditStatus.PAYEE).reduce((acc, curr) => acc + Number(curr.somme || 0), 0);
    const debtorCount = filteredData.filter(i => i.status === CreditStatus.NON_PAYEE).length;
    return { totalCount, totalUnpaidAmount, totalPaidAmount, debtorCount };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Wallet className="text-blue-600" size={28} />
            Gestion des Crédits
          </h2>
          <p className="text-slate-500 text-sm font-medium">Suivi des dettes clients (Crédits). (Module opérationnel isolé)</p>
        </div>
        <button 
          onClick={addCredit}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={18} /> Nouveau Crédit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Crédits" value={stats.totalCount} icon={Users} color="text-slate-600" bg="bg-slate-50" />
        <StatCard label="Montant Impayé" value={formatPrice(stats.totalUnpaidAmount)} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Montant Récupéré" value={formatPrice(stats.totalPaidAmount)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Nombre Débiteurs" value={stats.debtorCount} icon={Users} color="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
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
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Montant Crédit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2">
                    <EditableCell value={item.client} onSave={(v) => updateCredit(item.id, 'client', v)} className="font-bold text-slate-800" />
                  </td>
                  <td className="p-2 text-right">
                    {/* UPDATED: Use item.somme instead of amount */}
                    <EditableCell type="number" value={item.somme} onSave={(v) => updateCredit(item.id, 'somme', v)} className="text-right font-black text-red-600" />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateCredit(item.id, 'status', e.target.value as CreditStatus)}
                      className={`w-full text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === CreditStatus.PAYEE ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                    >
                      <option value={CreditStatus.PAYEE}>RÉCUPÉRÉ</option>
                      <option value={CreditStatus.NON_PAYEE}>À RÉCUPÉRER</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => deleteCredit(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
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

export default Credit;
