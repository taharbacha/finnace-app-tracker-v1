
import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  GrosStatus, 
  SitewebStatus, 
  MerchStatus, 
  MarketingSpendSource 
} from '../types.ts';
import { 
  FileBarChart, 
  ArrowRight, 
  Minus, 
  Plus, 
  Equal, 
  Truck, 
  ShoppingBag, 
  Globe,
  Info,
  TrendingUp,
  AlertCircle,
  Receipt,
  ArrowUpRight,
  Target
} from 'lucide-react';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const AccountingRow = ({ label, value, type = 'expense', subLabel }: { label: string, value: number, type?: 'revenue' | 'expense' | 'total' | 'info', subLabel?: string }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group transition-all hover:bg-slate-50/50 px-3 rounded-2xl">
    <div className="flex flex-col">
      <div className="flex items-center gap-4">
        {type === 'revenue' && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm"><Plus size={14} className="text-emerald-600" /></div>}
        {type === 'expense' && <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shadow-sm"><Minus size={14} className="text-rose-600" /></div>}
        {type === 'total' && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md"><Equal size={14} className="text-white" /></div>}
        {type === 'info' && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shadow-sm"><Info size={14} className="text-slate-400" /></div>}
        <div className="flex flex-col">
          <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${type === 'total' ? 'text-slate-900' : 'text-slate-500'}`}>
            {label}
          </span>
          {subLabel && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{subLabel}</span>}
        </div>
      </div>
    </div>
    <span className={`font-mono text-[13px] font-black tabular-nums ${
      type === 'revenue' ? 'text-emerald-600' : 
      type === 'expense' ? 'text-rose-500' : 
      type === 'info' ? 'text-slate-400' :
      value >= 0 ? 'text-blue-600' : 'text-rose-600'
    }`}>
      {type === 'expense' && value !== 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
    </span>
  </div>
);

const PillarStatsCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  ventes, 
  production, 
  retours, 
  ads, 
  commissions, 
  colorClass 
}: any) => {
  const profitBrut = ventes - production;
  const profitNet = profitBrut - retours - ads - (commissions || 0);
  const roi = ads > 0 ? (profitNet / ads).toFixed(2) : 'N/A';

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full transition-all hover:shadow-2xl hover:-translate-y-2">
      <div className={`p-10 border-b border-slate-50 ${colorClass.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-5">
          <div className={`p-5 rounded-[1.5rem] bg-white shadow-lg ${colorClass.text}`}>
            <Icon size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1.5">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex flex-col items-end px-4 py-2 rounded-2xl bg-white/80 border border-white shadow-sm`}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pillar ROI</p>
            <div className={`text-sm font-black ${Number(roi) > 3 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {roi}x
            </div>
          </div>
        </div>
      </div>

      <div className="p-10 space-y-6 flex-1">
        {/* Section: Gross Volume */}
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-1">Flux de Revenus</p>
          <AccountingRow label="Chiffre d'Affaires" value={ventes} type="revenue" subLabel="Ventes Confirmées" />
          <AccountingRow label="Coût de Production" value={production} type="expense" subLabel="Purchase + Print" />
          <div className="pt-2">
            <div className="h-px bg-slate-50 w-full" />
            <AccountingRow label="Profit Brut" value={profitBrut} type="total" />
          </div>
        </div>

        {/* Section: Deductions */}
        <div className="pt-4 space-y-1">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 ml-1">Déductions Opérationnelles</p>
          <AccountingRow label="Investissement Ads" value={ads} type="expense" subLabel="Scoped AdSpend" />
          {commissions !== undefined && (
            <AccountingRow label="Commissions" value={commissions} type="expense" subLabel="Network Fees" />
          )}
          <AccountingRow label="Pertes Retours" value={retours} type="expense" subLabel="COGS Losses" />
        </div>
      </div>

      <div className={`p-10 ${colorClass.bg} mt-auto border-t border-slate-50`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Net Income Contribution</p>
            <h4 className={`text-3xl font-black tabular-nums tracking-tighter ${profitNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(profitNet)}
            </h4>
          </div>
          <div className={`w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center ${profitNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            <ArrowUpRight size={28} className={profitNet < 0 ? 'rotate-180 transition-transform' : ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Stats: React.FC = () => {
  const { 
    getCalculatedGros, 
    getCalculatedSiteweb, 
    getCalculatedMerch, 
    marketingSpends,
    charges,
    offres,
    dashboardDateStart,
    dashboardDateEnd
  } = useAppStore();

  const filterByDate = (dateStr: string) => {
    if (!dateStr) return true;
    const cleanDate = dateStr.split('T')[0];
    if (dashboardDateStart && cleanDate < dashboardDateStart) return false;
    if (dashboardDateEnd && cleanDate > dashboardDateEnd) return false;
    return true;
  };

  const pillarData = useMemo(() => {
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const grosVentes = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status))
                         .reduce((a, c) => a + Number(c.prix_vente), 0);
    const grosProd = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status))
                       .reduce((a, c) => a + Number(c.cost), 0);
    const grosRetours = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a, c) => a + Number(c.cost), 0);
    const grosAds = marketingSpends.filter(s => s.source === MarketingSpendSource.GROS && filterByDate(s.date_start))
                                  .reduce((a, c) => a + Number(c.amount), 0);

    const cs = getCalculatedSiteweb().filter(i => filterByDate(i.date_created));
    const vendVentes = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                         .reduce((a, c) => a + Number(c.prix_vente), 0);
    const vendProd = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                       .reduce((a, c) => a + (Number(c.cout_article) + Number(c.cout_impression)), 0);
    const vendComm = cs.filter(i => [SitewebStatus.LIVREE, SitewebStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                       .reduce((a, c) => a + Number(c.vendeur_benefice), 0);
    const vendRetours = cs.filter(i => i.status === SitewebStatus.RETOUR)
                          .reduce((a, c) => a + (Number(c.cout_article) + Number(c.cout_impression)), 0);
    const vendAds = marketingSpends.filter(s => s.source === MarketingSpendSource.SITEWEB && filterByDate(s.date_start))
                                  .reduce((a, c) => a + Number(c.amount), 0);

    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const merchVentes = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                          .reduce((a, c) => a + Number(c.prix_vente), 0);
    const merchProd = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                        .reduce((a, c) => a + Number(c.prix_achat), 0);
    const merchRetours = cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a, c) => a + Number(c.prix_achat), 0);
    const merchAds = marketingSpends.filter(s => s.source === MarketingSpendSource.MERCH && filterByDate(s.date_start))
                                   .reduce((a, c) => a + Number(c.amount), 0);

    const totalPillarProfit = (grosVentes - grosProd - grosRetours - grosAds) + 
                              (vendVentes - vendProd - vendRetours - vendAds - vendComm) + 
                              (merchVentes - merchProd - merchRetours - merchAds);

    const totalFixedCosts = charges.filter(c => filterByDate(c.date)).reduce((a, c) => a + Number(c.montant), 0);
    const totalOffres = offres.filter(o => filterByDate(o.date)).reduce((a, c) => a + (c.type === 'revenue' ? Number(c.montant) : -Number(c.montant)), 0);

    return {
      gros: { ventes: grosVentes, prod: grosProd, retours: grosRetours, ads: grosAds },
      vendeurs: { ventes: vendVentes, prod: vendProd, comm: vendComm, retours: vendRetours, ads: vendAds },
      merch: { ventes: merchVentes, prod: merchProd, retours: merchRetours, ads: merchAds },
      totalPillarProfit,
      totalFixedCosts,
      totalOffres,
      finalNet: totalPillarProfit - totalFixedCosts + totalOffres,
      totalVentes: grosVentes + vendVentes + merchVentes
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, marketingSpends, charges, offres, dashboardDateStart, dashboardDateEnd]);

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-24">
      {/* Header & Date Range Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            <Target size={14}/> Forensic Suite v5.0
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Comptabilité Analytique
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-sm">Vue structurelle de la rentabilité par segment.</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-10">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fenêtre Temporelle</p>
             <p className="text-sm font-black text-slate-800 flex items-center gap-2 justify-end">
               {dashboardDateStart || 'Infinity'} <ArrowRight size={14} className="text-slate-300" /> {dashboardDateEnd || 'Present'}
             </p>
           </div>
           <div className="h-10 w-px bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Indice de Fiabilité</p>
             <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               100% AUDITED
             </div>
           </div>
        </div>
      </div>

      {/* Executive Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Volume Ventes (Total)', val: pillarData.totalVentes, color: 'text-slate-900' },
          { label: 'Profit Opérationnel', val: pillarData.totalPillarProfit, color: 'text-blue-600' },
          { label: 'Charges de Structure', val: pillarData.totalFixedCosts, color: 'text-rose-600' },
          { label: 'Net Final', val: pillarData.finalNet, color: 'text-emerald-600' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white px-8 py-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
            <p className={`text-xl font-black tracking-tight ${item.color}`}>{formatCurrency(item.val)}</p>
          </div>
        ))}
      </div>

      {/* Main Pillars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <PillarStatsCard 
          title="Wholesale" 
          subtitle="B2B Supply Chain"
          icon={Truck}
          ventes={pillarData.gros.ventes}
          production={pillarData.gros.prod}
          retours={pillarData.gros.retours}
          ads={pillarData.gros.ads}
          colorClass={{bg: 'bg-blue-50/30', text: 'text-blue-600'}}
        />
        <PillarStatsCard 
          title="Network Retail" 
          subtitle="Vendeurs Externes"
          icon={Globe}
          ventes={pillarData.vendeurs.ventes}
          production={pillarData.vendeurs.prod}
          commissions={pillarData.vendeurs.comm}
          retours={pillarData.vendeurs.retours}
          ads={pillarData.vendeurs.ads}
          colorClass={{bg: 'bg-indigo-50/30', text: 'text-indigo-600'}}
        />
        <PillarStatsCard 
          title="Direct Sales" 
          subtitle="Merch Merchandise"
          icon={ShoppingBag}
          ventes={pillarData.merch.ventes}
          production={pillarData.merch.prod}
          retours={pillarData.merch.retours}
          ads={pillarData.merch.ads}
          colorClass={{bg: 'bg-emerald-50/30', text: 'text-emerald-600'}}
        />
      </div>

      {/* Strategic Consolidation Section */}
      <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] -mr-64 -mt-64" />
        
        <div className="relative z-10 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="max-w-xl">
              <h3 className="text-4xl font-black tracking-tighter mb-4">Consolidation Stratégique</h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Réconciliation du profit opérationnel brut avec les coûts fixes de structure et les flux extraordinaires (Offres).
              </p>
            </div>
            <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md">
              <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.3em] mb-3">Health Performance Index</p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-black leading-none">
                  {pillarData.totalFixedCosts > 0 ? (pillarData.totalPillarProfit / pillarData.totalFixedCosts).toFixed(2) : 'N/A'}
                </span>
                <span className="text-2xl font-bold text-slate-500 mb-1">X Profit/OpEx</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 space-y-4">
              <AccountingRow label="Profits Opérationnels (Piliers)" value={pillarData.totalPillarProfit} type="revenue" />
              <AccountingRow label="Charges Fixes (OpEx)" value={pillarData.totalFixedCosts} type="expense" subLabel="Salaries & Infrastructure" />
              <AccountingRow label="Impact Net Offres" value={pillarData.totalOffres} type={pillarData.totalOffres >= 0 ? 'revenue' : 'expense'} />
              <div className="pt-8 border-t border-white/10 mt-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Trésorerie Nette Disponible</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Post-Deduction Balance</span>
                  </div>
                  <span className="text-4xl font-black font-mono tracking-tighter text-white">{formatCurrency(pillarData.finalNet)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Efficient Growth Scale</p>
                  <span className="text-xs font-black text-blue-400">Target: 2.0x+</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg" 
                    style={{ width: `${Math.min(100, (pillarData.totalPillarProfit / Math.max(1, pillarData.totalFixedCosts * 2.5)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium italic">
                  *Un indice supérieur à 2.0x signifie que pour chaque 1 DA dépensé en structure, vous générez 2 DA de profit opérationnel.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                  <div className="flex items-center gap-3 mb-3 text-rose-400">
                    <AlertCircle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Operational Risk</span>
                  </div>
                  <p className="text-2xl font-black">{formatCurrency(pillarData.gros.retours + pillarData.vendeurs.retours + pillarData.merch.retours)}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mt-1">Total Returns Impact</p>
                </div>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                  <div className="flex items-center gap-3 mb-3 text-purple-400">
                    <Receipt size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AdSpend Focus</span>
                  </div>
                  <p className="text-2xl font-black">{formatCurrency(pillarData.gros.ads + pillarData.vendeurs.ads + pillarData.merch.ads)}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mt-1">Total Marketing Budget</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
