
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { OFFRE_TYPE_OPTIONS, OFFRE_CATEGORY_OPTIONS } from '../constants.ts';
import { OffreType, OffreCategory } from '../types.ts';
import { Plus, TrendingUp, TrendingDown, Download, Upload, Search, Zap, Trash2 } from 'lucide-react';

const Offres: React.FC = () => {
  const { offres, updateOffre, addOffre, deleteOffre, importOffres, dashboardDateStart, dashboardDateEnd } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return offres.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const itemDate = item.date;
      const matchesStart = !dashboardDateStart || itemDate >= dashboardDateStart;
      const matchesEnd = !dashboardDateEnd || itemDate <= dashboardDateEnd;

      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [offres, searchTerm, dashboardDateStart, dashboardDateEnd]);

  const stats = useMemo(() => {
    const rev = filteredData.filter(o => o.type === OffreType.REVENUE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const exp = filteredData.filter(o => o.type === OffreType.EXPENSE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    return { rev, exp, net: rev - exp };
  }, [filteredData]);

  const formatPrice = (val: number) => {
    return val.toLocaleString('fr-DZ') + ' DA';
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous supprimer ce mouvement d\'offre ?')) {
      deleteOffre(id);
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
      
      const importedData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            const val = values[index];
            if (header.includes('montant') || header.includes('amount') || header.includes('prix')) {
              obj[header] = Number(val) || 0;
            } else {
              obj[header] = val;
            }
          });

          return {
            date: obj.date || new Date().toISOString().split('T')[0],
            type: (obj.type as OffreType) || OffreType.EXPENSE,
            category: (obj.category as OffreCategory) || OffreCategory.OTHER,
            description: obj.description || '',
            montant: obj.montant || obj.amount || 0
          };
        });

      importOffres(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["date", "type", "category", "description", "montant"];
    const rows = filteredData.map(item => [
      item.date,
      item.type,
      item.category,
      item.description,
      item.montant
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "les_offres.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Les Offres</h2>
          <p className="text-slate-500 text-sm font-medium">Suivi exclusif des revenus et dépenses liés aux abonnements plans.</p>
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
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
          >
            <Upload size={16} /> Importer
          </button>
          <button 
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
          >
            <Download size={16} /> Exporter
          </button>
          <button 
            type="button"
            onClick={addOffre}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} /> Nouveau Flux
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Revenus Plans" value={formatPrice(stats.rev)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Dépenses Directes" value={formatPrice(stats.exp)} icon={TrendingDown} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Bilan Offres" value={formatPrice(stats.net)} icon={Zap} color="text-slate-600" bg="bg-slate-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrer par description ou catégorie..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium"
            />
          </div>
          {(dashboardDateStart || dashboardDateEnd) && (
            <div className="ml-4 px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-2xl border border-blue-100">
              Période Active
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Type</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Catégorie</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Description</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Montant</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2">
                    <EditableCell type="date" value={item.date} onSave={(v) => updateOffre(item.id, 'date', v)} className="text-slate-500 font-medium" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <select 
                        value={item.type} 
                        onChange={(e) => updateOffre(item.id, 'type', e.target.value)}
                        className={`text-[10px] px-2 py-1 border-none rounded-lg font-black uppercase tracking-widest cursor-pointer ${item.type === 'revenue' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}
                      >
                        {OFFRE_TYPE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.category} 
                      onChange={(e) => updateOffre(item.id, 'category', e.target.value)}
                      className="text-[10px] p-1.5 border-none bg-slate-100 rounded-lg text-slate-600 font-black uppercase tracking-tight"
                    >
                      {OFFRE_CATEGORY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.description} onSave={(v) => updateOffre(item.id, 'description', v)} className="min-w-[200px] text-slate-700 font-medium" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell 
                      type="number" 
                      value={item.montant} 
                      onSave={(v) => updateOffre(item.id, 'montant', v)} 
                      className={`text-right font-black ${item.type === 'revenue' ? 'text-emerald-600' : 'text-orange-600'}`} 
                    />
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
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun mouvement trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Offres;
