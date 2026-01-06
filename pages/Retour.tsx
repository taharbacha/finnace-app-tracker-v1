
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RotateCcw, Search, Trash2, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { Retour as IRetour } from '../types.ts';

// Supabase configuration local to the page to avoid store logic changes
const SUPABASE_URL = (window as any).process?.env?.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = (window as any).process?.env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const Retour: React.FC = () => {
  const [retours, setRetours] = useState<IRetour[]>([]);
  const [scanValue, setScanValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('commandes_retours')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setRetours(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Always maintain focus on input when mode is active
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (isScanning && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 500);
    return () => clearInterval(focusInterval);
  }, [isScanning]);

  // Handle Scan logic: Auto-save on change with stabilization (debounce)
  useEffect(() => {
    const trimmed = scanValue.trim();
    if (!trimmed || !isScanning || isProcessing) return;

    // Use a 400ms window for input to stabilize (finish scanner transmission)
    const saveTimeout = setTimeout(async () => {
      if (!supabase) return;
      
      const referenceToSave = trimmed;
      
      // STEP 1: Immediate state reset to allow next scan while processing
      setScanValue(''); 
      setIsProcessing(true);
      
      try {
        const { data, error } = await supabase
          .from('commandes_retours')
          .insert([{ order_reference: referenceToSave }])
          .select()
          .single();

        if (data && !error) {
          setRetours(prev => [data, ...prev]);
          setLastSaved(referenceToSave);
          
          // Reset success indicator after 2s
          setTimeout(() => setLastSaved(null), 2000);
        }
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        setIsProcessing(false);
      }
    }, 400); 

    return () => clearTimeout(saveTimeout);
  }, [scanValue, isScanning, isProcessing]);

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm('Supprimer ce retour ?')) return;
    const { error } = await supabase.from('commandes_retours').delete().eq('id', id);
    if (!error) setRetours(prev => prev.filter(r => r.id !== id));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-DZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <RotateCcw className="text-blue-600" size={28} />
            Gestion des Retours
          </h2>
          <p className="text-slate-500 text-sm font-medium">Enregistrement rapide des retours par scan code-barres.</p>
        </div>
        
        <button 
          onClick={() => {
            setIsScanning(!isScanning);
            if (!isScanning) {
              setScanValue('');
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-blue-500/10 active:scale-95
            ${isScanning ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}
        >
          {isScanning ? <CheckCircle2 size={18} /> : <Plus size={18} />}
          {isScanning ? 'Mode Scan Actif' : 'Démarrer Scan'}
        </button>
      </div>

      {isScanning && (
        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-4 text-emerald-400">
               {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
               <span className="text-xs font-black uppercase tracking-widest">
                {isProcessing ? "Sauvegarde en cours..." : "Prêt pour le scan"}
               </span>
            </div>
            
            <div className="relative">
              <input 
                ref={inputRef}
                autoFocus
                type="text"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                placeholder="Scannez ici..."
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-3xl px-6 py-5 text-2xl font-black text-white text-center outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
              />
              {lastSaved && (
                <div className="absolute -bottom-10 left-0 right-0 text-emerald-500 text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                  <CheckCircle2 size={16} />
                  Dernier scan enregistré: {lastSaved}
                </div>
              )}
            </div>
            
            <p className="text-slate-500 text-xs font-medium">L'enregistrement est automatique dès que le code est lu.</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Historique des Retours ({retours.length})</h3>
        </div>

        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
             <Loader2 size={32} className="animate-spin" />
             <span className="text-xs font-bold uppercase tracking-widest">Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-5">Référence Commande</th>
                  <th className="p-5">Date d'enregistrement</th>
                  <th className="p-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {retours.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 font-black text-slate-800 tracking-tight">{r.order_reference}</td>
                    <td className="p-5 text-sm font-medium text-slate-500">{formatDate(r.created_at)}</td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {retours.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-20 text-center">
                       <div className="flex flex-col items-center gap-4 text-slate-300">
                          <RotateCcw size={48} />
                          <p className="text-xs font-black uppercase tracking-widest">Aucun retour enregistré</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Retour;
