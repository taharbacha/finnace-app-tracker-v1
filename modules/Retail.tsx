

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { EXTERN_STATUS_OPTIONS } from '../constants.ts';
import { Trash2, Search, Plus } from 'lucide-react';

const Retail: React.FC = () => {
  // Fixed: Updated method names to match Siteweb terminology used in AppState
  const { getCalculatedSiteweb, updateSiteweb, addSiteweb, deleteSiteweb } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return getCalculatedSiteweb().filter(i => {
      return (i.vendeur_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || i.reference.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a,b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [getCalculatedSiteweb, searchTerm]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Supprimer définitivement cet enregistrement client ?")) {
      deleteSiteweb(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Retail Ops (Sitweb)</h1>
        <button onClick={addSiteweb} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"><Plus size={18}/> Nouvelle Commande</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filter Terminal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">Ref</th>
                <th className="p-4">Vendeur</th>
                <th className="p-4 text-right">Commission</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Profit Net</th>
                <th className="p-4 text-center">Purge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    <EditableCell type="text" value={item.reference} onSave={v => updateSiteweb(item.id, 'reference', String(v))} />
                  </td>
                  <td className="p-3 text-blue-600 font-bold">
                    <EditableCell value={item.vendeur_name} onSave={v => updateSiteweb(item.id, 'vendeur_name', v)} />
                  </td>
                  <td className="p-3 text-right font-black text-purple-600">
                    <EditableCell type="number" value={item.vendeur_benefice} onSave={v => updateSiteweb(item.id, 'vendeur_benefice', v)} />
                  </td>
                  <td className="p-3 text-center">
                    <select value={item.status} onChange={e => updateSiteweb(item.id, 'status', e.target.value)} className="text-[10px] font-black uppercase bg-slate-100 rounded p-1 border-none">
                      {/* Fixed: toUpperCase and types issues resolved by casting EXTERN_STATUS_OPTIONS to string[] in constants.ts */}
                      {EXTERN_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-right font-black text-emerald-600">
                    {(Number(item.prix_vente) - (Number(item.cout_article) + Number(item.cout_impression) + Number(item.vendeur_benefice))).toLocaleString()} DA
                  </td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-200 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16}/></button>
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

export default Retail;