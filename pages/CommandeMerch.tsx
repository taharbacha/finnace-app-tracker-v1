
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { MerchStatus } from '../types.ts';
import { MERCH_STATUS_OPTIONS } from '../constants.ts';
import { Plus, Search, Banknote, Trash2, Download, Upload, AlertCircle, Clock, Truck, ShoppingBag } from 'lucide-react';

const CommandeMerch: React.FC = () => {
  const { getCalculatedMerch, updateMerch, addMerch, deleteMerch, importMerch } = useAppStore();
  const allData = getCalculatedMerch();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return (item.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.produit || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allData, searchTerm]);

  const stats = useMemo(() => {
    const encaisse = filteredData.reduce((acc, curr) => acc + curr.impact_encaisse, 0);
    const attendu = filteredData.reduce((acc, curr) => acc + curr.impact_attendu, 0);
    const perdu = filteredData.reduce((acc, curr) => acc + curr.impact_perte, 0);
    const enLivraisonCount = filteredData.filter(i => i.status === MerchStatus.EN_LIVRAISON).length;

    return { encaisse, attendu, perdu, enLivraisonCount };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

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
          reference: obj.reference || `M${Date.now()}`,
          client_name: obj.client_name || '',
          produit: obj.produit || '',
          prix_achat: Number(obj.prix_achat) || 0,
          prix_vente: Number(obj.prix_vente) || 0,
          status: (obj.status as MerchStatus) || MerchStatus.EN_LIVRAISON,
          created_at: obj.created_at || new Date().toISOString()
        };
      });
      importMerch(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Commande Merch</h2>
          <p className="text-slate-500 text-sm font-medium">Gestion opérationnelle des ventes directes de produits dérivés.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Upload size={16} /> Importer
          </button>
          <button type="button" onClick={addMerch} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Vente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        <StatCard label="Encaissé Merch" value={formatPrice(stats.encaisse)} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Attendu Merch" value={formatPrice(stats.attendu)} icon={Clock} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Pertes Merch" value={formatPrice(stats.perdu)} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
        
        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">
              <Truck size={14} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Logistique</p>
              <p className="text-[11px] font-bold text-slate-700 mt-1">{stats.enLivraisonCount} en transit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher par Client, Produit ou Réf..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Reference</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Client</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Produit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Achat</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Profit</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2 font-mono text-xs font-black text-slate-400">
                    <EditableCell value={item.reference} onSave={(v) => updateMerch(item.id, 'reference', v)} />
                  </td>
                  <td className="p-2 font-bold text-blue-600">
                    <EditableCell value={item.client_name} onSave={(v) => updateMerch(item.id, 'client_name', v)} />
                  </td>
                  <td className="p-2 text-slate-700">
                    <EditableCell value={item.produit} onSave={(v) => updateMerch(item.id, 'produit', v)} />
                  </td>
                  <td className="p-2 text-right">
                    <EditableCell type="number" value={item.prix_achat} onSave={(v) => updateMerch(item.id, 'prix_achat', v)} className="text-right text-slate-500" />
                  </td>
                  <td className="p-2 text-right font-black">
                    <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateMerch(item.id, 'prix_vente', v)} className="text-right" />
                  </td>
                  <td className="p-2 text-center">
                    <select 
                      value={item.status} 
                      onChange={(e) => updateMerch(item.id, 'status', e.target.value)}
                      className={`text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                        ${item.status === MerchStatus.LIVREE ? 'bg-emerald-50 text-emerald-700' : 
                          item.status === MerchStatus.LIVREE_NON_ENCAISSEE ? 'bg-purple-50 text-purple-700' :
                          item.status === MerchStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}
                    >
                      {MERCH_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-black text-sm ${item.status === MerchStatus.RETOUR ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.status === MerchStatus.RETOUR ? `-${formatPrice(item.impact_perte)}` : formatPrice(item.profit)}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => deleteMerch(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
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

export default CommandeMerch;
