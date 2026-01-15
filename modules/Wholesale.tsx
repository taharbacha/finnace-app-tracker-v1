
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { GROS_STATUS_OPTIONS } from '../constants.ts';
import { Plus, Download, Upload, Trash2, Search, Calendar } from 'lucide-react';

const Wholesale: React.FC = () => {
  const { getCalculatedGros, updateGros, addGros, deleteGros } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const filteredData = useMemo(() => {
    return getCalculatedGros().filter(i => {
      const match = i.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || i.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const dateMatch = (!dateStart || i.date_created >= dateStart) && (!dateEnd || i.date_created <= dateEnd);
      return match && dateMatch;
    }).sort((a,b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [getCalculatedGros, searchTerm, dateStart, dateEnd]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Action Irréversible: Supprimer cette commande de gros ?")) {
      deleteGros(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wholesale Core</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Mass Volume Trading & Logistics</p>
        </div>
        <button onClick={addGros} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all"><Plus size={18}/> New Batch</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Global Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">Ref & Timeline</th>
                <th className="p-4">Client Detail</th>
                <th className="p-4 text-right">Unit Acq.</th>
                <th className="p-4 text-right">Bulk Sale</th>
                <th className="p-4 text-center">Lifecycle</th>
                <th className="p-4 text-right">Net Return</th>
                <th className="p-4 text-center">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition-all group">
                  <td className="p-3">
                    {/* Fixed: updateGros now takes a Partial object as expected by the store */}
                    <EditableCell value={item.reference} onSave={v => updateGros(item.id, { reference: String(v) })} className="font-mono font-black text-blue-600 text-xs" />
                    <EditableCell type="date" value={item.date_created} onSave={v => updateGros(item.id, { date_created: String(v) })} className="text-[10px] text-slate-400" />
                  </td>
                  <td className="p-3">
                    {/* Fixed: updateGros now takes a Partial object as expected by the store */}
                    <EditableCell value={item.client_name} onSave={v => updateGros(item.id, { client_name: String(v) })} className="font-bold text-slate-800" />
                    <EditableCell value={item.client_phone} onSave={v => updateGros(item.id, { client_phone: String(v) })} className="text-[10px] text-slate-400" />
                  </td>
                  <td className="p-3 text-right">
                    {/* Fixed: updateGros now takes a Partial object as expected by the store */}
                    <EditableCell type="number" value={item.prix_achat_article} onSave={v => updateGros(item.id, { prix_achat_article: Number(v) })} className="font-bold text-slate-600" />
                  </td>
                  <td className="p-3 text-right">
                    {/* Fixed: updateGros now takes a Partial object as expected by the store */}
                    <EditableCell type="number" value={item.prix_vente} onSave={v => updateGros(item.id, { prix_vente: Number(v) })} className="font-black text-slate-900" />
                  </td>
                  <td className="p-3 text-center">
                    {/* Fixed: updateGros now takes a Partial object as expected by the store */}
                    <select value={item.status} onChange={e => updateGros(item.id, { status: e.target.value as any })} className="text-[10px] font-black uppercase p-1 bg-slate-100 rounded-lg">
                      {GROS_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-right font-black text-emerald-600">
                    {(item.prix_vente - item.cost).toLocaleString()} DA
                  </td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={(e) => handleDelete(e, item.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
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

export default Wholesale;
