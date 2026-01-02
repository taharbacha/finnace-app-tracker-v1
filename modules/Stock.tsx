
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { Plus, Trash2, Search, Package } from 'lucide-react';

const Stock: React.FC = () => {
  const { inventory, updateInventory, addInventory, deleteInventory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())), [inventory, searchTerm]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Supprimer définitivement cet item de l'inventaire ?")) {
      deleteInventory(id);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Merch Inventory</h1>
        <button onClick={addInventory} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"><Plus size={18}/> New SKU</button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Scan SKU or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">SKU / Item Name</th>
                <th className="p-4 text-right">Available</th>
                <th className="p-4 text-right">Alert Cap</th>
                <th className="p-4 text-right">Unit Val.</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-all ${item.quantity <= item.min_stock ? 'bg-red-50/20' : ''}`}>
                  <td className="p-3">
                    <EditableCell value={item.name} onSave={v => updateInventory(item.id, 'name', v)} className="font-black text-slate-800" />
                    <span className="text-[9px] font-mono text-slate-400 block px-2">{item.sku}</span>
                  </td>
                  <td className="p-3 text-right">
                    <EditableCell type="number" value={item.quantity} onSave={v => updateInventory(item.id, 'quantity', v)} className={`font-black ${item.quantity <= item.min_stock ? 'text-red-600' : 'text-slate-900'}`} />
                  </td>
                  <td className="p-3 text-right">
                    <EditableCell type="number" value={item.min_stock} onSave={v => updateInventory(item.id, 'min_stock', v)} className="text-slate-400 font-bold" />
                  </td>
                  <td className="p-3 text-right font-black text-slate-600">
                    <EditableCell type="number" value={item.unit_cost} onSave={v => updateInventory(item.id, 'unit_cost', v)} />
                  </td>
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

export default Stock;
