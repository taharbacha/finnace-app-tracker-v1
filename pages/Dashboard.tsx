
import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area, 
  Line, 
  ComposedChart,
  Legend 
} from 'recharts';
import { Clock, Banknote, Calendar, Wallet, TrendingUp, Megaphone, RotateCcw, BarChart3 } from 'lucide-react';
import { OffreType, MarketingSpendSource, MarketingStatus, GrosStatus, SitewebStatus } from '../types.ts';

// Fixed: Moved ChartCard outside Dashboard and used React.FC to properly handle children prop and avoid missing prop errors in strict TS environments
interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  icon: any;
  colorClass: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[380px]">
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-xl ${colorClass.replace('text', 'bg').replace('600', '50')}`}>
        <Icon className={colorClass} size={18} />
      </div>
      <h4 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h4>
    </div>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { 
    getDashboardData, 
    getCalculatedGros, 
    getCalculatedSiteweb, 
    getCalculatedMarketing, 
    offres, 
    marketingSpends,
    dashboardDateStart,
    dashboardDateEnd,
    setDashboardDateRange
  } = useAppStore();

  const data = getDashboardData(dashboardDateStart, dashboardDateEnd);
  
  const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  // Date Filter Helper
  const filterByDate = (dateStr: string) => {
    if (dashboardDateStart && dateStr < dashboardDateStart) return false;
    if (dashboardDateEnd && dateStr > dashboardDateEnd) return false;
    return true;
  };

  // 1. Time Series Data Processing
  const timeSeriesData = useMemo(() => {
    const dailyMap: Record<string, { 
      date: string, 
      grosProfit: number, 
      retailProfit: number, 
      offresNet: number, 
      marketingProfit: number,
      marketingSpend: number 
    }> = {};

    // Process Gros
    getCalculatedGros().forEach(item => {
      if (!filterByDate(item.date_created)) return;
      const d = item.date_created;
      if (!dailyMap[d]) dailyMap[d] = { date: d, grosProfit: 0, retailProfit: 0, offresNet: 0, marketingProfit: 0, marketingSpend: 0 };
      const profit = item.status === GrosStatus.RETOUR ? -item.cost : (item.prix_vente - item.cost);
      dailyMap[d].grosProfit += profit;
    });

    // Process Retail
    getCalculatedSiteweb().forEach(item => {
      if (!filterByDate(item.date_created)) return;
      // Modified: en_livraison is logistical only and must not affect financial trends
      if (item.status === SitewebStatus.EN_LIVRAISON) return;
      
      const d = item.date_created;
      if (!dailyMap[d]) dailyMap[d] = { date: d, grosProfit: 0, retailProfit: 0, offresNet: 0, marketingProfit: 0, marketingSpend: 0 };
      dailyMap[d].retailProfit += item.profit_net;
    });

    // Process Offres
    offres.forEach(item => {
      if (!filterByDate(item.date)) return;
      const d = item.date;
      if (!dailyMap[d]) dailyMap[d] = { date: d, grosProfit: 0, retailProfit: 0, offresNet: 0, marketingProfit: 0, marketingSpend: 0 };
      const amt = Number(item.montant);
      dailyMap[d].offresNet += item.type === OffreType.REVENUE ? amt : -amt;
    });

    // Process Marketing Services
    getCalculatedMarketing().forEach(item => {
      if (!filterByDate(item.date)) return;
      const d = item.date;
      if (!dailyMap[d]) dailyMap[d] = { date: d, grosProfit: 0, retailProfit: 0, offresNet: 0, marketingProfit: 0, marketingSpend: 0 };
      dailyMap[d].marketingProfit += item.net_profit;
    });

    // Process Marketing Spends
    marketingSpends.forEach(item => {
      if (!filterByDate(item.date_start)) return;
      const d = item.date_start;
      if (!dailyMap[d]) dailyMap[d] = { date: d, grosProfit: 0, retailProfit: 0, offresNet: 0, marketingProfit: 0, marketingSpend: 0 };
      dailyMap[d].marketingSpend += Number(item.amount);
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMarketing, offres, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  // Pillar Stats (Current grouping)
  const pillarStats = useMemo(() => {
    // 1. Gros
    const grosFiltered = getCalculatedGros().filter(item => filterByDate(item.date_created));
    const grosRev = grosFiltered.filter(i => i.status !== GrosStatus.RETOUR).reduce((a, c) => a + c.prix_vente, 0);
    const grosProd = grosFiltered.reduce((a, c) => a + c.cost, 0);
    const grosMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.GROS && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    // 2. Siteweb
    const swFiltered = getCalculatedSiteweb().filter(item => filterByDate(item.date_created));
    // Revenue remains realized (LIVREE)
    const swRev = swFiltered.filter(i => i.status === SitewebStatus.LIVREE).reduce((a, c) => a + Number(c.prix_vente), 0);
    // Modified: Production expenses for Retail now exclude items in transit (en_livraison) to keep ROI and Net accurate to financial truth
    const swProd = swFiltered.filter(i => i.status === SitewebStatus.LIVREE || i.status === SitewebStatus.LIVREE_NON_ENCAISSEE).reduce((a, c) => a + (Number(c.cout_article) + Number(c.cout_impression) + Number(c.vendeur_benefice)), 0);
    const swMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.SITEWEB && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    // 3. Offres (Subscriptions)
    const offFiltered = offres.filter(item => filterByDate(item.date));
    const offRev = offFiltered.filter(o => o.type === OffreType.REVENUE).reduce((a, c) => a + Number(c.montant), 0);
    const offExp = offFiltered.filter(o => o.type === OffreType.EXPENSE).reduce((a, c) => a + Number(c.montant), 0);
    const offMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.OFFRES && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    // 4. Marketing Client (Services)
    const clientFiltered = getCalculatedMarketing().filter(item => filterByDate(item.date));
    const clientRev = clientFiltered.filter(m => m.status === MarketingStatus.TERMINE).reduce((a, c) => a + Number(c.revenue), 0);
    const clientExp = clientFiltered.filter(m => m.status === MarketingStatus.TERMINE).reduce((a, c) => a + Number(c.client_charges), 0);
    const clientMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.MARKETING_CLIENT && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    return [
      { name: 'Gros', rev: grosRev, exp: grosProd, marketing: grosMarketing, net: grosRev - grosProd - grosMarketing },
      { name: 'Retail', rev: swRev, exp: swProd, marketing: swMarketing, net: swRev - swProd - swMarketing },
      { name: 'Plans', rev: offRev, exp: offExp, marketing: offMarketing, net: offRev - offExp - offMarketing },
      { name: 'Services', rev: clientRev, exp: clientExp, marketing: clientMarketing, net: clientRev - clientExp - clientMarketing },
    ];
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMarketing, offres, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  const kpis = [
    { label: 'Profit Encaissé', value: data.encaisse_reel, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Attendu (En cours)', value: data.profit_attendu, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Marketing Spend', value: data.total_marketing_spend, icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Fixed Charges', value: data.total_charges, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Date Filtering */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord</h2>
          <p className="text-slate-500 font-medium italic">Analyse {dashboardDateStart || dashboardDateEnd ? 'filtrée par période' : 'globale de tous les temps'}.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-blue-200">
            <Calendar size={16} className="text-blue-500" />
            <input 
              type="date" 
              value={dashboardDateStart} 
              onChange={(e) => setDashboardDateRange(e.target.value, dashboardDateEnd)} 
              className="bg-transparent border-none text-xs font-black text-slate-800 outline-none w-28" 
            />
            <span className="text-[10px] font-black text-slate-300 uppercase">Au</span>
            <input 
              type="date" 
              value={dashboardDateEnd} 
              onChange={(e) => setDashboardDateRange(dashboardDateStart, e.target.value)} 
              className="bg-transparent border-none text-xs font-black text-slate-800 outline-none w-28" 
            />
          </div>
          {(dashboardDateStart || dashboardDateEnd) && (
            <button 
              onClick={() => setDashboardDateRange('', '')}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Réinitialiser le filtre"
            >
              <RotateCcw size={18} />
            </button>
          )}
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
        <div className="xl:col-span-2 space-y-8">
           {/* Section Pillars Profitability */}
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-slate-800 text-lg">Rentabilité par Catégorie</h4>
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Live ROI
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pillarStats.map(p => (
                  <div key={p.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 transition-all hover:border-blue-100 hover:bg-white">
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{p.name}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Rev:</span>
                        <span className="text-slate-700">{formatCurrency(p.rev)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">MKT:</span>
                        <span className="text-purple-600">{formatCurrency(p.marketing)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-slate-400">Net:</span>
                       <span className={`text-xs font-black ${p.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(p.net)}</span>
                    </div>
                  </div>
                ))}
             </div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-[350px]">
              <h4 className="font-bold text-slate-800 text-lg mb-6">Performance Nette du Pilier</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="net" radius={[6, 6, 0, 0]} barSize={40}>
                    {pillarStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
          <div className="relative z-10">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Solde Net Final (Période)</p>
            <h4 className="text-4xl font-black mb-4 tracking-tighter">{formatCurrency(data.profit_net_final)}</h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">Profit calculé sur la période sélectionnée après déduction de la production, des charges et du marketing spend.</p>
          </div>
          
          <div className="relative z-10 space-y-3 mt-12">
            <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-white/5">
               <span className="text-[10px] font-black uppercase text-slate-500">MKT ROI (Période)</span>
               <span className="text-xs font-black text-blue-400">
                {data.total_marketing_spend > 0 ? (( (data.encaisse_reel + data.profit_attendu) / data.total_marketing_spend)).toFixed(2) + 'x' : 'N/A'}
               </span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-2xl flex items-center justify-between border border-white/5">
               <span className="text-[10px] font-black uppercase text-slate-500">Ratio Marketing</span>
               <span className="text-xs font-black text-slate-300">
                {data.encaisse_reel + data.profit_attendu > 0 ? ((data.total_marketing_spend / (data.encaisse_reel + data.profit_attendu)) * 100).toFixed(1) : 0}%
               </span>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl flex items-center justify-between border border-emerald-500/20">
               <span className="text-[10px] font-black uppercase text-emerald-500">Taux de Marge</span>
               <span className="text-xs font-black text-emerald-400">
                {data.encaisse_reel + data.profit_attendu > 0 ? ((data.profit_net_final / (data.encaisse_reel + data.profit_attendu)) * 100).toFixed(1) : 0}%
               </span>
            </div>
          </div>
          <TrendingUp size={150} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
        </div>
      </div>

      {/* NEW SECTION: TIME SERIES ANALYTICS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-slate-400" size={24} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Analyses Temporelles</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* GROS PROFIT EVOLUTION */}
          <ChartCard title="Évolution Profit GROS" icon={TrendingUp} colorClass="text-emerald-600">
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorGros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="grosProfit" stroke="#10b981" fillOpacity={1} fill="url(#colorGros)" strokeWidth={3} />
            </AreaChart>
          </ChartCard>

          {/* RETAIL PROFIT EVOLUTION */}
          <ChartCard title="Évolution Profit SITEWEB" icon={TrendingUp} colorClass="text-blue-600">
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="retailProfit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRetail)" strokeWidth={3} />
            </AreaChart>
          </ChartCard>

          {/* OFFRES NET TREND */}
          <ChartCard title="Tendance Flux OFFRES" icon={TrendingUp} colorClass="text-orange-600">
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="offresNet" radius={[4, 4, 0, 0]} barSize={15}>
                {timeSeriesData.map((entry, index) => (
                  <Cell key={`cell-o-${index}`} fill={entry.offresNet >= 0 ? '#f97316' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>

          {/* MARKETING PERFORMANCE VS SPEND */}
          <ChartCard title="Marketing: Services vs Ads Spend" icon={Megaphone} colorClass="text-purple-600">
            <ComposedChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              <Area name="Profit Services" type="monotone" dataKey="marketingProfit" fill="#a855f7" stroke="#a855f7" fillOpacity={0.1} strokeWidth={2} />
              <Line name="Dépenses Marketing" type="monotone" dataKey="marketingSpend" stroke="#ef4444" strokeWidth={2} dot={{r: 3}} />
            </ComposedChart>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
