
import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
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
  Megaphone, 
  RotateCcw, 
  BarChart3, 
  ArrowUpRight, 
  Truck, 
  ShoppingBag, 
  Zap,
  Target,
  Globe,
  Activity,
  Sparkles,
  Box,
  BadgeAlert,
  Coins,
  Store
} from 'lucide-react';
import { OffreType, MarketingSpendSource, MarketingStatus, GrosStatus, SitewebStatus, MerchStatus, ClientComptoirStatus } from '../types.ts';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const KPICard = ({ title, value, subValues = [], icon: Icon, colorClass, statusCount, isMuted }: any) => (
  <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md group ${isMuted ? 'opacity-80 border-dashed' : ''}`}>
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
      <h3 className={`text-3xl font-black tracking-tighter tabular-nums ${colorClass.valueText || 'text-slate-900'}`}>{typeof value === 'number' ? formatCurrency(value) : value}</h3>
    </div>
    {subValues.length > 0 && (
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
        {subValues.map((sv: any, i: number) => (sv && (
          <div key={i} className={sv.fullWidth ? 'col-span-2' : ''}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{sv.label}</p>
            <p className={`text-[11px] font-bold ${sv.color || 'text-slate-700'}`}>{typeof sv.val === 'number' ? formatCurrency(sv.val) : sv.val}</p>
          </div>
        )))}
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
    getCalculatedClientComptoir,
    offres,
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

  // --- REFINED PILLAR FINAL PROFIT ANALYSIS ---
  const pillarProfitData = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const cc = getCalculatedClientComptoir().filter(i => filterByDate(i.date));
    const mkt = marketingSpends.filter(s => filterByDate(s.date_start));

    const getMktBySource = (src: MarketingSpendSource) => 
      mkt.filter(s => s.source === src).reduce((a, c) => a + Number(c.amount), 0);

    // Wholesale (Gros)
    const grosMkt = getMktBySource(MarketingSpendSource.GROS);
    const grosSuccess = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status));
    const grosVentes = grosSuccess.reduce((a,c) => a + c.prix_vente, 0);
    const grosProd = grosSuccess.reduce((a,c) => a + c.cost, 0);
    const grosRetours = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0);
    const grosFinalProfit = grosVentes - grosProd - grosRetours - grosMkt;

    // Retail (Vendeurs)
    const vendMkt = getMktBySource(MarketingSpendSource.SITEWEB);
    const vendSuccess = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status));
    const vendVentes = vendSuccess.reduce((a,c) => a + c.prix_vente, 0);
    const vendProd = vendSuccess.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0);
    const vendRetours = cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0);
    const vendComms = vendSuccess.reduce((a,c) => a + Number(c.vendeur_benefice || 0), 0);
    const vendFinalProfit = vendVentes - vendProd - vendRetours - vendComms - vendMkt;

    // Merch
    const merchMkt = getMktBySource(MarketingSpendSource.MERCH);
    const merchSuccess = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status));
    const merchVentes = merchSuccess.reduce((a,c) => a + c.prix_vente, 0);
    const merchProd = merchSuccess.reduce((a,c) => a + c.prix_achat, 0);
    const merchRetours = cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);
    const merchFinalProfit = merchVentes - merchProd - merchRetours - merchMkt;

    // Client Comptoir (Isolated Analytical View: Realized + Expected)
    const ccSuccess = cc.filter(i => [ClientComptoirStatus.PAYEE, ClientComptoirStatus.NON_PAYEE].includes(i.status));
    const ccVentes = ccSuccess.reduce((a,c) => a + Number(c.revenue), 0);
    const ccProd = ccSuccess.reduce((a,c) => a + Number(c.client_charges), 0);
    const ccFinalProfit = ccVentes - ccProd;

    return {
      gros: { final: grosFinalProfit, sales: grosVentes, prod: grosProd, ret: grosRetours, mkt: grosMkt },
      vendeurs: { final: vendFinalProfit, sales: vendVentes, prod: vendProd, ret: vendRetours, comm: vendComms, mkt: vendMkt },
      merch: { final: merchFinalProfit, sales: merchVentes, prod: merchProd, ret: merchRetours, mkt: merchMkt },
      comptoir: { final: ccFinalProfit, sales: ccVentes, prod: ccProd }
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedClientComptoir, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  // --- REFINED GLOBAL KPIS ---
  const globalKPIs = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const cc = getCalculatedClientComptoir().filter(i => filterByDate(i.date));
    const co = offres.filter(i => filterByDate(i.date));
    const mkt = marketingSpends.filter(s => filterByDate(s.date_start));

    // 1. Production Consolidée (Includes all pillars)
    const prodGros = cg.reduce((a,c) => a + (Number(c.prix_achat_article) + Number(c.prix_impression)), 0);
    const prodSw = cs.reduce((a,c) => a + (Number(c.cout_article) + Number(c.cout_impression)), 0);
    const prodMerch = cm.reduce((a,c) => a + Number(c.prix_achat), 0);
    const prodCc = cc.reduce((a,c) => a + Number(c.client_charges), 0);
    const totalProd = prodGros + prodSw + prodMerch + prodCc;

    // 2. Profit Brut Global (CC: PAYEE only as per specific rule)
    const oRev = co.filter(i => i.type === OffreType.REVENUE).reduce((a, c) => a + Number(c.montant), 0);
    const oAds = mkt.filter(s => s.source === MarketingSpendSource.OFFRES).reduce((a, c) => a + Number(c.amount), 0);
    
    // Core pillar logic
    const successGros = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)).reduce((a,c) => a + (c.prix_vente - c.cost), 0);
    const successVend = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + c.profit_net, 0);
    const successMerch = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);
    const successCc = cc.filter(i => i.status === ClientComptoirStatus.PAYEE).reduce((a,c) => a + c.benefice_net, 0); // PAYEE ONLY

    const lossGros = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0);
    const lossSw = cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0);
    const lossMerch = cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);
    const totalRetLoss = lossGros + lossSw + lossMerch;

    const totalMkt = pillarProfitData.gros.mkt + pillarProfitData.vendeurs.mkt + pillarProfitData.merch.mkt;

    const profitBrutGlobal = (successGros + successVend + successMerch + successCc + (oRev - oAds)) - totalRetLoss - totalMkt;

    // 3. Livrée Non Encaissée (CC: NON_PAYEE)
    const lneGros = cg.filter(i => i.status === GrosStatus.LIVREE_NON_ENCAISSE);
    const lneSw = cs.filter(i => i.status === SitewebStatus.LIVREE_NON_ENCAISSEE);
    const lneMerch = cm.filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE);
    const lneCc = cc.filter(i => i.status === ClientComptoirStatus.NON_PAYEE);

    const lneProfitTotal = lneGros.reduce((a,c) => a + (c.prix_vente - c.cost), 0) + 
                           lneSw.reduce((a,c) => a + c.profit_net, 0) + 
                           lneMerch.reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0) +
                           lneCc.reduce((a,c) => a + c.benefice_net, 0);
    const lneCount = lneGros.length + lneSw.length + lneMerch.length + lneCc.length;

    // 4. En Livraison (CC: EN_PROD/EN_LIVR)
    const potGros = cg.filter(i => [GrosStatus.EN_LIVRAISON, GrosStatus.EN_PRODUCTION].includes(i.status));
    const potSw = cs.filter(i => i.status === SitewebStatus.EN_LIVRAISON);
    const potMerch = cm.filter(i => i.status === MerchStatus.EN_LIVRAISON);
    const potCc = cc.filter(i => [ClientComptoirStatus.EN_PRODUCTION, ClientComptoirStatus.EN_LIVRAISON].includes(i.status));

    const potProfitTotal = potGros.reduce((a,c) => a + (c.prix_vente - c.cost), 0) + 
                           potSw.reduce((a,c) => a + c.profit_net, 0) + 
                           potMerch.reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0) +
                           potCc.reduce((a,c) => a + c.benefice_net, 0);
    const potCount = potGros.length + potSw.length + potMerch.length + potCc.length;

    return {
      totalProd,
      profitBrutGlobal, totalRetLoss,
      lneProfitTotal, lneCount,
      potProfitTotal, potCount
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedClientComptoir, offres, marketingSpends, pillarProfitData, dashboardDateStart, dashboardDateEnd]);

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
            <input type="date" value={dashboardDateStart} onChange={(e) => setDashboardDateRange(e.target.value, dashboardDateEnd)} className="bg-transparent border-none text-[10px] font-black text-slate-800 outline-none w-28" />
            <span className="text-[10px] font-black text-slate-300 uppercase px-1">AU</span>
            <input type="date" value={dashboardDateEnd} onChange={(e) => setDashboardDateRange(dashboardDateStart, e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-800 outline-none w-28" />
          </div>
          {(dashboardDateStart || dashboardDateEnd) && (
            <button onClick={() => setDashboardDateRange('', '')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <RotateCcw size={16} />
            </button>
          )}
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

      {/* PROFIT FINAL RÉEL SECTION */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white">
            <Coins size={20} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Profit Final Réel (Après Tous Coûts)</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Analyse isolée de rentabilité par flux direct</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <KPICard 
            title="Profit Final GROS" 
            value={pillarProfitData.gros.final} 
            icon={Truck} 
            colorClass={{
              text: 'text-blue-600', bg: 'bg-blue-50', 
              valueText: pillarProfitData.gros.final >= 0 ? 'text-emerald-600' : 'text-red-600'
            }}
            subValues={[
              { label: 'Ventes', val: pillarProfitData.gros.sales },
              { label: 'Prod/Ret/Ads', val: -(pillarProfitData.gros.prod + pillarProfitData.gros.ret + pillarProfitData.gros.mkt), color: 'text-red-400' }
            ]}
          />
          <KPICard 
            title="Profit Final VENDEURS" 
            value={pillarProfitData.vendeurs.final} 
            icon={Globe} 
            colorClass={{
              text: 'text-indigo-600', bg: 'bg-indigo-50', 
              valueText: pillarProfitData.vendeurs.final >= 0 ? 'text-emerald-600' : 'text-red-600'
            }}
            subValues={[
              { label: 'Ventes', val: pillarProfitData.vendeurs.sales },
              { label: 'Tous Coûts', val: -(pillarProfitData.vendeurs.sales - pillarProfitData.vendeurs.final), color: 'text-red-400' }
            ]}
          />
          <KPICard 
            title="Profit Final MERCH" 
            value={pillarProfitData.merch.final} 
            icon={ShoppingBag} 
            colorClass={{
              text: 'text-emerald-600', bg: 'bg-emerald-50', 
              valueText: pillarProfitData.merch.final >= 0 ? 'text-emerald-600' : 'text-red-600'
            }}
            subValues={[
              { label: 'Ventes', val: pillarProfitData.merch.sales },
              { label: 'Prod/Ret/Ads', val: -(pillarProfitData.merch.sales - pillarProfitData.merch.final), color: 'text-red-400' }
            ]}
          />
          <KPICard 
            title="Profit CLIENT COMPTOIR" 
            value={pillarProfitData.comptoir.final} 
            icon={Store} 
            colorClass={{
              text: 'text-amber-600', bg: 'bg-amber-50', 
              valueText: pillarProfitData.comptoir.final >= 0 ? 'text-emerald-600' : 'text-red-600'
            }}
            subValues={[
              { label: 'Ventes Directes', val: pillarProfitData.comptoir.sales },
              { label: 'Charges Production', val: -pillarProfitData.comptoir.prod, color: 'text-slate-400' }
            ]}
          />
        </div>
      </section>

      {/* Global Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <KPICard 
          title="Production Consolidée" 
          value={globalKPIs.totalProd} 
          icon={Box} 
          colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}}
          subValues={[
            { label: 'Impact Global', val: 'Coût de Fabrication' }
          ]}
        />
        <KPICard 
          title="Profit Brut Global" 
          value={globalKPIs.profitBrutGlobal} 
          icon={TrendingUp} 
          colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50', valueText: 'text-emerald-600'}}
          subValues={[
            { label: 'Pertes Retours', val: globalKPIs.totalRetLoss, color: 'text-red-500', fullWidth: true }
          ]}
        />
        <KPICard 
          title="Revenus non encore encaissés" 
          value={globalKPIs.lneProfitTotal} 
          icon={Clock} 
          colorClass={{text: 'text-purple-600', bg: 'bg-purple-50'}}
          statusCount={globalKPIs.lneCount}
          subValues={[
            { label: 'Statut', val: 'LNE / NON PAYÉ' }
          ]}
        />
        <KPICard 
          title="Potentiel – Non comptabilisé" 
          value={globalKPIs.potProfitTotal} 
          icon={Activity} 
          colorClass={{text: 'text-slate-400', bg: 'bg-slate-50'}}
          isMuted={true}
          statusCount={globalKPIs.potCount}
          subValues={[
            { label: 'Profit Est.', val: globalKPIs.potProfitTotal, color: 'text-blue-400', fullWidth: true }
          ]}
        />
      </div>
    </div>
  );
};

export default Dashboard;
