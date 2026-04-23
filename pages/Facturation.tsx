
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  Document, 
  DocumentType, 
  DocumentStatus, 
  DocumentItem 
} from '../types.ts';
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  Calendar,
  ArrowLeft,
  Save,
  Printer,
  Truck
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import StatusBadge from '../components/StatusBadge.tsx';
import EditableCell from '../components/EditableCell.tsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_CONFIG } from '../constants/companyConfig.ts';

const Facturation: React.FC = () => {
  const formatDA = (n: number) => {
    const parts = n.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',') + ' DA';
  };

  const { 
    documentItems, 
    addDocument, 
    updateDocument, 
    deleteDocument,
    addDocumentItem,
    updateDocumentItem,
    deleteDocumentItem,
    getCalculatedDocuments
  } = useAppStore();

  const calculatedDocs = useMemo(() => getCalculatedDocuments(), [getCalculatedDocuments]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    return calculatedDocs.filter(doc => {
      const matchesSearch = 
        doc.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.client_nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [calculatedDocs, searchTerm, typeFilter, statusFilter]);

  const selectedDoc = useMemo(() => 
    calculatedDocs.find(d => d.id === selectedDocId), 
    [calculatedDocs, selectedDocId]
  );

  const selectedItems = useMemo(() => 
    documentItems.filter(item => item.document_id === selectedDocId),
    [documentItems, selectedDocId]
  );

  const handleCreate = async (type: DocumentType) => {
    const id = await addDocument(type);
    if (id) setSelectedDocId(id);
  };

  const generatePDF = (doc: Document, items: DocumentItem[]) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    
    // --- 1. EN-TÊTE ENTREPRISE (GAUCHE) ---
    pdf.setFontSize(9);
    pdf.setTextColor(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text(COMPANY_CONFIG.name, margin, 20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    const companyInfo = [
      COMPANY_CONFIG.address,
      `Capital social : ${COMPANY_CONFIG.capital}`,
      `RC : ${COMPANY_CONFIG.rc}`,
      `ART IMPOS : ${COMPANY_CONFIG.artImpos}`,
      `NIF : ${COMPANY_CONFIG.nif}`,
      `NIS : ${COMPANY_CONFIG.nis}`,
      `RIB : ${COMPANY_CONFIG.rib}`,
      `Tel / Fax : ${COMPANY_CONFIG.telFax}`,
      COMPANY_CONFIG.reference,
      `BPN : ${COMPANY_CONFIG.bpn}`
    ];
    companyInfo.forEach((line, i) => {
      pdf.text(line, margin, 25 + (i * 3.5));
    });

    // --- 2. TITRE DU DOCUMENT (DROITE) ---
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const title = (doc.type === DocumentType.FACTURE || doc.type === DocumentType.FACTURE_REAL) ? 'FACTURE' : 
                  doc.type === DocumentType.PROFORMA ? 'FACTURE PROFORMA' : 'BON DE LIVRAISON';
    pdf.text(title, pageWidth - margin, 25, { align: 'right' });

    // RÉFÉRENCE & DATE
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Référence: ${doc.reference}`, pageWidth - margin, 35, { align: 'right' });
    pdf.text(`Date: ${format(parseISO(doc.date), 'dd/MM/yyyy')}`, pageWidth - margin, 40, { align: 'right' });

    // Ligne de séparation
    pdf.setDrawColor(200);
    pdf.line(margin, 65, pageWidth - margin, 65);

    // --- 3. BLOC CLIENT (GAUCHE) ---
    const clientX = margin;
    const clientY = 75;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESTINATAIRE:', clientX, clientY);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const clientNom = (doc.client_nom || '').trim() || 'N/A';
    pdf.text(clientNom, clientX, clientY + 7);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    let currentClientY = clientY + 12;
    if (doc.client_adresse) {
      const splitAddress = pdf.splitTextToSize(doc.client_adresse, pageWidth - clientX - margin);
      pdf.text(splitAddress, clientX, currentClientY);
      currentClientY += (splitAddress.length * 4);
    }
    if (doc.client_telephone) {
      pdf.text(`Tél: ${doc.client_telephone}`, clientX, currentClientY);
      currentClientY += 4;
    }
    if (doc.client_rc) {
      pdf.text(`RC: ${doc.client_rc}`, clientX, currentClientY);
      currentClientY += 4;
    }
    if (doc.client_nif) {
      pdf.text(`NIF: ${doc.client_nif}`, clientX, currentClientY);
      currentClientY += 4;
    }
    if (doc.client_nis) {
      pdf.text(`NIS: ${doc.client_nis}`, clientX, currentClientY);
      currentClientY += 4;
    }
    if (doc.client_ai) {
      pdf.text(`AI: ${doc.client_ai}`, clientX, currentClientY);
      currentClientY += 4;
    }

    // --- 4. TABLEAU DES ARTICLES ---
    const tableStartY = Math.max(currentClientY + 10, 105);
    
    autoTable(pdf, {
      startY: tableStartY,
      head: [['Article', 'Quantité', 'P.U (DA)', 'Total (DA)']],
      body: items.length > 0 ? items.map(item => [
        item.article,
        item.quantite,
        formatDA(item.prix_unitaire),
        formatDA(item.total_ligne)
      ]) : [['Aucun article', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // --- 5. TOTAUX (DYNAMIQUE) ---
    let finalY = (pdf as any).lastAutoTable?.finalY || tableStartY + 20;
    
    // Vérifier s'il reste assez de place sur la page pour les totaux
    if (finalY > 240) {
      pdf.addPage();
      finalY = 20;
    }

    const totalX = pageWidth - margin;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(`Total HT:`, totalX - 50, finalY + 10);
    pdf.text(formatDA(doc.total_ht), totalX, finalY + 10, { align: 'right' });
    
    let currentTotalY = finalY + 16;
    if (doc.type !== DocumentType.BON_LIVRAISON) {
      pdf.text(`TVA (${doc.tva_percent}%):`, totalX - 50, currentTotalY);
      pdf.text(formatDA(doc.tva_amount), totalX, currentTotalY, { align: 'right' });
      currentTotalY += 6;
    }
    
    if (doc.shipping > 0) {
      pdf.text(`Livraison:`, totalX - 50, currentTotalY);
      pdf.text(formatDA(doc.shipping), totalX, currentTotalY, { align: 'right' });
      currentTotalY += 6;
    }
    
    if (doc.timbre > 0) {
      pdf.text(`Timbre:`, totalX - 50, currentTotalY);
      pdf.text(formatDA(doc.timbre), totalX, currentTotalY, { align: 'right' });
      currentTotalY += 6;
    }

    // Encadré Total TTC
    pdf.setFillColor(245, 245, 245);
    pdf.rect(totalX - 60, currentTotalY, 60, 10, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`TOTAL TTC:`, totalX - 58, currentTotalY + 6.5);
    pdf.text(formatDA(doc.total_ttc), totalX - 2, currentTotalY + 6.5, { align: 'right' });
    
    currentTotalY += 16;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Versement:`, totalX - 50, currentTotalY);
    pdf.text(formatDA(doc.versement), totalX, currentTotalY, { align: 'right' });
    
    pdf.setFont('helvetica', 'bold');
    if (doc.total_ttc - doc.versement > 0) {
      pdf.setTextColor(200, 0, 0);
    } else {
      pdf.setTextColor(0, 150, 0);
    }
    pdf.text(`Reste à payer:`, totalX - 50, currentTotalY + 6);
    pdf.text(formatDA(doc.total_ttc - doc.versement), totalX, currentTotalY + 6, { align: 'right' });

    pdf.save(`${doc.reference}.pdf`);
  };

  if (selectedDocId && selectedDoc) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedDocId(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-bold"
          >
            <ArrowLeft size={20} />
            Retour à la liste
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => generatePDF(selectedDoc, selectedItems)}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all font-bold"
            >
              <Download size={18} />
              Exporter PDF
            </button>
            <button 
              onClick={() => updateDocument(selectedDoc.id, { status: DocumentStatus.VALIDATED })}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20"
            >
              <Save size={18} />
              Valider le document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <FileText className="text-blue-600" />
                  Détails du Document
                </h2>
                <StatusBadge status={selectedDoc.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Référence</label>
                    <div className="p-3 bg-slate-50 rounded-xl font-mono font-bold text-slate-700">{selectedDoc.reference}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Type</label>
                    <select 
                      value={selectedDoc.type}
                      onChange={(e) => updateDocument(selectedDoc.id, { type: e.target.value as DocumentType })}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 border-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value={DocumentType.FACTURE}>Facture</option>
                      <option value={DocumentType.FACTURE_REAL}>Facture REAL</option>
                      <option value={DocumentType.PROFORMA}>Proforma</option>
                      <option value={DocumentType.BON_LIVRAISON}>Bon de Livraison</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                    <input 
                      type="date"
                      value={selectedDoc.date}
                      onChange={(e) => updateDocument(selectedDoc.id, { date: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 border-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Client</label>
                    <input 
                      type="text"
                      placeholder="Nom du client"
                      value={selectedDoc.client_nom}
                      onChange={(e) => updateDocument(selectedDoc.id, { client_nom: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 border-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Téléphone</label>
                    <input 
                      type="text"
                      placeholder="N° de téléphone"
                      value={selectedDoc.client_telephone || ''}
                      onChange={(e) => updateDocument(selectedDoc.id, { client_telephone: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 border-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Adresse</label>
                    <textarea 
                      rows={3}
                      placeholder="Adresse complète"
                      value={selectedDoc.client_adresse}
                      onChange={(e) => updateDocument(selectedDoc.id, { client_adresse: e.target.value })}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 border-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Articles</h3>
                <button 
                  onClick={() => addDocumentItem(selectedDoc.id)}
                  className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all font-bold text-sm"
                >
                  <Plus size={16} />
                  Ajouter un article
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">P.U (DA)</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <EditableCell 
                            value={item.article}
                            onSave={(val) => updateDocumentItem(item.id, { article: val })}
                            placeholder="Désignation"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <EditableCell 
                            value={item.quantite}
                            type="number"
                            onSave={(val) => updateDocumentItem(item.id, { quantite: Number(val) })}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <EditableCell 
                            value={item.prix_unitaire}
                            type="number"
                            onSave={(val) => updateDocumentItem(item.id, { prix_unitaire: Number(val) })}
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">
                          {formatDA(item.total_ligne)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => deleteDocumentItem(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {selectedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                          Aucun article ajouté. Cliquez sur "Ajouter un article" pour commencer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Client Details (Extra) */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Informations Fiscales</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RC</label>
                  <input 
                    type="text"
                    value={selectedDoc.client_rc}
                    onChange={(e) => updateDocument(selectedDoc.id, { client_rc: e.target.value })}
                    className="w-full p-2 bg-slate-50 rounded-lg font-bold text-slate-700 border-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NIF</label>
                  <input 
                    type="text"
                    value={selectedDoc.client_nif}
                    onChange={(e) => updateDocument(selectedDoc.id, { client_nif: e.target.value })}
                    className="w-full p-2 bg-slate-50 rounded-lg font-bold text-slate-700 border-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NIS</label>
                  <input 
                    type="text"
                    value={selectedDoc.client_nis}
                    onChange={(e) => updateDocument(selectedDoc.id, { client_nis: e.target.value })}
                    className="w-full p-2 bg-slate-50 rounded-lg font-bold text-slate-700 border-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI</label>
                  <input 
                    type="text"
                    value={selectedDoc.client_ai}
                    onChange={(e) => updateDocument(selectedDoc.id, { client_ai: e.target.value })}
                    className="w-full p-2 bg-slate-50 rounded-lg font-bold text-slate-700 border-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <Printer className="text-blue-400" />
                Résumé Financier
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-sm">Total HT</span>
                  <span className="font-mono font-bold">{formatDA(selectedDoc.total_ht)}</span>
                </div>
                
                {selectedDoc.type !== DocumentType.BON_LIVRAISON && (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-sm">TVA</span>
                        <input 
                          type="number"
                          value={selectedDoc.tva_percent}
                          onChange={(e) => updateDocument(selectedDoc.id, { tva_percent: Number(e.target.value) })}
                          className="w-12 bg-slate-800 border-none rounded-lg text-[10px] font-black p-1 text-center"
                        />
                        <span className="text-slate-500 text-[10px]">%</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">+{formatDA(selectedDoc.tva_amount)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-sm">Livraison</span>
                  <input 
                    type="number"
                    value={selectedDoc.shipping}
                    onChange={(e) => updateDocument(selectedDoc.id, { shipping: Number(e.target.value) })}
                    className="w-20 bg-slate-800 border-none rounded-lg text-xs font-bold p-1 text-right"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-sm">Timbre</span>
                  <input 
                    type="number"
                    value={selectedDoc.timbre}
                    onChange={(e) => updateDocument(selectedDoc.id, { timbre: Number(e.target.value) })}
                    className="w-20 bg-slate-800 border-none rounded-lg text-xs font-bold p-1 text-right"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-blue-400 font-black uppercase tracking-widest text-xs">Total TTC</span>
                    <span className="text-2xl font-black text-blue-400">{formatDA(selectedDoc.total_ttc)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-sm">Versement</span>
                    <input 
                      type="number"
                      value={selectedDoc.versement}
                      onChange={(e) => updateDocument(selectedDoc.id, { versement: Number(e.target.value) })}
                      className="w-24 bg-slate-800 border-none rounded-lg text-sm font-bold p-1 text-right text-emerald-400"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-400 font-bold text-sm">Reste à payer</span>
                    <span className="font-mono font-bold text-red-400">
                      {formatDA(selectedDoc.total_ttc - selectedDoc.versement)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Facturation</h1>
          <p className="text-slate-500 font-bold">Gérez vos factures, proformas et bons de livraison</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl hover:bg-blue-700 transition-all font-black shadow-xl shadow-blue-600/20">
              <Plus size={20} />
              Nouveau Document
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button onClick={() => handleCreate(DocumentType.FACTURE)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors font-bold text-slate-700">
                <FileText size={18} className="text-blue-600" /> Facture
              </button>
              <button onClick={() => handleCreate(DocumentType.FACTURE_REAL)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors font-bold text-slate-700">
                <FileText size={18} className="text-indigo-600" /> Facture REAL
              </button>
              <button onClick={() => handleCreate(DocumentType.PROFORMA)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors font-bold text-slate-700">
                <FileText size={18} className="text-amber-500" /> Proforma
              </button>
              <button onClick={() => handleCreate(DocumentType.BON_LIVRAISON)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors font-bold text-slate-700">
                <Truck size={18} className="text-emerald-500" /> Bon de Livraison
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Rechercher par référence ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 min-w-[160px]"
          >
            <option value="ALL">Tous les types</option>
            <option value={DocumentType.FACTURE}>Factures</option>
            <option value={DocumentType.FACTURE_REAL}>Factures REAL</option>
            <option value={DocumentType.PROFORMA}>Proformas</option>
            <option value={DocumentType.BON_LIVRAISON}>Bons de Livraison</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 min-w-[160px]"
          >
            <option value="ALL">Tous les status</option>
            <option value={DocumentStatus.DRAFT}>Brouillon</option>
            <option value={DocumentStatus.VALIDATED}>Validé</option>
            <option value={DocumentStatus.PAID}>Payé</option>
            <option value={DocumentStatus.CANCELED}>Annulé</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDocs.map((doc) => (
            <motion.div
              layout
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
              onClick={() => setSelectedDocId(doc.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${
                  doc.type === DocumentType.FACTURE ? 'bg-blue-50 text-blue-600' :
                  doc.type === DocumentType.FACTURE_REAL ? 'bg-indigo-50 text-indigo-600' :
                  doc.type === DocumentType.PROFORMA ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  <FileText size={24} />
                </div>
                <StatusBadge status={doc.status} />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{doc.reference}</span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {format(new Date(doc.date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800 line-clamp-1">{doc.client_nom || 'Client non spécifié'}</h3>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total TTC</p>
                  <p className="text-xl font-black text-slate-900">{formatDA(doc.total_ttc)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const items = documentItems.filter(i => i.document_id === doc.id);
                      generatePDF(doc, items);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Télécharger PDF"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                        deleteDocument(doc.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDocs.length === 0 && (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Aucun document trouvé</h3>
          <p className="text-slate-500 font-bold max-w-md mx-auto">
            Commencez par créer votre premier document en cliquant sur le bouton "Nouveau Document" ci-dessus.
          </p>
        </div>
      )}
    </div>
  );
};

export default Facturation;
