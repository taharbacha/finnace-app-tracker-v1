
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { 
  FournisseurName, 
  FournisseurForWho 
} from '../types.ts';
import { 
  Plus, 
  Users, 
  Search, 
  Trash2, 
  History
} from 'lucide-react';

const formatCurrency = (val: number) => Math.round(val).toLocaleString('fr-DZ') + ' DA';

const Fournisseurs: React.FC = () => {
  const { 
    fournisseurLedger, 
    addFournisseurLedger, 
    updateFournisseurLedger, 
    deleteFournisseurLedger
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return fournisseurLedger.filter(item => {
      return (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.fournisseur || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.for_who || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fournisseurLedger, searchTerm]);

  // Rules based validation for dropdowns
  const getAvailableFournisseurs = (forWho: FournisseurForWho) => {
    switch(forWho) {
      case FournisseurForWho.GROS_ARTICLE:
      case FournisseurForWho.MERCH:
        return [FournisseurName.YASSIN, FournisseurName.BIVALENT];
      case FournisseurForWho.GROS_IMPRESSION:
        return [FournisseurName.CSS];
      default:
        return Object.values(FournisseurName);
    }
  };

  const handleForWhoChange = (id: string, newVal: any) => {
    const available = getAvailableFournisseurs(newVal as FournisseurForWho);
    updateFournisseurLedger(id, 'for_who', newVal);
    // If current fournisseur is not valid for new ForWho, auto-switch it
    const currentItem = fournisseurLedger.find(i => i.id === id);
    if (currentItem && !available.includes(currentItem.fournisseur)) {
      updateFournisseurLedger(id, 'fournisseur', available[0]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer définitivement ce paiement ?')) {
      deleteFournisseurLedger(id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Users className="text-blue-600" size={36} />
            Fournisseurs Balance
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Réconciliation des dettes de production et paiements effectués.</p>
        </div>
        <button 
          onClick={addFournisseurLedger}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
        >
          <Plus size={20} /> Nouveau Paiement
        </button>
      </div>

      {/* Removed Cards as requested */}

      {/* Main Ledger Table */}
      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par note, fournisseur, cible..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
             <History size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Journal des Paiements</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Cible (For Who)</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Fournisseur</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Montant Payé</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Memo</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-3">
                    <EditableCell type="date" value={item.date} onSave={(v) => updateFournisseurLedger(item.id, 'date', v)} className="text-slate-400 font-bold" />
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.for_who} 
                      onChange={(e) => handleForWhoChange(item.id, e.target.value)}
                      className="w-full p-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-tighter outline-none cursor-pointer"
                    >
                      {Object.values(FournisseurForWho).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.fournisseur} 
                      onChange={(e) => updateFournisseurLedger(item.id, 'fournisseur', e.target.value as FournisseurName)}
                      className="w-full p-2 bg-slate-100 border-none rounded-xl text-xs font-black uppercase tracking-tight outline-none cursor-pointer"
                    >
                      {getAvailableFournisseurs(item.for_who).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <EditableCell 
                      type="number" 
                      value={item.amount} 
                      onSave={(v) => updateFournisseurLedger(item.id, 'amount', v)} 
                      className={`text-right font-black text-emerald-600`} 
                    />
                  </td>
                  <td className="p-3">
                    <EditableCell value={item.notes} onSave={(v) => updateFournisseurLedger(item.id, 'notes', v)} className="italic text-xs text-slate-400" />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-200 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <Layers size={40} />
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Aucun paiement enregistré</p>
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

export default Fournisseurs;
