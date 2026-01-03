
import React, { useRef, useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import EditableCell from '../components/EditableCell.tsx';
import StatCard from '../components/StatCard.tsx';
import { SitewebStatus } from '../types.ts';
import { Plus, Search, Banknote, User, Trash2, Copy, Download, Upload, AlertCircle, Clock } from 'lucide-react';

const CommandesDetail: React.FC = () => {
  const { getCalculatedSiteweb, updateSiteweb, addSiteweb, deleteSiteweb, duplicateSiteweb, importSiteweb } = useAppStore();
  const allData = getCalculatedSiteweb();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return allData.filter(item => {
      return (item.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.vendeur_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [allData, searchTerm]);

  const stats = useMemo(() => {
    // Profit réel (livrée)
    const profitReel = filteredData
      .filter(o => o.status === SitewebStatus.LIVREE)
      .reduce((acc, curr) => acc + curr.profit_net, 0);

    // On hold (en livraison + livrée non encaissée)
    const onHold = filteredData
      .filter(o => o.status === SitewebStatus.EN_LIVRAISON || o.status === SitewebStatus.LIVREE_NON_ENCAISSEE)
      .reduce((acc, curr) => acc + curr.profit_net, 0);

    // Lost (retour)
    const lost = filteredData
      .filter(o => o.status === SitewebStatus.RETOUR)
      .reduce((acc, curr) => acc + (Number(curr.cout_article) + Number(curr.cout_impression)), 0);

    return { profitReel, onHold, lost };
  }, [filteredData]);

  const formatPrice = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer cette commande sitweb ?')) {
      deleteSiteweb(id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateSiteweb(id);
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
          reference: obj.reference || String(Date.now()).slice(-6),
          date_created: obj.date_created || obj.date || new Date().toISOString().split('T')[0],
          cout_article: Number(obj.cout_article) || 0,
          cout_impression: Number(obj.cout_impression) || 0,
          prix_vente: Number(obj.prix_vente) || 0,
          status: (obj.status as SitewebStatus) || SitewebStatus.EN_LIVRAISON,
          vendeur_name: obj.vendeur_name || 'V-X',
          vendeur_benefice: Number(obj.vendeur_benefice) || 0,
          stock_note: obj.stock_note || ''
        };
      });
      importSiteweb(importedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["reference", "vendeur_name", "date_created", "cout_article", "cout_impression", "prix_vente", "vendeur_benefice", "status"];
    const rows = filteredData.map(item => [
      item.reference,
      item.vendeur_name,
      item.date_created,
      item.cout_article,
      item.cout_impression,
      item.prix_vente,
      item.vendeur_benefice,
      item.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "commandes_siteweb.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Commandes siteweb</h2>
          <p className="text-slate-500 text-sm font-medium">Gestion indépendante des commandes directes et commissions vendeurs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Upload size={16} /> Importer
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Download size={16} /> Exporter
          </button>
          <button type="button" onClick={addSiteweb} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Commande
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Profit Réel (Livrée)" value={formatPrice(stats.profitReel)} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="On Hold (Livraison)" value={formatPrice(stats.onHold)} icon={Clock} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Lost (Retour)" value={formatPrice(stats.lost)} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtre par Ref ou Vendeur..." 
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
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Ref</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px]">Vendeur</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Production (x + y)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Vente</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Com. Vendeur</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-right">Profit Net</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-tighter text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-2 font-mono text-xs font-black text-slate-400">
                      <EditableCell type="text" value={item.reference} onSave={(v) => updateSiteweb(item.id, 'reference', v)} />
                    </td>
                    <td className="p-2 font-bold text-blue-600">
                      <EditableCell value={item.vendeur_name} onSave={(v) => updateSiteweb(item.id, 'vendeur_name', v)} />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-2 text-center">
                        <EditableCell type="number" value={item.cout_article} onSave={(v) => updateSiteweb(item.id, 'cout_article', v)} prefix="A: " className="text-[10px] py-1 h-auto min-w-[65px]" />
                        <span className="text-slate-300 text-[10px] font-bold">+</span>
                        <EditableCell type="number" value={item.cout_impression} onSave={(v) => updateSiteweb(item.id, 'cout_impression', v)} prefix="I: " className="text-[10px] py-1 h-auto min-w-[65px]" />
                      </div>
                    </td>
                    <td className="p-2 text-right font-black text-slate-900">
                      <EditableCell type="number" value={item.prix_vente} onSave={(v) => updateSiteweb(item.id, 'prix_vente', v)} />
                    </td>
                    <td className="p-2 text-right font-bold text-purple-600">
                      <EditableCell type="number" value={item.vendeur_benefice} onSave={(v) => updateSiteweb(item.id, 'vendeur_benefice', v)} />
                    </td>
                    <td className="p-2 text-center">
                      <select 
                        value={item.status} 
                        onChange={(e) => updateSiteweb(item.id, 'status', e.target.value)}
                        className={`text-[10px] p-2 rounded-xl border-none font-black uppercase tracking-widest cursor-pointer transition-colors
                          ${item.status === SitewebStatus.LIVREE ? 'bg-emerald-50 text-emerald-700' : 
                            item.status === SitewebStatus.LIVREE_NON_ENCAISSEE ? 'bg-purple-50 text-purple-700' :
                            item.status === SitewebStatus.EN_LIVRAISON ? 'bg-blue-50 text-blue-700' : 
                            'bg-red-50 text-red-700'}`}
                      >
                        {Object.values(SitewebStatus).map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-black text-sm ${item.profit_net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPrice(item.profit_net)}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          type="button"
                          onClick={(e) => handleDuplicate(e, item.id)}
                          className="p-2 text-slate-300 hover:text-blue-500 transition-all rounded-lg hover:bg-blue-50"
                          title="Dupliquer la commande"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                          title="Supprimer la commande"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommandesDetail;
