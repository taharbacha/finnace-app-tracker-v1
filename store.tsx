
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CommandeGros, CommandeSiteweb, Offre, InventoryItem, Charge, MarketingService, MarketingSpend,
  CalculatedGros, CalculatedSiteweb, CalculatedMarketing, DashboardData,
  GrosStatus, SitewebStatus, OffreType, OffreCategory, MarketingStatus, MarketingSpendSource, MarketingSpendType
} from './types.ts';
import { INITIAL_GROS, INITIAL_EXTERN, INITIAL_OFFRES } from './constants.ts';

// Using a robust check for environment variables across different runtimes
const getEnvVar = (name: string) => {
  // Try Vite's import.meta.env first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteName = `VITE_${name}`;
    if (import.meta.env[viteName]) return import.meta.env[viteName];
    if (import.meta.env[name]) return import.meta.env[name];
  }
  // Fallback to process.env (shimmed in index.html)
  return (window as any).process?.env?.[name] || '';
};

const SUPABASE_URL = getEnvVar('SUPABASE_URL');
const SUPABASE_KEY = getEnvVar('SUPABASE_ANON_KEY');
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

interface AppState {
  gros: CommandeGros[];
  siteweb: CommandeSiteweb[];
  offres: Offre[];
  inventory: InventoryItem[];
  charges: Charge[];
  marketingServices: MarketingService[];
  marketingSpends: MarketingSpend[];
  dashboardDateStart: string;
  dashboardDateEnd: string;
  isAuthenticated: boolean;
  isSyncing: boolean;
  isCloudActive: boolean;
  lastSynced: string | null;
  login: (password: string) => boolean;
  logout: () => void;
  setDashboardDateRange: (start: string, end: string) => void;
  updateGros: (id: string, field: keyof CommandeGros, value: any) => void;
  addGros: () => void;
  deleteGros: (id: string) => void;
  importGros: (data: any[]) => void;
  updateSiteweb: (id: string, field: keyof CommandeSiteweb, value: any) => void;
  addSiteweb: () => void;
  duplicateSiteweb: (id: string) => void;
  deleteSiteweb: (id: string) => void;
  importSiteweb: (data: any[]) => void;
  getCalculatedGros: () => CalculatedGros[];
  getCalculatedSiteweb: () => CalculatedSiteweb[];
  getCalculatedMarketing: () => CalculatedMarketing[];
  getDashboardData: (startDate?: string, endDate?: string) => DashboardData;
  syncData: () => Promise<void>;
  updateOffre: (id: string, field: keyof Offre, value: any) => void;
  addOffre: () => void;
  deleteOffre: (id: string) => void;
  importOffres: (data: any[]) => void;
  updateInventory: (id: string, field: keyof InventoryItem, value: any) => void;
  addInventory: () => void;
  deleteInventory: (id: string) => void;
  importInventory: (data: any[]) => void;
  updateCharge: (id: string, field: keyof Charge, value: any) => void;
  addCharge: (label?: string) => void;
  deleteCharge: (id: string) => void;
  importCharges: (data: any[]) => void;
  updateMarketing: (id: string, field: keyof MarketingService, value: any) => void;
  addMarketing: () => void;
  deleteMarketing: (id: string) => void;
  updateMarketingSpend: (id: string, field: keyof MarketingSpend, value: any) => void;
  addMarketingSpend: () => void;
  deleteMarketingSpend: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudActive] = useState(!!supabase);
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('merch_dz_last_sync'));

  const [gros, setGros] = useState<CommandeGros[]>(() => JSON.parse(localStorage.getItem('merch_dz_gros') || JSON.stringify(INITIAL_GROS)));
  const [siteweb, setSiteweb] = useState<CommandeSiteweb[]>(() => JSON.parse(localStorage.getItem('merch_dz_siteweb') || JSON.stringify(INITIAL_EXTERN)));
  const [offres, setOffres] = useState<Offre[]>(() => JSON.parse(localStorage.getItem('merch_dz_offres') || JSON.stringify(INITIAL_OFFRES)));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => JSON.parse(localStorage.getItem('merch_dz_inventory') || '[]'));
  const [charges, setCharges] = useState<Charge[]>(() => JSON.parse(localStorage.getItem('merch_dz_charges') || '[]'));
  const [marketingServices, setMarketingServices] = useState<MarketingService[]>(() => JSON.parse(localStorage.getItem('merch_dz_marketing') || '[]'));
  const [marketingSpends, setMarketingSpends] = useState<MarketingSpend[]>(() => JSON.parse(localStorage.getItem('merch_dz_marketing_spends') || '[]'));
  
  const [dashboardDateStart, setDashboardDateStart] = useState<string>(() => localStorage.getItem('merch_dz_dash_start') || '');
  const [dashboardDateEnd, setDashboardDateEnd] = useState<string>(() => localStorage.getItem('merch_dz_dash_end') || '');

  // Fetch data from Supabase on mount
  useEffect(() => {
    const fetchAllData = async () => {
      if (!supabase) return;
      setIsSyncing(true);
      try {
        const [
          { data: grosData },
          { data: sitewebData },
          { data: offresData },
          { data: inventoryData },
          { data: chargesData },
          { data: marketingServicesData },
          { data: marketingSpendsData }
        ] = await Promise.all([
          supabase.from('commandes_gros').select('*'),
          supabase.from('commandes_siteweb').select('*'),
          supabase.from('offres').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('charges').select('*'),
          supabase.from('marketing_services').select('*'),
          supabase.from('marketing_spends').select('*')
        ]);

        if (grosData && grosData.length > 0) setGros(grosData);
        if (sitewebData && sitewebData.length > 0) setSiteweb(sitewebData);
        if (offresData && offresData.length > 0) setOffres(offresData);
        if (inventoryData && inventoryData.length > 0) setInventory(inventoryData);
        if (chargesData && chargesData.length > 0) setCharges(chargesData);
        if (marketingServicesData && marketingServicesData.length > 0) setMarketingServices(marketingServicesData);
        if (marketingSpendsData && marketingSpendsData.length > 0) setMarketingSpends(marketingSpendsData);

        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setLastSynced(now);
      } catch (e) {
        console.error("Initial Fetch Failed", e);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    localStorage.setItem('merch_dz_gros', JSON.stringify(gros));
    localStorage.setItem('merch_dz_siteweb', JSON.stringify(siteweb));
    localStorage.setItem('merch_dz_offres', JSON.stringify(offres));
    localStorage.setItem('merch_dz_inventory', JSON.stringify(inventory));
    localStorage.setItem('merch_dz_charges', JSON.stringify(charges));
    localStorage.setItem('merch_dz_marketing', JSON.stringify(marketingServices));
    localStorage.setItem('merch_dz_marketing_spends', JSON.stringify(marketingSpends));
    localStorage.setItem('merch_dz_dash_start', dashboardDateStart);
    localStorage.setItem('merch_dz_dash_end', dashboardDateEnd);
  }, [gros, siteweb, offres, inventory, charges, marketingServices, marketingSpends, dashboardDateStart, dashboardDateEnd]);

  const setDashboardDateRange = useCallback((start: string, end: string) => {
    setDashboardDateStart(start);
    setDashboardDateEnd(end);
  }, []);

  const syncData = useCallback(async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        supabase.from('commandes_gros').upsert(gros),
        supabase.from('commandes_siteweb').upsert(siteweb),
        supabase.from('offres').upsert(offres),
        supabase.from('inventory').upsert(inventory),
        supabase.from('charges').upsert(charges),
        supabase.from('marketing_services').upsert(marketingServices),
        supabase.from('marketing_spends').upsert(marketingSpends)
      ]);
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('merch_dz_last_sync', now);
    } catch (e) { console.error("Sync Failed", e); }
    finally { setTimeout(() => setIsSyncing(false), 800); }
  }, [gros, siteweb, offres, inventory, charges, marketingServices, marketingSpends]);

  const login = useCallback(() => true, []);
  const logout = useCallback(() => {}, []);

  const updateGros = useCallback((id: string, field: keyof CommandeGros, value: any) => 
    setGros(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);

  const addGros = useCallback(() => {
    setGros(prevGros => {
      const refs = prevGros.map(i => {
        const match = i.reference.match(/^G(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxRefNum = Math.max(0, ...refs);
      const nextReference = `G${maxRefNum + 1}`;
      return [{ 
        id: generateId(), 
        reference: nextReference, 
        client_name: '', client_phone: '', 
        date_created: new Date().toISOString().split('T')[0], 
        prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, 
        status: GrosStatus.EN_PRODUCTION, stock_note: '' 
      }, ...prevGros];
    });
  }, []);

  const deleteGros = useCallback((id: string) => setGros(prev => prev.filter(item => String(item.id) !== String(id))), []);
  const importGros = useCallback((data: any[]) => setGros(prev => [...data.map(i => ({...i, id: generateId()})), ...prev]), []);

  const updateSiteweb = useCallback((id: string, field: keyof CommandeSiteweb, value: any) => 
    setSiteweb(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addSiteweb = useCallback(() => 
    setSiteweb(p => [{ id: generateId(), reference: String(Date.now()).slice(-6), date_created: new Date().toISOString().split('T')[0], cout_article: 0, cout_impression: 0, prix_vente: 0, status: SitewebStatus.EN_LIVRAISON, stock_note: '', vendeur_name: 'V-X', vendeur_benefice: 0 }, ...p]), []);
  
  const duplicateSiteweb = useCallback((id: string) => {
    const target = siteweb.find(i => String(i.id) === String(id));
    if (target) setSiteweb(p => [{ ...target, id: generateId(), reference: target.reference + '-copy' }, ...p]);
  }, [siteweb]);
  
  const deleteSiteweb = useCallback((id: string) => setSiteweb(prev => prev.filter(item => String(item.id) !== String(id))), []);
  const importSiteweb = useCallback((data: any[]) => setSiteweb(prev => [...data.map(i => ({...i, id: generateId()})), ...prev]), []);

  const updateOffre = useCallback((id: string, field: keyof Offre, value: any) => 
    setOffres(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);

  const addOffre = useCallback(() => 
    setOffres(p => [{ id: generateId(), date: new Date().toISOString().split('T')[0], type: OffreType.EXPENSE, montant: 0, category: OffreCategory.OTHER, description: '' }, ...p]), []);
  
  const deleteOffre = useCallback((id: string) => setOffres(prev => prev.filter(item => String(item.id) !== String(id))), []);
  const importOffres = useCallback((data: any[]) => setOffres(prev => [...data.map(i => ({...i, id: generateId()})), ...prev]), []);

  const updateInventory = useCallback((id: string, field: keyof InventoryItem, value: any) => 
    setInventory(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addInventory = useCallback(() => 
    setInventory(p => [{ id: generateId(), name: 'Nouveau Stock', sku: 'SKU-'+Date.now(), quantity: 0, min_stock: 5, unit_cost: 0, supplier: '' }, ...p]), []);
  
  const deleteInventory = useCallback((id: string) => setInventory(prev => prev.filter(item => String(item.id) !== String(id))), []);
  const importInventory = useCallback((data: any[]) => setInventory(prev => [...data.map(i => ({...i, id: generateId()})), ...prev]), []);

  const updateCharge = useCallback((id: string, field: keyof Charge, value: any) => 
    setCharges(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addCharge = useCallback((label: string = 'Autre') => 
    setCharges(p => [{ id: generateId(), date: new Date().toISOString().split('T')[0], label, montant: 0, note: '' }, ...p]), []);
  
  const deleteCharge = useCallback((id: string) => setCharges(prev => prev.filter(item => String(item.id) !== String(id))), []);
  const importCharges = useCallback((data: any[]) => setCharges(prev => [...data.map(i => ({...i, id: generateId()})), ...prev]), []);

  const updateMarketing = useCallback((id: string, field: keyof MarketingService, value: any) => 
    setMarketingServices(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addMarketing = useCallback(() => 
    setMarketingServices(p => [{ id: generateId(), client_name: 'Nouveau Client', service_description: '', date: new Date().toISOString().split('T')[0], revenue: 0, client_charges: 0, status: MarketingStatus.EN_COURS }, ...p]), []);
  
  const deleteMarketing = useCallback((id: string) => setMarketingServices(prev => prev.filter(i => String(i.id) !== String(id))), []);

  const updateMarketingSpend = useCallback((id: string, field: keyof MarketingSpend, value: any) => 
    setMarketingSpends(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)), []);
  
  const addMarketingSpend = useCallback(() => 
    setMarketingSpends(p => [{ id: generateId(), date_start: new Date().toISOString().split('T')[0], date_end: new Date().toISOString().split('T')[0], source: MarketingSpendSource.GROS, type: MarketingSpendType.ADS, amount: 0, note: '' }, ...p]), []);
  
  const deleteMarketingSpend = useCallback((id: string) => setMarketingSpends(prev => prev.filter(i => String(i.id) !== String(id))), []);

  const getCalculatedGros = useCallback((): CalculatedGros[] => gros.map(i => {
    const cost = Number(i.prix_achat_article) + Number(i.prix_impression);
    const profit = Number(i.prix_vente) - cost;
    return { ...i, cost, profit_encaisse: i.status === GrosStatus.LIVREE_ENCAISSE ? profit : 0, profit_attendu: i.status === GrosStatus.LIVREE_NON_ENCAISSE ? profit : 0, perte: i.status === GrosStatus.RETOUR ? cost : 0 };
  }), [gros]);

  const getCalculatedSiteweb = useCallback((): CalculatedSiteweb[] => siteweb.map(i => {
    const prod = Number(i.cout_article) + Number(i.cout_impression);
    return { ...i, profit_net: Number(i.prix_vente) - (prod + Number(i.vendeur_benefice)) };
  }), [siteweb]);

  const getCalculatedMarketing = useCallback((): CalculatedMarketing[] => marketingServices.map(i => ({
    ...i, net_profit: i.status === MarketingStatus.TERMINE ? Number(i.revenue) - Number(i.client_charges) : 0
  })), [marketingServices]);

  const getDashboardData = useCallback((startDate?: string, endDate?: string): DashboardData => {
    const cGrosFull = getCalculatedGros();
    const cSitewebFull = getCalculatedSiteweb();

    const filterByDate = (dateStr: string) => {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    };

    const cGros = cGrosFull.filter(item => filterByDate(item.date_created));
    const cSiteweb = cSitewebFull.filter(item => filterByDate(item.date_created));
    const currentOffres = offres.filter(item => filterByDate(item.date));
    const currentCharges = charges.filter(item => filterByDate(item.date));
    const currentMarketingSpends = marketingSpends.filter(item => filterByDate(item.date_start));

    const encaisse = cGros.reduce((a, c) => a + c.profit_encaisse, 0) + cSiteweb.filter(o => o.status === SitewebStatus.LIVREE).reduce((a, c) => a + c.profit_net, 0);
    const attendu = cGros.reduce((a, c) => a + c.profit_attendu, 0) + cSiteweb.filter(o => o.status === SitewebStatus.EN_LIVRAISON || o.status === SitewebStatus.LIVREE_NON_ENCAISSEE).reduce((a, c) => a + c.profit_net, 0);
    const pertes = cGros.reduce((a, c) => a + c.perte, 0) + cSiteweb.filter(o => o.status === SitewebStatus.RETOUR).reduce((a, c) => a + (Number(c.cout_article) + Number(c.cout_impression)), 0);
    const net_offres = currentOffres.reduce((a, c) => c.type === OffreType.REVENUE ? a + Number(c.montant) : a - Number(c.montant), 0);
    const total_charges = currentCharges.reduce((a, c) => a + Number(c.montant), 0);
    const total_marketing_spend = currentMarketingSpends.reduce((a, c) => a + Number(c.amount), 0);
    
    return { 
      encaisse_reel: encaisse, 
      profit_attendu: attendu, 
      pertes, 
      net_offres, 
      total_charges, 
      total_marketing_spend, 
      profit_net_final: encaisse + attendu + net_offres - pertes - total_charges - total_marketing_spend 
    };
  }, [getCalculatedGros, getCalculatedSiteweb, offres, charges, marketingSpends]);

  return (
    <AppContext.Provider value={{ 
      gros, siteweb, offres, inventory, charges, marketingServices, marketingSpends, 
      dashboardDateStart, dashboardDateEnd, setDashboardDateRange,
      isAuthenticated, login, logout, isSyncing, isCloudActive, lastSynced,
      updateGros, addGros, deleteGros, importGros, 
      updateSiteweb, addSiteweb, duplicateSiteweb, deleteSiteweb, importSiteweb,
      updateOffre, addOffre, deleteOffre, importOffres, 
      updateInventory, addInventory, deleteInventory, importInventory,
      updateCharge, addCharge, deleteCharge, importCharges,
      updateMarketing, addMarketing, deleteMarketing,
      updateMarketingSpend, addMarketingSpend, deleteMarketingSpend,
      getCalculatedGros, getCalculatedSiteweb, getCalculatedMarketing, getDashboardData, syncData
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
