
import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, Legend
} from 'recharts';
import { 
  Clock, 
  AlertCircle, 
  ArrowRightLeft, 
  TrendingUp,
  Banknote,
  Calendar,
  Layers
} from 'lucide-react';
import { GrosStatus, ExternStatus, OffreType, OffreCategory } from '../types';

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

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    offres.filter(o => o.type === OffreType.EXPENSE).forEach(o => {
      cats[o.category] = (cats[o.category] || 0) + Number(o.montant);
    });
    return Object.entries(cats).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [offres]);

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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord Financier</h2>
          <p className="text-slate-500 font-medium">Suivi de la performance opérationnelle en temps réel.</p>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Performance Journalière</h4>
              <p className="text-sm text-slate-500">Bénéfices nets vs Charges globales</p>
            </div>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                  dy={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', fontSize: '12px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend verticalAlign="top" height={36}/>
                <Area name="Profit Net" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" />
                <Area name="Frais/Dépenses" type="monotone" dataKey="expenses" stroke="#fb923c" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-lg shadow-blue-200 text-white relative overflow-hidden">
            <Layers className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                Bilan Final Estimé
              </span>
              <p className="text-blue-100 text-sm font-medium mb-1">Profit Net Global</p>
              <h3 className="text-4xl font-black mb-2">
                {formatCurrency(data.profit_net_final)}
              </h3>
              <p className="text-xs text-blue-200 italic opacity-80 leading-relaxed">
                Inclut l'encaissé, l'attendu, les revenus annexes et déduit toutes les pertes et frais de fonctionnement.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <h4 className="font-bold text-slate-800 text-sm mb-6 uppercase tracking-widest">Répartition des Frais</h4>
             <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={categoryData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {categoryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                    <span className="truncate">{cat.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
