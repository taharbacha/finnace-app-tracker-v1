
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { EXTERN_STATUS_OPTIONS } from '../constants.ts';
import { ExternStatus } from '../types.ts';
import { Plus, Search, Banknote, ShoppingBag, User, Trash2 } from 'lucide-react';

const CommandesDetail: React.FC = () => {
  const { getCalculatedExtern, updateExtern, addExtern, deleteExtern } = useAppStore();
  const allData = getCalculatedExtern();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.vendeur_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [allData, searchTerm]);

  const stats = useMemo(() => {
    const totalProfit = filteredData.reduce((acc, curr) => acc + curr.profit_reel, 0);
    const totalVendorBenefice = filteredData.reduce((acc, curr) => acc + (curr.status === ExternStatus.LIVREE ? Number(curr.vendeur_benefice) : 0), 0);
    const deliveredCount = filteredData.filter(d => d.status === ExternStatus.LIVREE).length;
    return { totalProfit, totalVendorBenefice, deliveredCount };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer cet enregistrement client sitweb ?')) {
      deleteExtern(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Commandes sitweb</h2>
          <p className="text-slate-500 text-sm">Gestion des commandes directes et commissions vendeurs.</p>
        </div>
        <button 
          type="button"
          onClick={addExtern}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md active:scale-95"
        >
          <Plus size={16} /> Nouveau Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Profit Réel" value={formatPrice(stats.totalProfit)} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Total Vendeurs" value={formatPrice(stats.totalVendorBenefice)} icon={User} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Livraisons" value={stats.deliveredCount} icon={ShoppingBag} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtre client, vendeur, ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Ref</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Vendeur</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Com. Vendeur</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Profit Net</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2 font-mono text-xs font-black text-slate-400">
                    <EditableCell value={item.reference} onSave={(v) => updateExtern(item.id, 'reference', v)} />
                  </td>
                  <td className="p-2 font-bold text-blue-600">
                    <EditableCell value={item.vendeur_name} onSave={(v) => updateExtern(item.id, 'vendeur_name', v)} />
                  </td>
                  <td className="p-2 font-bold text-slate-800">
                    <EditableCell value={item.client_name} onSave={(v) => updateExtern(item.id, 'client_name', v)} />
                  </td>
                  <td className="p-2 text-right font-bold text-purple-600">
                    <EditableCell type="number" value={item.vendeur_benefice} onSave={(v) => updateExtern(item.id, 'vendeur_benefice', v)} />
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateExtern(item.id, 'prix_vente', v)} />
                  </td>
                  <td className="p-2 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateExtern(item.id, 'status', e.target.value)}
                      className="text-[10px] p-1.5 border-none bg-slate-100 rounded-lg cursor-pointer font-black text-slate-600 uppercase"
                    >
                      {EXTERN_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.status === ExternStatus.LIVREE ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {formatPrice(Number(item.prix_vente) - (item.cost + Number(item.vendeur_benefice)))}
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

export default CommandesDetail;
