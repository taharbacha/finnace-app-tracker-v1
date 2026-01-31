
import React, { useRef } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface ExportDashboardPDFProps {
  data: any;
  globalKPIs: any;
  pillars: any;
  dateRange: { start: string; end: string };
  counts: any;
}

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const ExportDashboardPDF: React.FC<ExportDashboardPDFProps> = ({ data, globalKPIs, pillars, dateRange, counts }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleExport = () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Rapport_Financier_MerchDZ_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    window.html2pdf().from(element).set(opt).save().then(() => {
      setIsGenerating(false);
    });
  };

  const TableRow = ({ label, value, isBold = false, isNegative = false }: any) => (
    <div className={`flex justify-between py-2 border-b border-slate-100 ${isBold ? 'font-bold' : ''}`}>
      <span className="text-slate-600 text-xs uppercase tracking-tight">{label}</span>
      <span className={`text-sm ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>
        {isNegative && value !== 0 ? '-' : ''}{typeof value === 'number' ? formatCurrency(value) : value}
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
        {isGenerating ? 'Génération...' : 'Exporter PDF'}
      </button>

      {/* HIDDEN PRINT VIEW */}
      <div className="hidden">
        <div ref={reportRef} className="p-10 bg-white text-slate-900 font-sans" style={{ width: '190mm' }}>
          
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Merch By DZ</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rapport Financier Consolidé</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase">Période d'analyse</p>
              <p className="text-xs font-bold">Du {dateRange.start || "Début"} au {dateRange.end || "Aujourd'hui"}</p>
              <p className="text-[8px] text-slate-400 mt-1 uppercase">Généré le {new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>

          {/* GLOBAL SUMMARY */}
          <section className="mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-blue-600 border-l-4 border-blue-600 pl-4">Résumé Global</h2>
            <div className="grid grid-cols-1 gap-1">
              <TableRow label="Production Consolidée (Investissement)" value={globalKPIs.totalProd} />
              <TableRow label="Profit Brut Global (Ventes - Production)" value={globalKPIs.totalProfitNet} />
              <TableRow label="Profit Encaissé" value={data.encaisse_reel} />
              <TableRow label="Profit Attendu (Livrée Non Encaissée)" value={globalKPIs.lneProfit} />
              <TableRow label="Pertes de Retours (Stock Perdu)" value={globalKPIs.retLoss} isNegative />
              <TableRow label="Investissement Marketing Total" value={data.total_marketing_spend} isNegative />
              <TableRow label="Charges Fixes Opérationnelles" value={data.total_charges} isNegative />
              <TableRow label="Solde Net des Offres" value={data.net_offres} />
              
              <div className="mt-6 bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Bottom Line</p>
                   <h3 className="text-xs font-bold uppercase">Trésorerie Nette Finale</h3>
                </div>
                <span className="text-2xl font-black">{formatCurrency(data.profit_net_final)}</span>
              </div>
            </div>
          </section>

          {/* PILLAR 1: GROS */}
          <section style={{ pageBreakBefore: 'always' }} className="pt-10 mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-blue-600 border-l-4 border-blue-600 pl-4">Pilier 1: Commandes GROS</h2>
            <div className="bg-slate-50 p-6 rounded-2xl mb-4">
              <TableRow label="Profit Réalisé (LNE + LE)" value={pillars.gros.profitReal} isBold />
              <TableRow label="Marketing Spend (Pillar Scoped)" value={pillars.gros.mkt} isNegative />
              <TableRow label="Net Final Pilier" value={pillars.gros.profitReal - pillars.gros.mkt} isBold />
            </div>
            <div className="border border-slate-100 p-6 rounded-2xl">
              <TableRow label="Profit Potentiel (En Cours)" value={pillars.gros.profitPot} />
              <p className="text-[8px] text-slate-400 uppercase font-bold mt-1">* Note: Non comptabilisé dans le solde actuel</p>
            </div>
          </section>

          {/* PILLAR 2: VENDEURS */}
          <section style={{ pageBreakBefore: 'always' }} className="pt-10 mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-indigo-600 border-l-4 border-indigo-600 pl-4">Pilier 2: Commandes VENDEURS</h2>
            <div className="bg-slate-50 p-6 rounded-2xl mb-4">
              <TableRow label="Profit Net Entreprise" value={pillars.vendeurs.profitReal} isBold />
              <TableRow label="Commission Vendeurs (Variable déduite)" value={pillars.vendeurs.benefice} isNegative />
              <TableRow label="Marketing Spend (Siteweb)" value={pillars.vendeurs.mkt} isNegative />
              <TableRow label="Net Final Pilier" value={pillars.vendeurs.profitReal - pillars.vendeurs.mkt} isBold />
            </div>
          </section>

          {/* PILLAR 3: MERCH */}
          <section style={{ pageBreakBefore: 'always' }} className="pt-10 mb-12">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-emerald-600 border-l-4 border-emerald-600 pl-4">Pilier 3: Commandes MERCH</h2>
            <div className="bg-slate-50 p-6 rounded-2xl mb-4">
              <TableRow label="Profit Réalisé" value={pillars.merch.profitReal} isBold />
              <TableRow label="Production Investie" value={pillars.merch.prod} />
              <TableRow label="Marketing Spend" value={pillars.merch.mkt} isNegative />
              <TableRow label="Net Final Merch" value={pillars.merch.profitReal - pillars.merch.mkt} isBold />
            </div>
          </section>

          {/* DISTRIBUTION STATUS */}
          <section style={{ pageBreakBefore: 'always' }} className="pt-10">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-slate-900 border-l-4 border-slate-900 pl-4">Distribution Statutaire</h2>
            <div className="grid grid-cols-3 gap-8">
               <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Wholesale</h4>
                  <div className="text-xs space-y-1">
                    <p>En Production: <b>{counts.gros.prod}</b></p>
                    <p>En Livraison: <b>{counts.gros.liv}</b></p>
                    <p>Retours: <b>{counts.gros.ret}</b></p>
                  </div>
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Vendeurs</h4>
                  <div className="text-xs space-y-1">
                    <p>En Livraison: <b>{counts.vendeurs.liv}</b></p>
                    <p>Livré: <b>{counts.vendeurs.ok}</b></p>
                    <p>Retours: <b>{counts.vendeurs.ret}</b></p>
                  </div>
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Merch</h4>
                  <div className="text-xs space-y-1">
                    <p>En Livraison: <b>{counts.merch.liv}</b></p>
                    <p>Livré: <b>{counts.merch.ok}</b></p>
                    <p>Retours: <b>{counts.merch.ret}</b></p>
                  </div>
               </div>
            </div>
            
            <div className="mt-20 pt-10 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-300 uppercase tracking-widest font-black">Merch By DZ © 2025 — Système d'Exploitation Financier Privé</p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default ExportDashboardPDF;
