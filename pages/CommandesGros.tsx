import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { GROS_STATUS_OPTIONS } from '../constants.ts';
import { GrosStatus } from '../types.ts';
import { Plus, Download, Upload, Trash2, Search, Filter, Truck, Banknote, AlertCircle, Calendar } from 'lucide-react';

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
    const totalProfit = filteredData.reduce((acc, curr) => acc + (curr.prix_vente - curr.cost), 0);
    const encaisse = filteredData.reduce((acc, curr) => acc + curr.profit_encaisse, 0);
    const attendu = filteredData.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    return { totalProfit, encaisse, attendu };
  }, [filteredData]);

  const formatPrice = (val: number) => {
    return val.toLocaleString('fr-DZ') + ' DA';
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateStart('');
    setDateEnd('');
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
      
      const importedData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            const val = values[index];
            if (header.includes('prix') || header.includes('achat') || header.includes('vente') || header.includes('montant')) {
              obj[header] = Number(val) || 0;
            } else if (header === 'impression') {
              obj[header] = val.toLowerCase() === 'true' || val === '1';
            } else {
              obj[header] = val;
            }
          });

          return {
            reference: obj.reference || obj.ref || 'NEW',
            client_name: obj.client_name || obj.client || '',
            client_phone: obj.client_phone || obj.contact || '',
            date_created: obj.date_created || obj.date || new Date().toISOString().split('T')[0],
            prix_achat_article: obj.prix_achat_article || obj.achat || 0,
            impression: obj.impression ?? false,
            prix_impression: obj.prix_impression || 0,
            prix_vente: obj.prix_vente || obj.vente || 0,
            status: (obj.status as GrosStatus) || GrosStatus.EN_PRODUCTION,
            stock_note: obj.stock_note || obj.note || ''
          };
        });

      importGros(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["reference", "client_name", "client_phone", "date_created", "prix_achat_article", "impression", "prix_impression", "prix_vente", "status", "stock_note"];
    const rows = filteredData.map(item => [
      item.reference,
      item.client_name,
      item.client_phone,
      item.date_created,
      item.prix_achat_article,
      item.impression,
      item.prix_impression,
      item.prix_vente,
      item.status,
      item.stock_note
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "commandes_gros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Commandes GROS</h2>
          <p className="text-slate-500 text-sm">Gestion des volumes wholesale et suivi financier.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload size={16} /> Importer
          </button>
          <button 
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={16} /> Exporter
          </button>
          <button 
            type="button"
            onClick={addGros}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} /> Nouvelle Commande
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Profit Total (Période)" value={formatPrice(stats.totalProfit)} icon={Truck} color="text-slate-600" bg="bg-slate-50" />
        <StatCard label="Encaissé (Période)" value={formatPrice(stats.encaisse)} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Attendu (Période)" value={formatPrice(stats.attendu)} icon={AlertCircle} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par client ou référence..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                value={dateStart} 
                onChange={(e) => setDateStart(e.target.value)}
                className="text-xs outline-none bg-transparent font-medium text-slate-700"
              />
              <span className="text-slate-300">à</span>
              <input 
                type="date" 
                value={dateEnd} 
                onChange={(e) => setDateEnd(e.target.value)}
                className="text-xs outline-none bg-transparent font-medium text-slate-700"
              />
            </div>
            {(searchTerm || dateStart || dateEnd) && (
              <button 
                onClick={resetFilters}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Réinitialiser
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
              <Filter size={14} /> 
              <span>{filteredData.length} Résultats</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Ref</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Contact</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Achat Art.</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Impression</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Prix Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Profit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-2 font-mono text-xs font-black text-slate-400">
                    <EditableCell value={item.reference} onSave={(v) => updateGros(item.id, 'reference', v)} className="text-slate-400 hover:text-blue-600" />
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.client_name} onSave={(v) => updateGros(item.id, 'client_name', v)} className="font-bold text-slate-800" />
                  </td>
                  <td className="p-2 text-slate-500">
                    <EditableCell value={item.client_phone} onSave={(v) => updateGros(item.id, 'client_phone', v)} className="text-slate-500 font-medium" />
                  </td>
                  <td className="p-2">
                    <EditableCell type="date" value={item.date_created} onSave={(v) => updateGros(item.id, 'date_created', v)} className="text-slate-600 font-medium" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.prix_achat_article} onSave={(v) => updateGros(item.id, 'prix_achat_article', v)} className="text-right text-slate-600 font-bold" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                       <input 
                        type="checkbox" 
                        checked={item.impression} 
                        onChange={(e) => updateGros(item.id, 'impression', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      {item.impression && (
                        <EditableCell type="number" value={item.prix_impression} onSave={(v) => updateGros(item.id, 'prix_impression', v)} className="w-20 text-right text-slate-600 text-xs" />
                      )}
                    </div>
                  </td>
                  <td className="p-2 font-black text-slate-900 text-right">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateGros(item.id, 'prix_vente', v)} className="text-right font-black text-slate-900" />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateGros(item.id, 'status', e.target.value)}
                      className="text-xs p-1.5 border-none bg-slate-100 rounded-lg cursor-pointer outline-none font-black text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      {GROS_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt.replace(/_/g, ' ').toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.profit_encaisse > 0 ? 'text-emerald-600' : (item.profit_attendu > 0 ? 'text-blue-600' : 'text-slate-400')}`}>
                      {formatPrice(item.prix_vente - item.cost)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      type="button"
                      onClick={() => {
                        if(confirm('Voulez-vous vraiment supprimer cette commande ?')) deleteGros(item.id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                    Aucun résultat trouvé pour cette période ou recherche.
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