
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store.tsx';
import { Clock, AlertCircle, TrendingUp, Banknote, Calendar, RotateCcw, Activity } from 'lucide-react';

const Analytics: React.FC = () => {
  const { getDashboardData } = useAppStore();
  const data = getDashboardData();
  const formatPrice = (v: number) => v.toLocaleString('fr-DZ') + ' DA';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Terminal</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Operational Analytics Index</p>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-3xl flex gap-6 shadow-2xl">
           <div className="text-center">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</p>
             <p className="text-sm font-black text-emerald-400 flex items-center gap-1 justify-center"><Activity size={14}/> ONLINE</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Real Cashflow', val: data.encaisse_reel, icon: Banknote, color: 'emerald' },
          { label: 'Pending Yield', val: data.profit_attendu, icon: Clock, color: 'blue' },
          { label: 'Return Loss', val: data.pertes, icon: AlertCircle, color: 'red' },
          { label: 'Fixed Costs', val: data.total_charges, icon: TrendingUp, color: 'orange' }
        ].map((k, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl">
            <div className={`w-12 h-12 rounded-2xl bg-${k.color}-50 flex items-center justify-center mb-6`}>
              <k.icon className={`text-${k.color}-600`} size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{formatPrice(k.val)}</h3>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
        <div className="relative z-10">
          <TrendingUp size={48} className="text-blue-500 mb-8" />
          <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Final Net Standing</p>
          <h2 className="text-6xl font-black tracking-tighter mb-4">{formatPrice(data.profit_net_final)}</h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl">Total liquidity position after accounting for Wholesale, Retail, Marketing spend, and Fixed Operational costs.</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
