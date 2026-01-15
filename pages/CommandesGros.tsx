
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { GROS_STATUS_OPTIONS } from '../constants.ts';
import { GrosStatus } from '../types.ts';
import { 
  Plus, Search, Truck, Banknote, Calendar, 
  Trash2, Download, Upload, Clock, RotateCcw
} from 'lucide-react';

// Main component for Managing Wholesale Orders (Gros)
const CommandesGros: React.FC = () => {
  const { getCalculatedGros, updateGros, addGros, deleteGros, importGros } = useAppStore();
  const allData = getCalculatedGros();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort the data based on search input and creation date
  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return (item.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [allData, searchTerm]);

  // Aggregate stats for the KPI section
  const stats = useMemo(() => {
    const profitEncaisse = filteredData.reduce((acc, curr) => acc + curr.profit_encaisse, 0);
    const profitAttendu = filteredData.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    const perte = filteredData.reduce((acc, curr) => acc + curr.perte, 0);
    const countTotal = filteredData.length;
    return { profitEncaisse, profitAttendu, perte, countTotal };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  // Handler for CSV imports
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
          client_name: obj.client_name || '',
          client_phone: obj.client_phone || '',
          date_created: obj.date_created || new Date().toISOString().split('T')[0],
          prix_achat_article: Number(obj.prix_achat_article) || 0,
          prix_impression: Number(obj.prix_impression) || 0,
          prix_vente: Number(obj.prix_vente) || 0,
          status: (obj.status as GrosStatus) || GrosStatus.EN_PRODUCTION,
          stock_note: obj.stock_note || '',
          processed: obj.processed === 'true'
        };
      });
      importGros(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Handler for CSV export
  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["reference", "client_name", "date_created", "status", "profit"];
    const rows = filteredData.map(item => [
      item.reference, 
      item.client_name, 
      item.date_created, 
      item.status, 
      item.prix_vente - item.cost
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "commandes_gros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Commandes GROS</h2>
          <p className="text-slate-500 text-sm font-medium">Gestion du volume de gros et suivi logistique.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Upload size={16} /> Importer
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Download size={16} /> Exporter
          </button>
          <button onClick={addGros} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            <Plus size={18} /> Nouveau Batch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 rounded-xl bg-emerald-50">
            <Banknote className="text-emerald-600" size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Encaissé</p>
            <h3 className="text-lg font-bold text-slate-800">{formatPrice(stats.profitEncaisse)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 rounded-xl bg-blue-50">
            <Clock className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendu</p>
            <h3 className="text-lg font-bold text-slate-800">{formatPrice(stats.profitAttendu)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="p-3 rounded-xl bg-red-50">
            <RotateCcw className="text-red-600" size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pertes (Retour)</p>
            <h3 className="text-lg font-bold text-slate-800">{formatPrice(stats.perte)}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">
              <Truck size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</p>
              <p className="text-[11px] font-bold text-slate-700 mt-1">{stats.countTotal} Commandes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtre par Ref ou Client..." 
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
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Reference</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Achat Unit.</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente Bulk</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Net Return</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2">
                    <EditableCell value={item.reference} onSave={(v) => updateGros(item.id, { reference: String(v) })} className="font-mono text-xs font-black text-slate-400" />
                    <EditableCell type="date" value={item.date_created} onSave={(v) => updateGros(item.id, { date_created: String(v) })} className="text-[10px] text-slate-400 p-0 min-h-0" />
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.client_name} onSave={(v) => updateGros(item.id, { client_name: String(v) })} className="font-bold text-blue-600" />
                    <EditableCell value={item.client_phone} onSave={(v) => updateGros(item.id, { client_phone: String(v) })} className="text-[10px] text-slate-400 p-0 min-h-0" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.prix_achat_article} onSave={(v) => updateGros(item.id, { prix_achat_article: Number(v) })} className="text-right" />
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateGros(item.id, { prix_vente: Number(v) })} className="text-right" />
                  </td>
                  <td className="p-2 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateGros(item.id, { status: e.target.value as GrosStatus })}
                      className={`text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === GrosStatus.LIVREE_ENCAISSE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === GrosStatus.LIVREE_NON_ENCAISSE ? 'bg-purple-50 text-purple-700' :
                          item.status === GrosStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' : 
                          item.status === GrosStatus.RETOUR ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}
                    >
                      {GROS_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.prix_vente - item.cost >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPrice(item.prix_vente - item.cost)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => deleteGros(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                        <Trash2 size={16} />
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

export default CommandesGros;
