import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Clock, 
  AlertCircle, 
  ArrowRightLeft, 
  TrendingUp,
  Banknote,
  Calendar,
  RotateCcw,
  // Added missing Truck import
  Truck
} from 'lucide-react';
import { GrosStatus, ExternStatus, OffreType } from '../types.ts';

const Dashboard: React.FC = () => {
  const { gros, extern, offres, getCalculatedGros, getCalculatedExtern } = useAppStore();
  
  // Date Filtration States
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const cGros = getCalculatedGros();
  const cExtern = getCalculatedExtern();

  // Filtered Datasets
  const filteredData = useMemo(() => {
    const filterByDate = (dateStr: string) => {
      if (!dateStart && !dateEnd) return true;
      if (dateStart && dateStr < dateStart) return false;
      if (dateEnd && dateStr > dateEnd) return false;
      return true;
    };

    const fGros = cGros.filter(item => filterByDate(item.date_created));
    const fExtern = cExtern.filter(item => filterByDate(item.date_created));
    const fOffres = offres.filter(item => filterByDate(item.date));

    return { fGros, fExtern, fOffres };
  }, [cGros, cExtern, offres, dateStart, dateEnd]);

  // Recalculate KPIs based on filtered data
  const metrics = useMemo(() => {
    const { fGros, fExtern, fOffres } = filteredData;

    const encaisse_reel = fGros.reduce((acc, curr) => acc + curr.profit_encaisse, 0) + 
                         fExtern.reduce((acc, curr) => acc + curr.profit_reel, 0);
    
    const profit_attendu = fGros.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    
    const pertes = fGros.reduce((acc, curr) => acc + curr.perte, 0) + 
                   fExtern.reduce((acc, curr) => acc + curr.perte, 0);
    
    const rev = fOffres.filter(o => o.type === OffreType.REVENUE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const exp = fOffres.filter(o => o.type === OffreType.EXPENSE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const net_offres = rev - exp;

    const profit_net_final = encaisse_reel + profit_attendu + net_offres - pertes;

    return {
      encaisse_reel,
      profit_attendu,
      pertes,
      net_offres,
      profit_net_final,
      total_orders: fGros.length + fExtern.length,
      total_expenses: exp
    };
  }, [filteredData]);

  const kpis = [
    { label: 'Encaisse Réel', value: metrics.encaisse_reel, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Profit Attendu', value: metrics.profit_attendu, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pertes (Retours)', value: metrics.pertes, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Net Offres (Frais)', value: metrics.net_offres, icon: ArrowRightLeft, color: metrics.net_offres >= 0 ? 'text-emerald-600' : 'text-orange-600', bg: metrics.net_offres >= 0 ? 'bg-emerald-50' : 'bg-orange-50' },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  const timeSeriesData = useMemo(() => {
    const { fGros, fExtern, fOffres } = filteredData;
    const dailyMap: Record<string, { date: string; profit: number }> = {};
    
    const ensureDate = (date: string) => {
      if (!dailyMap[date]) dailyMap[date] = { date, profit: 0 };
    };

    fGros.forEach(item => {
      ensureDate(item.date_created);
      if (item.status === GrosStatus.LIVREE_ENCAISSE) {
        dailyMap[item.date_created].profit += (item.prix_vente - item.cost);
      } else if (item.status === GrosStatus.RETOUR) {
        dailyMap[item.date_created].profit -= item.cost;
      }
    });

    fExtern.forEach(item => {
      ensureDate(item.date_created);
      if (item.status === ExternStatus.LIVREE) {
        dailyMap[item.date_created].profit += (item.prix_vente - item.cost);
      } else if (item.status === ExternStatus.RETOUR) {
        dailyMap[item.date_created].profit -= item.cost;
      }
    });

    fOffres.forEach(item => {
      ensureDate(item.date);
      if (item.type === OffreType.REVENUE) {
        dailyMap[item.date].profit += Number(item.montant);
      } else {
        dailyMap[item.date].profit -= Number(item.montant);
      }
    });

    return Object.values(dailyMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredData]);

  const resetFilters = () => {
    setDateStart('');
    setDateEnd('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Filter Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium">Analyse financière dynamique par période.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Du</span>
            <input 
              type="date" 
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none text-slate-700"
            />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Au</span>
            <input 
              type="date" 
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none text-slate-700"
            />
          </div>
          {(dateStart || dateEnd) && (
            <button 
              onClick={resetFilters}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Réinitialiser"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <div className="hidden md:flex flex-col items-end px-4 border-l border-slate-100">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aujourd'hui</span>
             <span className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center mb-6`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(kpi.value)}</h3>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profit Flow Chart */}
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-slate-800 text-lg">Flux de Profit Périodique</h4>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Profit Net Quotidiens
            </div>
          </div>
          <div className="h-[350px]">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                    dy={10}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => [formatCurrency(val), 'Profit']}
                  />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Calendar size={48} className="opacity-10" />
                <p className="text-sm font-medium">Aucune donnée pour cette période</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden flex flex-col">
          <div className="relative z-10 flex flex-col h-full">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Total Net (Sur Période)</p>
            <h4 className="text-4xl font-black mb-2 tracking-tighter transition-all">
              {formatCurrency(metrics.profit_net_final)}
            </h4>
            <p className="text-slate-400 text-sm font-medium">
              Bénéfice calculé après toutes les opérations de la période sélectionnée.
            </p>
            
            <div className="mt-auto space-y-4 pt-8">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Volume Commandes</p>
                  <span className="text-sm font-black text-white">{metrics.total_orders}</span>
                </div>
                <Truck size={20} className="text-blue-500/50" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Frais Opérationnels</p>
                  <span className="text-sm font-black text-orange-400">-{formatCurrency(metrics.total_expenses)}</span>
                </div>
                <AlertCircle size={20} className="text-orange-500/50" />
              </div>
            </div>
          </div>
          <TrendingUp size={120} className="absolute -bottom-8 -right-8 text-white/5 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;