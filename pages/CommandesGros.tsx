
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { GROS_STATUS_OPTIONS } from '../constants.ts';
import { GrosStatus } from '../types.ts';
import { Plus, Search, Truck, Banknote, AlertCircle, Calendar, Trash2, Download, Upload, Clock, Ban } from 'lucide-react';

const CommandesGros: React.FC = () => {
  const { getCalculatedGros, updateGros, addGros, deleteGros, importGros } = useAppStore();
  const allData = getCalculatedGros();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
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

  const stats = useMemo(() => {
    const totalProfit = filteredData
      .filter(o => o.status !== GrosStatus.RETOUR)
      .reduce((acc, curr) => acc + (curr.prix_vente - curr.cost), 0);
      
    const encaisse = filteredData.reduce((acc, curr) => acc + curr.profit_encaisse, 0);
    const attendu = filteredData.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    const lost = filteredData.reduce((acc, curr) => acc + curr.perte, 0);
    
    return { totalProfit, encaisse, attendu, lost };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

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

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["reference", "client_name", "date_created", "prix_vente", "status", "profit"];
    const rows = filteredData.map(item => [
      item.reference,
      item.client_name,
      item.date_created,
      item.prix_vente,
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
          <p className="text-slate-500 text-sm font-medium">Gestion opérationnelle wholesale et suivi financier des volumes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Upload size={16} /> Importer
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Download size={16} /> Exporter
          </button>
          <button type="button" onClick={addGros} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Commande
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Profit Total" value={formatPrice(stats.totalProfit)} icon={Truck} color="text-slate-600" bg="bg-slate-50" />
        <StatCard label="Profit Encaissé" value={formatPrice(stats.encaisse)} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Profit Attendu" value={formatPrice(stats.attendu)} icon={Clock} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Lost (Retours)" value={formatPrice(stats.lost)} icon={Ban} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher client ou référence..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <Calendar size={14} className="text-blue-500" />
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="text-xs outline-none bg-transparent font-bold text-slate-700" />
            <span className="text-slate-300 font-bold">à</span>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="text-xs outline-none bg-transparent font-bold text-slate-700" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Ref</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Production (x + y)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Notes Stock</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Net Profit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2">
                    <EditableCell value={item.reference} onSave={(v) => updateGros(item.id, 'reference', v)} className="font-mono text-xs font-black text-blue-600 min-w-[60px]" />
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.client_name} onSave={(v) => updateGros(item.id, 'client_name', v)} className="font-bold text-slate-800 text-sm min-w-[120px]" />
                  </td>
                  <td className="p-2">
                    <div className="text-[10px] text-slate-400 font-bold px-2 whitespace-nowrap">
                      <EditableCell type="date" value={item.date_created} onSave={(v) => updateGros(item.id, 'date_created', v)} className="text-[10px] text-slate-400 h-auto" />
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2 text-right">
                      <EditableCell type="number" value={item.prix_achat_article} onSave={(v) => updateGros(item.id, 'prix_achat_article', v)} prefix="A: " className="text-[10px] py-1 h-auto text-slate-500 min-w-[70px]" />
                      <span className="text-slate-300 text-[10px] font-bold">+</span>
                      <EditableCell type="number" value={item.prix_impression} onSave={(v) => updateGros(item.id, 'prix_impression', v)} prefix="I: " className="text-[10px] py-1 h-auto text-slate-500 min-w-[70px]" />
                    </div>
                  </td>
                  <td className="p-2 text-right font-black text-slate-900">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateGros(item.id, 'prix_vente', v)} className="text-right" />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateGros(item.id, 'status', e.target.value)} 
                      className={`text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === GrosStatus.LIVREE_ENCAISSE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === GrosStatus.LIVREE_NON_ENCAISSE ? 'bg-purple-50 text-purple-700' :
                          item.status === GrosStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' :
                          item.status === GrosStatus.RETOUR ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {GROS_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.stock_note} onSave={(v) => updateGros(item.id, 'stock_note', v)} className="text-slate-500 italic text-xs max-w-[150px] truncate h-auto" />
                  </td>
                  <td className={`p-4 text-right font-black text-sm ${item.status === GrosStatus.RETOUR ? 'text-red-500' : 'text-blue-600'}`}>
                    {item.status === GrosStatus.RETOUR ? `- ${formatPrice(item.cost)}` : formatPrice(item.prix_vente - item.cost)}
                  </td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
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

export default CommandesGros;
