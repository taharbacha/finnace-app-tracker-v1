
import React, { useRef } from 'react';
import { useAppStore } from '../store';
import EditableCell from '../components/EditableCell';
import { OFFRE_TYPE_OPTIONS, OFFRE_CATEGORY_OPTIONS } from '../constants';
import { OffreType, OffreCategory } from '../types';
import { Plus, TrendingUp, TrendingDown, Download, Upload, Trash2 } from 'lucide-react';

const Offres: React.FC = () => {
  const { offres, updateOffre, addOffre, deleteOffre, importOffres } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Offres & Frais Globaux</h2>
          <p className="text-slate-500">Mouvements financiers non liés à une commande spécifique (Ads, Transport, etc.).</p>
        </div>
        <div className="flex gap-3">
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload size={18} /> Importer CSV
          </button>
          <button 
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={18} /> Exporter CSV
          </button>
          <button 
            type="button"
            onClick={addOffre}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Ajouter un mouvement
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">Date</th>
                <th className="p-4 font-semibold text-slate-600">Type</th>
                <th className="p-4 font-semibold text-slate-600">Catégorie</th>
                <th className="p-4 font-semibold text-slate-600">Description</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Montant</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offres.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2">
                    <EditableCell type="date" value={item.date} onSave={(v) => updateOffre(item.id, 'date', v)} />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {item.type === 'revenue' ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-orange-500" />}
                      <select 
                        value={item.type} 
                        onChange={(e) => updateOffre(item.id, 'type', e.target.value)}
                        className="text-xs p-1 border-none bg-transparent rounded font-bold uppercase text-slate-600"
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
                      className="text-xs p-1 border-none bg-transparent rounded text-slate-600"
                    >
                      {OFFRE_CATEGORY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 flex-1">
                    <EditableCell value={item.description} onSave={(v) => updateOffre(item.id, 'description', v)} className="min-w-[200px]" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell 
                      type="number" 
                      value={item.montant} 
                      onSave={(v) => updateOffre(item.id, 'montant', v)} 
                      className={`text-right font-bold ${item.type === 'revenue' ? 'text-emerald-600' : 'text-orange-600'}`} 
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteOffre(item.id);
                      }}
                      title="Supprimer l'enregistrement"
                      className="p-3 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center mx-auto rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {offres.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Aucun mouvement global.</td>
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
