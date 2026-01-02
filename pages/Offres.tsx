
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store';
import EditableCell from '../components/EditableCell';
import StatCard from '../components/StatCard';
import { OFFRE_TYPE_OPTIONS, OFFRE_CATEGORY_OPTIONS } from '../constants';
import { OffreType, OffreCategory } from '../types';
import { Plus, TrendingUp, TrendingDown, Download, Upload, Trash2, Search, Zap } from 'lucide-react';

const Offres: React.FC = () => {
  const { offres, updateOffre, addOffre, deleteOffre, importOffres } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const data = useMemo(() => {
    return offres.filter(item => 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [offres, searchTerm]);

  const stats = useMemo(() => {
    const rev = offres.filter(o => o.type === OffreType.REVENUE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const exp = offres.filter(o => o.type === OffreType.EXPENSE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    return { rev, exp, net: rev - exp };
  }, [offres]);

  const formatPrice = (val: number) => {
    return val.toLocaleString('fr-DZ') + ' DA';
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
    if (offres.length === 0) return;
    const headers = ["date", "type", "category", "description", "montant"];
    const rows = offres.map(item => [
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
    link.setAttribute("download", "offres_et_frais.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Offres & Frais Globaux</h2>
          <p className="text-slate-500 text-sm">Gestion des revenus et dépenses opérationnelles indirectes.</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-all"
          >
            <Plus size={16} /> Nouveau Flux
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenus" value={formatPrice(stats.rev)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Total Dépenses" value={formatPrice(stats.exp)} icon={TrendingDown} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Bilan Flux" value={formatPrice(stats.net)} icon={Zap} color="text-slate-600" bg="bg-slate-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrer par description ou catégorie..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Type</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Catégorie</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Description</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Montant</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
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
                      className="text-[10px] p-1.5 border-none bg-slate-100 rounded-lg text-slate-600 font-bold uppercase tracking-tight"
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
                      onClick={() => { if(confirm('Supprimer cet enregistrement ?')) deleteOffre(item.id); }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">Aucun mouvement enregistré.</td>
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
