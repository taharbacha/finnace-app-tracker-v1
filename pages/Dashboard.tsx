
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
  FileText,
  TrendingDown
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

const Dashboard: React.FC = () => {
  const { 
    getDashboardData, 
    getCalculatedGros, 
    getCalculatedSiteweb, 
    getCalculatedMerch,
    marketingSpends,
    charges,
    payouts,
    credits,
    offres,
    dashboardDateStart,
    dashboardDateEnd,
    setDashboardDateRange
  } = useAppStore();

  const [tempStart, setTempStart] = useState(dashboardDateStart);
  const [tempEnd, setTempEnd] = useState(dashboardDateEnd);

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

  const globalKPIs = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const fo = offres.filter(i => filterByDate(i.date));

    const totalProd = cg.reduce((a,c) => a + c.cost, 0) + 
                    cs.reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + 
                    cm.reduce((a,c) => a + c.prix_achat, 0);

    const soldeOffres = fo.reduce((a, c) => a + (c.type === OffreType.REVENUE ? Number(c.montant) : -Number(c.montant)), 0);

    const totalProfitNet = 
      cg.reduce((a, c) => {
        if ([GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(c.status)) return a + (c.prix_vente - c.cost);
        if (c.status === GrosStatus.RETOUR) return a - c.cost;
        return a;
      }, 0) +
      cs.reduce((a, c) => {
        if ([SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(c.status)) return a + c.profit_net;
        if (c.status === SitewebStatus.RETOUR) return a - (c.cout_article + c.cout_impression);
        return a;
      }, 0) +
      cm.reduce((a, c) => {
        if ([MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(c.status)) return a + (c.prix_vente - c.prix_achat);
        if (c.status === MerchStatus.RETOUR) return a - c.impact_perte;
        return a;
      }, 0) +
      soldeOffres;

    const lneProfit = cg.filter(i => i.status === GrosStatus.LIVREE_NON_ENCAISSE).reduce((a,c) => a + (c.prix_vente - c.cost), 0) + 
                     cs.filter(i => i.status === SitewebStatus.LIVREE_NON_ENCAISSEE).reduce((a,c) => a + c.profit_net, 0) + 
                     cm.filter(i => i.status === MerchStatus.LIVREE_NON_ENCAISSEE).reduce((a,c) => a + (c.prix_vente - c.prix_achat), 0);

    const retLoss = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a,c) => a + c.cost, 0) + 
                   cs.filter(i => i.status === SitewebStatus.RETOUR).reduce((a,c) => a + (c.cout_article + c.cout_impression), 0) + 
                   cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a,c) => a + c.prix_achat, 0);

    return { totalProd, totalProfitNet, lneProfit, retLoss };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, offres, dashboardDateStart, dashboardDateEnd]);

  const pillars = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const fo = offres.filter(i => filterByDate(i.date));

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
    const vendBenef = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                        .reduce((a, c) => a + Number(c.vendeur_benefice), 0);

    const merchMkt = getPillarMkt(MarketingSpendSource.MERCH);
    const merchProfitReal = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                            .reduce((a, c) => a + (Number(c.prix_vente) - Number(c.prix_achat)), 0);
    const merchProd = cm.reduce((a, c) => a + c.prix_achat, 0);

    const offresRev = fo.filter(o => o.type === OffreType.REVENUE).reduce((a, c) => a + Number(c.montant), 0);
    const offresExp = fo.filter(o => o.type === OffreType.EXPENSE).reduce((a, c) => a + Number(c.montant), 0);

    return {
      gros: { mkt: grosMkt, profitReal: grosProfitReal, profitPot: grosProfitPot },
      vendeurs: { mkt: vendMkt, profitReal: vendProfitReal, benefice: vendBenef },
      merch: { mkt: merchMkt, profitReal: merchProfitReal, prod: merchProd },
      offres: { rev: offresRev, exp: offresExp, net: offresRev - offresExp }
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, marketingSpends, offres, dashboardDateStart, dashboardDateEnd]);

  const counts = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));

    return {
      gros: {
        prod: cg.filter(i => i.status === GrosStatus.EN_PRODUCTION).length,
        liv: cg.filter(i => i.status === GrosStatus.EN_LIVRAISON).length,
        ok: cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status)).length,
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
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, dashboardDateStart, dashboardDateEnd]);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Activity className="text-blue-600" size={36} />
            Global Dashboard
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Vue d'ensemble de la performance opérationnelle.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)} className="text-xs font-bold border-none bg-slate-50 rounded-lg p-2 outline-none" />
            <span className="text-slate-300">-</span>
            <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)} className="text-xs font-bold border-none bg-slate-50 rounded-lg p-2 outline-none" />
          </div>
          <button onClick={handleApplyFilter} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-all">
            <Check size={16} />
          </button>
          <button onClick={handleResetFilter} className="bg-slate-100 text-slate-400 p-2 rounded-xl hover:bg-slate-200 transition-all">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Profit Net Global" 
          value={globalKPIs.totalProfitNet} 
          icon={Zap} 
          colorClass={{bg: 'bg-blue-600', text: 'text-white'}}
          subValues={[
            {label: 'Encaissé Réel', val: data.encaisse_reel},
            {label: 'Charges Fixes', val: data.total_charges, color: 'text-red-500'}
          ]}
        />
        <KPICard 
          title="Profit Attendu (LNE)" 
          value={globalKPIs.lneProfit} 
          icon={Clock} 
          colorClass={{bg: 'bg-orange-50', text: 'text-orange-600'}}
          subValues={[
            {label: 'Exposition Retours', val: globalKPIs.retLoss, color: 'text-red-500'}
          ]}
        />
        <KPICard 
          title="Investissement Marketing" 
          value={data.total_marketing_spend} 
          icon={Target} 
          colorClass={{bg: 'bg-purple-50', text: 'text-purple-600'}}
        />
        <KPICard 
          title="Valeur de Production" 
          value={globalKPIs.totalProd} 
          icon={TrendingUp} 
          colorClass={{bg: 'bg-emerald-50', text: 'text-emerald-600'}}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Wholesale Pillar */}
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Truck size={20}/></div>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Pillier Wholesale</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Profit Réalisé</p>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(pillars.gros.profitReal)}</p>
                 </div>
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Marketing Spend</p>
                    <p className="font-bold text-red-500">{formatCurrency(pillars.gros.mkt)}</p>
                 </div>
              </div>
            </div>
         </div>

         {/* Retail Pillar */}
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Globe size={20}/></div>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Pillier Vendeurs</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Profit Net Entreprise</p>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(pillars.vendeurs.profitReal)}</p>
                 </div>
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Commissions Payées</p>
                    <p className="font-bold text-purple-500">{formatCurrency(pillars.vendeurs.benefice)}</p>
                 </div>
              </div>
            </div>
         </div>

         {/* Merch Pillar */}
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingBag size={20}/></div>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Pillier Merch</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Profit Réalisé</p>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(pillars.merch.profitReal)}</p>
                 </div>
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Coût Production</p>
                    <p className="font-bold text-slate-600">{formatCurrency(pillars.merch.prod)}</p>
                 </div>
              </div>
            </div>
         </div>

         {/* Offres Pillar */}
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={20}/></div>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Pillier Offres</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Revenus Plans</p>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(pillars.offres.rev)}</p>
                 </div>
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Dépenses Directes</p>
                    <p className="font-bold text-orange-500">{formatCurrency(pillars.offres.exp)}</p>
                 </div>
              </div>
            </div>
         </div>

         {/* Report & Export Column */}
         <div className="bg-slate-900 rounded-[3rem] p-8 text-white flex flex-col justify-between overflow-hidden relative shadow-2xl col-span-1 md:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16" />
            <div className="relative z-10">
               <FileText size={32} className="text-blue-500 mb-6" />
               <h4 className="text-xl font-black mb-2">Audit Report</h4>
               <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">Générez un rapport PDF complet incluant l'analyse forensic de tous vos piliers de revenus.</p>
            </div>
            <div className="relative z-10 pt-8 border-t border-white/5">
              <ExportDashboardPDF 
                data={data} 
                globalKPIs={globalKPIs} 
                pillars={pillars} 
                dateRange={{start: dashboardDateStart, end: dashboardDateEnd}}
                counts={counts}
                rawLists={{
                  charges: charges, 
                  marketingSpends: marketingSpends, 
                  payouts: payouts, 
                  credits: credits
                }}
              />
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
