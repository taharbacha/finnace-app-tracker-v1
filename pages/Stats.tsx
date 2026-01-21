
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
  Receipt
} from 'lucide-react';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const AccountingRow = ({ label, value, type = 'expense', subLabel }: { label: string, value: number, type?: 'revenue' | 'expense' | 'total' | 'info', subLabel?: string }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 group transition-all hover:bg-slate-50/50 px-2 rounded-xl">
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        {type === 'revenue' && <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center"><Plus size={12} className="text-emerald-500" /></div>}
        {type === 'expense' && <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center"><Minus size={12} className="text-red-400" /></div>}
        {type === 'total' && <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><Equal size={12} className="text-blue-500" /></div>}
        {type === 'info' && <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center"><Info size={12} className="text-slate-400" /></div>}
        <span className={`text-[11px] font-black uppercase tracking-widest ${type === 'total' ? 'text-slate-900' : 'text-slate-500'}`}>
          {label}
        </span>
      </div>
      {subLabel && <span className="text-[10px] text-slate-400 font-medium ml-9">{subLabel}</span>}
    </div>
    <span className={`font-mono text-sm font-black tabular-nums ${
      type === 'revenue' ? 'text-emerald-600' : 
      type === 'expense' ? 'text-red-500' : 
      type === 'info' ? 'text-slate-400' :
      value >= 0 ? 'text-blue-600' : 'text-red-600'
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
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`p-8 border-b border-slate-50 ${colorClass.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-white shadow-sm ${colorClass.text}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ROI Ads</p>
          <div className={`px-3 py-1 rounded-full text-[11px] font-black ${Number(roi) > 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {roi}x
          </div>
        </div>
      </div>

      <div className="p-8 space-y-2 flex-1">
        <AccountingRow label="Chiffre d'Affaires" value={ventes} type="revenue" subLabel="Ventes cumulées (LNE + LE)" />
        <AccountingRow label="Coût de Production" value={production} type="expense" subLabel="Achat + Impression" />
        <div className="py-2"><div className="h-px bg-slate-100 w-full" /></div>
        <AccountingRow label="Profit Brut" value={profitBrut} type="total" />
        <AccountingRow label="Investissement Ads" value={ads} type="expense" subLabel="Marketing direct pillar" />
        {commissions !== undefined && (
          <AccountingRow label="Commissions Vendeurs" value={commissions} type="expense" />
        )}
        <AccountingRow label="Pertes Retours" value={retours} type="expense" subLabel="COGS des retours définitifs" />
      </div>

      <div className={`p-8 ${colorClass.bg} mt-auto`}>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bénéfice Net Pilier</p>
            <h4 className={`text-2xl font-black tabular-nums ${profitNet >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {formatCurrency(profitNet)}
            </h4>
          </div>
          <div className={`p-2 rounded-xl bg-white/50 ${profitNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp size={20} className={profitNet < 0 ? 'rotate-180' : ''} />
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
    // 1. GROS
    const cg = getCalculatedGros().filter(i => filterByDate(i.date_created));
    const grosVentes = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status))
                         .reduce((a, c) => a + Number(c.prix_vente), 0);
    const grosProd = cg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status))
                       .reduce((a, c) => a + Number(c.cost), 0);
    const grosRetours = cg.filter(i => i.status === GrosStatus.RETOUR).reduce((a, c) => a + Number(c.cost), 0);
    const grosAds = marketingSpends.filter(s => s.source === MarketingSpendSource.GROS && filterByDate(s.date_start))
                                  .reduce((a, c) => a + Number(c.amount), 0);

    // 2. VENDEURS
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

    // 3. MERCH
    const cm = getCalculatedMerch().filter(i => filterByDate(i.created_at));
    const merchVentes = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                          .reduce((a, c) => a + Number(c.prix_vente), 0);
    const merchProd = cm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status))
                        .reduce((a, c) => a + Number(c.prix_achat), 0);
    const merchRetours = cm.filter(i => i.status === MerchStatus.RETOUR).reduce((a, c) => a + Number(c.prix_achat), 0);
    const merchAds = marketingSpends.filter(s => s.source === MarketingSpendSource.MERCH && filterByDate(s.date_start))
                                   .reduce((a, c) => a + Number(c.amount), 0);

    // Consolidated Overall
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
      finalNet: totalPillarProfit - totalFixedCosts + totalOffres
    };
  }, [getCalculatedGros, getCalculatedSiteweb, getCalculatedMerch, marketingSpends, charges, offres, dashboardDateStart, dashboardDateEnd]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <FileBarChart className="text-blue-600" size={36} />
            Forensic Analytics
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Breakdown comptable de la rentabilité par pilier.</p>
        </div>
        
        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Période d'analyse</p>
             <p className="text-xs font-bold text-slate-700">
               {dashboardDateStart || 'Début'} <ArrowRight size={10} className="inline mx-1 text-slate-300" /> {dashboardDateEnd || 'Aujourd\'hui'}
             </p>
           </div>
           <div className="h-8 w-px bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Données</p>
             <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px]">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               SYNCHRONISÉ
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PillarStatsCard 
          title="Wholesale (Gros)" 
          subtitle="B2B & Distribution"
          icon={Truck}
          ventes={pillarData.gros.ventes}
          production={pillarData.gros.prod}
          retours={pillarData.gros.retours}
          ads={pillarData.gros.ads}
          colorClass={{bg: 'bg-blue-50/50', text: 'text-blue-600'}}
        />
        <PillarStatsCard 
          title="Retail (Vendeurs)" 
          subtitle="Multi-vendor Network"
          icon={Globe}
          ventes={pillarData.vendeurs.ventes}
          production={pillarData.vendeurs.prod}
          commissions={pillarData.vendeurs.comm}
          retours={pillarData.vendeurs.retours}
          ads={pillarData.vendeurs.ads}
          colorClass={{bg: 'bg-indigo-50/50', text: 'text-indigo-600'}}
        />
        <PillarStatsCard 
          title="D2C (Merch)" 
          subtitle="Direct Merchandise"
          icon={ShoppingBag}
          ventes={pillarData.merch.ventes}
          production={pillarData.merch.prod}
          retours={pillarData.merch.retours}
          ads={pillarData.merch.ads}
          colorClass={{bg: 'bg-emerald-50/50', text: 'text-emerald-600'}}
        />
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Consolidation Globale</h3>
              <p className="text-slate-400 text-sm font-medium">Réconciliation des profits opérationnels avec les charges de structure.</p>
            </div>
            
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-2">
              <AccountingRow label="Somme des Profits Piliers" value={pillarData.totalPillarProfit} type="revenue" />
              <AccountingRow label="Charges Fixes (OpEx)" value={pillarData.totalFixedCosts} type="expense" subLabel="Salaires, Loyers, Services" />
              <AccountingRow label="Impact Net Offres" value={pillarData.totalOffres} type={pillarData.totalOffres >= 0 ? 'revenue' : 'expense'} />
              <div className="pt-4 border-t border-white/10 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">Trésorerie Finale Estimée</span>
                  <span className="text-3xl font-black tabular-nums">{formatCurrency(pillarData.finalNet)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6">
            <div className="p-8 bg-blue-600 rounded-[2.5rem] shadow-xl shadow-blue-600/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-white/20 rounded-xl"><TrendingUp size={24} /></div>
                <h4 className="font-black text-lg">Indice de Santé</h4>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Le ratio de profitabilité opérationnelle (Piliers / OpEx) est de 
                <span className="font-black text-white px-2">
                  {pillarData.totalFixedCosts > 0 ? (pillarData.totalPillarProfit / pillarData.totalFixedCosts).toFixed(2) : 'N/A'}x
                </span>. 
                Une valeur supérieure à 2.0x indique une structure de coûts saine.
              </p>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (pillarData.totalPillarProfit / Math.max(1, pillarData.totalFixedCosts * 2)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl">
                <div className="flex items-center gap-3 mb-2 text-red-400">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Risque Retours</span>
                </div>
                <p className="text-xl font-black">{formatCurrency(pillarData.gros.retours + pillarData.vendeurs.retours + pillarData.merch.retours)}</p>
              </div>
              <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded-3xl">
                <div className="flex items-center gap-3 mb-2 text-purple-400">
                  <Receipt size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Ads</span>
                </div>
                <p className="text-xl font-black">{formatCurrency(pillarData.gros.ads + pillarData.vendeurs.ads + pillarData.merch.ads)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
