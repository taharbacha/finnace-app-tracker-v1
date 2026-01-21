
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
  Cell,
  LabelList
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
  Globe,
  TrendingDown,
  Activity,
  UserCheck,
  ShieldAlert,
  Flame,
  Lightbulb
} from 'lucide-react';
import { OffreType, MarketingSpendSource, MarketingStatus, GrosStatus, SitewebStatus, MerchStatus } from '../types.ts';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const KPICard = ({ title, value, subValues = [], icon: Icon, colorClass, statusCount, trend, subtitle }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md group relative overflow-hidden">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${colorClass.bg}`}>
        <Icon className={colorClass.text} size={24} />
      </div>
      <div className="flex flex-col items-end gap-2">
        {statusCount !== undefined && (
          <span className="bg-slate-50 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100">
            {statusCount} OBJETS
          </span>
        )}
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border ${trend.val >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {trend.val >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.val).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(value)}</h3>
      {subtitle && <p className="text-[9px] font-bold text-slate-400 italic mt-1">{subtitle}</p>}
    </div>
    {subValues.length > 0 && (
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
        {subValues.map((sv: any, i: number) => (
          <div key={i} className={sv.fullWidth ? 'col-span-2' : ''}>
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
    getCalculatedMarketing,
    offres,
    marketingSpends,
    charges,
    dashboardDateStart,
    dashboardDateEnd,
    setDashboardDateRange
  } = useAppStore();

  const data = getDashboardData(dashboardDateStart, dashboardDateEnd);
  
  const filterByDate = (dateStr: string, start?: string, end?: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.split('T')[0];
    const s = start || dashboardDateStart;
    const e = end || dashboardDateEnd;
    if (s && cleanDate < s) return false;
    if (e && cleanDate > e) return false;
    return true;
  };

  // --- TREND & COMPARISON LOGIC ---
  const trends = useMemo(() => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    
    const recentStart = formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
    const recentEnd = formatDate(today);
    const previousStart = formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000));
    const previousEnd = recentStart;

    const calcForPeriod = (start: string, end: string) => {
      const cg = getCalculatedGros().filter(i => filterByDate(i.date_created, start, end));
      const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created, start, end));
      const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at, start, end));
      const co = offres.filter(i => filterByDate(i.date, start, end));
      const cc = getCalculatedMarketing().filter(i => filterByDate(i.date, start, end));
      const fms = marketingSpends.filter(i => filterByDate(i.date_start, start, end));

      const profit = cg.reduce((a, c) => a + (c.status === GrosStatus.RETOUR ? -c.cost : (c.prix_vente - c.cost)), 0) +
                     cs.reduce((a, c) => a + (c.status === SitewebStatus.RETOUR ? -(c.cout_article + c.cout_impression) : c.profit_net), 0) +
                     cm.reduce((a, c) => a + (c.status === MerchStatus.RETOUR ? -c.impact_perte : (c.prix_vente - c.prix_achat)), 0) +
                     cc.reduce((a, c) => a + (c.status === MarketingStatus.TERMINE ? (Number(c.revenue || 0) - Number(c.client_charges || 0)) : 0), 0);

      const rets = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0) + 
                   cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + 
                   cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);

      return { profit, rets };
    };

    const recent = calcForPeriod(recentStart, recentEnd);
    const previous = calcForPeriod(previousStart, previousEnd);

    const getDelta = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;

    return {
      profitDelta: getDelta(recent.profit, previous.profit),
      retsDelta: getDelta(recent.rets, previous.rets)
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedMarketing, offres, marketingSpends]);

  // --- GLOBAL KPIS DEEP BREAKDOWN ---
  const globalKPIs = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const cc = getCalculatedMarketing().filter(i => filterByDate(i.date));
    const co = offres.filter(i => filterByDate(i.date));

    // 1. Production Breakdown (Costs Only)
    const prodGros = cg.reduce((a,c) => a + c.cost, 0);
    const prodSW = cs.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0);
    const prodMerch = cm.reduce((a,c) => a + c.prix_achat, 0);
    const prodOffres = co.filter(o => o.type === OffreType.EXPENSE).reduce((a,c) => a + Number(c.montant), 0);
    const prodCC = cc.reduce((a,c) => a + Number(c.client_charges || 0), 0);
    const totalProd = prodGros + prodSW + prodMerch + prodOffres + prodCC;

    // 2. Profit Brut (Before Returns & Global Charges)
    const brutGros = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)).reduce((a,c) => a + (c.prix_vente - c.cost), 0);
    const brutSW = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + c.profit_net, 0);
    const brutMerch = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);
    const brutOffres = co.filter(o => o.type === OffreType.REVENUE).reduce((a,c) => a + Number(c.montant), 0);
    const brutCC = cc.filter(i => i.status === MarketingStatus.TERMINE).reduce((a, c) => a + (Number(c.revenue || 0) - Number(c.client_charges || 0)), 0);
    const totalProfitBrut = brutGros + brutSW + brutMerch + brutOffres + brutCC;

    // 3. Livrée Non Encaissée Detail
    const lneGros = cg.filter(i => i.status === GrosStatus.LIVREE_NON_ENCAISSE);
    const lneSW = cs.filter(i => i.status === SitewebStatus.LIVREE_NON_ENCAISSEE);
    const lneMerch = cm.filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE);
    
    const lneTotalAmount = lneGros.reduce((a,c) => a + c.prix_vente, 0) + lneSW.reduce((a,c) => a + c.prix_vente, 0) + lneMerch.reduce((a,c) => a + c.prix_vente, 0);
    const lneProdEngagee = lneGros.reduce((a,c) => a + c.cost, 0) + lneSW.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + lneMerch.reduce((a,c) => a + c.prix_achat, 0);
    const lneProfitAttendu = lneGros.reduce((a,c) => a + (c.prix_vente - c.cost), 0) + lneSW.reduce((a,c) => a + c.profit_net, 0) + lneMerch.reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);
    const lneCount = lneGros.length + lneSW.length + lneMerch.length;

    // 4. Pertes de Retour Detail
    const retGros = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0);
    const retSW = cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0);
    const retMerch = cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);
    const retLoss = retGros + retSW + retMerch;

    return { 
      totalProd, prodGros, prodSW, prodMerch, prodOffres, prodCC,
      totalProfitBrut, brutGros, brutSW, brutMerch, brutOffres, brutCC,
      lneTotalAmount, lneProdEngagee, lneProfitAttendu, lneCount,
      retLoss, retGros, retSW, retMerch
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedMarketing, offres, dashboardDateStart, dashboardDateEnd]);

  // --- PILLAR & SIGNAL LOGIC ---
  const pillars = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const cc = getCalculatedMarketing().filter(i => filterByDate(i.date));

    const getPillarMkt = (src: MarketingSpendSource) => 
      marketingSpends.filter(s => s.source === src && filterByDate(s.date_start)).reduce((a, c) => a + Number(c.amount), 0);

    const grosMkt = getPillarMkt(MarketingSpendSource.GROS);
    const grosRev = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)).reduce((a,c) => a + c.prix_vente, 0);
    const grosProfitReal = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)).reduce((a, c) => a + (c.prix_vente - c.cost), 0);
    const grosRets = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0);

    const vendMkt = getPillarMkt(MarketingSpendSource.SITEWEB);
    const vendRev = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + c.prix_vente, 0);
    const vendProfitReal = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a, c) => a + c.profit_net, 0);
    const vendRets = cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0);

    const merchMkt = getPillarMkt(MarketingSpendSource.MERCH);
    const merchRev = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + c.prix_vente, 0);
    const merchProfitReal = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a, c) => a + (c.prix_vente - c.prix_achat), 0);
    const merchRets = cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);

    const signals: any[] = [];
    const checkPillar = (name: string, rev: number, profit: number, mkt: number, rets: number) => {
      if (rev > 0 && (rets / rev) > 0.1) signals.push({ type: 'danger', icon: RotateCcw, msg: `Taux de retour critique sur ${name} (>10%)` });
      if (rev > 0 && (profit / rev) < 0.2) signals.push({ type: 'warning', icon: TrendingDown, msg: `Marge faible sur ${name} (<20%)` });
      if (mkt > profit && mkt > 0) signals.push({ type: 'info', icon: Megaphone, msg: `Dépenses Ads supérieures au profit sur ${name}` });
      if (mkt > 0 && (profit / mkt) > 3) signals.push({ type: 'success', icon: Flame, msg: `Performance ROI exceptionnelle sur ${name} (>3x)` });
    };

    checkPillar('Gros', grosRev, grosProfitReal, grosMkt, grosRets);
    checkPillar('Vendeurs', vendRev, vendProfitReal, vendMkt, vendRets);
    checkPillar('Merch', merchRev, merchProfitReal, merchMkt, merchRets);

    let focusMsg = "Analyse stable. Continuez les opérations standard.";
    let focusIcon = Target;
    if (trends.retsDelta > 15) {
      focusMsg = `Alerte: Les retours ont augmenté de ${trends.retsDelta.toFixed(1)}% cette semaine. Audit logistique requis.`;
      focusIcon = ShieldAlert;
    } else if (trends.profitDelta < -10) {
      focusMsg = `Urgent: Le profit global a chuté de ${Math.abs(trends.profitDelta).toFixed(1)}%. Vérifiez les marges par pilier.`;
      focusIcon = TrendingDown;
    }

    const daily: Record<string, any> = {};
    const initDate = (d: string) => { 
      if (!daily[d]) daily[d] = { date: d, gProfit: 0, gMkt: 0, gPot: 0, vProfit: 0, vMkt: 0, vCom: 0, vProd: 0, mProfit: 0, mMkt: 0, mProd: 0, mRet: 0, oProfit: 0, oMkt: 0, oExp: 0, ccProfitReal: 0, ccProfitExpected: 0, ccSales: 0, ccCost: 0 }; 
    };

    cg.forEach(i => { initDate(i.date_created); if ([GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)) daily[i.date_created].gProfit += (i.prix_vente - i.cost); });
    cs.forEach(i => { initDate(i.date_created); if ([SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)) { daily[i.date_created].vProfit += i.profit_net; daily[i.date_created].vCom += Number(i.vendeur_benefice || 0); daily[i.date_created].vProd += (i.cout_article + i.cout_impression); } });
    cm.forEach(i => { const d = i.created_at.split('T')[0]; initDate(d); if ([MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)) daily[d].mProfit += (i.prix_vente - i.prix_achat); daily[d].mProd += i.prix_achat; if (i.status === MerchStatus.RETOUR) daily[d].mRet += i.prix_achat; });
    offres.forEach(i => { initDate(i.date); if (i.type === OffreType.REVENUE) daily[i.date].oProfit += Number(i.montant); if (i.type === OffreType.EXPENSE) daily[i.date].oExp += Number(i.montant); });
    cc.forEach(i => { initDate(i.date); const profit = Number(i.revenue || 0) - Number(i.client_charges || 0); if (i.status === MarketingStatus.TERMINE) daily[i.date].ccProfitReal += profit; });
    const timeline = Object.values(daily).sort((a,b) => a.date.localeCompare(b.date));

    return {
      signals, focus: { msg: focusMsg, icon: focusIcon },
      gros: { timeline }, vendeurs: { timeline }, merch: { timeline }, offres: { timeline }, clientComptoir: { timeline }
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedMarketing, offres, marketingSpends, trends, dashboardDateStart, dashboardDateEnd]);

  // --- WATERFALL DATA ---
  const waterfallData = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const co = offres.filter(i => filterByDate(i.date));
    const cc = getCalculatedMarketing().filter(i => filterByDate(i.date));
    const fc = charges.filter(i => filterByDate(i.date));
    const fms = marketingSpends.filter(i => filterByDate(i.date_start));

    const rev = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)).reduce((a,c) => a + c.prix_vente, 0) +
                cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + c.prix_vente, 0) +
                cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status)).reduce((a,c) => a + c.prix_vente, 0) +
                co.filter(i => i.type === OffreType.REVENUE).reduce((a,c) => a + Number(c.montant), 0) +
                cc.filter(i => i.status === MarketingStatus.TERMINE).reduce((a,c) => a + Number(c.revenue), 0);

    const prod = cg.reduce((a,c) => a + c.cost, 0) + cs.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + cm.reduce((a,c) => a + c.prix_achat, 0) + cc.reduce((a,c) => a + Number(c.client_charges || 0), 0);
    const rets = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0) + cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);
    const mkt = fms.reduce((a, c) => a + Number(c.amount), 0);
    const chgs = fc.reduce((a, c) => a + Number(c.montant), 0);
    const netFinal = data.profit_net_final;

    return [
      { name: 'Revenus Totaux', value: rev, bottom: 0, color: '#10b981', displayValue: rev, percentage: '100%' },
      { name: 'Production', value: prod, bottom: rev - prod, color: '#ef4444', displayValue: -prod, percentage: rev > 0 ? `-${((prod/rev)*100).toFixed(1)}%` : '0%' },
      { name: 'Retours', value: rets, bottom: rev - prod - rets, color: '#f59e0b', displayValue: -rets, percentage: rev > 0 ? `-${((rets/rev)*100).toFixed(1)}%` : '0%' },
      { name: 'Marketing', value: mkt, bottom: rev - prod - rets - mkt, color: '#ef4444', displayValue: -mkt, percentage: rev > 0 ? `-${((mkt/rev)*100).toFixed(1)}%` : '0%' },
      { name: 'Charges', value: chgs, bottom: rev - prod - rets - mkt - chgs, color: '#ef4444', displayValue: -chgs, percentage: rev > 0 ? `-${((chgs/rev)*100).toFixed(1)}%` : '0%' },
      { name: 'Net Final', value: netFinal, bottom: 0, color: '#3b82f6', displayValue: netFinal, percentage: rev > 0 ? `${((netFinal/rev)*100).toFixed(1)}%` : '0%' }
    ];
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, getCalculatedMarketing, offres, charges, marketingSpends, data.profit_net_final, dashboardDateStart, dashboardDateEnd]);

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

      {/* --- SIGNALS STRIP --- */}
      {pillars.signals.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {pillars.signals.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border whitespace-nowrap shadow-sm animate-in slide-in-from-left-4 duration-300
              ${s.type === 'danger' ? 'bg-red-50 border-red-100 text-red-700' : 
                s.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                s.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
              <s.icon size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{s.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Net Standing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 text-white p-14 rounded-[4.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center lg:items-start justify-center gap-8">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
               <Target className="text-blue-400" size={24} />
               <p className="text-blue-400 text-xs font-black uppercase tracking-[0.4em]">Trésorerie Nette Finale</p>
            </div>
            <h4 className="text-8xl font-black tracking-tighter tabular-nums text-center lg:text-left">{formatCurrency(data.profit_net_final)}</h4>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl text-center lg:text-left">
              Solde consolidé après déduction des charges fixes et investissement marketing global.
            </p>
          </div>
          <TrendingUp size={450} className="absolute -bottom-24 -right-24 text-white/[0.03] rotate-12 pointer-events-none" />
        </div>

        {/* --- FOCUS TODAY CARD --- */}
        <div className="bg-white p-12 rounded-[4.5rem] border-4 border-blue-600 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/30">
                <pillars.focus.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Focus CEO d'Aujourd'hui</p>
            </div>
            <h4 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
              {pillars.focus.msg}
            </h4>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Hebdomadaire (vs S-1)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${trends.profitDelta >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                   <p className="text-[8px] font-black uppercase tracking-tighter opacity-70">Profit Net</p>
                   <p className="text-lg font-black">{trends.profitDelta >= 0 ? '+' : ''}{trends.profitDelta.toFixed(1)}%</p>
                </div>
                <div className={`p-4 rounded-2xl border ${trends.retsDelta <= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                   <p className="text-[8px] font-black uppercase tracking-tighter opacity-70">Retours</p>
                   <p className="text-lg font-black">{trends.retsDelta > 0 ? '+' : ''}{trends.retsDelta.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
          <Zap className="absolute -bottom-10 -right-10 text-blue-50/50 size-48 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Global Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        <KPICard 
          title="Dépenses Production" 
          value={globalKPIs.totalProd} 
          icon={Zap} 
          colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}} 
          subtitle="Article + Impression (Engagé)"
          subValues={[
            { label: 'Gros', val: globalKPIs.prodGros },
            { label: 'Vendeurs', val: globalKPIs.prodSW },
            { label: 'Merch', val: globalKPIs.prodMerch },
            { label: 'Offres/CC', val: globalKPIs.prodOffres + globalKPIs.prodCC }
          ]}
        />
        <KPICard 
          title="Profit Brut Global" 
          value={globalKPIs.totalProfitBrut} 
          icon={TrendingUp} 
          colorClass={{text: 'text-emerald-600', bg: 'bg-emerald-50'}} 
          subtitle="Avant retours & charges"
          trend={{ val: trends.profitDelta }}
          subValues={[
            { label: 'Gros', val: globalKPIs.brutGros },
            { label: 'Vendeurs', val: globalKPIs.brutSW },
            { label: 'Merch', val: globalKPIs.brutMerch },
            { label: 'Offres/CC', val: globalKPIs.brutOffres + globalKPIs.brutCC }
          ]}
        />
        <KPICard 
          title="Créances / Attendu" 
          value={globalKPIs.lneTotalAmount} 
          icon={Clock} 
          colorClass={{text: 'text-purple-600', bg: 'bg-purple-50'}} 
          subtitle="Capital en boucle logistique"
          statusCount={globalKPIs.lneCount}
          subValues={[
            { label: 'Prod. Engagée', val: globalKPIs.lneProdEngagee },
            { label: 'Profit Attendu', val: globalKPIs.lneProfitAttendu, color: 'text-purple-600' }
          ]}
        />
        <KPICard 
          title="Pertes de Retour" 
          value={globalKPIs.retLoss} 
          icon={RotateCcw} 
          colorClass={{text: 'text-red-600', bg: 'bg-red-50'}} 
          subtitle="Coûts nets irrécupérables"
          trend={{ val: trends.retsDelta }}
          subValues={[
            { label: 'Gros', val: globalKPIs.retGros },
            { label: 'Vendeurs', val: globalKPIs.retSW },
            { label: 'Merch', val: globalKPIs.retMerch },
            { label: 'Note', val: 'Déduites du profit', color: 'text-red-400', fullWidth: true }
          ]}
        />
      </div>

      <div className="h-px bg-slate-100 w-full" />

      {/* --- WATERFALL SECTION --- */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-900/20">
            <LayoutGrid size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Décomposition du Résultat Net Global</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Global Profit Waterfall Analysis</p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.name}</p>
                          <p className={`text-lg font-black ${d.displayValue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {formatCurrency(d.displayValue)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 italic">Impact: {d.percentage} du revenu brut</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bottom" stackId="a" fill="transparent" />
                <Bar dataKey="value" stackId="a" radius={[6, 6, 6, 6]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="displayValue" 
                    position="top" 
                    formatter={(val: number) => val === 0 ? '' : (val > 0 ? `+${val/1000}k` : `${val/1000}k`)}
                    style={{ fontSize: '10px', fontWeight: '900', fill: '#64748b' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 pt-8 border-t border-slate-50">
            {waterfallData.map((step, idx) => (
              <div key={idx} className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{step.name}</p>
                <p className="text-xs font-black text-slate-900">{step.percentage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <div className="lg:col-span-1">
            <ChartCard title="Progression Profit" icon={TrendingUp} colorClass={{text: 'text-blue-600', bg: 'bg-blue-50'}}>
              <ComposedChart data={pillars.gros.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="gProfit" name="Profit" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={3} />
                <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '30px'}} />
              </ComposedChart>
            </ChartCard>
          </div>
          <div className="lg:col-span-3">
             {/* Timeline and other details reused from previous logic */}
          </div>
        </div>
      </section>

      {/* Strategic Footer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100">
          <div className="flex items-center gap-6 p-8 bg-blue-50/50 rounded-3xl border border-blue-100">
             <Zap className="text-blue-500 shrink-0" size={32} />
             <div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Efficacité Publicitaire</p>
                <p className="text-base font-bold text-slate-700">
                  Total {data.total_marketing_spend > 0 ? (globalKPIs.totalProfitBrut / data.total_marketing_spend).toFixed(1) + 'x ROI brut sur spend.' : 'Aucun spend marketing enregistré.'}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-6 p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100">
             <ArrowUpRight className="text-emerald-500 shrink-0" size={32} />
             <div>
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Santé du Business</p>
                <p className="text-base font-bold text-slate-700">
                  Position de liquidité : {data.profit_net_final > 0 ? 'Excellente.' : 'Action corrective requise.'}
                </p>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
