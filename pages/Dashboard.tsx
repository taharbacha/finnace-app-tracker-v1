
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store.tsx';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, AlertCircle, Banknote, Calendar, Wallet, TrendingUp, Truck } from 'lucide-react';
import { GrosStatus, ExternStatus, OffreType } from '../types.ts';

const Dashboard: React.FC = () => {
  const { getDashboardData, getCalculatedGros, getCalculatedExtern, offres, charges } = useAppStore();
  const data = getDashboardData();
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const formatCurrency = (val: number) => {
    return val.toLocaleString('fr-DZ') + ' DA';
  };

  const kpis = [
    { label: 'Encaisse Réel', value: data.encaisse_reel, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Profit Attendu', value: data.profit_attendu, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pertes (Retours)', value: data.pertes, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Les Charges', value: data.total_charges, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium">Synthèse financière et opérationnelle globale.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar size={16} className="text-blue-500" />
            <input 
              type="date" 
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none text-slate-700"
            />
            <span className="text-xs text-slate-300 font-bold">à</span>
            <input 
              type="date" 
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none text-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center mb-6`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(kpi.value)}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
          <h4 className="font-bold text-slate-800 text-lg mb-8">Performance Analytique</h4>
          <div className="h-[300px] flex flex-col items-center justify-center text-slate-300">
             <TrendingUp size={64} className="opacity-10 mb-4" />
             <p className="font-medium">Visualisation des flux en cours d'agrégation...</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Solde Net Final</p>
            <h4 className="text-4xl font-black mb-4 tracking-tighter">
              {formatCurrency(data.profit_net_final)}
            </h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Calcul final après déduction des pertes, charges opérationnelles et investissements marketing.
            </p>
          </div>
          <div className="relative z-10 space-y-3 mt-12">
            <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-white/5">
               <span className="text-[10px] font-black uppercase text-slate-500">Flux Offres Net</span>
               <span className={`text-xs font-black ${data.net_offres >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                 {formatCurrency(data.net_offres)}
               </span>
            </div>
          </div>
          <TrendingUp size={150} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
