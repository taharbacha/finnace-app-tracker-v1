
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CommandeGros, CommandeSiteweb, Offre, InventoryItem, Charge, MarketingService, MarketingSpend,
  CalculatedGros, CalculatedSiteweb, CalculatedMarketing, DashboardData,
  GrosStatus, SitewebStatus, OffreType, OffreCategory, MarketingStatus, MarketingSpendSource, MarketingSpendType,
  ChatMessage
} from './types.ts';

/**
 * ARCHITECTURE SPECIFICATION: Business Logic Layer
 */

async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const computeGrosCalculatedFields = (item: CommandeGros) => {
  const total_cout = Number(item.prix_achat_article || 0) + Number(item.prix_impression || 0);
  const total_revenu = Number(item.prix_vente || 0);
  const benefice_net = total_revenu - total_cout;
  const marge_percent = total_revenu > 0 ? (benefice_net / total_revenu) * 100 : 0;
  return { ...item, total_cout, total_revenu, benefice_net, marge_percent };
};

const computeSitewebCalculatedFields = (item: CommandeSiteweb) => {
  const total_cout = Number(item.cout_article || 0) + Number(item.cout_impression || 0);
  const total_revenu = Number(item.prix_vente || 0);
  const benefice_net = total_revenu - (total_cout + Number(item.vendeur_benefice || 0));
  const marge_percent = total_revenu > 0 ? (benefice_net / total_revenu) * 100 : 0;
  return { ...item, total_cout, total_revenu, benefice_net, marge_percent };
};

const computeMarketingCalculatedFields = (item: MarketingService) => {
  const benefice_net = Number(item.revenue || 0) - Number(item.client_charges || 0);
  return { ...item, benefice_net };
};

