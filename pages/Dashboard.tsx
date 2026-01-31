
import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area, 
  Line, 
  ComposedChart,
  Legend,
  Bar
} from 'recharts';
import { 
  Clock, 
  Banknote, 
  Calendar, 
  TrendingUp, 
  RotateCcw, 
  BarChart3, 
  Target,
  Zap,
  Activity,
  Truck,
  Globe,
  ShoppingBag,
  Check,
  FileText
} from 'lucide-react';
import { OffreType, MarketingSpendSource, GrosStatus, SitewebStatus, MerchStatus } from '../types.ts';
import ExportDashboardPDF from '../components/ExportDashboardPDF.tsx';

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
            <p className={`text-[11px] font-bold ${sv.color || 'text-slate-700'}`}>{typeof sv.val === 'number' ? formatCurrency(sv.val) : sv.val}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ChartCard = ({ title, children, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[500px]">
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

  const [tempStart, setTempStart] = useState(dashboardDateStart);
  const [tempEnd, setTempEnd] = useState(dashboardDateEnd);

  // Sync temp dates if global state changes externally
  useEffect(() => {
    setTempStart(dashboardDateStart);
    setTempEnd(dashboardDateEnd);
  }, [dashboardDateStart, dashboardDateEnd]);

  const data = getDashboardData(dashboardDateStart, dashboardDateEnd);
  
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.split('T')[0];
    if (dashboardDateStart && cleanDate < dashboardDateStart) return false;
    if (dashboardDateEnd && cleanDate > dashboardDateEnd) return false;
    return true;
  };

  const handleApplyFilter = () => {
    setDashboardDateRange(tempStart, tempEnd);
  };

  const handleResetFilter = () => {
    setTempStart('');
    setTempEnd('');
    setDashboardDateRange('', '');
  };

  // --- GLOBAL KPIS (Top of page) ---
  const globalKPIs = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));

    const totalProd = cg.reduce((a,c) => a + c.cost, 0) + 
                    cs.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + 
                    cm.reduce((a,c) => a + c.prix_achat, 0);

    const totalProfitNet = cg.reduce((a, c) => a + (c.status === GrosStatus.RETOUR ? -c.cost : (c.prix_vente - c.cost)), 0) +
                           cs.reduce((a, c) => a + (c.status === SitewebStatus.RETOUR ? -(c.cout_article + c.cout_impression) : c.profit_net), 0) +
                           cm.reduce((a, c) => a + (c.status === MerchStatus.RETOUR ? -c.impact_perte : (c.prix_vente - c.prix_achat)), 0);

    const lneProfit = cg.filter(i => i.status === GrosStatus.LIVREE_NON_ENCAISSE).reduce((a,c) => a + (c.prix_vente - c.cost), 0) + 
                     cs.filter(i => i.status === SitewebStatus.LIVREE_NON_ENCAISSEE).reduce((a,c) => a + c.profit_net, 0) + 
                     cm.filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE).reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);

    const retLoss = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0) + 
                   cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + 
                   cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);

    return { totalProd, totalProfitNet, lneProfit, retLoss };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, dashboardDateStart, dashboardDateEnd]);

  // --- PILLAR REDESIGN DATA ---
  const pillars = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));

    const getPillarMkt = (src: MarketingSpendSource) => 
      marketingSpends.filter(s => s.source === src && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    const grosMkt = getPillarMkt(MarketingSpendSource.GROS);
    const grosProfitReal = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status))
                           .reduce((a, c) => a + (c.prix_vente - c.cost), 0);
    const grosProfitPot = cg.filter(i => [GrosStatus.EN_LIVRAISON, GrosStatus.EN_PRODUCTION].includes(i.status))
                          .reduce((a, c) => a + (c.prix_vente - c.cost), 0);

    const vendMkt = getPillarMkt(MarketingSpendSource.SITEWEB);
    const vendProfitReal = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                           .reduce((a, c) => a + c.profit_net, 0);
    // Fix: Changed 'item.vendeur_benefice' to 'c.vendeur_benefice' to use the correct callback argument.
    const vendBenefice = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                         .reduce((a, c) => a + Number(c.vendeur_benefice || 0), 0);

    const merchMkt = getPillarMkt(MarketingSpendSource.MERCH);
    const merchProfitReal = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                            .reduce((a, c) => a + (c.prix_vente - c.prix_achat), 0);
    const merchProdValue = cm.reduce((a, c) => a + c.prix_achat, 0);
    const merchProfitPot = cm.filter(i => i.status === MerchStatus.EN_LIVRAISON)
                           .reduce((a, c) => a + (c.prix_vente - c.prix_achat), 0);

    const daily: Record<string, any> = {};
    const initDate = (d: string) => { 
      if (!daily[d]) daily[d] = { 
        date: d, 
        gProfit: 0, gMkt: 0, gPot: 0,
        vProfit: 0, vMkt: 0, vCom: 0, vProd: 0,
        mProfit: 0, mMkt: 0, mProd: 0, mRet: 0
      }; 
    };

    cg.forEach(i => {
      initDate(i.date_created);
      if ([GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)) daily[i.date_created].gProfit += (i.prix_vente - i.cost);
      if ([GrosStatus.EN_LIVRAISON, GrosStatus.EN_PRODUCTION].includes(i.status)) daily[i.date_created].gPot += (i.prix_vente - i.cost);
    });

    cs.forEach(i => {
      initDate(i.date_created);
      if ([SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)) {
        daily[i.date_created].vProfit += i.profit_net;
        daily[i.date_created].vCom += Number(i.vendeur_benefice || 0);
        daily[i.date_created].vProd += (i.cout_article + i.cout_impression);
      }
    });

    cm.forEach(i => {
      const d = i.created_at.split('T')[0];
      initDate(d);
      if ([MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)) daily[d].mProfit += (i.prix_vente - i.prix_achat);
      daily[d].mProd += i.prix_achat;
      if (i.status === MerchStatus.RETOUR) daily[d].mRet += i.prix_achat;
    });

    marketingSpends.forEach(s => {
      if (filterByDate(s.date_start)) {
        initDate(s.date_start);
        if (s.source === MarketingSpendSource.GROS) daily[s.date_start].gMkt += Number(s.amount);
        if (s.source === MarketingSpendSource.SITEWEB) daily[s.date_start].vMkt += Number(s.amount);
        if (s.source === MarketingSpendSource.MERCH) daily[s.date_start].mMkt += Number(s.amount);
      }
    });

    const timeline = Object.values(daily).sort((a,b) => a.date.localeCompare(b.date));

    // Count distributions for PDF
    const counts = {
      gros: { 
        prod: cg.filter(i => i.status === GrosStatus.EN_PRODUCTION).length,
        liv: cg.filter(i => i.status === GrosStatus.EN_LIVRAISON).length,
        ret: cg.filter(i => i.status === GrosStatus.RETOUR).length
      },
      vendeurs: {
        liv: cs.filter(i => i.status === SitewebStatus.EN_LIVRAISON).length,
        ok: cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).length,
        ret: cs.filter(i => i.status === SitewebStatus.RETOUR).length
      },
      merch: {
        liv: cm.filter(i => i.status === MerchStatus.EN_LIVRAISON).length,
        ok: cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).length,
        ret: cm.filter(i => i.status === MerchStatus.RETOUR).length
      }
    };

    return {
      gros: { profitReal: grosProfitReal, profitPot: grosProfitPot, mkt: grosMkt, timeline },
      vendeurs: { profitReal: vendProfitReal, mkt: vendMkt, benefice: vendBenefice, timeline },
      merch: { profitReal: merchProfitReal, mkt: merchMkt, prod: merchProdValue, profitPot: merchProfitPot, timeline },
      counts
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  const hasChanges = tempStart !== dashboardDateStart || tempEnd !== dashboardDateEnd;

  return (
    <div className="space-y-16 animate-in fade-in duration-500 pb-32">
      {/* Executive Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Financial Operating Terminal</h2>
          <p className="text-slate-500 font-medium italic">Analyse de rentabilité isolée par pilier opérationnel.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 p-2 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-blue-200">
            <Calendar size={14} className="text-blue-500" />
            <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-800 outline-none w-28" />
            <span className="text-[10px] font-black text-slate-300 uppercase px-1">AU</span>
            <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-800 outline-none w-28" />
          </div>
          
          <button 
            onClick={handleApplyFilter}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${hasChanges ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
          >
            <Check size={14} /> Appliquer
          </button>

          {(tempStart || tempEnd || dashboardDateStart || dashboardDateEnd) && (
            <button 
              onClick={handleResetFilter} 
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Réinitialiser les filtres"
            >
              <RotateCcw size={16} />
            </button>
          )}

          <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />

          {/* PDF EXPORT INTEGRATION */}
          <ExportDashboardPDF 
            data={data} 
            globalKPIs={globalKPIs} 
            pillars={pillars} 
            dateRange={{ start: dashboardDateStart, end: dashboardDateEnd }}
            counts={pillars.counts}
          />
        </div>
      </div>

      {/* Main Net Standing Card */}
      <div className="bg-slate-900 text-white p-14 rounded-[4.5rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
             <Target className="text-blue-400" size={24} />
             <p className="text-blue-400 text-xs font-black uppercase tracking-[0.4em]">Trésorerie Nette Finale</p>
          </div>
          <h4 className="text-8xl font-black tracking-tighter tabular-nums">{formatCurrency(data.profit_net_final)}</h4>
          <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">
            Solde consolidé après déduction des charges fixes et investissement marketing global.
          </p>
        </div>
        <TrendingUp size={450} className="absolute -bottom-24 -right-24 text-white/[0.03] rotate-12 pointer-events-none" />
      </div>

      {/* Global Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        <KPICard title="Production Consolidée" value={globalKPIs.totalProd} icon={Zap} colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}} />
        <KPICard title="Profit Brut Global" value={globalKPIs.totalProfitNet} icon={TrendingUp} colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50'}} />
        <KPICard title="Livrée Non Encaissée" value={globalKPIs.lneProfit} icon={Clock} colorClass={{text: 'text-purple-600', bg: 'bg-purple-50'}} />
        <KPICard title="Pertes de Retours" value={globalKPIs.retLoss} icon={RotateCcw} colorClass={{text: 'text-red-600', bg: 'bg-red-50'}} />
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* --- PILLAR 1: COMMANDES GROS --- */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20">
            <Truck size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Pilier 1: Commandes GROS</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Wholesale & Logistics Accounting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <KPICard 
              title="Profit Réalisé (LNE + LE)" 
              value={pillars.gros.profitReal} 
              icon={Banknote} 
              colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50'}}
              subValues={[
                { label: 'Marketing Spend', val: pillars.gros.mkt, color: 'text-red-500' },
                { label: 'Net Final Pilier', val: pillars.gros.profitReal - pillars.gros.mkt, color: 'text-blue-600' }
              ]}
            />
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Potentiel (Non comptabilisé)</p>
               <h3 className="text-2xl font-black text-slate-400 tabular-nums italic">{formatCurrency(pillars.gros.profitPot)}</h3>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-300">
                  <Activity size={12} /> STATUS: PRODUCTION / EN LIVRAISON
               </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <ChartCard title="Performance Chronologique Wholesale" icon={TrendingUp} colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}}>
              <ComposedChart data={pillars.gros.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="gProfit" name="Profit Réalisé" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={3} />
                <Line type="monotone" dataKey="gMkt" name="Investissement Marketing" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gPot" name="Profit Potentiel (En cours)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '30px'}} />
              </ComposedChart>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* --- PILLAR 2: COMMANDES VENDEURS --- */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
            <Globe size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Pilier 2: Commandes VENDEURS</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retail & Multi-vendor Commissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <KPICard 
              title="Profit Net (LNE + L)" 
              value={pillars.vendeurs.profitReal} 
              icon={TrendingUp} 
              colorClass={{text: 'text-indigo-600', bg: 'bg-indigo-50'}}
              subValues={[
                { label: 'Commission Vendeurs', val: pillars.vendeurs.benefice, color: 'text-purple-500' },
                { label: 'Net Final Pilier', val: pillars.vendeurs.profitReal - pillars.vendeurs.mkt, color: 'text-blue-600' }
              ]}
            />
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dépense Pub Pilier</p>
               <h3 className="text-2xl font-black text-red-500">{formatCurrency(pillars.vendeurs.mkt)}</h3>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <ChartCard title="Structure des Revenus Retail" icon={BarChart3} colorClass={{text: 'text-indigo-600', bg: 'bg-indigo-50'}}>
              <ComposedChart data={pillars.vendeurs.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="vProfit" name="Profit Net Entreprise" stroke="#6366f1" fill="#6366f1" fillOpacity={0.05} strokeWidth={3} />
                <Line type="monotone" dataKey="vCom" name="Bénéfice Vendeurs" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vProd" name="Coûts Production" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Bar dataKey="vMkt" name="Ads Spend" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} />
                <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '30px'}} />
              </ComposedChart>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* --- PILLAR 3: COMMANDES MERCH --- */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-600/20">
            <ShoppingBag size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Pilier 3: Commandes MERCH</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Direct-to-Consumer Merchandise</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <KPICard 
              title="Profit Réalisé" 
              value={pillars.merch.profitReal} 
              icon={Activity} 
              colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50'}}
              subValues={[
                { label: 'Invest. Production', val: pillars.merch.prod, color: 'text-slate-500' },
                { label: 'Profit Potentiel', val: pillars.merch.profitPot, color: 'text-blue-400' }
              ]}
            />
            <div className="bg-emerald-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-center">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Solde Net Merch</p>
               <h3 className="text-3xl font-black tabular-nums">{formatCurrency(pillars.merch.profitReal - pillars.merch.mkt)}</h3>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <ChartCard title="Analyse de Flux Merch" icon={Zap} colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50'}}>
              <ComposedChart data={pillars.merch.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="mProfit" name="Profit Opérationnel" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={3} />
                <Line type="monotone" dataKey="mProd" name="Investissement Production" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mRet" name="Pertes de Retours" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mMkt" name="Marketing Spend" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '30px'}} />
              </ComposedChart>
            </ChartCard>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
