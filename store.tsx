
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CommandeGros, CommandeExtern, Offre, InventoryItem, Charge,
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
  charges: Charge[];
  isAuthenticated: boolean;
  isSyncing: boolean;
  isCloudActive: boolean;
  lastSynced: string | null;
  login: (password: string) => boolean;
  logout: () => void;
  updateGros: (id: string, field: keyof CommandeGros, value: any) => void;
  addGros: () => void;
  deleteGros: (id: string) => void;
  importGros: (data: any[]) => void;
  updateExtern: (id: string, field: keyof CommandeExtern, value: any) => void;
  addExtern: () => void;
  deleteExtern: (id: string) => void;
  importExtern: (data: any[]) => void;
  updateOffre: (id: string, field: keyof Offre, value: any) => void;
  addOffre: () => void;
  deleteOffre: (id: string) => void;
  importOffres: (data: any[]) => void;
  updateInventory: (id: string, field: keyof InventoryItem, value: any) => void;
  addInventory: () => void;
  deleteInventory: (id: string) => void;
  updateCharge: (id: string, field: keyof Charge, value: any) => void;
  addCharge: (label?: string) => void;
  deleteCharge: (id: string) => void;
  getCalculatedGros: () => CalculatedGros[];
  getCalculatedExtern: () => CalculatedExtern[];
  getDashboardData: () => DashboardData;
  syncData: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);
