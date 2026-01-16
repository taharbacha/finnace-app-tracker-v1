
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { MerchStatus } from '../types.ts';
import { MERCH_STATUS_OPTIONS } from '../constants.ts';
import { 
  Plus, Search, Banknote, Trash2, Download, Upload, AlertCircle, 
  Clock, Truck, ShoppingBag, Filter, CheckSquare, Square, 
  ClipboardCheck, ChevronUp, ChevronDown, Percent, Ban 
} from 'lucide-react';

const CommandeMerch: React.FC = () => {
  const { getCalculatedMerch, updateMerch, addMerch, deleteMerch, importMerch } = useAppStore();
  const allData = getCalculatedMerch();
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHeaders, setShowHeaders] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return (item.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.produit || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allData, searchTerm]);

  // Logic for selection-based KPIs
  const kpiData = useMemo(() => {
    if (!analysisMode) return filteredData;
    return filteredData.filter(item => selectedIds.has(item.id));
  }, [filteredData, analysisMode, selectedIds]);

  const stats = useMemo(() => {
    if (kpiData.length === 0) {
      return {
        production: 0,
        profitEncaissé: 0,
        nonEncProduction: 0,
        enLivraisonVente: 0,
        enLivraisonProfit: 0,
        enLivraisonProduction: 0,
        retourLoss: 0,
        returnRate: 0,
        counts: { total: 0, enLivraison: 0, livree: 0, livreeNonEnc: 0, retour: 0 }
      };
    }

    const production = kpiData.reduce((acc, curr) => acc + Number(curr.prix_achat || 0), 0);
    
    const profitEncaissé = kpiData
      .filter(i => i.status === MerchStatus.LIVREE)
      .reduce((acc, curr) => acc + (Number(curr.prix_vente || 0) - Number(curr.prix_achat || 0)), 0);

    const nonEncProduction = kpiData
      .filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE)
      .reduce((acc, curr) => acc + Number(curr.prix_achat || 0), 0);

    const enLivraisonOrders = kpiData.filter(i => i.status === MerchStatus.EN_LIVRAISON);
    const enLivraisonVente = enLivraisonOrders.reduce((acc, curr) => acc + Number(curr.prix_vente || 0), 0);
    const enLivraisonProduction = enLivraisonOrders.reduce((acc, curr) => acc + Number(curr.prix_achat || 0), 0);
    const enLivraisonProfit = enLivraisonVente - enLivraisonProduction;

    const retourOrders = kpiData.filter(i => i.status === MerchStatus.RETOUR);
    const retourLoss = retourOrders.reduce((acc, curr) => acc + Number(curr.prix_achat || 0), 0);
    const returnRate = (retourOrders.length / kpiData.length) * 100;

    const counts = {
      total: kpiData.length,
      enLivraison: enLivraisonOrders.length,
      livree: kpiData.filter(i => i.status === MerchStatus.LIVREE).length,
      livreeNonEnc: kpiData.filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE).length,
      retour: retourOrders.length
    };

    return { 
      production, profitEncaissé, nonEncProduction, 
      enLivraisonVente, enLivraisonProfit, enLivraisonProduction,
      retourLoss, returnRate, counts
    };
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

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const importedData = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => { obj[header] = values[index]; });
        return {
          reference: obj.reference || `M${Date.now()}`,
          client_name: obj.client_name || '',
          produit: obj.produit || '',
          prix_achat: Number(obj.prix_achat) || 0,
          prix_vente: Number(obj.prix_vente) || 0,
          status: (obj.status as MerchStatus) || MerchStatus.EN_LIVRAISON,
          created_at: obj.created_at || new Date().toISOString()
        };
      });
      importMerch(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShoppingBag className="text-blue-600" size={28} />
            Commande Merch
          </h2>
          <p className="text-slate-500 text-sm font-medium">Gestion opérationnelle des ventes directes de produits dérivés.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setAnalysisMode(!analysisMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
              ${analysisMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'}`}
          >
            <Filter size={16} />
            {analysisMode ? 'Analyse Active' : 'Mode Analyse OFF'}
          </button>
          
          <button 
            onClick={() => setShowHeaders(!showHeaders)}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
            title={showHeaders ? "Masquer les KPIs" : "Afficher les KPIs"}
          >
            {showHeaders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all">
            <Upload size={18} />
          </button>
          
          <button type="button" onClick={addMerch} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Vente
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      {showHeaders && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            
            {/* KPI: Production */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <ShoppingBag className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production (Achat)</p>
                <h3 className="text-2xl font-black text-slate-900">{formatPrice(stats.production)}</h3>
              </div>
            </div>

            {/* KPI: Profit Encaissé */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <Banknote className="text-emerald-600" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Encaissé (LIVRÉE)</p>
              <h3 className="text-2xl font-black text-emerald-600">{formatPrice(stats.profitEncaissé)}</h3>
            </div>

            {/* KPI: Livrée Non Encaissée */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
                <Clock className="text-purple-600" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Livrée (Non Encaissée)</p>
              <h3 className="text-2xl font-black text-purple-600">{formatPrice(stats.nonEncProduction)}</h3>
            </div>

            {/* KPI: En Livraison */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Livraison (Valeur Vente)</p>
                <h3 className="text-2xl font-black text-blue-600">{formatPrice(stats.enLivraisonVente)}</h3>
              </div>
              <div className="mt-4 space-y-1 pt-3 border-t border-slate-50">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Profit Potentiel</span>
                  <span className="text-blue-500">{formatPrice(stats.enLivraisonProfit)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Production</span>
                  <span className="text-slate-600">{formatPrice(stats.enLivraisonProduction)}</span>
                </div>
              </div>
            </div>

            {/* KPI: Retour */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prod. Perdue (Retours)</p>
                  <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    <Percent size={10} />
                    <span className="text-[10px] font-black">{stats.returnRate.toFixed(1)}%</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-red-600">{formatPrice(stats.retourLoss)}</h3>
              </div>
              <div className="mt-4 flex items-center justify-center p-3 bg-red-50/50 rounded-2xl border border-red-100/50">
                <Ban size={24} className="text-red-300" />
              </div>
            </div>
          </div>

          {/* Status Chips Summary */}
          <div className="flex flex-wrap items-center gap-3 px-2">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2">Compteurs:</div>
            <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 border border-slate-200">
              TOTAL: {stats.counts.total}
            </div>
            <div className="px-3 py-1 bg-blue-50 rounded-full text-[10px] font-black text-blue-600 border border-blue-100">
              LIVRAISON: {stats.counts.enLivraison}
            </div>
            <div className="px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100">
              LIVRÉE: {stats.counts.livree}
            </div>
            <div className="px-3 py-1 bg-purple-50 rounded-full text-[10px] font-black text-purple-600 border border-purple-100">
              ATTENTE: {stats.counts.livreeNonEnc}
            </div>
            <div className="px-3 py-1 bg-red-50 rounded-full text-[10px] font-black text-red-600 border border-red-100">
              RETOUR: {stats.counts.retour}
            </div>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher par Client, Produit ou Réf..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
             <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Affiche: {filteredData.length}</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 w-12 text-center">
                  <button onClick={selectAll} className="text-slate-300 hover:text-blue-500 transition-colors">
                    {selectedIds.size === filteredData.length && filteredData.length > 0 ? <CheckSquare size={20} className="text-blue-500" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Ref</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Produit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Achat</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Profit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className={`transition-colors group ${selectedIds.has(item.id) ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleSelection(item.id)} className="text-slate-300 hover:text-blue-500 transition-colors">
                      {selectedIds.has(item.id) ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="p-2 font-mono text-xs font-black text-slate-400">
                    <EditableCell value={item.reference} onSave={(v) => updateMerch(item.id, 'reference', v)} />
                  </td>
                  <td className="p-2 font-bold text-blue-600">
                    <EditableCell value={item.client_name} onSave={(v) => updateMerch(item.id, 'client_name', v)} />
                  </td>
                  <td className="p-2 text-slate-700">
                    <EditableCell value={item.produit} onSave={(v) => updateMerch(item.id, 'produit', v)} />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.prix_achat} onSave={(v) => updateMerch(item.id, 'prix_achat', v)} className="text-right text-slate-500" />
                  </td>
                  <td className="p-2 text-right font-black">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateMerch(item.id, 'prix_vente', v)} className="text-right" />
                  </td>
                  <td className="p-2 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateMerch(item.id, 'status', e.target.value as MerchStatus)}
                      className={`w-full text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === MerchStatus.LIVREE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === MerchStatus.LIVREE_NON_ENCAISSEE ? 'bg-purple-50 text-purple-700' :
                          item.status === MerchStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}
                    >
                      {MERCH_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.status === MerchStatus.RETOUR ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.status === MerchStatus.RETOUR ? `-${formatPrice(item.impact_perte)}` : formatPrice(item.profit)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => updateMerch(item.id, 'processed' as any, !(item as any).processed)} 
                        title="Marquer comme traité"
                        className={`p-2 transition-all rounded-lg ${(item as any).processed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                      >
                        <ClipboardCheck size={18} />
                      </button>
                      <button onClick={() => deleteMerch(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-200">
                      <ShoppingBag size={64} />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-300">Aucune commande Merch trouvée</p>
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

export default CommandeMerch;
