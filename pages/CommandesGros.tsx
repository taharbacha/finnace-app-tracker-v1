
import React, { useRef } from 'react';
import { useAppStore } from '../store';
import EditableCell from '../components/EditableCell';
import { GROS_STATUS_OPTIONS } from '../constants';
import { GrosStatus } from '../types';
import { Plus, Download, Upload, Trash2 } from 'lucide-react';

const CommandesGros: React.FC = () => {
  const { getCalculatedGros, updateGros, addGros, deleteGros, importGros } = useAppStore();
  const data = getCalculatedGros();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (data.length === 0) return;
    const headers = ["reference", "client_name", "client_phone", "date_created", "prix_achat_article", "impression", "prix_impression", "prix_vente", "status", "stock_note"];
    const rows = data.map(item => [
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Commandes GROS</h2>
          <p className="text-slate-500">Gestion des commandes en gros et suivi des encaissements.</p>
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
            onClick={addGros}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> Ajouter une ligne
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">Ref</th>
                <th className="p-4 font-semibold text-slate-600">Client</th>
                <th className="p-4 font-semibold text-slate-600">Contact</th>
                <th className="p-4 font-semibold text-slate-600">Date</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Achat Art.</th>
                <th className="p-4 font-semibold text-slate-600">Impression</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Prix Vente</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Total Profit</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2 font-mono text-xs font-bold text-slate-400">
                    <EditableCell value={item.reference} onSave={(v) => updateGros(item.id, 'reference', v)} className="text-slate-400" />
                  </td>
                  <td className="p-2">
                    <EditableCell value={item.client_name} onSave={(v) => updateGros(item.id, 'client_name', v)} className="font-semibold text-slate-800" />
                  </td>
                  <td className="p-2 text-slate-500">
                    <EditableCell value={item.client_phone} onSave={(v) => updateGros(item.id, 'client_phone', v)} className="text-slate-500" />
                  </td>
                  <td className="p-2">
                    <EditableCell type="date" value={item.date_created} onSave={(v) => updateGros(item.id, 'date_created', v)} className="text-slate-600" />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.prix_achat_article} onSave={(v) => updateGros(item.id, 'prix_achat_article', v)} className="text-right text-slate-600 font-medium" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                       <input 
                        type="checkbox" 
                        checked={item.impression} 
                        onChange={(e) => updateGros(item.id, 'impression', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      {item.impression && (
                        <EditableCell type="number" value={item.prix_impression} onSave={(v) => updateGros(item.id, 'prix_impression', v)} className="w-20 text-right text-slate-600" />
                      )}
                    </div>
                  </td>
                  <td className="p-2 font-bold text-slate-800 text-right">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateGros(item.id, 'prix_vente', v)} className="text-right font-bold text-slate-900" />
                  </td>
                  <td className="p-2">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateGros(item.id, 'status', e.target.value)}
                      className="text-xs p-1 border-none bg-transparent hover:bg-white rounded cursor-pointer outline-none font-semibold text-slate-600"
                    >
                      {GROS_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt.replace(/_/g, ' ').toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right font-black">
                    <span className={item.profit_encaisse > 0 ? 'text-emerald-600' : (item.profit_attendu > 0 ? 'text-blue-600' : 'text-slate-400')}>
                      {formatPrice(item.prix_vente - item.cost)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteGros(item.id);
                      }}
                      title="Supprimer la ligne"
                      className="p-3 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center mx-auto rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Aucune commande. Ajoutez une ligne pour commencer.</td>
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
