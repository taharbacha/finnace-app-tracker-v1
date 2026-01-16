
import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area, 
  Line, 
  ComposedChart,
  Legend,
  Cell
} from 'recharts';
import { 
  Clock, 
  Banknote, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  Megaphone, 
  RotateCcw, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  LayoutGrid, 
  Truck, 
  ShoppingBag, 
  Zap,
  Target,
  AlertCircle,
  Percent,
  Globe
} from 'lucide-react';
import { OffreType, MarketingSpendSource, MarketingStatus, GrosStatus, SitewebStatus, MerchStatus } from '../types.ts';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const KPICard = ({ title, value, subValues = [], icon: Icon, colorClass, statusCount }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md group">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${colorClass.bg}`}>
        <Icon className={colorClass.text} size={24} />
      </div>
      {statusCount !== undefined && (
        <span className="bg-slate-50 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100">
          {statusCount} OBJETS
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(value)}</h3>
    </div>
    {subValues.length > 0 && (
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
        {subValues.map((sv: any, i: number) => (
          <div key={i}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{sv.label}</p>
            <p className={`text-[11px] font-bold ${sv.color || 'text-slate-700'}`}>{formatCurrency(sv.val)}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ChartCard = ({ title, children, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[400px]">
    <div className="flex items-center gap-3 mb-8">
      <div className={`p-3 rounded-2xl ${colorClass.bg}`}>
        <Icon className={colorClass.text} size={18} />
      </div>
      <h4 className="font-black text-slate-800 text-xs tracking-widest uppercase">{title}</h4>
    </div>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {children}
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
    marketingSpends,
    dashboardDateStart,
    dashboardDateEnd,
    setDashboardDateRange
  } = useAppStore();

  const data = getDashboardData(dashboardDateStart, dashboardDateEnd);
  
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.split('T')[0];
    if (dashboardDateStart && cleanDate < dashboardDateStart) return false;
    if (dashboardDateEnd && cleanDate > dashboardDateEnd) return false;
    return true;
  };

  // --- REFINED GLOBAL KPI LOGIC ---
  const globalKPIs = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));

    const prodGrosA = cg.reduce((a, c) => a + Number(c.prix_achat_article || 0), 0);
    const prodGrosI = cg.reduce((a, c) => a + Number(c.prix_impression || 0), 0);
    const prodSW_A = cs.reduce((a, c) => a + Number(c.cout_article || 0), 0);
    const prodSW_I = cs.reduce((a, c) => a + Number(c.cout_impression || 0), 0);
    const prodMerch = cm.reduce((a, c) => a + Number(c.prix_achat || 0), 0);

    const totalProdA = prodGrosA + prodSW_A + prodMerch;
    const totalProdI = prodGrosI + prodSW_I;
    const totalProduction = totalProdA + totalProdI;

    const netGros = cg.reduce((a, c) => a + (c.status === GrosStatus.RETOUR ? -c.cost : (c.prix_vente - c.cost)), 0);
    const netSW = cs.reduce((a, c) => a + (c.status === SitewebStatus.RETOUR ? -(c.cout_article + c.cout_impression) : c.profit_net), 0);
    const netMerch = cm.reduce((a, c) => a + (c.status === MerchStatus.RETOUR ? -c.impact_perte : (c.prix_vente - c.prix_achat)), 0);
    const totalProfitNet = netGros + netSW + netMerch;

    const lneGros = cg.filter(i => i.status === GrosStatus.LIVREE_NON_ENCAISSE);
    const lneSW = cs.filter(i => i.status === SitewebStatus.LIVREE_NON_ENCAISSEE);
    const lneMerch = cm.filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE);
    const lneProd = lneGros.reduce((a,c) => a + c.cost, 0) + lneSW.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + lneMerch.reduce((a,c) => a + c.prix_achat, 0);
    const lneProfit = lneGros.reduce((a,c) => a + (c.prix_vente - c.cost), 0) + lneSW.reduce((a,c) => a + c.profit_net, 0) + lneMerch.reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);
    const lneCount = lneGros.length + lneSW.length + lneMerch.length;

    const elGros = cg.filter(i => i.status === GrosStatus.EN_LIVRAISON);
    const elSW = cs.filter(i => i.status === SitewebStatus.EN_LIVRAISON);
    const elMerch = cm.filter(i => i.status === MerchStatus.EN_LIVRAISON);
    const elProd = elGros.reduce((a,c) => a + c.cost, 0) + elSW.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + elMerch.reduce((a,c) => a + c.prix_achat, 0);
    const elExpProfit = elGros.reduce((a,c) => a + (c.prix_vente - c.cost), 0) + elSW.reduce((a,c) => a + c.profit_net, 0) + elMerch.reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);
    const elCount = elGros.length + elSW.length + elMerch.length;

    const retGros = cg.filter(i => i.status === GrosStatus.RETOUR);
    const retSW = cs.filter(i => i.status === SitewebStatus.RETOUR);
    const retMerch = cm.filter(i => i.status === MerchStatus.RETOUR);
    const retLoss = retGros.reduce((a,c) => a + c.cost, 0) + retSW.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + retMerch.reduce((a,c) => a + c.prix_achat, 0);
    const retCount = retGros.length + retSW.length + retMerch.length;
    const totalOrders = cg.length + cs.length + cm.length;
    const retRate = totalOrders > 0 ? (retCount / totalOrders) * 100 : 0;

    return {
      totalProduction, totalProdA, totalProdI,
      totalProfitNet,
      lneProd, lneProfit, lneCount,
      elProd, elExpProfit, elCount,
      retLoss, retCount, retRate,
      totalOrders
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, dashboardDateStart, dashboardDateEnd]);

  // --- PILLAR SPECIFIC ROI LOGIC ---
  const pillarPerformance = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));

    const getPillarMkt = (src: MarketingSpendSource) => 
      marketingSpends.filter(s => s.source === src && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    return [
      {
        name: 'Commandes GROS',
        icon: Truck,
        profit: cg.reduce((a, c) => a + (c.status === GrosStatus.RETOUR ? -c.cost : (c.prix_vente - c.cost)), 0),
        mkt: getPillarMkt(MarketingSpendSource.GROS),
        color: { text: 'text-blue-600', bg: 'bg-blue-50' },
        rev: cg.reduce((a, c) => a + (c.status === GrosStatus.RETOUR ? 0 : c.prix_vente), 0)
      },
      {
        name: 'Commandes VENDEURS',
        icon: Globe,
        profit: cs.reduce((a, c) => a + (c.status === SitewebStatus.RETOUR ? -(c.cout_article + c.cout_impression) : c.profit_net), 0),
        mkt: getPillarMkt(MarketingSpendSource.SITEWEB),
        color: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
        rev: cs.reduce((a, c) => a + (c.status === SitewebStatus.LIVREE ? c.prix_vente : 0), 0)
      },
      {
        name: 'Commande MERCH',
        icon: ShoppingBag,
        profit: cm.reduce((a, c) => a + (c.status === MerchStatus.RETOUR ? -c.impact_perte : (c.prix_vente - c.prix_achat)), 0),
        mkt: getPillarMkt(MarketingSpendSource.MERCH),
        color: { text: 'text-purple-600', bg: 'bg-purple-50' },
        rev: cm.reduce((a, c) => a + (c.status === MerchStatus.LIVREE ? c.prix_vente : 0), 0)
      }
    ].map(s => ({
      ...s,
      netFinal: s.profit - s.mkt,
      roi: s.mkt > 0 ? (s.rev / s.mkt).toFixed(2) + 'x' : 'N/A'
    }));
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  // --- TIME SERIES FOR CHARTS ---
  const chartData = useMemo(() => {
    const daily: Record<string, any> = {};
    const initDate = (d: string) => { if (!daily[d]) daily[d] = { date: d, gProfit: 0, gMkt: 0, vProfit: 0, vCom: 0, vProd: 0, vRet: 0, mProfit: 0, mMkt: 0, mProd: 0, mRet: 0 }; };

    getCalculatedGros().forEach(i => { if (filterByDate(i.date_created)) { initDate(i.date_created); daily[i.date_created].gProfit += (i.status === GrosStatus.RETOUR ? -i.cost : (i.prix_vente - i.cost)); } });
    marketingSpends.forEach(s => { if (filterByDate(s.date_start)) { initDate(s.date_start); if (s.source === MarketingSpendSource.GROS) daily[s.date_start].gMkt += Number(s.amount); if (s.source === MarketingSpendSource.MERCH) daily[s.date_start].mMkt += Number(s.amount); } });
    getCalculatedSiteweb().forEach(i => { if (filterByDate(i.date_created)) { initDate(i.date_created); if (i.status === SitewebStatus.RETOUR) daily[i.date_created].vRet += (i.cout_article + i.cout_impression); else { daily[i.date_created].vProfit += i.profit_net; daily[i.date_created].vCom += Number(i.vendeur_benefice || 0); daily[i.date_created].vProd += (i.cout_article + i.cout_impression); } } });
    getCalculatedMerch().forEach(i => { const d = i.created_at.split('T')[0]; if (filterByDate(d)) { initDate(d); if (i.status === MerchStatus.RETOUR) daily[d].mRet += i.impact_perte; else { daily[d].mProfit += (i.prix_vente - i.prix_achat); daily[d].mProd += i.prix_achat; } } });

    return Object.values(daily).sort((a,b) => a.date.localeCompare(b.date));
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Executive Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 font-medium italic">Analyse consolidée des piliers Wholesale, Retail et Merch.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 p-2 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-blue-200">
            <Calendar size={14} className="text-blue-500" />
            <input 
              type="date" 
              value={dashboardDateStart} 
              onChange={(e) => setDashboardDateRange(e.target.value, dashboardDateEnd)} 
              className="bg-transparent border-none text-[10px] font-black text-slate-800 outline-none w-28" 
            />
            <span className="text-[10px] font-black text-slate-300 uppercase px-1">AU</span>
            <input 
              type="date" 
              value={dashboardDateEnd} 
              onChange={(e) => setDashboardDateRange(dashboardDateStart, e.target.value)} 
              className="bg-transparent border-none text-[10px] font-black text-slate-800 outline-none w-28" 
            />
          </div>
          {(dashboardDateStart || dashboardDateEnd) && (
            <button 
              onClick={() => setDashboardDateRange('', '')}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Strategic CEO Card */}
      <div className="bg-slate-900 text-white p-14 rounded-[4.5rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
             <Target className="text-blue-400" size={24} />
             <p className="text-blue-400 text-xs font-black uppercase tracking-[0.4em]">Solde Net Final Global</p>
          </div>
          <h4 className="text-8xl font-black tracking-tighter tabular-nums">{formatCurrency(data.profit_net_final)}</h4>
          <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">
            Position de liquidité après charges fixes ({formatCurrency(data.total_charges)}) et investissement marketing.
          </p>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-6 w-full lg:w-auto min-w-[420px]">
          <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 space-y-3 backdrop-blur-md">
             <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Global ROI</span>
             <p className="text-5xl font-black text-blue-400">
              {data.total_marketing_spend > 0 ? ((globalKPIs.totalProfitNet / data.total_marketing_spend)).toFixed(2) + 'x' : 'N/A'}
             </p>
             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
               <Zap size={10} /> PERFORMANCE INDEX
             </div>
          </div>
          <div className="p-10 bg-emerald-500/10 rounded-[3rem] border border-emerald-500/20 space-y-3 backdrop-blur-md">
             <span className="text-[11px] font-black uppercase text-emerald-500 tracking-[0.2em]">Marge Nette</span>
             <p className="text-5xl font-black text-emerald-400">
              {globalKPIs.totalProfitNet > 0 ? ((data.profit_net_final / globalKPIs.totalProfitNet) * 100).toFixed(1) : 0}%
             </p>
             <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
               <TrendingUp size={10} /> NET PROFITABILITY
             </div>
          </div>
        </div>
        <TrendingUp size={450} className="absolute -bottom-24 -right-24 text-white/[0.03] rotate-12 pointer-events-none" />
      </div>

      {/* Primary KPI Grid - Organized 3x2 on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        <KPICard 
          title="Production (Total)" 
          value={globalKPIs.totalProduction} 
          icon={Zap} 
          colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}}
          subValues={[
            {label: 'Article (A)', val: globalKPIs.totalProdA},
            {label: 'Impression (I)', val: globalKPIs.totalProdI, color: 'text-blue-400'}
          ]}
        />
        <KPICard 
          title="Profit Net (Global)" 
          value={globalKPIs.totalProfitNet} 
          icon={TrendingUp} 
          colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50'}}
        />
        <KPICard 
          title="Marketing Spend" 
          value={data.total_marketing_spend} 
          icon={Megaphone} 
          colorClass={{text: 'text-orange-600', bg: 'bg-orange-50'}}
        />
        <KPICard 
          title="Livrée Non Encaissée" 
          value={globalKPIs.lneProfit} 
          statusCount={globalKPIs.lneCount}
          icon={Clock} 
          colorClass={{text: 'text-purple-600', bg: 'bg-purple-50'}}
          subValues={[
            {label: 'Production liée', val: globalKPIs.lneProd}
          ]}
        />
        <KPICard 
          title="En Livraison" 
          value={globalKPIs.elExpProfit} 
          statusCount={globalKPIs.elCount}
          icon={Truck} 
          colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}}
          subValues={[
            {label: 'Production El', val: globalKPIs.elProd}
          ]}
        />
        <KPICard 
          title="Retours" 
          value={globalKPIs.retLoss} 
          statusCount={globalKPIs.retCount}
          icon={RotateCcw} 
          colorClass={{text: 'text-red-600', bg: 'bg-red-50'}}
          subValues={[
            {label: 'Taux retour', val: globalKPIs.retRate.toFixed(1) + '%', color: 'text-red-400'}
          ]}
        />
      </div>

      {/* Pillar Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <LayoutGrid className="text-slate-400" size={20} />
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Rentabilité par Pilier (Net - Marketing)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillarPerformance.map(p => (
            <div key={p.name} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl group">
              <div className="flex justify-between items-start mb-10">
                <div className={`p-5 rounded-[1.5rem] ${p.color.bg}`}>
                  <p.icon className={p.color.text} size={32} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROI PILIER</p>
                  <p className={`text-base font-black ${p.color.text}`}>{p.roi}</p>
                </div>
              </div>
              
              <div className="space-y-1 mb-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Final Pilier</p>
                <h4 className={`text-3xl font-black tracking-tighter ${p.netFinal >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                  {formatCurrency(p.netFinal)}
                </h4>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Profit Brut</span>
                  <span className="text-sm font-black text-slate-700">{formatCurrency(p.profit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Spend Marketing</span>
                  <span className="text-sm font-black text-red-500">-{formatCurrency(p.mkt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts - Expanded sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <ChartCard title="Analytics GROS (Profit vs Mkt)" icon={Truck} colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
            <Area type="monotone" dataKey="gProfit" name="Profit Brut" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} />
            <Line type="monotone" dataKey="gMkt" name="Mkt Spend" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Legend wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
          </ComposedChart>
        </ChartCard>

        <ChartCard title="Analytics VENDEURS (Performance)" icon={Globe} colorClass={{text: 'text-indigo-600', bg: 'bg-indigo-50'}}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
            <Bar dataKey="vProfit" name="Profit Net" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vCom" name="Com. Vend." fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vProd" name="Production" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vRet" name="Retours" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Analytics MERCH (Ops Breakdown)" icon={ShoppingBag} colorClass={{text: 'text-purple-600', bg: 'bg-purple-50'}}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
            <Area type="monotone" dataKey="mProfit" name="Profit" stroke="#a855f7" fill="#a855f7" fillOpacity={0.05} />
            <Line type="monotone" dataKey="mProd" name="Production" stroke="#94a3b8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mRet" name="Pertes Retour" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Legend wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px'}} />
          </ComposedChart>
        </ChartCard>
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100">
          <div className="flex items-center gap-6 p-8 bg-blue-50/50 rounded-3xl border border-blue-100">
             <Zap className="text-blue-500 shrink-0" size={32} />
             <div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Efficacité Publicitaire</p>
                <p className="text-base font-bold text-slate-700">
                  Total {data.total_marketing_spend > 0 ? (globalKPIs.totalProfitNet / data.total_marketing_spend).toFixed(1) + 'x ROI global sur investissement.' : 'Aucun spend marketing enregistré.'}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-6 p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100">
             <ArrowUpRight className="text-emerald-500 shrink-0" size={32} />
             <div>
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Santé du Business</p>
                <p className="text-base font-bold text-slate-700">
                  {globalKPIs.totalProfitNet > 0 ? 'Flux de trésorerie net positif.' : 'Surveillance des dépenses nécessaire.'}
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
