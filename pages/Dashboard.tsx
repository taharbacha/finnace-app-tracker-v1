
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
import { Clock, Banknote, Calendar, Wallet, TrendingUp, Megaphone, RotateCcw, BarChart3, ArrowUpRight, ArrowDownRight, LayoutGrid, Truck } from 'lucide-react';
import { OffreType, MarketingSpendSource, MarketingStatus, GrosStatus, SitewebStatus, MerchStatus } from '../types.ts';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  icon: any;
  colorClass: string;
  height?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, icon: Icon, colorClass, height = 280 }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-md" style={{ height }}>
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-2 rounded-xl ${colorClass.replace('text', 'bg').replace('600', '50')}`}>
        <Icon className={colorClass} size={16} />
      </div>
      <h4 className="font-bold text-slate-700 text-[10px] tracking-widest uppercase">{title}</h4>
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
    getCalculatedMerch,
    getCalculatedMarketing, 
    offres, 
    marketingSpends,
    dashboardDateStart,
    dashboardDateEnd,
    setDashboardDateRange
  } = useAppStore();

  const data = getDashboardData(dashboardDateStart, dashboardDateEnd);
  
  const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

  const filterByDate = (dateStr: string) => {
    if (dashboardDateStart && dateStr < dashboardDateStart) return false;
    if (dashboardDateEnd && dateStr > dashboardDateEnd) return false;
    return true;
  };

  const timeSeriesData = useMemo(() => {
    const dailyMap: Record<string, { 
      date: string;
      grosProfit: number;
      grosReturns: number;
      grosAds: number;
      retailProfit: number;
      merchProfit: number;
      merchReturns: number;
      merchAds: number;
      offresNet: number;
      offresAds: number;
      marketingProfit: number;
      marketingSpend: number;
    }> = {};

    const initDate = (d: string) => {
      if (!dailyMap[d]) {
        dailyMap[d] = { 
          date: d, 
          grosProfit: 0, grosReturns: 0, grosAds: 0,
          retailProfit: 0, 
          merchProfit: 0, merchReturns: 0, merchAds: 0,
          offresNet: 0, offresAds: 0,
          marketingProfit: 0, 
          marketingSpend: 0 
        };
      }
    };

    getCalculatedGros().forEach(item => {
      if (!filterByDate(item.date_created)) return;
      const d = item.date_created;
      initDate(d);
      if (item.status === GrosStatus.RETOUR) {
        dailyMap[d].grosReturns += item.cost;
        dailyMap[d].grosProfit -= item.cost;
      } else {
        dailyMap[d].grosProfit += (item.prix_vente - item.cost);
      }
    });

    getCalculatedSiteweb().forEach(item => {
      if (!filterByDate(item.date_created)) return;
      if (item.status === SitewebStatus.EN_LIVRAISON) return;
      const d = item.date_created;
      initDate(d);
      dailyMap[d].retailProfit += item.profit_net;
    });

    getCalculatedMerch().forEach(item => {
      if (!filterByDate(item.created_at.split('T')[0])) return;
      const d = item.created_at.split('T')[0];
      initDate(d);
      if (item.status === MerchStatus.RETOUR) {
        dailyMap[d].merchReturns += item.impact_perte;
      }
      if (item.status !== MerchStatus.EN_LIVRAISON) {
        dailyMap[d].merchProfit += (item.impact_encaisse + item.impact_attendu - item.impact_perte);
      }
    });

    offres.forEach(item => {
      if (!filterByDate(item.date)) return;
      const d = item.date;
      initDate(d);
      const amt = Number(item.montant);
      dailyMap[d].offresNet += item.type === OffreType.REVENUE ? amt : -amt;
    });

    getCalculatedMarketing().forEach(item => {
      if (!filterByDate(item.date)) return;
      const d = item.date;
      initDate(d);
      dailyMap[d].marketingProfit += item.net_profit;
    });

    marketingSpends.forEach(item => {
      if (!filterByDate(item.date_start)) return;
      const d = item.date_start;
      initDate(d);
      const amt = Number(item.amount);
      dailyMap[d].marketingSpend += amt;
      
      if (item.source === MarketingSpendSource.GROS) dailyMap[d].grosAds += amt;
      if (item.source === MarketingSpendSource.MERCH) dailyMap[d].merchAds += amt;
      if (item.source === MarketingSpendSource.OFFRES) dailyMap[d].offresAds += amt;
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedMarketing, offres, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  const pillarStats = useMemo(() => {
    const grosFiltered = getCalculatedGros().filter(item => filterByDate(item.date_created));
    const grosRev = grosFiltered.filter(i => i.status !== GrosStatus.RETOUR).reduce((a, c) => a + c.prix_vente, 0);
    const grosProd = grosFiltered.reduce((a, c) => a + c.cost, 0);
    const grosMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.GROS && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    const swFiltered = getCalculatedSiteweb().filter(item => filterByDate(item.date_created));
    const swRev = swFiltered.filter(i => i.status === SitewebStatus.LIVREE).reduce((a, c) => a + Number(c.prix_vente), 0);
    const swProd = swFiltered.filter(i => i.status === SitewebStatus.LIVREE || i.status === SitewebStatus.LIVREE_NON_ENCAISSEE).reduce((a, c) => a + (Number(c.cout_article) + Number(c.cout_impression) + Number(c.vendeur_benefice)), 0);
    const swMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.SITEWEB && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    const merchFiltered = getCalculatedMerch().filter(item => filterByDate(item.created_at.split('T')[0]));
    const merchRev = merchFiltered.filter(i => i.status === MerchStatus.LIVREE).reduce((a, c) => a + Number(c.prix_vente), 0);
    const merchProd = merchFiltered.filter(i => i.status !== MerchStatus.EN_LIVRAISON).reduce((a, c) => a + Number(c.prix_achat), 0);
    const merchMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.MERCH && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    const offFiltered = offres.filter(item => filterByDate(item.date));
    const offRev = offFiltered.filter(o => o.type === OffreType.REVENUE).reduce((a, c) => a + Number(c.montant), 0);
    const offExp = offFiltered.filter(o => o.type === OffreType.EXPENSE).reduce((a, c) => a + Number(c.montant), 0);
    const offMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.OFFRES && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    const clientFiltered = getCalculatedMarketing().filter(item => filterByDate(item.date));
    const clientRev = clientFiltered.filter(m => m.status === MarketingStatus.TERMINE).reduce((a, c) => a + Number(c.revenue), 0);
    const clientExp = clientFiltered.filter(m => m.status === MarketingStatus.TERMINE).reduce((a, c) => a + Number(c.client_charges), 0);
    const clientMarketing = marketingSpends.filter(s => s.source === MarketingSpendSource.MARKETING_CLIENT && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    return [
      { name: 'Gros', rev: grosRev, exp: grosProd, marketing: grosMarketing, net: grosRev - grosProd - grosMarketing, color: 'text-blue-600', bg: 'bg-blue-50' },
      { name: 'Vendeurs', rev: swRev, exp: swProd, marketing: swMarketing, net: swRev - swProd - swMarketing, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { name: 'Merch', rev: merchRev, exp: merchProd, marketing: merchMarketing, net: merchRev - merchProd - merchMarketing, color: 'text-purple-600', bg: 'bg-purple-50' },
      { name: 'Plans', rev: offRev, exp: offExp, marketing: offMarketing, net: offRev - offExp - offMarketing, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { name: 'Services', rev: clientRev, exp: clientExp, marketing: clientMarketing, net: clientRev - clientExp - clientMarketing, color: 'text-slate-600', bg: 'bg-slate-50' },
    ];
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedMarketing, offres, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  const kpis = [
    { label: 'Profit Encaissé', value: data.encaisse_reel, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Attendu (En cours)', value: data.profit_attendu, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Marketing Spend', value: data.total_marketing_spend, icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Fixed Charges', value: data.total_charges, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tableau de Bord Operations</h2>
          <p className="text-slate-500 font-medium italic">Consolidation financière en temps réel.</p>
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
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Section */}
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

      {/* Rentabilité par Pilier Refined UI */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <LayoutGrid className="text-slate-400" size={20} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Rentabilité par Pilier</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {pillarStats.map(p => (
            <div key={p.name} className={`relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 group transition-all hover:shadow-xl hover:-translate-y-1`}>
              <div className="flex justify-between items-start mb-8">
                <div className={`px-3 py-1 rounded-full ${p.bg} ${p.color} text-[9px] font-black uppercase tracking-widest`}>
                  {p.name}
                </div>
                {p.net >= 0 ? <ArrowUpRight size={16} className="text-emerald-500" /> : <ArrowDownRight size={16} className="text-red-500" />}
              </div>
              
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Profit Net</p>
                <h4 className={`text-xl font-black tracking-tighter ${p.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(p.net)}
                </h4>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Revenue</span>
                  <span className="text-slate-700">{formatCurrency(p.rev)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-tighter">Marketing</span>
                  <span className="text-purple-600">-{formatCurrency(p.marketing)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Solde Card */}
      <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="relative z-10 space-y-4 max-w-xl text-center lg:text-left">
          <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em]">Solde Net Final Global</p>
          <h4 className="text-6xl font-black tracking-tighter">{formatCurrency(data.profit_net_final)}</h4>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Consolidation totale incluant tous les piliers business, après déduction des charges fixes et du marketing spend.
          </p>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-4 w-full lg:w-auto min-w-[320px]">
          <div className="p-6 bg-slate-800/50 rounded-3xl border border-white/5 space-y-2">
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global ROI</span>
             <p className="text-3xl font-black text-blue-400">
              {data.total_marketing_spend > 0 ? (( (data.encaisse_reel + data.profit_attendu) / data.total_marketing_spend)).toFixed(2) + 'x' : 'N/A'}
             </p>
          </div>
          <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 space-y-2">
             <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Marge Nette</span>
             <p className="text-3xl font-black text-emerald-400">
              {data.encaisse_reel + data.profit_attendu > 0 ? ((data.profit_net_final / (data.encaisse_reel + data.profit_attendu)) * 100).toFixed(1) : 0}%
             </p>
          </div>
        </div>
        <TrendingUp size={300} className="absolute -bottom-20 -right-20 text-white/[0.02] rotate-12 pointer-events-none" />
      </div>

      {/* Temporal Pillar Performance Analysis */}
      <div className="space-y-12 pt-8 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-slate-400" size={24} />
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Performances Temporelles par Pilier</h3>
        </div>

        {/* Pillar: Commandes GROS */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl w-fit">
            <Truck className="text-blue-600" size={16} />
            <h4 className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Commandes GROS</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ChartCard title="Profit Gros" icon={TrendingUp} colorClass="text-emerald-600">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="grosProfit" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ChartCard>
            <ChartCard title="Pertes Gros (Retours)" icon={RotateCcw} colorClass="text-red-600">
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="grosReturns" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Ads Gros" icon={Megaphone} colorClass="text-blue-600">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="grosAds" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ChartCard>
          </div>
        </section>

        {/* Pillar: Commande MERCH */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-2xl w-fit">
            <LayoutGrid className="text-purple-600" size={16} />
            <h4 className="text-[11px] font-black text-purple-700 uppercase tracking-widest">Commande MERCH</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ChartCard title="Profit Merch" icon={TrendingUp} colorClass="text-emerald-600">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="merchProfit" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ChartCard>
            <ChartCard title="Pertes Merch" icon={RotateCcw} colorClass="text-red-600">
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="merchReturns" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Ads Merch" icon={Megaphone} colorClass="text-purple-600">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="merchAds" stroke="#a855f7" fill="#a855f7" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ChartCard>
          </div>
        </section>

        {/* Pillar: OFFRES / PLANS */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl w-fit">
            <ArrowUpRight className="text-emerald-600" size={16} />
            <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">OFFRES / PLANS</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Profit Plans" icon={TrendingUp} colorClass="text-emerald-600">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="offresNet" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ChartCard>
            <ChartCard title="Ads Offres" icon={Megaphone} colorClass="text-emerald-600">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="offresAds" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ChartCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
