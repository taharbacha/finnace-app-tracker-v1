
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { Plus, Search, Wallet, UserCheck, Briefcase, Trash2, Download, Upload } from 'lucide-react';

const PRESET_LABELS = [
  'Salaire Billel',
  'Salaire Oussama',
  'Salaire Ahmed',
  'Salaire Assistante',
  'Transport',
  'Service online',
  'Autre',
  'salaire teleoperatrice',
  'locale',
  'investiseur salaise'
];

const Charges: React.FC = () => {
  const { charges, updateCharge, addCharge, deleteCharge, importCharges, dashboardDateStart, dashboardDateEnd } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return charges.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.note.toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = item.date;
      const matchesStart = !dashboardDateStart || itemDate >= dashboardDateStart;
      const matchesEnd = !dashboardDateEnd || itemDate <= dashboardDateEnd;
      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [charges, searchTerm, dashboardDateStart, dashboardDateEnd]);

  const stats = useMemo(() => {
    const total = filteredData.reduce((acc, curr) => acc + Number(curr.montant), 0);
    const count = filteredData.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous supprimer cette charge du grand livre ?')) {
      deleteCharge(id);
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
          date: obj.date || new Date().toISOString().split('T')[0],
          label: obj.label || obj.title || 'Nouvelle Charge',
          note: obj.note || obj.details || '',
          montant: Number(obj.montant) || Number(obj.amount) || 0
        };
      });
      importCharges(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["date", "label", "note", "montant"];
    const rows = filteredData.map(item => [item.date, item.label, item.note, item.montant]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "les_charges.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Les Charges</h2>
          <p className="text-slate-500 text-sm">Gestion des salaires, loyers et charges fixes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">
            <Upload size={16} /> Importer
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">
            <Download size={16} /> Exporter
          </button>
          <div className="relative group">
            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95">
              <Plus size={16} /> Ajouter une Charge
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 text-left">
              <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1 text-left">Presets</p>
              {PRESET_LABELS.map(label => (
                <button key={label} type="button" onClick={() => addCharge(label)} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">
                  {label}
                </button>
              ))}
              <button type="button" onClick={() => addCharge('Nouvelle Charge')} className="w-full text-left px-3 py-2 mt-1 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-400 text-center uppercase tracking-widest">
                + Libre
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Charges (Période)" value={formatPrice(stats.total)} icon={Wallet} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Nombre d'Entrées" value={stats.count} icon={Briefcase} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Moyenne / Entrée" value={formatPrice(stats.avg)} icon={UserCheck} color="text-slate-600" bg="bg-slate-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher par label ou note..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" />
          </div>
          {(dashboardDateStart || dashboardDateEnd) && (
            <div className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-xl border border-blue-100">
              Analyse Temporelle
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Libellé</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Note / Détails</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Montant (DA)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="p-2"><EditableCell type="date" value={item.date} onSave={(v) => updateCharge(item.id, 'date', v)} className="text-slate-600 font-medium" /></td>
                  <td className="p-2"><EditableCell value={item.label} onSave={(v) => updateCharge(item.id, 'label', v)} className="font-black text-slate-800" /></td>
                  <td className="p-2 text-slate-500"><EditableCell value={item.note} onSave={(v) => updateCharge(item.id, 'note', v)} className="text-slate-500 italic text-xs" /></td>
                  <td className="p-2 text-right font-black text-orange-600"><EditableCell type="number" value={item.montant} onSave={(v) => updateCharge(item.id, 'montant', v)} className="text-right" /></td>
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

export default Charges;
