
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { OFFRE_TYPE_OPTIONS } from '../constants.ts';
import { OffreType } from '../types.ts';
import { Plus, Trash2, Search } from 'lucide-react';

const Operations: React.FC = () => {
  const { offres, updateOffre, addOffre, deleteOffre } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => offres.filter(i => i.description.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [offres, searchTerm]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Supprimer définitivement ce mouvement d'offre ?")) {
      deleteOffre(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ops Hub (Offres)</h1>
        <button onClick={addOffre} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"><Plus size={18}/> New Action</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Trace Ops..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Vector</th>
                <th className="p-4">Audit Memo</th>
                <th className="p-4 text-right">Cash Movement</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-3"><EditableCell type="date" value={item.date} onSave={v => updateOffre(item.id, 'date', v)} className="text-slate-400 font-bold text-xs" /></td>
                  <td className="p-3">
                    <select value={item.type} onChange={e => updateOffre(item.id, 'type', e.target.value)} className={`text-[9px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-xl border-none ${item.type === OffreType.REVENUE ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {OFFRE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="p-3"><EditableCell value={item.description} onSave={v => updateOffre(item.id, 'description', v)} className="text-slate-700 font-bold text-sm" /></td>
                  <td className="p-3 text-right"><EditableCell type="number" value={item.montant} onSave={v => updateOffre(item.id, 'montant', v)} className={`font-black ${item.type === OffreType.REVENUE ? 'text-emerald-600' : 'text-red-600'}`} /></td>
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

export default Operations;
