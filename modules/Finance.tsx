
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { Plus, Trash2, Search, Wallet } from 'lucide-react';

const Finance: React.FC = () => {
  const { charges, updateCharge, addCharge, deleteCharge } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => charges.filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [charges, searchTerm]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Action Irréversible: Supprimer cette charge du ledger ?")) {
      deleteCharge(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finance Ledger</h1>
        <button onClick={() => addCharge()} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"><Plus size={18}/> Add Entry</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Audit Label..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">Fiscal Date</th>
                <th className="p-4">Label</th>
                <th className="p-4">Memo</th>
                <th className="p-4 text-right">Debit (DA)</th>
                <th className="p-4 text-center">Purge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-3"><EditableCell type="date" value={item.date} onSave={v => updateCharge(item.id, 'date', v)} className="text-slate-400 font-bold text-xs" /></td>
                  <td className="p-3"><EditableCell value={item.label} onSave={v => updateCharge(item.id, 'label', v)} className="font-black text-slate-800" /></td>
                  <td className="p-3 text-slate-400"><EditableCell value={item.note} onSave={v => updateCharge(item.id, 'note', v)} className="italic text-xs" /></td>
                  <td className="p-3 text-right"><EditableCell type="number" value={item.montant} onSave={v => updateCharge(item.id, 'montant', v)} className="font-black text-orange-600" /></td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-200 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
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

export default Finance;
