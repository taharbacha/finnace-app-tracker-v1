
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { Plus, Trash2, Search, Package, AlertTriangle, Layers } from 'lucide-react';

const Inventory: React.FC = () => {
  const { inventory, updateInventory, addInventory, deleteInventory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const lowStockCount = useMemo(() => 
    inventory.filter(i => i.quantity <= i.min_stock).length, 
  [inventory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Inventaire & Stock</h2>
          <p className="text-slate-500 text-sm font-medium">Suivi des articles vierges et consommables.</p>
        </div>
        <button 
          onClick={addInventory}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus size={18} /> Ajouter un Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Package size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles Totaux</p>
            <p className="text-xl font-black text-slate-800">{inventory.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-2xl text-orange-600"><AlertTriangle size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Critique</p>
            <p className="text-xl font-black text-orange-600">{lowStockCount} Articles</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><Layers size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur Stock</p>
            <p className="text-xl font-black text-emerald-600">
              {(inventory.reduce((acc, i) => acc + (i.quantity * i.unit_cost), 0)).toLocaleString()} DA
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-5">Article</th>
                <th className="p-5">SKU</th>
                <th className="p-5">Quantité</th>
                <th className="p-5">Min. Alerte</th>
                <th className="p-5">Coût Unitaire</th>
                <th className="p-5">Fournisseur</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors ${item.quantity <= item.min_stock ? 'bg-red-50/30' : ''}`}>
                  <td className="p-2"><EditableCell value={item.name} onSave={v => updateInventory(item.id, 'name', v)} className="font-bold text-slate-800" /></td>
                  <td className="p-2"><EditableCell value={item.sku} onSave={v => updateInventory(item.id, 'sku', v)} className="font-mono text-xs text-slate-500" /></td>
                  <td className="p-2"><EditableCell type="number" value={item.quantity} onSave={v => updateInventory(item.id, 'quantity', v)} className={`font-black text-right ${item.quantity <= item.min_stock ? 'text-red-600' : 'text-slate-700'}`} /></td>
                  <td className="p-2"><EditableCell type="number" value={item.min_stock} onSave={v => updateInventory(item.id, 'min_stock', v)} className="text-slate-400 text-right" /></td>
                  <td className="p-2 font-bold text-slate-600 text-right"><EditableCell type="number" value={item.unit_cost} onSave={v => updateInventory(item.id, 'unit_cost', v)} className="text-right" /></td>
                  <td className="p-2"><EditableCell value={item.supplier} onSave={v => updateInventory(item.id, 'supplier', v)} className="text-slate-500 italic text-xs" /></td>
                  <td className="p-2 text-center">
                    <button onClick={() => confirm('Supprimer cet article ?') && deleteInventory(item.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
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

export default Inventory;
