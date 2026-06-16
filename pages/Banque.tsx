import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { Plus, Trash2, Building } from 'lucide-react';
import EditableCell from '../components/EditableCell.tsx';

const Banque = () => {
  const { 
    bankTransactions,
    addBankTransaction,
    updateBankTransaction,
    deleteBankTransaction
  } = useAppStore();

  const totalDisponible = useMemo(() => {
    return bankTransactions.reduce((acc, curr) => acc + Number(curr.somme || 0), 0);
  }, [bankTransactions]);

  const sortedTransactions = [...bankTransactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Banque</h1>
        <button 
          onClick={addBankTransaction}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Ajouter Transaction
        </button>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl flex items-center gap-6">
        <div className="bg-white/20 p-4 rounded-2xl">
          <Building size={32} className="text-indigo-100" />
        </div>
        <div>
          <p className="text-indigo-100 font-bold mb-1 uppercase tracking-wider text-xs">Disponible</p>
          <p className="text-4xl font-black">{totalDisponible.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Somme</th>
                <th className="px-6 py-4 w-1/2">Note</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <EditableCell 
                      value={item.date} 
                      onSave={(val) => updateBankTransaction(item.id, 'date', val)} 
                      type="date" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    <EditableCell 
                      value={item.somme} 
                      onSave={(val) => updateBankTransaction(item.id, 'somme', val)} 
                      type="number" 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <EditableCell 
                      value={item.note} 
                      onSave={(val) => updateBankTransaction(item.id, 'note', val)} 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => {
                        if (window.confirm('Supprimer cette transaction ?')) deleteBankTransaction(item.id);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Aucune transaction bancaire
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

export default Banque;
