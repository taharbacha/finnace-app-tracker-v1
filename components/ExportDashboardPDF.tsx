
import React, { useRef } from 'react';
import { FileText, Loader2, ShieldCheck, AlertCircle, TrendingUp, Wallet } from 'lucide-react';

interface ExportDashboardPDFProps {
  data: any;
  globalKPIs: any;
  pillars: any;
  dateRange: { start: string; end: string };
  counts: any;
  rawLists: {
    charges: any[];
    marketingSpends: any[];
    payouts: any[];
    credits: any[];
  };
}

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const ExportDashboardPDF: React.FC<ExportDashboardPDFProps> = ({ data, globalKPIs, pillars, dateRange, counts, rawLists }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleExport = () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `FORENSIC_REPORT_MerchDZ_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    // @ts-ignore
    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsGenerating(false);
    });
  };

  const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="border-b-2 border-slate-900 pb-2 mb-4 mt-8">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{title}</h2>
      {subtitle && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{subtitle}</p>}
    </div>
  );

  const DenseTableRow = ({ label, value, subLabel, isNegative = false, isBold = false }: any) => (
    <div className={`flex justify-between py-1.5 border-b border-slate-100 ${isBold ? 'font-black' : ''}`}>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-600 uppercase tracking-tight">{label}</span>
        {subLabel && <span className="text-[8px] text-slate-400 italic">{subLabel}</span>}
      </div>
      <span className={`text-[11px] font-mono ${isNegative && value !== 0 ? 'text-red-600' : 'text-slate-900'}`}>
        {isNegative && value !== 0 ? '-' : ''}{typeof value === 'number' ? formatCurrency(Math.abs(value)) : value}
      </span>
    </div>
  );

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-800 disabled:opacity-50 shadow-sm"
      >
        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {isGenerating ? 'Audit Export...' : 'Exporter PDF'}
      </button>

      {/* RENDER VIEW (HIDDEN) */}
      <div className="hidden">
        <div ref={reportRef} className="p-8 bg-white text-slate-900 font-sans" style={{ width: '195mm' }}>
          
          {/* PAGE 1: COVER */}
          <div className="h-[270mm] flex flex-col justify-between border-4 border-slate-900 p-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-black">M</div>
                 <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Merch By DZ</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Financial Intelligence Unit</p>
                 </div>
              </div>
              
              <div className="pt-20">
                <h2 className="text-5xl font-black text-slate-900 leading-tight">FORENSIC<br/>FINANCIAL REPORT</h2>
                <div className="h-2 w-32 bg-slate-900 mt-6" />
              </div>

              <div className="pt-12 space-y-4">
                <div className="flex gap-12">
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400">Période Analysée</p>
                     <p className="font-bold">DU {dateRange.start || "DÉBUT"} AU {dateRange.end || "AUJOURD'HUI"}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400">Date d'Export</p>
                     <p className="font-bold">{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
               <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase">
                  <ShieldCheck size={16} /> Data Integrity Disclaimer
               </div>
               <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                Ce rapport constitue un audit transactionnel consolidé. Tous les calculs de profitabilité sont basés sur le modèle comptable Merch By DZ v5. Les chiffres "Encaissés" reflètent la liquidité réelle perçue, tandis que les chiffres "Attendus" (LNE) sont isolés pour l'évaluation du risque de trésorerie. Aucune projection de vente future n'est incluse.
               </p>
            </div>
          </div>

          {/* PAGE 2: GLOBAL SNAPSHOT */}
          <div className="h-[270mm] pt-10" style={{ pageBreakBefore: 'always' }}>
            <SectionHeader title="01. Global Financial Snapshot" subtitle="Consolidation Multi-Piliers & Flux Net" />
            
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 inline-block">Accounting Assets</h3>
                 <DenseTableRow label="Production Consolidée (COGS)" value={globalKPIs.totalProd} subLabel="Valeur totale achat + impression" />
                 <DenseTableRow label="Profit Brut Global" value={globalKPIs.totalProfitNet} subLabel="Ventes - Coûts production" />
                 <DenseTableRow label="Profit Réel Encaissé" value={data.encaisse_reel} subLabel="Liquidité nette confirmée" isBold />
                 <DenseTableRow label="Profit Attendu (LNE)" value={globalKPIs.lneProfit} subLabel="Ventes livrées non encaissées" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-1 inline-block">Structural Deductions</h3>
                 <DenseTableRow label="Investissement Marketing Total" value={data.total_marketing_spend} isNegative />
                 <DenseTableRow label="Charges Fixes Opérationnelles" value={data.total_charges} isNegative />
                 <DenseTableRow label="Pertes de Retours (Stock Perdu)" value={globalKPIs.retLoss} isNegative />
                 <DenseTableRow label="Impact Net des Offres" value={data.net_offres} />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] flex justify-between items-center shadow-xl">
               <div className="space-y-1">
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Corporate Balance</p>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Trésorerie Nette Finale</h3>
                  <p className="text-slate-400 text-[9px] uppercase font-medium">Après déduction de toutes les charges et investissements</p>
               </div>
               <div className="text-right">
                  <span className="text-4xl font-black font-mono tracking-tighter">{formatCurrency(data.profit_net_final)}</span>
               </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4">
               <div className="p-4 border border-slate-100 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Ratio Profitabilité</p>
                  <p className="text-lg font-black">{(data.profit_net_final / Math.max(1, data.total_charges)).toFixed(2)}x</p>
               </div>
               <div className="p-4 border border-slate-100 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Exposition Retours</p>
                  <p className="text-lg font-black text-red-600">{(globalKPIs.retLoss / Math.max(1, globalKPIs.totalProd) * 100).toFixed(1)}%</p>
               </div>
               <div className="p-4 border border-slate-100 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Liquidité Immédiate</p>
                  <p className="text-lg font-black text-emerald-600">{(data.encaisse_reel / Math.max(1, data.profit_net_final) * 100).toFixed(1)}%</p>
               </div>
            </div>
          </div>

          {/* PAGE 3: PILLAR RENTABILITÉ */}
          <div className="h-[270mm] pt-10" style={{ pageBreakBefore: 'always' }}>
            <SectionHeader title="02. Forensic Rentabilité par Pilier" subtitle="Waterfall Profit Breakdown (Ventes - Coûts = Net)" />
            
            <div className="space-y-10">
              {/* GROS */}
              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/30">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase text-blue-600 text-xs">Pillar I: Commandes Wholesale (GROS)</h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">Net Final = Ventes - (Prod + Ads + Retours)</span>
                </div>
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-1">
                      <DenseTableRow label="Ventes Réalisées (LE + LNE)" value={pillars.gros.profitReal + (globalKPIs.totalProd - globalKPIs.retLoss)} />
                      <DenseTableRow label="Cout Production (COGS)" value={pillars.gros.profitReal === 0 ? 0 : (globalKPIs.totalProd - globalKPIs.retLoss)} isNegative />
                   </div>
                   <div className="space-y-1">
                      <DenseTableRow label="Marketing Scoped (Ads)" value={pillars.gros.mkt} isNegative />
                      <DenseTableRow label="Net Final Pilier" value={pillars.gros.profitReal - pillars.gros.mkt} isBold />
                   </div>
                </div>
              </div>

              {/* VENDEURS */}
              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/30">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase text-indigo-600 text-xs">Pillar II: Commandes Retail (VENDEURS)</h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">Net = Profit Net Entreprise - (Commissions + Ads)</span>
                </div>
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-1">
                      <DenseTableRow label="Profit Net Entreprise" value={pillars.vendeurs.profitReal} />
                      <DenseTableRow label="Commissions Vendeurs" value={pillars.vendeurs.benefice} isNegative subLabel="Charge variable déduite" />
                   </div>
                   <div className="space-y-1">
                      <DenseTableRow label="Marketing Scoped (Siteweb)" value={pillars.vendeurs.mkt} isNegative />
                      <DenseTableRow label="Net Final Pilier" value={pillars.vendeurs.profitReal - pillars.vendeurs.mkt} isBold />
                   </div>
                </div>
              </div>

              {/* MERCH */}
              <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/30">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black uppercase text-emerald-600 text-xs">Pillar III: Commandes Directes (MERCH)</h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">Net = Profit - (Ads + Retours)</span>
                </div>
                <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-1">
                      <DenseTableRow label="Profit Opérationnel" value={pillars.merch.profitReal} />
                      <DenseTableRow label="Production Investie" value={pillars.merch.prod} subLabel="Référence informationnelle" />
                   </div>
                   <div className="space-y-1">
                      <DenseTableRow label="Marketing Scoped (Ads)" value={pillars.merch.mkt} isNegative />
                      <DenseTableRow label="Net Final Merch" value={pillars.merch.profitReal - pillars.merch.mkt} isBold />
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 4: OPERATIONAL DISTRIBUTION */}
          <div className="h-[270mm] pt-10" style={{ pageBreakBefore: 'always' }}>
            <SectionHeader title="03. Operational Status Distribution" subtitle="Friction Index & Volume Segmentation" />
            
            <div className="grid grid-cols-1 gap-12">
               {['GROS', 'VENDEURS', 'MERCH'].map((pName, idx) => {
                  const pKey = pName.toLowerCase();
                  const pCounts = counts[pKey === 'gros' ? 'gros' : pKey === 'vendeurs' ? 'vendeurs' : 'merch'];
                  const total = Object.values(pCounts).reduce((a: any, b: any) => a + b, 0) as number;

                  return (
                    <div key={idx} className="space-y-4">
                      <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-400 border-l-4 border-slate-200 pl-3">{pName} Pipeline</h4>
                      <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-900 text-white text-[9px] font-black uppercase">
                              <th className="p-2 rounded-tl-xl">Statut de Commande</th>
                              <th className="p-2 text-center">Quantité</th>
                              <th className="p-2 text-right rounded-tr-xl">Part du Volume</th>
                           </tr>
                        </thead>
                        <tbody className="text-[10px] font-bold divide-y divide-slate-100 border border-slate-100">
                           {Object.entries(pCounts).map(([k, v]: any) => (
                             <tr key={k}>
                               <td className="p-2 capitalize text-slate-600">{k.replace('ok', 'Livré/Payé').replace('liv', 'En Livraison').replace('ret', 'Retours').replace('prod', 'En Production')}</td>
                               <td className="p-2 text-center text-slate-900">{v}</td>
                               <td className="p-2 text-right text-slate-400">{total > 0 ? ((v / total) * 100).toFixed(1) : 0}%</td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                  );
               })}
            </div>
          </div>

          {/* PAGE 5: GRANULAR LEDGERS */}
          <div className="h-[270mm] pt-10" style={{ pageBreakBefore: 'always' }}>
            <SectionHeader title="04. Granular Ledgers (Evidence)" subtitle="Raw Transactional Data Tracking" />
            
            <div className="space-y-10">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400">Dernières Charges Opérationnelles</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[8px] font-black uppercase border-b border-slate-100">
                      <tr><th className="p-2">Date</th><th className="p-2">Label</th><th className="p-2 text-right">Montant</th></tr>
                    </thead>
                    <tbody className="text-[9px] divide-y divide-slate-50">
                      {rawLists.charges.slice(0, 15).map((c, i) => (
                        <tr key={i}><td className="p-2 text-slate-400">{c.date}</td><td className="p-2 font-bold">{c.label}</td><td className="p-2 text-right font-mono">{formatCurrency(c.montant)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400">Marketing ROI Evidence</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[8px] font-black uppercase border-b border-slate-100">
                          <tr><th className="p-2">Pillar</th><th className="p-2 text-right">Budget Spent</th></tr>
                        </thead>
                        <tbody className="text-[9px] divide-y divide-slate-50">
                          {rawLists.marketingSpends.slice(0, 8).map((m, i) => (
                            <tr key={i}><td className="p-2 font-bold uppercase">{m.source}</td><td className="p-2 text-right font-mono">{formatCurrency(m.amount)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400">Client Credits (Debts)</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[8px] font-black uppercase border-b border-slate-100">
                          <tr><th className="p-2">Client</th><th className="p-2 text-right">Somme</th></tr>
                        </thead>
                        <tbody className="text-[9px] divide-y divide-slate-50">
                          {rawLists.credits.filter(c => c.status === 'non_payee').slice(0, 8).map((c, i) => (
                            <tr key={i}><td className="p-2 font-bold">{c.client}</td><td className="p-2 text-right font-mono text-red-600">{formatCurrency(c.somme)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* PAGE 6: FINAL AUDIT & RISK */}
          <div className="h-[270mm] pt-10" style={{ pageBreakBefore: 'always' }}>
            <SectionHeader title="05. Final Audit & Risk Interpretation" subtitle="System-Generated Strategic Overview" />
            
            <div className="space-y-12">
               <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400">
                        <TrendingUp size={14} /> Realism Ratio
                     </div>
                     <p className="text-[11px] leading-relaxed font-medium">
                        Le profit **Réel Encaissé** ({formatCurrency(data.encaisse_reel)}) représente **{((data.encaisse_reel / Math.max(1, data.profit_net_final)) * 100).toFixed(1)}%** du profit net total estimé. 
                        {data.encaisse_reel < globalKPIs.lneProfit ? " Attention: La majorité du profit est actuellement bloquée en LNE, posant un risque de liquidité court terme." : " La structure de trésorerie est saine avec une forte conversion de ventes en cash réel."}
                     </p>
                  </div>
                  <div className="p-6 bg-red-50 border border-red-100 rounded-3xl space-y-4">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600">
                        <AlertCircle size={14} /> Return Exposure Audit
                     </div>
                     <p className="text-[11px] leading-relaxed font-medium text-red-800">
                        Le coût des retours ({formatCurrency(globalKPIs.retLoss)}) impacte la rentabilité brute à hauteur de **{((globalKPIs.retLoss / Math.max(1, globalKPIs.totalProfitNet)) * 100).toFixed(1)}%**. Une augmentation de ce ratio au-delà de 15% nécessite une révision immédiate des processus de confirmation de commande.
                     </p>
                  </div>
               </div>

               <div className="p-10 border-2 border-dashed border-slate-200 rounded-[3rem] text-center space-y-4">
                  <ShieldCheck size={48} className="mx-auto text-slate-300" />
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Certification de Données</h3>
                  <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">
                    Ce rapport reflète la réalité comptable au timestamp de génération. Aucun ajustement manuel ou projection optimiste n'a été appliqué aux données transactionnelles sources.
                  </p>
               </div>

               <div className="pt-20 text-center space-y-2">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Merch By DZ © 2025 — Système d'Exploitation Financier Privé</p>
                  <p className="text-[8px] font-bold text-slate-200 uppercase">Document Classifié • Usage Interne Exclusivement</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ExportDashboardPDF;
