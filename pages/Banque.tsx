import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store.tsx';
import { Plus, Trash2, Building, Archive } from 'lucide-react';
import EditableCell from '../components/EditableCell.tsx';

const Banque = () => {
  const { 
    bankTransactions,
    addBankTransaction,
    updateBankTransaction,
    deleteBankTransaction,
    bankArchives,
    addBankArchive,
    updateBankArchive,
    deleteBankArchive,
    bankArchiveNotes,
    updateBankArchiveNote
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'actif' | 'archive'>('actif');

  const totalDisponible = useMemo(() => {
    return bankTransactions.reduce((acc, curr) => acc + Number(curr.somme || 0), 0);
  }, [bankTransactions]);

  const sortedTransactions = [...bankTransactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const sortedArchives = [...bankArchives].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Banque</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('actif')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'actif' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Disponible
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'archive' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Archive size={14} /> Archive
            </button>
          </div>
        </div>
        
        <button 
          onClick={activeTab === 'actif' ? addBankTransaction : addBankArchive}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Ajouter {activeTab === 'actif' ? 'Transaction' : 'Archive'}
        </button>
      </div>

      {activeTab === 'actif' && (
        <>
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
        </>
      )}

      {activeTab === 'archive' && (
        <div className="space-y-6">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Notes d'Archive</h2>
            <textarea
              className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-all"
              rows={4}
              placeholder="Ajouter des notes globales ici..."
              value={bankArchiveNotes[0]?.content || ''}
              onChange={(e) => updateBankArchiveNote(e.target.value)}
            />
          </div>

          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Somme</th>
                  <th className="px-6 py-4">TVA</th>
                  <th className="px-6 py-4 w-1/3">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedArchives.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EditableCell 
                        value={item.date} 
                        onSave={(val) => updateBankArchive(item.id, 'date', val)} 
                        type="date" 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      <EditableCell 
                        value={item.somme} 
                        onSave={(val) => updateBankArchive(item.id, 'somme', val)} 
                        type="number" 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <EditableCell 
                        value={item.tva} 
                        onSave={(val) => updateBankArchive(item.id, 'tva', val)} 
                        type="number" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <EditableCell 
                        value={item.description} 
                        onSave={(val) => updateBankArchive(item.id, 'description', val)} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => {
                          if (window.confirm('Supprimer cette archive ?')) deleteBankArchive(item.id);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedArchives.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                      Aucune archive bancaire
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

    </div>
  );
};

export default Banque;