const computeInventoryCalculatedFields = (item: InventoryItem) => {
  const stock_value = Number(item.quantity || 0) * Number(item.unit_cost || 0);
  return { ...item, stock_value };
};

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || (window as any).process?.env?.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (window as any).process?.env?.VITE_SUPABASE_ANON_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

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
  // Added chat properties
  chatHistory: ChatMessage[];
  addChatMessage: (role: 'user' | 'assistant', text: string) => void;
  clearChat: () => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setDashboardDateRange: (start: string, end: string) => void;
  updateGros: (id: string, field: keyof CommandeGros, value: any) => Promise<void>;
  addGros: () => Promise<void>;
  deleteGros: (id: string) => Promise<void>;
  importGros: (data: any[]) => Promise<void>;
  updateSiteweb: (id: string, field: keyof CommandeSiteweb, value: any) => Promise<void>;
  addSiteweb: () => Promise<void>;
  duplicateSiteweb: (id: string) => Promise<void>;
  deleteSiteweb: (id: string) => Promise<void>;
  importSiteweb: (data: any[]) => Promise<void>;
  getCalculatedGros: () => CalculatedGros[];
  getCalculatedSiteweb: () => CalculatedSiteweb[];
  getCalculatedMarketing: () => CalculatedMarketing[];
  getDashboardData: (startDate?: string, endDate?: string) => DashboardData;
  syncData: () => Promise<void>;
  updateOffre: (id: string, field: keyof Offre, value: any) => Promise<void>;
  addOffre: () => Promise<void>;
  deleteOffre: (id: string) => Promise<void>;
  importOffres: (data: any[]) => Promise<void>;
  updateInventory: (id: string, field: keyof InventoryItem, value: any) => Promise<void>;
  addInventory: () => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  importInventory: (data: any[]) => Promise<void>;
  updateCharge: (id: string, field: keyof Charge, value: any) => Promise<void>;
  addCharge: (label?: string) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
  importCharges: (data: any[]) => Promise<void>;
  updateMarketing: (id: string, field: keyof MarketingService, value: any) => Promise<void>;
  addMarketing: () => Promise<void>;
  deleteMarketing: (id: string) => Promise<void>;
  updateMarketingSpend: (id: string, field: keyof MarketingSpend, value: any) => Promise<void>;
  addMarketingSpend: () => Promise<void>;
  deleteMarketingSpend: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudActive] = useState(!!supabase);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const [gros, setGros] = useState<CommandeGros[]>([]);
  const [siteweb, setSiteweb] = useState<CommandeSiteweb[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [marketingServices, setMarketingServices] = useState<MarketingService[]>([]);
  const [marketingSpends, setMarketingSpends] = useState<MarketingSpend[]>([]);
  
  // Added chat history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [dashboardDateStart, setDashboardDateStart] = useState<string>('');
  const [dashboardDateEnd, setDashboardDateEnd] = useState<string>('');

  useEffect(() => {
    const fetchAllData = async () => {
      if (!supabase) {
        setIsInitialLoaded(true);
        return;
      }
      setIsSyncing(true);
      try {
        const [ { data: g }, { data: s }, { data: o }, { data: i }, { data: c }, { data: m }, { data: ms } ] = await Promise.all([
          supabase.from('commandes_gros').select('*'),
          supabase.from('commandes_siteweb').select('*'),
          supabase.from('offres').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('charges').select('*'),
          supabase.from('marketing_services').select('*'),
          supabase.from('marketing_spends').select('*')
        ]);
        if (g) setGros(g); 
        if (s) setSiteweb(s); 
        if (o) setOffres(o); 
        if (i) setInventory(i); 
        if (c) setCharges(c); 
        if (m) setMarketingServices(m); 
        if (ms) setMarketingSpends(ms);
        setLastSynced(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) { 
        console.error("Supabase sync error on mount:", e); 
      } finally { 
        setIsSyncing(false); 
        setIsInitialLoaded(true);
      }
    };
    fetchAllData();
  }, []);

  const login = useCallback(async (password: string) => {
    if (!supabase) return false;
    try {
      const inputHash = await hashPassword(password);
      const { data, error } = await supabase
        .from('app_settings')
        .select('password_hash')
        .eq('id', 'auth')
        .single();

      if (error || !data) {
        console.error("Auth verification failed: Settings not found or Supabase error.");
        return false;
      }

      if (data.password_hash === inputHash) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login process error:", err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const setDashboardDateRange = useCallback((start: string, end: string) => {
    setDashboardDateStart(start);
    setDashboardDateEnd(end);
  }, []);

  // Added chat history management functions
  const addChatMessage = useCallback((role: 'user' | 'assistant', text: string) => {
    setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role, text }]);
  }, []);

  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  const syncData = useCallback(async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        supabase.from('commandes_gros').upsert(gros.map(computeGrosCalculatedFields)),
        supabase.from('commandes_siteweb').upsert(siteweb.map(computeSitewebCalculatedFields)),
        supabase.from('offres').upsert(offres),
        supabase.from('inventory').upsert(inventory.map(computeInventoryCalculatedFields)),
        supabase.from('charges').upsert(charges),
        supabase.from('marketing_services').upsert(marketingServices.map(computeMarketingCalculatedFields)),
        supabase.from('marketing_spends').upsert(marketingSpends)
      ]);
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
    } catch (e) { 
      console.error("Supabase manual sync error:", e); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [gros, siteweb, offres, inventory, charges, marketingServices, marketingSpends]);

  const updateGros = useCallback(async (id: string, field: keyof CommandeGros, value: any) => {
    let item: CommandeGros | undefined;
    setGros(p => p.map(i => {
      if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; }
      return i;
    }));
    if (supabase && item) {
      const dbPayload = computeGrosCalculatedFields(item);
      await supabase.from('commandes_gros').update(dbPayload).eq('id', id);
    }
  }, []);

  const addGros = useCallback(async () => {
    const baseRecord = { 
      reference: `G${Date.now()}`, client_name: '', client_phone: '', date_created: new Date().toISOString().split('T')[0], 
      prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, status: GrosStatus.EN_PRODUCTION, stock_note: '' 
    };
    if (supabase) {
      const dbPayload = computeGrosCalculatedFields(baseRecord as CommandeGros);
      const { data } = await supabase.from('commandes_gros').insert([dbPayload]).select();
      if (data) setGros(p => [data[0], ...p]);
    } else {
      setGros(p => [{ ...baseRecord, id: crypto.randomUUID() } as CommandeGros, ...p]);
    }
  }, []);

  const updateSiteweb = useCallback(async (id: string, field: keyof CommandeSiteweb, value: any) => {
    let item: CommandeSiteweb | undefined;
    setSiteweb(p => p.map(i => {
      if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; }
      return i;
    }));
    if (supabase && item) {
      const dbPayload = computeSitewebCalculatedFields(item);
      await supabase.from('commandes_siteweb').update(dbPayload).eq('id', id);
    }
  }, []);

  const addSiteweb = useCallback(async () => {
    const baseRecord = { 
      reference: String(Date.now()).slice(-6), date_created: new Date().toISOString().split('T')[0], 
      cout_article: 0, cout_impression: 0, prix_vente: 0, status: SitewebStatus.EN_LIVRAISON, stock_note: '', vendeur_name: 'V-X', vendeur_benefice: 0 
    };
    if (supabase) {
      const dbPayload = computeSitewebCalculatedFields(baseRecord as CommandeSiteweb);
      const { data } = await supabase.from('commandes_siteweb').insert([dbPayload]).select();
      if (data) setSiteweb(p => [data[0], ...p]);
    } else {
      setSiteweb(p => [{ ...baseRecord, id: crypto.randomUUID() } as CommandeSiteweb, ...p]);
    }
  }, []);

  const updateInventory = useCallback(async (id: string, field: keyof InventoryItem, value: any) => {
    let item: InventoryItem | undefined;
    setInventory(p => p.map(i => {
      if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; }
      return i;
    }));
    if (supabase && item) {
      const dbPayload = computeInventoryCalculatedFields(item);
      await supabase.from('inventory').update(dbPayload).eq('id', id);
    }
  }, []);

  const addInventory = useCallback(async () => {
    const baseRecord = { name: 'Nouveau Stock', sku: 'SKU-' + Date.now(), quantity: 0, min_stock: 5, unit_cost: 0, supplier: '' };
    if (supabase) {
      const dbPayload = computeInventoryCalculatedFields(baseRecord as InventoryItem);
      const { data } = await supabase.from('inventory').insert([dbPayload]).select();
      if (data) setInventory(p => [data[0], ...p]);
    } else {
      setInventory(p => [{ ...baseRecord, id: crypto.randomUUID() } as InventoryItem, ...p]);
    }
  }, []);

  const updateMarketing = useCallback(async (id: string, field: keyof MarketingService, value: any) => {
    let item: MarketingService | undefined;
    setMarketingServices(p => p.map(i => {
      if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; }
      return i;
    }));
    if (supabase && item) {
      const dbPayload = computeMarketingCalculatedFields(item);
      await supabase.from('marketing_services').update(dbPayload).eq('id', id);
    }
  }, []);

  const addMarketing = useCallback(async () => {
    const baseRecord = { client_name: 'Nouveau Client', service_description: '', date: new Date().toISOString().split('T')[0], revenue: 0, client_charges: 0, status: MarketingStatus.EN_COURS };
    if (supabase) {
      const dbPayload = computeMarketingCalculatedFields(baseRecord as MarketingService);
      const { data } = await supabase.from('marketing_services').insert([dbPayload]).select();
      if (data) setMarketingServices(p => [data[0], ...p]);
    } else {
      setMarketingServices(p => [{ ...baseRecord, id: crypto.randomUUID() } as MarketingService, ...p]);
    }
  }, []);

  const updateOffre = useCallback(async (id: string, field: keyof Offre, value: any) => {
    setOffres(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i));
    if (supabase) await supabase.from('offres').update({ [field]: value }).eq('id', id);
  }, []);

  const addOffre = useCallback(async () => {
    const baseRecord = { date: new Date().toISOString().split('T')[0], type: OffreType.REVENUE, montant: 0, category: OffreCategory.OTHER, description: 'Nouveau Mouvement' };
    if (supabase) { 
      const { data } = await supabase.from('offres').insert([baseRecord]).select(); 
      if (data) setOffres(p => [data[0], ...p]); 
    } else {
      setOffres(p => [{ ...baseRecord, id: crypto.randomUUID() } as Offre, ...p]);
    }
  }, []);

  const deleteGros = useCallback(async (id: string) => { if (supabase) await supabase.from('commandes_gros').delete().eq('id', id); setGros(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const deleteSiteweb = useCallback(async (id: string) => { if (supabase) await supabase.from('commandes_siteweb').delete().eq('id', id); setSiteweb(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const deleteOffre = useCallback(async (id: string) => { if (supabase) await supabase.from('offres').delete().eq('id', id); setOffres(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const deleteInventory = useCallback(async (id: string) => { if (supabase) await supabase.from('inventory').delete().eq('id', id); setInventory(p => p.filter(i => String(i.id) !== String(id))); }, []);
  
  const updateCharge = useCallback(async (id: string, field: keyof Charge, value: any) => { 
    setCharges(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)); 
    if (supabase) await supabase.from('charges').update({ [field]: value }).eq('id', id); 
  }, []);

  const addCharge = useCallback(async (l: string = 'Autre') => { 
    const baseRecord = { date: new Date().toISOString().split('T')[0], label: l, montant: 0, note: '' }; 
    if (supabase) { 
      const { data } = await supabase.from('charges').insert([baseRecord]).select(); 
      if (data) setCharges(p => [data[0], ...p]); 
    } else {
      setCharges(p => [{ ...baseRecord, id: crypto.randomUUID() } as Charge, ...p]);
    }
  }, []);

  const deleteCharge = useCallback(async (id: string) => { if (supabase) await supabase.from('charges').delete().eq('id', id); setCharges(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const deleteMarketing = useCallback(async (id: string) => { if (supabase) await supabase.from('marketing_services').delete().eq('id', id); setMarketingServices(p => p.filter(i => String(i.id) !== String(id))); }, []);
  
  const updateMarketingSpend = useCallback(async (id: string, field: keyof MarketingSpend, value: any) => { 
    setMarketingSpends(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)); 
    if (supabase) await supabase.from('marketing_spends').update({ [field]: value }).eq('id', id); 
  }, []);

  const addMarketingSpend = useCallback(async () => { 
    const baseRecord = { date_start: new Date().toISOString().split('T')[0], date_end: new Date().toISOString().split('T')[0], source: MarketingSpendSource.GROS, type: MarketingSpendType.ADS, amount: 0, note: '' }; 
    if (supabase) { 
      const { data } = await supabase.from('marketing_spends').insert([baseRecord]).select(); 
      if (data) setMarketingSpends(p => [data[0], ...p]); 
    } else {
      setMarketingSpends(p => [{ ...baseRecord, id: crypto.randomUUID() } as MarketingSpend, ...p]);
    }
  }, []);

  const deleteMarketingSpend = useCallback(async (id: string) => { if (supabase) await supabase.from('marketing_spends').delete().eq('id', id); setMarketingSpends(p => p.filter(i => String(i.id) !== String(id))); }, []);
  
  const duplicateSiteweb = useCallback(async (id: string) => { 
    const t = siteweb.find(i => String(i.id) === String(id)); 
    if (t) { 
      const { id: _, ...baseRecord } = t;
      const nr = { ...baseRecord, reference: t.reference + '-copy' }; 
      if (supabase) { 
        const dbPayload = computeSitewebCalculatedFields(nr as CommandeSiteweb);
        const { data, error } = await supabase.from('commandes_siteweb').insert([dbPayload]).select(); 
        if (!error && data) setSiteweb(p => [data[0], ...p]); 
      } else {
        setSiteweb(p => [{ ...nr, id: crypto.randomUUID() } as CommandeSiteweb, ...p]);
      }
    } 
  }, [siteweb]);

  const importGros = useCallback(async (d: any[]) => {
    const cleanData = d.map(({ id, ...rest }) => computeGrosCalculatedFields(rest as CommandeGros));
    if (supabase) {
      const { data, error } = await supabase.from('commandes_gros').insert(cleanData).select();
      if (!error && data) setGros(p => [...data, ...p]);
    } else {
      const mapped = cleanData.map(i => ({ ...i, id: crypto.randomUUID() }));
      setGros(p => [...mapped, ...p]);
    }
  }, []);

  const importSiteweb = useCallback(async (d: any[]) => {
    const cleanData = d.map(({ id, ...rest }) => computeSitewebCalculatedFields(rest as CommandeSiteweb));
    if (supabase) {
      const { data, error } = await supabase.from('commandes_siteweb').insert(cleanData).select();
      if (!error && data) setSiteweb(p => [...data, ...p]);
    } else {
      const mapped = cleanData.map(i => ({ ...i, id: crypto.randomUUID() }));
      setSiteweb(p => [...mapped, ...p]);
    }
  }, []);

  const importOffres = useCallback(async (d: any[]) => {
    const cleanData = d.map(({ id, ...rest }) => rest);
    if (supabase) {
      const { data, error } = await supabase.from('offres').insert(cleanData).select();
      if (!error && data) setOffres(p => [...data, ...p]);
    } else {
      const mapped = cleanData.map(i => ({ ...i, id: crypto.randomUUID() }));
      setOffres(p => [...mapped, ...p]);
    }
  }, []);

  const importInventory = useCallback(async (d: any[]) => {
    const cleanData = d.map(({ id, ...rest }) => computeInventoryCalculatedFields(rest as InventoryItem));
    if (supabase) {
      const { data, error } = await supabase.from('inventory').insert(cleanData).select();
      if (!error && data) setInventory(p => [...data, ...p]);
    } else {
      const mapped = cleanData.map(i => ({ ...i, id: crypto.randomUUID() }));
      setInventory(p => [...mapped, ...p]);
    }
  }, []);

  const importCharges = useCallback(async (d: any[]) => {
    const cleanData = d.map(({ id, ...rest }) => rest);
    if (supabase) {
      const { data, error } = await supabase.from('charges').insert(cleanData).select();
      if (!error && data) setCharges(p => [...data, ...p]);
    } else {
      const mapped = cleanData.map(i => ({ ...i, id: crypto.randomUUID() }));
      setCharges(p => [...mapped, ...p]);
    }
  }, []);

  const getCalculatedGros = useCallback((): CalculatedGros[] => gros.map(i => {
    const calc = computeGrosCalculatedFields(i);
    return { 
      ...i, 
      cost: calc.total_cout, 
      profit_encaisse: i.status === GrosStatus.LIVREE_ENCAISSE ? calc.benefice_net : 0, 
      profit_attendu: i.status === GrosStatus.LIVREE_NON_ENCAISSE ? calc.benefice_net : 0, 
      perte: i.status === GrosStatus.RETOUR ? calc.total_cout : 0 
    };
  }), [gros]);

  const getCalculatedSiteweb = useCallback((): CalculatedSiteweb[] => siteweb.map(i => ({ ...i, profit_net: computeSitewebCalculatedFields(i).benefice_net })), [siteweb]);
  
  const getCalculatedMarketing = useCallback((): CalculatedMarketing[] => marketingServices.map(i => {
    const calc = computeMarketingCalculatedFields(i);
    return { ...i, net_profit: i.status === MarketingStatus.TERMINE ? calc.benefice_net : 0 };
  }), [marketingServices]);

  const getDashboardData = useCallback((startDate?: string, endDate?: string): DashboardData => {
    const cg = getCalculatedGros(); const cs = getCalculatedSiteweb();
    const filter = (d: string) => (!startDate || d >= startDate) && (!endDate || d <= endDate);
    
    const fcg = cg.filter(i => filter(i.date_created)); 
    const fcs = cs.filter(i => filter(i.date_created));
    const fo = offres.filter(i => filter(i.date)); 
    const fc = charges.filter(i => filter(i.date)); 
    const fm = marketingSpends.filter(i => filter(i.date_start));
    
    const enc = fcg.reduce((a, c) => a + c.profit_encaisse, 0) + fcs.filter(o => o.status === SitewebStatus.LIVREE).reduce((a, c) => a + c.profit_net, 0);
    // Modified Business Rule: en_livraison is excluded from financials. Only livrée_non_encaissée contributes to Attendu.
    const att = fcg.reduce((a, c) => a + c.profit_attendu, 0) + fcs.filter(o => o.status === SitewebStatus.LIVREE_NON_ENCAISSEE).reduce((a, c) => a + c.profit_net, 0);
    const per = fcg.reduce((a, c) => a + c.perte, 0) + fcs.filter(o => o.status === SitewebStatus.RETOUR).reduce((a, c) => a + (Number(c.cout_article) + Number(c.cout_impression)), 0);
    const no = fo.reduce((a, c) => c.type === OffreType.REVENUE ? a + Number(c.montant) : a - Number(c.montant), 0);
    const tc = fc.reduce((a, c) => a + Number(c.montant), 0); 
    const tm = fm.reduce((a, c) => a + Number(c.amount), 0);
    
    return { 
      encaisse_reel: enc, 
      profit_attendu: att, 
      pertes: per, 
      net_offres: no, 
      total_charges: tc, 
      total_marketing_spend: tm, 
      profit_net_final: enc + att + no - per - tc - tm 
    };
  }, [getCalculatedGros, getCalculatedSiteweb, offres, charges, marketingSpends]);

  return (
    <AppContext.Provider value={{ 
      gros, siteweb, offres, inventory, charges, marketingServices, marketingSpends, dashboardDateStart, dashboardDateEnd, setDashboardDateRange,
      isAuthenticated, login, logout, isSyncing, isCloudActive, lastSynced,
      chatHistory, addChatMessage, clearChat,
      updateGros, addGros, deleteGros, importGros, updateSiteweb, addSiteweb, duplicateSiteweb, deleteSiteweb, importSiteweb,
      updateOffre, addOffre, deleteOffre, importOffres, updateInventory, addInventory, deleteInventory, importInventory,
      updateCharge, addCharge, deleteCharge, importCharges, updateMarketing, addMarketing, deleteMarketing,
      updateMarketingSpend, addMarketingSpend, deleteMarketingSpend, getCalculatedGros, getCalculatedSiteweb, getCalculatedMarketing, getDashboardData, syncData
    }}>
      {isInitialLoaded ? children : null}
    </AppContext.Provider>
  );
};

export const useAppStore = () => { 
  const c = useContext(AppContext); 
  if (!c) throw new Error("AppContext not found. Ensure AppProvider is wrapping the root."); 
  return c; 
};
