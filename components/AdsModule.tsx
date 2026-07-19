import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import EditableCell from './EditableCell.tsx';

interface AdsModuleProps {
  type: 'gros' | 'impression';
}

const AdsModule: React.FC<AdsModuleProps> = ({ type }) => {
  const { ads, addAd, updateAd, deleteAd } = useAppStore();

  const filteredAds = useMemo(() => {
    return ads.filter(ad => ad.target_type === type).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ads, type]);

  const totalSum = useMemo(() => {
    return filteredAds.reduce((acc, ad) => acc + Number(ad.amount || 0), 0);
  }, [filteredAds]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Megaphone className="text-indigo-600" />
          Dépenses Publicitaires (Ads)
        </h2>
        <button 
          onClick={() => addAd(type)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Ajouter Ad
        </button>
      </div>

      <div className="bg-indigo-500 rounded-2xl p-6 text-white shadow-lg flex items-center gap-6">
        <div className="bg-white/20 p-4 rounded-xl">
          <Megaphone size={32} className="text-indigo-100" />
        </div>
        <div>
          <p className="text-indigo-100 font-bold mb-1 uppercase tracking-wider text-xs">Total Dépenses Ads</p>
          <p className="text-3xl font-black">{totalSum.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-4 w-40">De (Date)</th>
                <th className="px-4 py-4 w-40">À (Date)</th>
                <th className="px-4 py-4">Montant</th>
                <th className="px-4 py-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAds.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <input 
                      type="date" 
                      value={ad.date_from} 
                      onChange={(e) => updateAd(ad.id, 'date_from', e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 font-medium w-full"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="date" 
                      value={ad.date_to} 
                      onChange={(e) => updateAd(ad.id, 'date_to', e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 font-medium w-full"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    <EditableCell 
                      value={ad.amount} 
                      onSave={(val) => updateAd(ad.id, 'amount', val)} 
                      type="number" 
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => {
                        if (window.confirm('Supprimer cette publicité ?')) deleteAd(ad.id);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAds.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Aucune dépense publicitaire
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

export default AdsModule;
