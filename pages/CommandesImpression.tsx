import React, { useMemo, useState } from "react";
import { useAppStore } from '../store.tsx';
import { Plus, Trash2, CheckCircle, TrendingDown, X, Save, FileText } from 'lucide-react';
import type { CommandeImpression } from '../types.ts';
import EditableCell from '../components/EditableCell.tsx';

const CommandesImpression = () => {
  const { 
    commandesImpression,
    addCommandeImpression,
    updateCommandeImpression,
    deleteCommandeImpression
  } = useAppStore();

  const [selectedCommande, setSelectedCommande] = useState<CommandeImpression | null>(null);
  const [formData, setFormData] = useState<Partial<CommandeImpression>>({});

  const openPopup = (item: CommandeImpression) => {
    setSelectedCommande(item);
    setFormData({
      description: item.description || '',
      somme_totale: item.somme_totale || 0,
      versement: item.versement || 0,
      rest: item.rest || 0,
      nombre_produit: item.nombre_produit || 0,
      produits: item.produits || '',
      avec_impression: item.avec_impression || false,
      frais_impression: item.frais_impression || 0
    });
  };

  const handleFormChange = (field: keyof CommandeImpression, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'somme_totale' || field === 'versement') {
        newData.rest = (Number(newData.somme_totale) || 0) - (Number(newData.versement) || 0);
      }
      return newData;
    });
  };

  const savePopup = () => {
    if (selectedCommande) {
      Object.entries(formData).forEach(([key, value]) => {
        updateCommandeImpression(selectedCommande.id, key as keyof CommandeImpression, value);
      });
      setSelectedCommande(null);
    }
  };

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
                <th className="px-4 py-4">Date</th>
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
                      <button onClick={() => openPopup(item)} className="hover:underline flex items-center gap-1">
                        <FileText size={14} /> {item.ref}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
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
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Aucune commande d'impression
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedCommande && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Détails Commande {selectedCommande.ref}
              </h3>
              <button onClick={() => setSelectedCommande(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description de commandes</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Somme Totale</label>
                  <input 
                    type="number" 
                    value={formData.somme_totale || 0} 
                    onChange={(e) => handleFormChange('somme_totale', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Versement</label>
                  <input 
                    type="number" 
                    value={formData.versement || 0} 
                    onChange={(e) => handleFormChange('versement', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rest</label>
                  <input 
                    type="number" 
                    value={formData.rest || 0} 
                    onChange={(e) => handleFormChange('rest', Number(e.target.value))}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Produit</label>
                  <input 
                    type="number" 
                    value={formData.nombre_produit || 0} 
                    onChange={(e) => handleFormChange('nombre_produit', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Produits</label>
                <textarea 
                  value={formData.produits || ''} 
                  onChange={(e) => handleFormChange('produits', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.avec_impression || false} 
                      onChange={(e) => handleFormChange('avec_impression', e.target.checked)}
                      className="w-5 h-5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Avec Impression</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frais d'impression</label>
                  <input 
                    type="number" 
                    value={formData.frais_impression || 0} 
                    onChange={(e) => handleFormChange('frais_impression', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    disabled={!formData.avec_impression}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedCommande(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={savePopup}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Save size={18} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandesImpression;

