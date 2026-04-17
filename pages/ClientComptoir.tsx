import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { ClientComptoirStatus } from '../types.ts';
import { Plus, Trash2, Search, Package, TrendingUp, DollarSign, Wallet } from 'lucide-react';

const EditableCell: React.FC<{ value: any, onSave: (val: any) => void, type?: string, className?: string, options?: {value: string, label: string}[] }> = ({ value, onSave, type = 'text', className = '', options }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleBlur = () => { setIsEditing(false); if (val !== value) onSave(val); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleBlur(); if (e.key === 'Escape') { setVal(value); setIsEditing(false); } };

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <select autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={handleBlur} className={`w-full bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${className}`}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return <input type={type} autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className={`w-full bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${className}`} />;
  }
  return <div onClick={() => setIsEditing(true)} className={`cursor-text min-h-[24px] px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors ${className}`}>{type === 'number' ? Number(value).toLocaleString('fr-DZ') : value}</div>;
};

const ClientComptoirPage: React.FC = () => {
  const { getCalculatedClientComptoir, updateClientComptoir, addClientComptoir, deleteClientComptoir, dashboardDateStart, dashboardDateEnd } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const data = getCalculatedClientComptoir();

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.reference.toLowerCase().includes(searchTerm.toLowerCase()) || item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || item.produit.toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = item.created_at.split('T')[0];
      const matchDate = (!dashboardDateStart || itemDate >= dashboardDateStart) && (!dashboardDateEnd || itemDate <= dashboardDateEnd);
      return matchSearch && matchDate;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data, searchTerm, dashboardDateStart, dashboardDateEnd]);

  const totalVente = filteredData.reduce((acc, curr) => acc + Number(curr.vente), 0);
  const totalCharge = filteredData.reduce((acc, curr) => acc + Number(curr.charge), 0);
  const totalBenefice = filteredData.reduce((acc, curr) => acc + Number(curr.benefice_net), 0);

  const statusOptions = [
    { value: ClientComptoirStatus.EN_PRODUCTION, label: 'En Production' },
    { value: ClientComptoirStatus.EN_LIVRAISON, label: 'En Livraison' },
    { value: ClientComptoirStatus.PAYEE, label: 'Payée' },
    { value: ClientComptoirStatus.NON_PAYEE, label: 'Non Payée' }
  ];

  const getStatusColor = (status: ClientComptoirStatus) => {
    switch (status) {
      case ClientComptoirStatus.EN_PRODUCTION: return 'bg-amber-100 text-amber-800 border-amber-200';
      case ClientComptoirStatus.EN_LIVRAISON: return 'bg-blue-100 text-blue-800 border-blue-200';
      case ClientComptoirStatus.PAYEE: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case ClientComptoirStatus.NON_PAYEE: return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Client Comptoir</h2>
          <p className="text-slate-500 text-sm mt-1">Gestion des commandes comptoir</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64 shadow-sm" />
          </div>
          <button onClick={addClientComptoir} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 whitespace-nowrap">
            <Plus size={18} />
            <span className="hidden sm:inline">Nouvelle Commande</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={24} /></div>
          <div><p className="text-sm font-bold text-slate-500">Total Commandes</p><p className="text-2xl font-black text-slate-800">{filteredData.length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
          <div><p className="text-sm font-bold text-slate-500">Total Ventes</p><p className="text-2xl font-black text-slate-800">{totalVente.toLocaleString('fr-DZ')} DA</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><Wallet size={24} /></div>
          <div><p className="text-sm font-bold text-slate-500">Total Charges</p><p className="text-2xl font-black text-slate-800">{totalCharge.toLocaleString('fr-DZ')} DA</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-sm font-bold text-slate-500">Bénéfice Net</p><p className="text-2xl font-black text-slate-800">{totalBenefice.toLocaleString('fr-DZ')} DA</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Réf / Date</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Produit</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Charge</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Vente</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Bénéfice</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <EditableCell value={item.reference} onSave={v => updateClientComptoir(item.id, 'reference', v)} className="font-black text-slate-800" />
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{item.created_at.split('T')[0]}</div>
                  </td>
                  <td className="p-4"><EditableCell value={item.client_name} onSave={v => updateClientComptoir(item.id, 'client_name', v)} className="font-bold text-slate-700" /></td>
                  <td className="p-4"><EditableCell value={item.produit} onSave={v => updateClientComptoir(item.id, 'produit', v)} className="text-slate-600" /></td>
                  <td className="p-4"><EditableCell type="number" value={item.charge} onSave={v => updateClientComptoir(item.id, 'charge', v)} className="text-right font-bold text-rose-600" /></td>
                  <td className="p-4"><EditableCell type="number" value={item.vente} onSave={v => updateClientComptoir(item.id, 'vente', v)} className="text-right font-black text-emerald-600" /></td>
                  <td className="p-4 text-right font-black text-purple-600">{item.benefice_net.toLocaleString('fr-DZ')}</td>
                  <td className="p-4">
                    <EditableCell 
                      type="select" 
                      value={item.status} 
                      options={statusOptions} 
                      onSave={v => updateClientComptoir(item.id, 'status', v)} 
                      className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusColor(item.status)}`} 
                    />
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => { if (window.confirm('Supprimer cette commande ?')) deleteClientComptoir(item.id); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Aucune commande trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientComptoirPage;
