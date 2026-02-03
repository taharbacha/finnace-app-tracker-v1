
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { 
  FournisseurName, 
  FournisseurForWho, 
  FournisseurType 
} from '../types.ts';
import { 
  Plus, 
  Users, 
  Search, 
  Trash2, 
  Banknote, 
  Layers, 
  ArrowRightLeft,
  Info,
  Package,
  Printer
} from 'lucide-react';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const FournisseurCard = ({ name, data }: { name: FournisseurName, data: any[] }) => {
  const fData = data.filter(d => d.fournisseur === name);

  // Split into sections
  const articleEntries = fData.filter(d => 
    [FournisseurForWho.GROS_ARTICLE, FournisseurForWho.MERCH, FournisseurForWho.VENDEURS_ARTICLE].includes(d.for_who)
  );
  const impressionEntries = fData.filter(d => 
    [FournisseurForWho.GROS_IMPRESSION, FournisseurForWho.VENDEURS_IMPRESSION].includes(d.for_who)
  );

  const calculateStats = (entries: any[]) => {
    const owed = entries.filter(e => e.type === FournisseurType.OWED).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const paid = entries.filter(e => e.type === FournisseurType.PAID).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    return { owed, paid, bal: owed - paid };
  };

  const artStats = calculateStats(articleEntries);
  const impStats = calculateStats(impressionEntries);
  const totalBal = artStats.bal + impStats.bal;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Users size={24} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fournisseur</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{name}</h3>
          </div>
        </div>

        <div className="space-y-6">
          {/* Article Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Package size={12} className="text-blue-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Section Article</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase">Dû (Owed)</p>
                <p className="text-xs font-bold text-slate-800">{formatCurrency(artStats.owed)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-emerald-400 uppercase">Payé (Paid)</p>
                <p className="text-xs font-bold text-emerald-700">{formatCurrency(artStats.paid)}</p>
              </div>
            </div>
          </div>

          {/* Impression Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Printer size={12} className="text-purple-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Section Impression</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase">Dû (Owed)</p>
                <p className="text-xs font-bold text-slate-800">{formatCurrency(impStats.owed)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black text-emerald-400 uppercase">Payé (Paid)</p>
                <p className="text-xs font-bold text-emerald-700">{formatCurrency(impStats.paid)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solde Global</p>
            <p className={`text-2xl font-black ${totalBal > 0 ? 'text-rose-600' : totalBal < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatCurrency(totalBal)}
            </p>
          </div>
          <div className={`p-2 rounded-xl ${totalBal > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
            <ArrowRightLeft size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const handleDelete = (id: string) => {
    if (confirm('Supprimer définitivement cette ligne du ledger fournisseur ?')) {
      deleteFournisseurLedger(id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Users className="text-slate-900" size={36} />
            Gestion Fournisseurs
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Suivi indépendant des dettes et paiements partenaires.</p>
        </div>
        <button 
          onClick={addFournisseurLedger}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
        >
          <Plus size={20} /> Nouvelle Entrée
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FournisseurCard name={FournisseurName.YASSIN} data={fournisseurLedger} />
        <FournisseurCard name={FournisseurName.CSS} data={fournisseurLedger} />
        <FournisseurCard name={FournisseurName.EMPRINTE} data={fournisseurLedger} />
        <FournisseurCard name={FournisseurName.BIVALENT} data={fournisseurLedger} />
      </div>

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
          <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
             <Info size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Calculs en temps réel</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Fournisseur</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Cible (For Who)</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Montant</th>
                <th className="p-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Type</th>
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
                      value={item.fournisseur} 
                      onChange={(e) => updateFournisseurLedger(item.id, 'fournisseur', e.target.value)}
                      className="w-full p-2 bg-slate-100 border-none rounded-xl text-xs font-black uppercase tracking-tight outline-none cursor-pointer"
                    >
                      {Object.values(FournisseurName).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.for_who} 
                      onChange={(e) => updateFournisseurLedger(item.id, 'for_who', e.target.value)}
                      className="w-full p-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-tighter outline-none cursor-pointer"
                    >
                      {Object.values(FournisseurForWho).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <EditableCell 
                      type="number" 
                      value={item.amount} 
                      onSave={(v) => updateFournisseurLedger(item.id, 'amount', v)} 
                      className={`text-right font-black ${item.type === FournisseurType.OWED ? 'text-rose-600' : 'text-emerald-600'}`} 
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => updateFournisseurLedger(item.id, 'type', item.type === FournisseurType.OWED ? FournisseurType.PAID : FournisseurType.OWED)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                        ${item.type === FournisseurType.OWED ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      {item.type === FournisseurType.OWED ? 'Dû (Owed)' : 'Payé (Paid)'}
                    </button>
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
                  <td colSpan={7} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <Layers size={40} />
                      </div>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Aucune transaction enregistrée</p>
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
