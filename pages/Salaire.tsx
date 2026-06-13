import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { Plus, Trash2, Users } from 'lucide-react';
import EditableCell from '../components/EditableCell.tsx';

const Salaire = () => {
  const { 
    employes, addEmploye, updateEmploye, deleteEmploye,
    salairePayments, addSalairePayment, updateSalairePayment, deleteSalairePayment
  } = useAppStore();

  const employeStats = useMemo(() => {
    return employes.map(emp => {
      const totalPayments = salairePayments
        .filter(p => p.employe_id === emp.id)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      const salaireRestant = Number(emp.salaire_base || 0) - totalPayments;
      
      return {
        ...emp,
        totalPayments,
        salaireRestant
      };
    });
  }, [employes, salairePayments]);

  return (
    <div className="space-y-10">
      
      {/* SECTION EMPLOYES */}
      <section className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-xl"><Users size={24} className="text-white"/></div>
            <div>
              <h2 className="text-xl font-bold">Employés</h2>
              <p className="text-slate-400 text-sm">Gestion des salaires de base</p>
            </div>
          </div>
          <button 
            onClick={addEmploye}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Nouvel Employé
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employeStats.map(emp => (
            <div key={emp.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative group space-y-4">
               <button 
                  onClick={() => { if (window.confirm("Supprimer l'employé et toutes ses avances ?")) deleteEmploye(emp.id); }}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
                
               <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">
                    <EditableCell 
                      value={emp.nom} 
                      onSave={(val) => updateEmploye(emp.id, 'nom', val)} 
                    />
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Base:</span>
                    <span className="font-bold text-slate-700">
                      <EditableCell 
                        value={emp.salaire_base} 
                        onSave={(val) => updateEmploye(emp.id, 'salaire_base', val)} 
                        type="number"
                      /> DZD
                    </span>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Reçu (Avances)</p>
                    <p className="font-black text-rose-500">{emp.totalPayments.toLocaleString()} DZD</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Reste à payer</p>
                    <p className="font-black text-emerald-600">{emp.salaireRestant.toLocaleString()} DZD</p>
                  </div>
               </div>
            </div>
          ))}
          {employeStats.length === 0 && (
             <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                Aucun employé. Ajoutez pour commencer.
             </div>
          )}
        </div>
      </section>

      {/* SECTION AVANCES / PAIEMENTS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Avances & Revenus Versés</h2>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employé</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Somme Versée</th>
                  <th className="px-6 py-4 w-1/3">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salairePayments.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(payment => {
                  const emp = employes.find(e => e.id === payment.employe_id);
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {emp?.nom || 'Employé inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EditableCell 
                          value={payment.date} 
                          onSave={(val) => updateSalairePayment(payment.id, 'date', val)} 
                          type="date" 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-rose-500">
                        <EditableCell 
                          value={payment.amount} 
                          onSave={(val) => updateSalairePayment(payment.id, 'amount', val)} 
                          type="number" 
                        /> DZD
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <EditableCell 
                          value={payment.description} 
                          onSave={(val) => updateSalairePayment(payment.id, 'description', val)} 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => { if (window.confirm('Supprimer ce paiement ?')) deleteSalairePayment(payment.id); }}
                          className="text-red-400 hover:text-red-600 transition-colors p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {/* Last row for adding new payment is mapped below for each employee, wait, let's just create a general Add row or dropdown */}
                <tr className="bg-indigo-50/50">
                  <td className="px-6 py-4" colSpan={5}>
                     <div className="flex items-center gap-4">
                        <select 
                          className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                          onChange={(e) => {
                            if(e.target.value) {
                              addSalairePayment(e.target.value);
                              e.target.value = "";
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>+ Ajouter un versement pour...</option>
                          {employes.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                        </select>
                     </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Salaire;
