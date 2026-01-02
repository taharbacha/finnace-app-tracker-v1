import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, AreaChart, Area, Legend, Cell
} from 'recharts';
import { 
  Clock, 
  AlertCircle, 
  ArrowRightLeft, 
  TrendingUp,
  Banknote,
  Calendar
} from 'lucide-react';
import { GrosStatus, ExternStatus, OffreType } from '../types.ts';

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
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium">Performance financière en temps réel.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 text-sm font-bold text-slate-600 shadow-sm self-start">
          <Calendar size={18} className="text-blue-500" />
          <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-800 text-lg mb-8">Flux de Profit Journalier</h4>
          <div className="h-[350px]">
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
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Total Net Calculé</p>
              <h4 className="text-4xl font-black mb-2 tracking-tighter">{formatCurrency(data.profit_net_final)}</h4>
              <p className="text-slate-400 text-sm font-medium">Bénéfice net final après déduction des pertes et frais opérationnels.</p>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <span className="text-xs font-bold text-slate-400">COMMANDES</span>
                <span className="text-sm font-black text-white">{gros.length + extern.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <span className="text-xs font-bold text-slate-400">FRAIS RÉCURRENTS</span>
                <span className="text-sm font-black text-orange-400">-{formatCurrency(offres.filter(o => o.type === 'expense').reduce((acc, curr) => acc + curr.montant, 0))}</span>
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