const ADMIN_PASSWORD = (window as any).process?.env?.APP_PASSWORD || "merchdz_private_2025";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('merch_dz_auth') === 'true');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudActive] = useState(!!supabase);
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('merch_dz_last_sync'));

  // Main state initialized from LocalStorage or Constants
  const [gros, setGros] = useState<CommandeGros[]>(() => JSON.parse(localStorage.getItem('merch_dz_gros') || JSON.stringify(INITIAL_GROS)));
  const [extern, setExtern] = useState<CommandeExtern[]>(() => JSON.parse(localStorage.getItem('merch_dz_extern') || JSON.stringify(INITIAL_EXTERN)));
  const [offres, setOffres] = useState<Offre[]>(() => JSON.parse(localStorage.getItem('merch_dz_offres') || JSON.stringify(INITIAL_OFFRES)));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => JSON.parse(localStorage.getItem('merch_dz_inventory') || '[]'));
  const [charges, setCharges] = useState<Charge[]>(() => JSON.parse(localStorage.getItem('merch_dz_charges') || '[]'));

  // Sync to LocalStorage on every change
  useEffect(() => {
    localStorage.setItem('merch_dz_gros', JSON.stringify(gros));
    localStorage.setItem('merch_dz_extern', JSON.stringify(extern));
    localStorage.setItem('merch_dz_offres', JSON.stringify(offres));
    localStorage.setItem('merch_dz_inventory', JSON.stringify(inventory));
    localStorage.setItem('merch_dz_charges', JSON.stringify(charges));
  }, [gros, extern, offres, inventory, charges]);

  const syncData = useCallback(async () => {
    if (!supabase || !isAuthenticated) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        supabase.from('gros_orders').upsert({ id: 'current_state', data: gros }),
        supabase.from('detail_orders').upsert({ id: 'current_state', data: extern }),
        supabase.from('offres_frais').upsert({ id: 'current_state', data: offres }),
        supabase.from('inventory').upsert({ id: 'current_state', data: inventory }),
        supabase.from('les_charges').upsert({ id: 'current_state', data: charges })
      ]);
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('merch_dz_last_sync', now);
    } catch (e) { console.error("Sync Failed", e); }
    finally { setTimeout(() => setIsSyncing(false), 800); }
  }, [gros, extern, offres, inventory, charges, isAuthenticated]);

  const login = useCallback((password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('merch_dz_auth', 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('merch_dz_auth');
  }, []);

  // Robust Action Logic - Hardened deletion to ensure rows are removed correctly
  const updateGros = useCallback((id: string, field: keyof CommandeGros, value: any) => 
    setGros(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addGros = useCallback(() => 
    setGros(p => [{ id: generateId(), reference: `G${Date.now()}`, client_name: '', client_phone: '', date_created: new Date().toISOString().split('T')[0], prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, status: GrosStatus.EN_PRODUCTION, stock_note: '' }, ...p]), []);
  
  const deleteGros = useCallback((id: string) => 
    setGros(prev => prev.filter(item => String(item.id) !== String(id))), []);

  const updateExtern = useCallback((id: string, field: keyof CommandeExtern, value: any) => 
    setExtern(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addExtern = useCallback(() => 
    setExtern(p => [{ id: generateId(), reference: `D${Date.now()}`, client_name: '', client_phone: '', date_created: new Date().toISOString().split('T')[0], prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, status: ExternStatus.EN_PRODUCTION, stock_note: '', vendeur_name: '', vendeur_benefice: 0 }, ...p]), []);
  
  const deleteExtern = useCallback((id: string) => 
    setExtern(prev => prev.filter(item => String(item.id) !== String(id))), []);

  const updateOffre = useCallback((id: string, field: keyof Offre, value: any) => 
    setOffres(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addOffre = useCallback(() => 
    setOffres(p => [{ id: generateId(), date: new Date().toISOString().split('T')[0], type: OffreType.EXPENSE, montant: 0, category: 'other' as any, description: '' }, ...p]), []);
  
  const deleteOffre = useCallback((id: string) => 
    setOffres(prev => prev.filter(item => String(item.id) !== String(id))), []);

  const updateInventory = useCallback((id: string, field: keyof InventoryItem, value: any) => 
    setInventory(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addInventory = useCallback(() => 
    setInventory(p => [{ id: generateId(), name: 'Nouveau Stock', sku: 'SKU-'+Date.now(), quantity: 0, min_stock: 5, unit_cost: 0, supplier: '' }, ...p]), []);
  
  const deleteInventory = useCallback((id: string) => 
    setInventory(prev => prev.filter(item => String(item.id) !== String(id))), []);

  const updateCharge = useCallback((id: string, field: keyof Charge, value: any) => 
    setCharges(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addCharge = useCallback((label: string = 'Autre') => 
    setCharges(p => [{ id: generateId(), date: new Date().toISOString().split('T')[0], label, montant: 0, note: '' }, ...p]), []);
  
  const deleteCharge = useCallback((id: string) => 
    setCharges(prev => prev.filter(item => String(item.id) !== String(id))), []);

  const getCalculatedGros = useCallback((): CalculatedGros[] => gros.map(i => {
    const cost = Number(i.prix_achat_article) + Number(i.prix_impression);
    const profit = Number(i.prix_vente) - cost;
    return { ...i, cost, profit_encaisse: i.status === GrosStatus.LIVREE_ENCAISSE ? profit : 0, profit_attendu: i.status === GrosStatus.LIVREE_NON_ENCAISSE ? profit : 0, perte: i.status === GrosStatus.RETOUR ? cost : 0 };
  }), [gros]);

  const getCalculatedExtern = useCallback((): CalculatedExtern[] => extern.map(i => {
    const cost = Number(i.prix_achat_article) + Number(i.prix_impression);
    const profit = Number(i.prix_vente) - (cost + Number(i.vendeur_benefice));
    return { ...i, cost, profit_reel: i.status === ExternStatus.LIVREE ? profit : 0, perte: i.status === ExternStatus.RETOUR ? cost : 0 };
  }), [extern]);

  const getDashboardData = useCallback((): DashboardData => {
    const cGros = getCalculatedGros();
    const cExtern = getCalculatedExtern();
    const encaisse = cGros.reduce((a, c) => a + c.profit_encaisse, 0) + cExtern.reduce((a, c) => a + c.profit_reel, 0);
    const attendu = cGros.reduce((a, c) => a + c.profit_attendu, 0);
    const pertes = cGros.reduce((a, c) => a + c.perte, 0) + cExtern.reduce((a, c) => a + c.perte, 0);
    const net_offres = offres.reduce((a, c) => c.type === OffreType.REVENUE ? a + Number(c.montant) : a - Number(c.montant), 0);
    const total_charges = charges.reduce((a, c) => a + Number(c.montant), 0);
    return { encaisse_reel: encaisse, profit_attendu: attendu, pertes, net_offres, total_charges, profit_net_final: encaisse + attendu + net_offres - pertes - total_charges };
  }, [getCalculatedGros, getCalculatedExtern, offres, charges]);

  return (
    <AppContext.Provider value={{ 
      gros, extern, offres, inventory, charges, isAuthenticated, login, logout, isSyncing, isCloudActive, lastSynced,
      updateGros, addGros, deleteGros, importGros: (d) => setGros(d), 
      updateExtern, addExtern, deleteExtern, importExtern: (d) => setExtern(d),
      updateOffre, addOffre, deleteOffre, importOffres: (d) => setOffres(d), 
      updateInventory, addInventory, deleteInventory,
      updateCharge, addCharge, deleteCharge,
      getCalculatedGros, getCalculatedExtern, getDashboardData, syncData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("Store context mismatch");
  return context;
};
