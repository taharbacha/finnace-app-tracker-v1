import React, { useMemo } from "react";
import { useAppStore } from '../store.tsx';
import { Plus, Trash2, CheckCircle, TrendingDown } from 'lucide-react';
import EditableCell from '../components/EditableCell.tsx';

const CommandesImpression = () => {
  const { 
    commandesImpression,
    addCommandeImpression,
    updateCommandeImpression,
    deleteCommandeImpression
  } = useAppStore();

  const sortedImpression = [...commandesImpression].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats = useMemo(() => {
    let beneficeNetLivree = 0;
    let retourPerte = 0;

    commandesImpression.forEach(item => {
      const benefice = Number(item.prix_vente) - (Number(item.cout_article) + Number(item.cout_impression));
      const perte = (Number(item.cout_article) + Number(item.cout_impression));
      
      if (item.status === 'livree') {
        beneficeNetLivree += benefice;
      }
      if (item.status === 'retour') {
        retourPerte += perte;
      }
    });

    return { beneficeNetLivree, retourPerte };
  }, [commandesImpression]);

  const handleStatusChange = (id: string, currentStatus: string) => {
    const statuses: ('en production' | 'en livraison' | 'livree' | 'retour')[] = ['en production', 'en livraison', 'livree', 'retour'];
    const currentIndex = statuses.indexOf(currentStatus as any);
    const nextIndex = (currentIndex + 1) % statuses.length;
    updateCommandeImpression(id, 'status', statuses[nextIndex]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en production': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'en livraison': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'livree': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'retour': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commande Impression</h1>
        
<button 
          onClick={addCommandeImpression}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nouvelle Commande
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl">
            <CheckCircle size={32} className="text-emerald-100" />
          </div>
          <div>
            <p className="text-emerald-100 font-bold mb-1 uppercase tracking-wider text-xs">Bénéfice Net (Livrées)</p>
            <p className="text-3xl font-black">{stats.beneficeNetLivree.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}</p>
          </div>
        </div>

        <div className="bg-red-500 rounded-3xl p-6 text-white shadow-xl flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl">
            <TrendingDown size={32} className="text-red-100" />
          </div>
          <div>
            <p className="text-red-100 font-bold mb-1 uppercase tracking-wider text-xs">Perte (Retours)</p>
            <p className="text-3xl font-black">{stats.retourPerte.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-4">Ref</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Téléphone</th>
                <th className="px-4 py-4">Coût Article</th>
                <th className="px-4 py-4">Coût Impr.</th>
                <th className="px-4 py-4">Prix Vente</th>
                <th className="px-4 py-4">Bénéfice Net</th>
                <th className="px-4 py-4 text-center">Versement</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedImpression.map((item) => {
                const benefice = Number(item.prix_vente) - (Number(item.cout_article) + Number(item.cout_impression));
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">
                      {item.ref}
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={item.client_name} 
                        onSave={(val) => updateCommandeImpression(item.id, 'client_name', val)} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EditableCell 
                        value={item.phone_number} 
                        onSave={(val) => updateCommandeImpression(item.id, 'phone_number', val)} 
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EditableCell 
                        value={item.cout_article} 
                        onSave={(val) => updateCommandeImpression(item.id, 'cout_article', val)} 
                        type="number" 
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EditableCell 
                        value={item.cout_impression} 
                        onSave={(val) => updateCommandeImpression(item.id, 'cout_impression', val)} 
                        type="number" 
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-700">
                      <EditableCell 
                        value={item.prix_vente} 
                        onSave={(val) => updateCommandeImpression(item.id, 'prix_vente', val)} 
                        type="number" 
                      />
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap font-bold ${benefice >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {benefice.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <input 
                        type="checkbox"
                        checked={item.has_versement}
                        onChange={(e) => updateCommandeImpression(item.id, 'has_versement', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusChange(item.id, item.status)}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button 
                        onClick={() => {
                          if (window.confirm('Supprimer cette commande ?')) deleteCommandeImpression(item.id);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedImpression.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Aucune commande d'impression
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

export default CommandesImpression;
