import React, { useState } from 'react';
import AdsModule from '../components/AdsModule.tsx';
import { Megaphone } from 'lucide-react';

const Ads = () => {
  const [activeTab, setActiveTab] = useState<'gros' | 'impression'>('gros');

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Megaphone className="text-blue-600" size={28} />
            Campagnes Publicitaires (Ads)
          </h1>
          <p className="text-slate-500 text-sm font-medium">Gérez vos dépenses publicitaires par cible.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('gros')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'gros' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Gros
          </button>
          <button
            onClick={() => setActiveTab('impression')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'impression' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Impression
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <AdsModule type={activeTab} />
      </div>
    </div>
  );
};

export default Ads;
