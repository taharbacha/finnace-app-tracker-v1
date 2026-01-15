
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { GROS_STATUS_OPTIONS } from '../constants.ts';
import { GrosStatus, CalculatedGros } from '../types.ts';
import { 
  Plus, Search, Truck, Banknote, AlertCircle, Calendar, 
  Trash2, Download, Upload, Clock, Ban, ChevronUp, ChevronDown, 
  Filter, CheckSquare, Square, ClipboardCheck
} from 'lucide-react';

const CommandesGros: React.FC = () => {
  const { getCalculatedGros, updateGros, addGros, deleteGros, importGros } = useAppStore();
  const allData = getCalculatedGros();
  
  // UI-ONLY State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [showHeaders, setShowHeaders] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      const matchesSearch = item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = item.date_created;
      const matchesStart = !dateStart || itemDate >= dateStart;
      const matchesEnd = !dateEnd || itemDate <= dateEnd;
      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [allData, searchTerm, dateStart, dateEnd]);

  // Subset for KPI calculations based on Analysis Mode
  const kpiData = useMemo(() => {
    if (!analysisMode) return filteredData;
    return filteredData.filter(item => selectedIds.has(item.id));
  }, [filteredData, analysisMode, selectedIds]);

  const stats = useMemo(() => {
    const totalProd = kpiData.reduce((acc, curr) => acc + curr.cost, 0);
    const totalA = kpiData.reduce((acc, curr) => acc + Number(curr.prix_achat_article || 0), 0);
    const totalI = kpiData.reduce((acc, curr) => acc + Number(curr.prix_impression || 0), 0);
    
    const profitEncaisse = kpiData
      .filter(o => o.status === GrosStatus.LIVREE_ENCAISSE)
      .reduce((acc, curr) => acc + (curr.prix_vente - curr.cost), 0);
      
    const enLivraisonValue = kpiData
      .filter(o => o.status === GrosStatus.EN_LIVRAISON)
      .reduce((acc, curr) => acc + Number(curr.prix_vente), 0);
      
    const enLivraisonProfit = kpiData
      .filter(o => o.status === GrosStatus.EN_LIVRAISON)
      .reduce((acc, curr) => acc + (curr.prix_vente - curr.cost), 0);
      
    const costRetour = kpiData
      .filter(o => o.status === GrosStatus.RETOUR)
      .reduce((acc, curr) => acc + curr.cost, 0);

    // Status Counters
    const counts = {
      total: kpiData.length,
      enLivraison: kpiData.filter(o => o.status === GrosStatus.EN_LIVRAISON).length,
      livreeEncaissée: kpiData.filter(o => o.status === GrosStatus.LIVREE_ENCAISSE).length,
      livreeNonEncaissée: kpiData.filter(o => o.status === GrosStatus.LIVREE_NON_ENCAISSE).length,
      retour: kpiData.filter(o => o.status === GrosStatus.RETOUR).length,
    };
    
    return { totalProd, totalA, totalI, profitEncaisse, enLivraisonValue, enLivraisonProfit, costRetour, counts };
  }, [kpiData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleProcessed = (id: string) => {
    const next = new Set(processedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setProcessedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredData.map(i => i.id)));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Confirmer la suppression définitive de cette commande gros ?')) {
      deleteGros(id);
    }
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
          reference: obj.reference || `G${Date.now()}`,
          client_name: obj.client_name || obj.client || '',
          client_phone: obj.client_phone || '',
          date_created: obj.date_created || obj.date || new Date().toISOString().split('T')[0],
          prix_achat_article: Number(obj.prix_achat_article) || 0,
          impression: obj.impression === 'true',
          prix_impression: Number(obj.prix_impression) || 0,
          prix_vente: Number(obj.prix_vente) || 0,
          status: (obj.status as GrosStatus) || GrosStatus.EN_PRODUCTION,
          stock_note: obj.stock_note || ''
        };
      });
      importGros(importedData);
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
            Commandes GROS
          </h2>
          <p className="text-slate-500 text-sm font-medium">Espace opérationnel & Analyse de rentabilité wholesale.</p>
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
          
          <button type="button" onClick={addGros} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Commande
          </button>
        </div>
      </div>

      {/* KPI Cards Section */}
      {showHeaders && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI A: Production */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production (Total)</p>
                <h3 className="text-2xl font-black text-slate-900">{formatPrice(stats.totalProd)}</h3>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Article (A)</p>
                  <p className="text-xs font-bold text-slate-700">{formatPrice(stats.totalA)}</p>
                </div>
                <div className="flex-1 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Impr. (I)</p>
                  <p className="text-xs font-bold text-blue-700">{formatPrice(stats.totalI)}</p>
                </div>
              </div>
            </div>

            {/* KPI B: Profit Encaissé */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <Banknote className="text-emerald-600" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Encaissé</p>
              <h3 className="text-2xl font-black text-emerald-600">{formatPrice(stats.profitEncaisse)}</h3>
            </div>

            {/* KPI C: En Livraison */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Livraison (Valeur)</p>
                <h3 className="text-2xl font-black text-blue-600">{formatPrice(stats.enLivraisonValue)}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-blue-400">
                <Clock size={14} />
                <span className="text-xs font-bold">Profit Attendu: {formatPrice(stats.enLivraisonProfit)}</span>
              </div>
            </div>

            {/* KPI D: Retour */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                <Ban className="text-red-600" size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cout Retours (Pertes)</p>
              <h3 className="text-2xl font-black text-red-600">{formatPrice(stats.costRetour)}</h3>
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
              ENCAISSÉ: {stats.counts.livreeEncaissée}
            </div>
            <div className="px-3 py-1 bg-purple-50 rounded-full text-[10px] font-black text-purple-600 border border-purple-100">
              ATTENTE: {stats.counts.livreeNonEncaissée}
            </div>
            <div className="px-3 py-1 bg-red-50 rounded-full text-[10px] font-black text-red-600 border border-red-100">
              RETOUR: {stats.counts.retour}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher client ou référence..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm">
            <Calendar size={14} className="text-blue-500" />
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="text-xs outline-none bg-transparent font-bold text-slate-700" />
            <span className="text-slate-300 font-bold text-[10px] uppercase">Au</span>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="text-xs outline-none bg-transparent font-bold text-slate-700" />
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
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Production (A+I)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
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
                    <EditableCell value={item.reference} onSave={(v) => updateGros(item.id, 'reference', v)} className="font-mono text-[10px] font-black text-blue-600 min-w-[60px]" />
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.client_name} onSave={(v) => updateGros(item.id, 'client_name', v)} className="font-bold text-slate-800 text-sm min-w-[120px]" />
                  </td>
                  <td className="p-2">
                    <EditableCell type="date" value={item.date_created} onSave={(v) => updateGros(item.id, 'date_created', v)} className="text-[10px] text-slate-400 font-bold" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2 text-right">
                      <EditableCell type="number" value={item.prix_achat_article} onSave={(v) => updateGros(item.id, 'prix_achat_article', v)} prefix="A: " className="text-[10px] h-auto text-slate-500 min-w-[70px]" />
                      <span className="text-slate-300 text-[10px] font-bold">+</span>
                      <EditableCell type="number" value={item.prix_impression} onSave={(v) => updateGros(item.id, 'prix_impression', v)} prefix="I: " className="text-[10px] h-auto text-slate-500 min-w-[70px]" />
                    </div>
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateGros(item.id, 'prix_vente', v)} className="text-right" />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateGros(item.id, 'status', e.target.value as GrosStatus)} 
                      className={`w-full text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === GrosStatus.LIVREE_ENCAISSE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === GrosStatus.LIVREE_NON_ENCAISSE ? 'bg-purple-50 text-purple-700' :
                          item.status === GrosStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' :
                          item.status === GrosStatus.RETOUR ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {GROS_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className={`p-4 text-right font-black text-sm ${item.status === GrosStatus.RETOUR ? 'text-red-500' : 'text-slate-900'}`}>
                    {item.status === GrosStatus.RETOUR ? `- ${formatPrice(item.cost)}` : formatPrice(item.prix_vente - item.cost)}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => toggleProcessed(item.id)} 
                        title="Marquer comme traité"
                        className={`p-2 transition-all rounded-lg ${processedIds.has(item.id) ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
                      >
                        <ClipboardCheck size={18} />
                      </button>
                      <button onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-200">
                      <Truck size={64} />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-300">Aucune commande trouvée</p>
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

export default CommandesGros;
