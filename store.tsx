
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CommandeGros, CommandeExtern, Offre, InventoryItem,
  CalculatedGros, CalculatedExtern, DashboardData,
  GrosStatus, ExternStatus, OffreType
} from './types.ts';
import { INITIAL_GROS, INITIAL_EXTERN, INITIAL_OFFRES } from './constants.ts';

const SUPABASE_URL = (window as any).process?.env?.SUPABASE_URL || '';
const SUPABASE_KEY = (window as any).process?.env?.SUPABASE_ANON_KEY || '';
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

interface AppState {
  gros: CommandeGros[];
  extern: CommandeExtern[];
  offres: Offre[];
  inventory: InventoryItem[];
  isAuthenticated: boolean;
  isSyncing: boolean;
  isCloudActive: boolean;
  lastSynced: string | null;
  login: (password: string) => boolean;
  logout: () => void;
  updateGros: (id: string, field: keyof CommandeGros, value: any) => void;
  addGros: () => void;
  deleteGros: (id: string) => void;
  // Added importGros to satisfy CommandesGros.tsx
  importGros: (data: any[]) => void;
  updateExtern: (id: string, field: keyof CommandeExtern, value: any) => void;
  addExtern: () => void;
  deleteExtern: (id: string) => void;
  // Added importExtern to satisfy CommandesDetail.tsx
  importExtern: (data: any[]) => void;
  updateOffre: (id: string, field: keyof Offre, value: any) => void;
  addOffre: () => void;
  deleteOffre: (id: string) => void;
  // Added importOffres to satisfy Offres.tsx
  importOffres: (data: any[]) => void;
  updateInventory: (id: string, field: keyof InventoryItem, value: any) => void;
  addInventory: () => void;
  deleteInventory: (id: string) => void;
  getCalculatedGros: () => CalculatedGros[];
  getCalculatedExtern: () => CalculatedExtern[];
  getDashboardData: () => DashboardData;
  syncData: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);
