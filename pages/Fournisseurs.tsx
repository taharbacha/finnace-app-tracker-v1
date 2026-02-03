
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
  Layers, 
  ArrowRightLeft,
  Info,
  Package,
  Printer,
  History
} from 'lucide-react';

const formatCurrency = (val: number) => Math.round(val).toLocaleString('fr-DZ') + ' DA';

const MustGiveCard = ({ name, mustGiveValue, icon: Icon, colorClass }: any) => {
  const isPositive = mustGiveValue > 0;
  
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-4 rounded-2xl shadow-lg ${colorClass.bg} text-white`}>
            <Icon size={24} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Partenaire</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{name}</h3>
          </div>
        </div>

        <div className="mt-8">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Solde "Must Give"</p>
           <h4 className={`text-3xl font-black tabular-nums tracking-tighter ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
             {formatCurrency(mustGiveValue)}
           </h4>
           <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-tighter">
             {isPositive ? 'Dette à régulariser' : 'Compte équilibré / Crédit'}
           </p>
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
    deleteFournisseurLedger,
    gros,
    merch,
    siteweb
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculate Read-Only Values from other modules
  const productionTotals = useMemo(() => {
    const grosArticle = gros.reduce((acc, curr) => acc + Number(curr.prix_achat_article || 0), 0);
    const grosImpression = gros.reduce((acc, curr) => acc + Number(curr.prix_impression || 0), 0);
    const merchAchat = merch.reduce((acc, curr) => acc + Number(curr.prix_achat || 0), 0);
    const vendeursTotal = siteweb.reduce((acc, curr) => acc + (Number(curr.cout_article || 0) + Number(curr.cout_impression || 0)), 0);

    return { grosArticle, grosImpression, merchAchat, vendeursTotal };
  }, [gros, merch, siteweb]);

  // 2. Calculate Payments from Ledger
  const payments = useMemo(() => {
    const yassin = fournisseurLedger.filter(l => l.fournisseur === FournisseurName.YASSIN).reduce((a, c) => a + Number(c.amount || 0), 0);
    const css = fournisseurLedger.filter(l => l.fournisseur === FournisseurName.CSS).reduce((a, c) => a + Number(c.amount || 0), 0);
    const emprinte = fournisseurLedger.filter(l => l.fournisseur === FournisseurName.EMPRINTE).reduce((a, c) => a + Number(c.amount || 0), 0);
    const bivalent = fournisseurLedger.filter(l => l.fournisseur === FournisseurName.BIVALENT).reduce((a, c) => a + Number(c.amount || 0), 0);

    return { yassin, css, emprinte, bivalent };
  }, [fournisseurLedger]);

  // 3. Compute Final "Must Give" Balances
  const mustGive = useMemo(() => {
    return {
      yassin: (productionTotals.grosArticle + productionTotals.merchAchat) - (payments.yassin + payments.bivalent),
      css: productionTotals.grosImpression - payments.css,
      emprinte: productionTotals.vendeursTotal - payments.emprinte
    };
  }, [productionTotals, payments]);

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
      case FournisseurForWho.VENDEURS:
        return [FournisseurName.EMPRINTE];
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

      {/* Summary Cards - Must Give Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MustGiveCard 
          name={FournisseurName.YASSIN} 
          mustGiveValue={mustGive.yassin} 
          icon={Package} 
          colorClass={{bg: 'bg-slate-900', text: 'text-white'}} 
        />
        <MustGiveCard 
          name={FournisseurName.CSS} 
          mustGiveValue={mustGive.css} 
          icon={Printer} 
          colorClass={{bg: 'bg-blue-600', text: 'text-white'}} 
        />
        <MustGiveCard 
          name={FournisseurName.EMPRINTE} 
          mustGiveValue={mustGive.emprinte} 
          icon={Layers} 
          colorClass={{bg: 'bg-indigo-600', text: 'text-white'}} 
        />
      </div>

      {/* Production Values Trace (Info Only) */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-wrap gap-8 justify-center shadow-sm">
         <div className="flex items-center gap-3">
            <Info size={14} className="text-slate-300" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de calcul :</span>
         </div>
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">GROS Art.</p>
            <p className="text-xs font-black text-slate-700">{formatCurrency(productionTotals.grosArticle)}</p>
         </div>
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">GROS Imp.</p>
            <p className="text-xs font-black text-slate-700">{formatCurrency(productionTotals.grosImpression)}</p>
         </div>
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">MERCH Prod.</p>
            <p className="text-xs font-black text-slate-700">{formatCurrency(productionTotals.merchAchat)}</p>
         </div>
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">VENDEURS Prod.</p>
            <p className="text-xs font-black text-slate-700">{formatCurrency(productionTotals.vendeursTotal)}</p>
         </div>
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
