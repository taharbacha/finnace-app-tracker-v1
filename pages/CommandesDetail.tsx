
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { SitewebStatus } from '../types.ts';
import { 
  Plus, Search, Banknote, Trash2, Copy, Upload, 
  Clock, Truck, Filter, CheckSquare, Square, 
  ClipboardCheck, ChevronUp, ChevronDown, Percent, Ban, Users
} from 'lucide-react';

const CommandesDetail: React.FC = () => {
  const { getCalculatedSiteweb, updateSiteweb, addSiteweb, deleteSiteweb, duplicateSiteweb, importSiteweb, dashboardDateStart, dashboardDateEnd } = useAppStore();
  const allData = getCalculatedSiteweb();
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHeaders, setShowHeaders] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      const matchesSearch = (item.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.vendeur_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = item.date_created;
      const matchesStart = !dashboardDateStart || itemDate >= dashboardDateStart;
      const matchesEnd = !dashboardDateEnd || itemDate <= dashboardDateEnd;
      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [allData, searchTerm, dashboardDateStart, dashboardDateEnd]);

  const kpiData = useMemo(() => {
    if (!analysisMode) return filteredData;
    return filteredData.filter(item => selectedIds.has(item.id));
  }, [filteredData, analysisMode, selectedIds]);

  const stats = useMemo(() => {
    if (kpiData.length === 0) {
      return { 
        prodTotal: 0, prodA: 0, prodI: 0,
        profitEncaissée: 0,
        profitNonEncaissée: 0, nonEncA: 0, nonEncI: 0, nonEncV: 0,
        enLivraisonValue: 0, enLivraisonProfit: 0, enLivA: 0, enLivI: 0, enLivV: 0,
        retourLoss: 0, returnRate: 0,
        commissionsTotales: 0,
        count: 0
      };
    }

    const prodA = kpiData.reduce((acc, curr) => acc + Number(curr.cout_article || 0), 0);
    const prodI = kpiData.reduce((acc, curr) => acc + Number(curr.cout_impression || 0), 0);
    const prodTotal = prodA + prodI;

    const profitEncaissée = kpiData
      .filter(o => o.status === SitewebStatus.LIVREE)
      .reduce((acc, curr) => acc + curr.profit_net, 0);

    const nonEncaisseData = kpiData.filter(o => o.status === SitewebStatus.LIVREE_NON_ENCAISSEE);
    const profitNonEncaissée = nonEncaisseData.reduce((acc, curr) => acc + curr.profit_net, 0);
    const nonEncA = nonEncaisseData.reduce((acc, curr) => acc + Number(curr.cout_article || 0), 0);
    const nonEncI = nonEncaisseData.reduce((acc, curr) => acc + Number(curr.cout_impression || 0), 0);
    const nonEncV = nonEncaisseData.reduce((acc, curr) => acc + Number(curr.vendeur_benefice || 0), 0);

    const enLivraisonData = kpiData.filter(o => o.status === SitewebStatus.EN_LIVRAISON);
    const enLivraisonValue = enLivraisonData.reduce((acc, curr) => acc + Number(curr.prix_vente || 0), 0);
    const enLivraisonProfit = enLivraisonData.reduce((acc, curr) => acc + curr.profit_net, 0);
    const enLivA = enLivraisonData.reduce((acc, curr) => acc + Number(curr.cout_article || 0), 0);
    const enLivI = enLivraisonData.reduce((acc, curr) => acc + Number(curr.cout_impression || 0), 0);
    const enLivV = enLivraisonData.reduce((acc, curr) => acc + Number(curr.vendeur_benefice || 0), 0);

    const retourData = kpiData.filter(o => o.status === SitewebStatus.RETOUR);
    const retourLoss = retourData.reduce((acc, curr) => acc + (Number(curr.cout_article || 0) + Number(curr.cout_impression || 0)), 0);
    const returnRate = (retourData.length / kpiData.length) * 100;

    const commissionsTotales = kpiData
      .filter(o => o.status === SitewebStatus.LIVREE || o.status === SitewebStatus.LIVREE_NON_ENCAISSEE)
      .reduce((acc, curr) => acc + Number(curr.vendeur_benefice || 0), 0);

    return { 
      prodTotal, prodA, prodI, 
      profitEncaissée, 
      profitNonEncaissée, nonEncA, nonEncI, nonEncV,
      enLivraisonValue, enLivraisonProfit, enLivA, enLivI, enLivV,
      retourLoss, returnRate,
      commissionsTotales,
      count: kpiData.length
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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer cette commande ?')) {
      deleteSiteweb(id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateSiteweb(id);
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
          reference: obj.reference || String(Date.now()).slice(-6),
          date_created: obj.date_created || obj.date || new Date().toISOString().split('T')[0],
          cout_article: Number(obj.cout_article) || 0,
          cout_impression: Number(obj.cout_impression) || 0,
          prix_vente: Number(obj.prix_vente) || 0,
          status: (obj.status as SitewebStatus) || SitewebStatus.EN_LIVRAISON,
          vendeur_name: obj.vendeur_name || 'V-X',
          vendeur_benefice: Number(obj.vendeur_benefice) || 0,
          stock_note: obj.stock_note || '',
          processed: false
        };
      });
      importSiteweb(importedData);
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
            <Truck className="text-blue-600" size={28} />
            Commandes Vendeurs
          </h2>
          <p className="text-slate-500 text-sm font-medium">Gestion opérationnelle Retail & Analyse de commissions.</p>
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
          
          <button type="button" onClick={addSiteweb} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Vente
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      {showHeaders && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Totale</p>
                <h3 className="text-2xl font-black text-slate-900">{formatPrice(stats.prodTotal)}</h3>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Article (A)</p>
                  <p className="text-xs font-bold text-slate-700">{formatPrice(stats.prodA)}</p>
                </div>
                <div className="flex-1 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Impr. (I)</p>
                  <p className="text-xs font-bold text-blue-700">{formatPrice(stats.prodI)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <Banknote className="text-emerald-600" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Encaissé (LIVRÉE)</p>
              <h3 className="text-2xl font-black text-emerald-600">{formatPrice(stats.profitEncaissée)}</h3>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Livré (Non Encaissé)</p>
                <h3 className="text-2xl font-black text-purple-600">{formatPrice(stats.profitNonEncaissée)}</h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-4">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Art.</p>
                  <p className="text-[10px] font-bold text-slate-700">{formatPrice(stats.nonEncA)}</p>
                </div>
                <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50 text-center">
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Imp.</p>
                  <p className="text-[10px] font-bold text-blue-700">{formatPrice(stats.nonEncI)}</p>
                </div>
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/50 text-center">
                  <p className="text-[8px] font-black text-purple-400 uppercase tracking-tighter">Vend.</p>
                  <p className="text-[10px] font-bold text-purple-700">{formatPrice(stats.nonEncV)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                <Users className="text-indigo-600" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission Vendeurs</p>
              <h3 className="text-2xl font-black text-indigo-600">{formatPrice(stats.commissionsTotales)}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Commandes livrées</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Livraison (Valeur Vente)</p>
                <h3 className="text-2xl font-black text-blue-600">{formatPrice(stats.enLivraisonValue)}</h3>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Profit Attendu: {formatPrice(stats.enLivraisonProfit)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cout Retours (Pertes)</p>
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
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par référence ou vendeur..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
          {(dashboardDateStart || dashboardDateEnd) && (
            <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Date Active</span>
            </div>
          )}
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
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Vendeur</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Production (A+I)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Com. Vend.</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Net Profit</th>
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
                  <td className="p-2">
                    <EditableCell type="text" value={item.reference} onSave={(v) => updateSiteweb(item.id, 'reference', v)} className="font-mono text-[10px] font-black text-slate-400 min-w-[60px]" />
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.vendeur_name} onSave={(v) => updateSiteweb(item.id, 'vendeur_name', v)} className="font-bold text-blue-600 text-sm min-w-[120px]" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-2">
                      <EditableCell type="number" value={item.cout_article} onSave={(v) => updateSiteweb(item.id, 'cout_article', v)} prefix="A: " className="text-[10px] py-1 h-auto min-w-[65px]" />
                      <span className="text-slate-300 text-[10px] font-bold">+</span>
                      <EditableCell type="number" value={item.cout_impression} onSave={(v) => updateSiteweb(item.id, 'cout_impression', v)} prefix="I: " className="text-[10px] py-1 h-auto min-w-[65px]" />
                    </div>
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateSiteweb(item.id, 'prix_vente', v)} className="text-right" />
                  </td>
                  <td className="p-2 text-right font-bold text-purple-600">
                    <EditableCell type="number" value={item.vendeur_benefice} onSave={(v) => updateSiteweb(item.id, 'vendeur_benefice', v)} className="text-right" />
                  </td>
                  <td className="p-2 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateSiteweb(item.id, 'status', e.target.value)}
                      className={`w-full text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === SitewebStatus.LIVREE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === SitewebStatus.LIVREE_NON_ENCAISSEE ? 'bg-purple-50 text-purple-700' :
                          item.status === SitewebStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}
                    >
                      {Object.values(SitewebStatus).map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.profit_net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPrice(item.profit_net)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => updateSiteweb(item.id, 'processed', !item.processed)} 
                        title="Marquer comme traité"
                        className={`p-2 transition-all rounded-lg ${item.processed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                      >
                        <ClipboardCheck size={18} />
                      </button>
                      <button onClick={(e) => handleDuplicate(e, item.id)} className="p-2 text-slate-300 hover:text-blue-500 transition-all rounded-lg hover:bg-blue-50">
                        <Copy size={16} />
                      </button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                        <Trash2 size={18} />
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

export default CommandesDetail;