const ADMIN_PASSWORD = (window as any).process?.env?.APP_PASSWORD || "merchdz_private_2025";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('merch_dz_auth') === 'true');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudActive] = useState(!!supabase);
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('merch_dz_last_sync'));

  const [gros, setGros] = useState<CommandeGros[]>(() => JSON.parse(localStorage.getItem('merch_dz_gros') || JSON.stringify(INITIAL_GROS)));
  const [extern, setExtern] = useState<CommandeExtern[]>(() => JSON.parse(localStorage.getItem('merch_dz_extern') || JSON.stringify(INITIAL_EXTERN)));
  const [offres, setOffres] = useState<Offre[]>(() => JSON.parse(localStorage.getItem('merch_dz_offres') || JSON.stringify(INITIAL_OFFRES)));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => JSON.parse(localStorage.getItem('merch_dz_inventory') || '[]'));

  useEffect(() => {
    localStorage.setItem('merch_dz_gros', JSON.stringify(gros));
    localStorage.setItem('merch_dz_extern', JSON.stringify(extern));
    localStorage.setItem('merch_dz_offres', JSON.stringify(offres));
    localStorage.setItem('merch_dz_inventory', JSON.stringify(inventory));
  }, [gros, extern, offres, inventory]);

  const syncData = useCallback(async () => {
    if (!supabase || !isAuthenticated) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        supabase.from('gros_orders').upsert({ id: 'current_state', data: gros }),
        supabase.from('detail_orders').upsert({ id: 'current_state', data: extern }),
        supabase.from('offres_frais').upsert({ id: 'current_state', data: offres }),
        supabase.from('inventory').upsert({ id: 'current_state', data: inventory })
      ]);
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('merch_dz_last_sync', now);
    } catch (e) { console.error("Sync Failed", e); }
    finally { setTimeout(() => setIsSyncing(false), 800); }
  }, [gros, extern, offres, inventory, isAuthenticated]);

  useEffect(() => {
    const initFetch = async () => {
      if (!supabase || !isAuthenticated) return;
      setIsSyncing(true);
      try {
        const [gRes, eRes, oRes, iRes] = await Promise.all([
          supabase.from('gros_orders').select('data').eq('id', 'current_state').single(),
          supabase.from('detail_orders').select('data').eq('id', 'current_state').single(),
          supabase.from('offres_frais').select('data').eq('id', 'current_state').single(),
          supabase.from('inventory').select('data').eq('id', 'current_state').single()
        ]);
        if (gRes.data?.data) setGros(gRes.data.data);
        if (eRes.data?.data) setExtern(eRes.data.data);
        if (oRes.data?.data) setOffres(oRes.data.data);
        if (iRes.data?.data) setInventory(iRes.data.data);
      } catch (e) { console.warn("Cloud pull failed or empty."); }
      finally { setIsSyncing(false); }
    };
    initFetch();
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => { if (isAuthenticated) syncData(); }, 10000);
    return () => clearTimeout(timer);
  }, [gros, extern, offres, inventory, syncData, isAuthenticated]);

  const login = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('merch_dz_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('merch_dz_auth');
  };

  // Updaters
  const updateGros = (id: string, field: keyof CommandeGros, value: any) => setGros(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addGros = () => setGros(p => [...p, { id: Date.now().toString(), reference: `G${p.length+1}`, client_name: '', client_phone: '', date_created: new Date().toISOString().split('T')[0], prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, status: GrosStatus.EN_PRODUCTION, stock_note: '' }]);
  const deleteGros = (id: string) => setGros(prev => prev.filter(i => i.id !== id));
  // Implementation for importGros
  const importGros = (data: any[]) => setGros(data.map(i => ({ ...i, id: i.id || (Date.now() + Math.random()).toString() })));

  const updateExtern = (id: string, field: keyof CommandeExtern, value: any) => setExtern(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addExtern = () => setExtern(p => [...p, { id: Date.now().toString(), reference: `D${p.length+1}`, client_name: '', client_phone: '', date_created: new Date().toISOString().split('T')[0], prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, status: ExternStatus.EN_PRODUCTION, stock_note: '' }]);
  const deleteExtern = (id: string) => setExtern(prev => prev.filter(i => i.id !== id));
  // Implementation for importExtern
  const importExtern = (data: any[]) => setExtern(data.map(i => ({ ...i, id: i.id || (Date.now() + Math.random()).toString() })));

  const updateOffre = (id: string, field: keyof Offre, value: any) => setOffres(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addOffre = () => setOffres(p => [...p, { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], type: OffreType.EXPENSE, montant: 0, category: 'other' as any, description: '' }]);
  const deleteOffre = (id: string) => setOffres(prev => prev.filter(i => i.id !== id));
  // Implementation for importOffres
  const importOffres = (data: any[]) => setOffres(data.map(i => ({ ...i, id: i.id || (Date.now() + Math.random()).toString() })));

  const updateInventory = (id: string, field: keyof InventoryItem, value: any) => setInventory(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addInventory = () => setInventory(p => [...p, { id: Date.now().toString(), name: 'Nouveau Stock', sku: 'SKU-'+p.length, quantity: 0, min_stock: 5, unit_cost: 0, supplier: '' }]);
  const deleteInventory = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));

  const getCalculatedGros = useCallback((): CalculatedGros[] => gros.map(i => {
    const cost = Number(i.prix_achat_article) + Number(i.prix_impression);
    const profit = Number(i.prix_vente) - cost;
    return { ...i, cost, profit_encaisse: i.status === GrosStatus.LIVREE_ENCAISSE ? profit : 0, profit_attendu: i.status === GrosStatus.LIVREE_NON_ENCAISSE ? profit : 0, perte: i.status === GrosStatus.RETOUR ? cost : 0 };
  }), [gros]);

  const getCalculatedExtern = useCallback((): CalculatedExtern[] => extern.map(i => {
    const cost = Number(i.prix_achat_article) + Number(i.prix_impression);
    const profit = Number(i.prix_vente) - cost;
    return { ...i, cost, profit_reel: i.status === ExternStatus.LIVREE ? profit : 0, perte: i.status === ExternStatus.RETOUR ? cost : 0 };
  }), [extern]);

  const getDashboardData = useCallback((): DashboardData => {
    const cGros = getCalculatedGros();
    const cExtern = getCalculatedExtern();
    const encaisse = cGros.reduce((acc, curr) => acc + curr.profit_encaisse, 0) + cExtern.reduce((acc, curr) => acc + curr.profit_reel, 0);
    const attendu = cGros.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    const pertes = cGros.reduce((acc, curr) => acc + curr.perte, 0) + cExtern.reduce((acc, curr) => acc + curr.perte, 0);
    const rev = offres.filter(o => o.type === OffreType.REVENUE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const exp = offres.filter(o => o.type === OffreType.EXPENSE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    return { encaisse_reel: encaisse, profit_attendu: attendu, pertes, net_offres: rev - exp, profit_net_final: encaisse + attendu + (rev - exp) - pertes };
  }, [getCalculatedGros, getCalculatedExtern, offres]);

  return (
    <AppContext.Provider value={{ 
      gros, extern, offres, inventory, isAuthenticated, login, logout, isSyncing, isCloudActive, lastSynced,
      updateGros, addGros, deleteGros, importGros, updateExtern, addExtern, deleteExtern, importExtern,
      updateOffre, addOffre, deleteOffre, importOffres, updateInventory, addInventory, deleteInventory,
      getCalculatedGros, getCalculatedExtern, getDashboardData, syncData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
