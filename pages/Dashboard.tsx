
import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  Clock, 
  AlertCircle, 
  ArrowRightLeft, 
  TrendingUp,
  Banknote,
  Calendar
} from 'lucide-react';
import { GrosStatus, ExternStatus, OffreType } from '../types';

const Dashboard: React.FC = () => {
  const { getDashboardData, gros, extern, offres, getCalculatedGros, getCalculatedExtern } = useAppStore();
  const data = getDashboardData();
  const cGros = getCalculatedGros();
  const cExtern = getCalculatedExtern();

  const kpis = [
    { label: 'Encaisse Réel', value: data.encaisse_reel, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Profit Attendu', value: data.profit_attendu, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pertes (Retours)', value: data.pertes, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Net Offres (Frais)', value: data.net_offres, icon: ArrowRightLeft, color: data.net_offres >= 0 ? 'text-emerald-600' : 'text-orange-600', bg: data.net_offres >= 0 ? 'bg-emerald-50' : 'bg-orange-50' },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(val);
  };

  const barChartData = useMemo(() => [
    { name: 'Encaisse', value: data.encaisse_reel, fill: '#10b981' },
    { name: 'Attendu', value: data.profit_attendu, fill: '#3b82f6' },
    { name: 'Pertes', value: data.pertes, fill: '#ef4444' },
  ], [data]);

  const timeSeriesData = useMemo(() => {
    const dailyMap: Record<string, { date: string; profit: number; expenses: number; volume: number }> = {};
    const ensureDate = (date: string) => {
      if (!dailyMap[date]) dailyMap[date] = { date, profit: 0, expenses: 0, volume: 0 };
    };

    cGros.forEach(item => {
      ensureDate(item.date_created);
      dailyMap[item.date_created].volume += 1;
      if (item.status === GrosStatus.LIVREE_ENCAISSE) {
        dailyMap[item.date_created].profit += (item.prix_vente - item.cost);
      } else if (item.status === GrosStatus.RETOUR) {
        dailyMap[item.date_created].profit -= item.cost;
      }
    });

    cExtern.forEach(item => {
      ensureDate(item.date_created);
      dailyMap[item.date_created].volume += 1;
      if (item.status === ExternStatus.LIVREE) {
        dailyMap[item.date_created].profit += (item.prix_vente - item.cost);
      } else if (item.status === ExternStatus.RETOUR) {
        dailyMap[item.date_created].profit -= item.cost;
      }
    });

    offres.forEach(item => {
      ensureDate(item.date);
      if (item.type === OffreType.REVENUE) {
        dailyMap[item.date].profit += Number(item.montant);
      } else {
        dailyMap[item.date].expenses += Number(item.montant);
      }
    });

    return Object.values(dailyMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15);
  }, [cGros, cExtern, offres]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de bord</h2>
          <p className="text-slate-500">Vue d'ensemble de la santé financière du business.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-sm font-medium text-slate-600 shadow-sm">
          <Calendar size={16} className="text-blue-500" />
          <span>Derniers 15 jours d'activité</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={kpi.color} size={24} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
            <h3 className="text-xl font-bold text-slate-900">{formatCurrency(kpi.value)}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Performance Financière Journalière</h4>
              <p className="text-sm text-slate-500">Profil des bénéfices encaissés et frais par date</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Profit</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400"></div> Frais</div>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}} 
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', color: '#1e293b' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                <Area type="monotone" dataKey="expenses" stroke="#fb923c" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-4">
              <TrendingUp size={14} /> Bilan de santé
            </span>
            <p className="text-sm font-medium text-slate-500 mb-1">Profit Net Final</p>
            <h3 className={`text-3xl font-black ${data.profit_net_final >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatCurrency(data.profit_net_final)}
            </h3>
            <p className="text-xs text-slate-400 mt-2 italic">
              * Calculé sur la base des livraisons encaissées, attendues et frais globaux.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50">
             <h4 className="font-bold text-slate-800 text-sm mb-4">Volume de Travail</h4>
             <div className="space-y-3">
               <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-500">Commandes Gros</span>
                 <span className="font-bold text-slate-900">{gros.length}</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-500">Commandes Détail</span>
                 <span className="font-bold text-slate-900">{extern.length}</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <span className="text-slate-500">Mouvements Offres</span>
                 <span className="font-bold text-slate-900">{offres.length}</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
