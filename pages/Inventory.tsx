
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import { 
  Plus, 
  Minus,
  Search, 
  Package, 
  AlertTriangle, 
  Layers, 
  Trash2, 
  Download, 
  Upload, 
  ChevronRight,
  TrendingDown,
  Box
} from 'lucide-react';

const Inventory: React.FC = () => {
  const { inventory, updateInventory, addInventory, deleteInventory, importInventory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'low') return matchesSearch && item.quantity <= item.min_stock && item.quantity > 0;
      if (filterStatus === 'out') return matchesSearch && item.quantity === 0;
      
      return matchesSearch;
    }).sort((a, b) => a.quantity - b.quantity); // Prioritize low stock items in view
  }, [inventory, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const lowStockCount = inventory.filter(i => i.quantity <= i.min_stock && i.quantity > 0).length;
    const outOfStockCount = inventory.filter(i => i.quantity === 0).length;
    const totalValue = inventory.reduce((acc, i) => acc + (i.quantity * i.unit_cost), 0);
    return { lowStockCount, outOfStockCount, totalValue };
  }, [inventory]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous supprimer définitivement cet article du stock ?')) {
      deleteInventory(id);
    }
  };

  const adjustQuantity = (id: string, current: number, delta: number) => {
    const newVal = Math.max(0, current + delta);
    updateInventory(id, 'quantity', newVal);
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
          name: obj.name || obj.item || '',
          sku: obj.sku || `SKU-${Date.now()}`,
          quantity: Number(obj.quantity) || 0,
          min_stock: Number(obj.min_stock) || 5,
          unit_cost: Number(obj.unit_cost) || Number(obj.cost) || 0,
          supplier: obj.supplier || ''
        };
      });
      importInventory(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["name", "sku", "quantity", "min_stock", "unit_cost", "supplier"];
    const rows = filteredData.map(item => [
      item.name,
      item.sku,
      item.quantity,
      item.min_stock,
      item.unit_cost,
      item.supplier
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "inventaire_stock.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Inventaire & Stock</h2>
          <p className="text-slate-500 font-medium">Gestion intelligente et alertes de réapprovisionnement.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Upload size={18} /> Importer
          </button>
          <button 
            onClick={exportCSV} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} /> Exporter
          </button>
          <button 
            onClick={addInventory} 
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} /> Nouvel Article
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 transition-transform group-hover:scale-110">
              <Package size={28}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total SKUs</p>
              <p className="text-2xl font-black text-slate-800">{inventory.length}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-200" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className={`p-4 ${stats.lowStockCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-300'} rounded-2xl transition-transform group-hover:scale-110`}>
              <AlertTriangle size={28}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Critique</p>
              <p className={`text-2xl font-black ${stats.lowStockCount > 0 ? 'text-orange-600' : 'text-slate-800'}`}>{stats.lowStockCount + stats.outOfStockCount}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-200" />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
              <Layers size={28}/>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur Inventaire</p>
              <p className="text-2xl font-black text-emerald-600">{stats.totalValue.toLocaleString()} DA</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-200" />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher nom, SKU, fournisseur..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-sm" 
            />
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => setFilterStatus('low')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterStatus === 'low' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-orange-600'}`}
            >
              Bas
            </button>
            <button 
              onClick={() => setFilterStatus('out')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filterStatus === 'out' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-red-600'}`}
            >
              Rupture
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-5">Article & Détails</th>
                <th className="p-5">SKU / Ref</th>
                <th className="p-5 text-center">Statut</th>
                <th className="p-5 text-right">Quantité</th>
                <th className="p-5 text-right">Prix Unitaire</th>
                <th className="p-5 text-right">Valeur Totale</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => {
                const isOutOfStock = item.quantity === 0;
                const isLowStock = item.quantity <= item.min_stock && !isOutOfStock;
                
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${isOutOfStock ? 'bg-red-50/20' : isLowStock ? 'bg-orange-50/20' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isOutOfStock ? 'bg-red-100 text-red-600' : isLowStock ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Box size={16} />
                        </div>
                        <div>
                          <EditableCell value={item.name} onSave={v => updateInventory(item.id, 'name', v)} className="font-bold text-slate-800 p-0 min-h-0" />
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{item.supplier || 'Sans Fournisseur'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <EditableCell value={item.sku} onSave={v => updateInventory(item.id, 'sku', v)} className="font-mono text-xs text-slate-500 p-0 min-h-0" />
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                        ${isOutOfStock ? 'bg-red-100 text-red-700' : isLowStock ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isOutOfStock ? 'En Rupture' : isLowStock ? 'Stock Bas' : 'En Stock'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => adjustQuantity(item.id, item.quantity, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="w-16 text-right">
                          <EditableCell type="number" value={item.quantity} onSave={v => updateInventory(item.id, 'quantity', v)} className={`text-right font-black text-sm p-0 min-h-0 ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-slate-800'}`} />
                        </div>
                        <button 
                          onClick={() => adjustQuantity(item.id, item.quantity, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-bold mt-1 pr-11">Seuil: {item.min_stock}</div>
                    </td>
                    <td className="p-3 text-right">
                      <EditableCell type="number" value={item.unit_cost} onSave={v => updateInventory(item.id, 'unit_cost', v)} className="text-right font-bold text-slate-600 p-0 min-h-0" />
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-black text-slate-900 text-sm">
                        {(item.quantity * item.unit_cost).toLocaleString()} DA
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          type="button" 
                          onClick={(e) => handleDelete(e, item.id)} 
                          className="p-2 text-slate-200 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                        <Box size={48} />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun article ne correspond à votre recherche</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
