
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  CommandeGros, CommandeMerch, Offre, InventoryItem, Charge, MarketingSpend, Retour,
  Payout, PayoutStatus, Credit, CreditStatus,
  CalculatedGros, CalculatedMerch, DashboardData, CalculatedClientComptoir, ClientComptoir, ClientComptoirStatus,
  GrosStatus, MerchStatus, OffreType, OffreCategory, MarketingSpendSource, MarketingSpendType,
  ChatMessage,
  FournisseurLedger, FournisseurName, FournisseurForWho,
  GlobalStatus,
  Document, DocumentItem, DocumentType, DocumentStatus
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

const computeMerchCalculatedFields = (item: CommandeMerch): CalculatedMerch => {
  const profit = Number(item.prix_vente || 0) - Number(item.prix_achat || 0);
  let impact_encaisse = 0;
  let impact_attendu = 0;
  let impact_perte = 0;

  if (item.status === MerchStatus.LIVREE) {
    impact_encaisse = profit;
  } else if (item.status === MerchStatus.LIVREE_NON_ENCAISSEE) {
    impact_attendu = profit;
  } else if (item.status === MerchStatus.RETOUR) {
    impact_perte = Number(item.prix_achat || 0);
  }

  return { ...item, profit, impact_encaisse, impact_attendu, impact_perte };
};

const computeClientComptoirCalculatedFields = (item: ClientComptoir): CalculatedClientComptoir => {
  const benefice_net = Number(item.vente || 0) - Number(item.charge || 0);
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
  merch: CommandeMerch[];
  clientComptoir: ClientComptoir[];
  offres: Offre[];
  inventory: InventoryItem[];
  charges: Charge[];
  marketingSpends: MarketingSpend[];
  retours: Retour[];
  payouts: Payout[];
  credits: Credit[];
  fournisseurLedger: FournisseurLedger[];
  documents: Document[];
  documentItems: DocumentItem[];
  dashboardDateStart: string;
  dashboardDateEnd: string;
  isAuthenticated: boolean;
  isSyncing: boolean;
  isCloudActive: boolean;
  lastSynced: string | null;
  chatHistory: ChatMessage[];
  globalStatusFilter: GlobalStatus;
  setGlobalStatusFilter: (status: GlobalStatus) => void;
  addChatMessage: (role: 'user' | 'assistant', text: string) => void;
  clearChat: () => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setDashboardDateRange: (start: string, end: string) => void;
  updateGros: (id: string, updates: Partial<CommandeGros>) => Promise<void>;
  addGros: () => Promise<void>;
  deleteGros: (id: string) => Promise<void>;
  importGros: (data: any[]) => Promise<void>;
  updateMerch: (id: string, field: keyof CommandeMerch, value: any) => Promise<void>;
  addMerch: () => Promise<void>;
  deleteMerch: (id: string) => Promise<void>;
  importMerch: (data: any[]) => Promise<void>;
  updateClientComptoir: (id: string, field: keyof ClientComptoir, value: any) => Promise<void>;
  addClientComptoir: () => Promise<void>;
  deleteClientComptoir: (id: string) => Promise<void>;
  getCalculatedGros: () => CalculatedGros[];
  getCalculatedMerch: () => CalculatedMerch[];
  getCalculatedClientComptoir: () => CalculatedClientComptoir[];
  getCalculatedDocuments: () => Document[];
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
  updateMarketingSpend: (id: string, field: keyof MarketingSpend, value: any) => Promise<void>;
  addMarketingSpend: () => Promise<void>;
  deleteMarketingSpend: (id: string) => Promise<void>;
  addRetour: (reference: string) => Promise<void>;
  deleteRetour: (id: string) => Promise<void>;
  addPayout: () => Promise<void>;
  updatePayout: (id: string, field: keyof Payout, value: any) => Promise<void>;
  deletePayout: (id: string) => Promise<void>;
  addCredit: () => Promise<void>;
  updateCredit: (id: string, field: keyof Credit, value: any) => Promise<void>;
  deleteCredit: (id: string) => Promise<void>;
  addFournisseurLedger: () => Promise<void>;
  updateFournisseurLedger: (id: string, field: keyof FournisseurLedger, value: any) => Promise<void>;
  deleteFournisseurLedger: (id: string) => Promise<void>;
  addDocument: (type: DocumentType) => Promise<string | undefined>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addDocumentItem: (documentId: string) => Promise<void>;
  updateDocumentItem: (id: string, updates: Partial<DocumentItem>) => Promise<void>;
  deleteDocumentItem: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudActive] = useState(!!supabase);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const [gros, setGros] = useState<CommandeGros[]>([]);
  const [merch, setMerch] = useState<CommandeMerch[]>([]);
  const [clientComptoir, setClientComptoir] = useState<ClientComptoir[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [marketingSpends, setMarketingSpends] = useState<MarketingSpend[]>([]);
  const [retours, setRetours] = useState<Retour[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [fournisseurLedger, setFournisseurLedger] = useState<FournisseurLedger[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [globalStatusFilter, setGlobalStatusFilter] = useState<GlobalStatus>(GlobalStatus.ALL);

  // Persistent Date Filtering initialized from localStorage
  const [dashboardDateStart, setDashboardDateStart] = useState<string>(() => localStorage.getItem('app_date_start') || '');
  const [dashboardDateEnd, setDashboardDateEnd] = useState<string>(() => localStorage.getItem('app_date_end') || '');

  const realtimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!supabase) {
      setIsInitialLoaded(true);
      return;
    }
    if (!isSilent) setIsSyncing(true);
    try {
      const [ { data: g }, { data: m_orders }, { data: cc }, { data: o }, { data: i }, { data: c }, { data: ms }, { data: r }, { data: p }, { data: cr }, { data: fl }, { data: docs }, { data: items } ] = await Promise.all([
        supabase.from('commandes_gros').select('*'),
        supabase.from('commandes_merch').select('*'),
        supabase.from('client_comptoir').select('*'),
        supabase.from('offres').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('charges').select('*'),
        supabase.from('marketing_spends').select('*'),
        supabase.from('commandes_retours').select('*'),
        supabase.from('payouts').select('*'),
        supabase.from('credits').select('*'),
        supabase.from('fournisseurs').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('document_items').select('*')
      ]);
      if (g) setGros(g); 
      if (m_orders) setMerch(m_orders);
      if (cc) setClientComptoir(cc);
      if (o) setOffres(o); 
      if (i) setInventory(i); 
      if (c) setCharges(c); 
      if (ms) setMarketingSpends(ms);
      if (r) setRetours(r);
      if (p) setPayouts(p);
      if (cr) setCredits(cr);
      if (fl) setFournisseurLedger(fl);
      if (docs) setDocuments(docs);
      if (items) setDocumentItems(items);
      setLastSynced(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { 
      console.error("Supabase fetch error:", e); 
    } finally { 
      if (!isSilent) setIsSyncing(false); 
      setIsInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    if (!supabase) return;
    const tables = ['commandes_gros', 'commandes_merch', 'offres', 'inventory', 'charges', 'marketing_spends', 'commandes_retours', 'payouts', 'credits', 'fournisseurs', 'documents', 'document_items'];
    const channel = supabase.channel('merchdz_realtime');
    tables.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
        realtimeTimeoutRef.current = setTimeout(() => { fetchAllData(true); }, 750);
      });
    });
    channel.subscribe();
    return () => {
      if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  const login = useCallback(async (password: string) => {
    if (!supabase) return false;
    try {
      const inputHash = await hashPassword(password);
      const { data, error } = await supabase.from('app_settings').select('password_hash').eq('id', 'auth').single();
      if (error || !data) return false;
      if (data.password_hash === inputHash) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) { return false; }
  }, []);

  const logout = useCallback(() => setIsAuthenticated(false), []);
  
  const setDashboardDateRange = useCallback((start: string, end: string) => { 
    setDashboardDateStart(start); 
    setDashboardDateEnd(end);
    if (start) localStorage.setItem('app_date_start', start); else localStorage.removeItem('app_date_start');
    if (end) localStorage.setItem('app_date_end', end); else localStorage.removeItem('app_date_end');
  }, []);

  const addChatMessage = useCallback((role: 'user' | 'assistant', text: string) => { setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role, text }]); }, []);
  const clearChat = useCallback(() => setChatHistory([]), []);

  const syncData = useCallback(async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        supabase.from('commandes_gros').upsert(gros.map(computeGrosCalculatedFields)),
        supabase.from('commandes_merch').upsert(merch),
        supabase.from('offres').upsert(offres),
        supabase.from('inventory').upsert(inventory.map(computeInventoryCalculatedFields)),
        supabase.from('charges').upsert(charges),
        supabase.from('marketing_spends').upsert(marketingSpends),
        supabase.from('payouts').upsert(payouts),
        supabase.from('credits').upsert(credits),
        supabase.from('fournisseurs').upsert(fournisseurLedger)
      ]);
      setLastSynced(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error("Supabase manual sync error:", e); } finally { setIsSyncing(false); }
  }, [gros, merch, offres, inventory, charges, marketingSpends, payouts, credits, fournisseurLedger]);

  const updateGros = useCallback(async (id: string, updates: Partial<CommandeGros>) => {
    setGros(prev => {
      const currentItem = prev.find(i => String(i.id) === String(id));
      if (!currentItem) return prev;
      const updatedItem = { ...currentItem, ...updates };
      if (supabase) { supabase.from('commandes_gros').update(computeGrosCalculatedFields(updatedItem)).eq('id', id).then(({ error }) => { if (error) console.error("Supabase update error:", error); }); }
      return prev.map(i => String(i.id) === String(id) ? updatedItem : i);
    });
  }, []);

  const addGros = useCallback(async () => {
    const maxNum = gros.reduce((max, item) => {
      if (item.reference?.startsWith('G') && item.reference.length === 7) {
        const num = parseInt(item.reference.substring(1), 10);
        return !isNaN(num) && num > max ? num : max;
      }
      return max;
    }, 0);
    const ref = `G${String(maxNum + 1).padStart(6, '0')}`;

    const baseRecord = { id: crypto.randomUUID(), reference: ref, client_name: '', client_phone: '', date_created: new Date().toISOString().split('T')[0], prix_achat_article: 0, impression: false, prix_impression: 0, prix_vente: 0, status: GrosStatus.EN_PRODUCTION, stock_note: '', processed: false };
    if (supabase) {
      const { data, error } = await supabase.from('commandes_gros').insert([computeGrosCalculatedFields(baseRecord as CommandeGros)]).select();
      if (error) {
        console.error("Error adding Commandes Gros:", error);
        alert(`Failed to add row: ${error.message} \n\nDid you forget to add the 'client_phone' column to Supabase? Check the add_client_phone_gros.sql file!`);
      }
      if (data) setGros(p => p.some(o => o.id === data[0].id) ? p : [data[0], ...p]);
    } else { setGros(p => [{ ...baseRecord, id: crypto.randomUUID() } as CommandeGros, ...p]); }
  }, [gros]);

  const updateMerch = useCallback(async (id: string, field: keyof CommandeMerch, value: any) => {
    let item: CommandeMerch | undefined;
    setMerch(p => p.map(i => {
      if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; }
      return i;
    }));
    if (supabase && item) await supabase.from('commandes_merch').update(item).eq('id', id);
  }, []);

  const addMerch = useCallback(async () => {
    const maxNum = merch.reduce((max, item) => {
      if (item.reference?.startsWith('M') && item.reference.length === 7) {
        const num = parseInt(item.reference.substring(1), 10);
        return !isNaN(num) && num > max ? num : max;
      }
      return max;
    }, 0);
    const ref = `M${String(maxNum + 1).padStart(6, '0')}`;
    const baseRecord = { id: crypto.randomUUID(), reference: ref, client_name: '', produit: '', prix_achat: 0, prix_vente: 0, status: MerchStatus.EN_LIVRAISON, created_at: new Date().toISOString() };
    if (supabase) {
      const { data } = await supabase.from('commandes_merch').insert([baseRecord]).select();
      if (data) setMerch(prev => prev.some(o => o.id === data[0].id) ? prev : [data[0], ...prev]);
    } else { setMerch(p => [{ ...baseRecord, id: crypto.randomUUID() } as CommandeMerch, ...p]); }
  }, [merch]);

  const deleteMerch = useCallback(async (id: string) => { if (supabase) await supabase.from('commandes_merch').delete().eq('id', id); setMerch(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const importMerch = useCallback(async (d: any[]) => {
    if (supabase) {
      const { data } = await supabase.from('commandes_merch').insert(d).select();
      if (data) { setMerch(prev => { const existingIds = new Set(prev.map(item => item.id)); const newItems = data.filter(item => !existingIds.has(item.id)); return [...newItems, ...prev]; }); }
    } else { const mapped = d.map(i => ({ ...i, id: crypto.randomUUID() })); setMerch(p => [...mapped, ...p]); }
  }, []);

  const updateClientComptoir = useCallback(async (id: string, field: keyof ClientComptoir, value: any) => {
    let item: ClientComptoir | undefined;
    setClientComptoir(p => p.map(i => {
      if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; }
      return i;
    }));
    if (supabase && item) await supabase.from('client_comptoir').update(item).eq('id', id);
  }, []);

  const addClientComptoir = useCallback(async () => {
    const baseRecord = { id: crypto.randomUUID(), reference: `CC${Date.now()}`, client_name: '', produit: '', charge: 0, vente: 0, status: ClientComptoirStatus.EN_PRODUCTION, created_at: new Date().toISOString() };
    if (supabase) {
      const { data } = await supabase.from('client_comptoir').insert([baseRecord]).select();
      if (data) setClientComptoir(prev => prev.some(o => o.id === data[0].id) ? prev : [data[0], ...prev]);
    } else { setClientComptoir(p => [{ ...baseRecord, id: crypto.randomUUID() } as ClientComptoir, ...p]); }
  }, []);

  const deleteClientComptoir = useCallback(async (id: string) => { if (supabase) await supabase.from('client_comptoir').delete().eq('id', id); setClientComptoir(p => p.filter(i => String(i.id) !== String(id))); }, []);

  const updateInventory = useCallback(async (id: string, field: keyof InventoryItem, value: any) => {
    let item: InventoryItem | undefined;
    setInventory(p => p.map(i => { if (String(i.id) === String(id)) { item = { ...i, [field]: value }; return item; } return i; }));
    if (supabase && item) await supabase.from('inventory').update(computeInventoryCalculatedFields(item)).eq('id', id);
  }, []);

  const addInventory = useCallback(async () => {
    const baseRecord = { id: crypto.randomUUID(), name: 'Nouveau Stock', sku: 'SKU-' + Date.now(), quantity: 0, min_stock: 5, unit_cost: 0, supplier: '' };
    if (supabase) {
      const { data } = await supabase.from('inventory').insert([computeInventoryCalculatedFields(baseRecord as InventoryItem)]).select();
      if (data) setInventory(p => p.some(o => o.id === data[0].id) ? p : [data[0], ...p]);
    } else { setInventory(p => [{ ...baseRecord, id: crypto.randomUUID() } as InventoryItem, ...p]); }
  }, []);

  const updateOffre = useCallback(async (id: string, field: keyof Offre, value: any) => {
    setOffres(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i));
    if (supabase) await supabase.from('offres').update({ [field]: value }).eq('id', id);
  }, []);

  const addOffre = useCallback(async () => {
    const baseRecord = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: OffreType.REVENUE, montant: 0, category: OffreCategory.OTHER, description: 'Nouveau Mouvement' };
    if (supabase) { const { data } = await supabase.from('offres').insert([baseRecord]).select(); if (data) setOffres(p => p.some(o => o.id === data[0].id) ? p : [data[0], ...p]); } else { setOffres(p => [{ ...baseRecord, id: crypto.randomUUID() } as Offre, ...p]); }
  }, []);

  const deleteGros = useCallback(async (id: string) => { if (supabase) await supabase.from('commandes_gros').delete().eq('id', id); setGros(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const deleteOffre = useCallback(async (id: string) => { if (supabase) await supabase.from('offres').delete().eq('id', id); setOffres(p => p.filter(i => String(i.id) !== String(id))); }, []);
  const deleteInventory = useCallback(async (id: string) => { if (supabase) await supabase.from('inventory').delete().eq('id', id); setInventory(p => p.filter(i => String(i.id) !== String(id))); }, []);
  
  const updateCharge = useCallback(async (id: string, field: keyof Charge, value: any) => { setCharges(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)); if (supabase) await supabase.from('charges').update({ [field]: value }).eq('id', id); }, []);
  const addCharge = useCallback(async (l: string = 'Autre') => { const baseRecord = { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], label: l, montant: 0, note: '' }; if (supabase) { const { data } = await supabase.from('charges').insert([baseRecord]).select(); if (data) setCharges(p => p.some(o => o.id === data[0].id) ? p : [data[0], ...p]); } else { setCharges(p => [{ ...baseRecord, id: crypto.randomUUID() } as Charge, ...p]); } }, []);
  const deleteCharge = useCallback(async (id: string) => { if (supabase) await supabase.from('charges').delete().eq('id', id); setCharges(p => p.filter(i => String(i.id) !== String(id))); }, []);
  
  const updateMarketingSpend = useCallback(async (id: string, field: keyof MarketingSpend, value: any) => { setMarketingSpends(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i)); if (supabase) await supabase.from('marketing_spends').update({ [field]: value }).eq('id', id); }, []);
  const addMarketingSpend = useCallback(async () => { const baseRecord = { id: crypto.randomUUID(), date_start: new Date().toISOString().split('T')[0], date_end: new Date().toISOString().split('T')[0], source: MarketingSpendSource.GROS, type: MarketingSpendType.ADS, amount: 0, note: '' }; if (supabase) { const { data } = await supabase.from('marketing_spends').insert([baseRecord]).select(); if (data) setMarketingSpends(p => p.some(o => o.id === data[0].id) ? p : [data[0], ...p]); } else { setMarketingSpends(p => [{ ...baseRecord, id: crypto.randomUUID() } as MarketingSpend, ...p]); } }, []);
  const deleteMarketingSpend = useCallback(async (id: string) => { if (supabase) await supabase.from('marketing_spends').delete().eq('id', id); setMarketingSpends(p => p.filter(i => String(i.id) !== String(id))); }, []);
  
  const addRetour = useCallback(async (reference: string) => { if (supabase) { const { data, error } = await supabase.from('commandes_retours').insert([{ order_reference: reference }]).select().single(); if (data && !error) setRetours(prev => [data, ...prev]); } }, []);
  const deleteRetour = useCallback(async (id: string) => { if (supabase) { const { error } = await supabase.from('commandes_retours').delete().eq('id', id); if (!error) setRetours(prev => prev.filter(r => r.id !== id)); } }, []);

  const addPayout = useCallback(async () => {
    const dbRecord = { 
      id: crypto.randomUUID(),
      vendeur: '', 
      orders_count: 0, 
      somme: 0, 
      reste: 0, 
      status: PayoutStatus.NON_PAYEE, 
      created_at: new Date().toISOString() 
    };
    if (supabase) {
      const { data, error } = await supabase.from('payouts').insert([dbRecord]).select().single();
      if (error) {
        console.error("Payout Creation Failed:", error.message);
        return;
      }
      if (data) setPayouts(p => [data, ...p]);
    } else { setPayouts(p => [{ ...dbRecord, id: crypto.randomUUID() } as Payout, ...p]); }
  }, []);
  const updatePayout = useCallback(async (id: string, field: keyof Payout, value: any) => {
    setPayouts(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i));
    if (supabase) await supabase.from('payouts').update({ [field]: value }).eq('id', id);
  }, []);
  const deletePayout = useCallback(async (id: string) => {
    if (supabase) await supabase.from('payouts').delete().eq('id', id);
    setPayouts(p => p.filter(i => String(i.id) !== String(id)));
  }, []);

  const addCredit = useCallback(async () => {
    const dbRecord = { 
      id: crypto.randomUUID(),
      client: '', 
      somme: 0, 
      status: CreditStatus.NON_PAYEE, 
      created_at: new Date().toISOString() 
    };
    if (supabase) {
      const { data, error } = await supabase.from('credits').insert([dbRecord]).select().single();
      if (error) {
        console.error("Credit Creation Failed:", error.message);
        return;
      }
      if (data) setCredits(p => [data, ...p]);
    } else { setCredits(p => [{ ...dbRecord, id: crypto.randomUUID() } as Credit, ...p]); }
  }, []);
  const updateCredit = useCallback(async (id: string, field: keyof Credit, value: any) => {
    setCredits(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i));
    if (supabase) await supabase.from('credits').update({ [field]: value }).eq('id', id);
  }, []);
  const deleteCredit = useCallback(async (id: string) => {
    if (supabase) await supabase.from('credits').delete().eq('id', id);
    setCredits(p => p.filter(i => String(i.id) !== String(id)));
  }, []);

  const addFournisseurLedger = useCallback(async () => {
    const baseRecord = { 
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0], 
      amount: 0, 
      fournisseur: FournisseurName.YASSIN, 
      for_who: FournisseurForWho.GROS_ARTICLE, 
      notes: '',
      type: 'Paid'
    };
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('fournisseurs')
          .insert([baseRecord])
          .select();
        
        if (error) {
          console.error("Supabase Insert Error (Fournisseurs):", error.message);
          alert("Erreur lors de l'ajout du paiement: " + error.message);
          return;
        }
        
        if (data && data.length > 0) {
          setFournisseurLedger(prev => [data[0], ...prev]);
        }
      } catch (err) {
        console.error("Unexpected error adding fournisseur entry:", err);
        alert("Une erreur inattendue est survenue.");
      }
    } else { 
      setFournisseurLedger(p => [{ ...baseRecord, id: crypto.randomUUID() } as FournisseurLedger, ...p]); 
    }
  }, []);

  const updateFournisseurLedger = useCallback(async (id: string, field: keyof FournisseurLedger, value: any) => {
    setFournisseurLedger(p => p.map(i => String(i.id) === String(id) ? { ...i, [field]: value } : i));
    if (supabase) {
      const { error } = await supabase.from('fournisseurs').update({ [field]: value }).eq('id', id);
      if (error) console.error("Supabase Update Error (Fournisseurs):", error.message);
    }
  }, []);

  const deleteFournisseurLedger = useCallback(async (id: string) => {
    if (supabase) await supabase.from('fournisseurs').delete().eq('id', id);
    setFournisseurLedger(p => p.filter(i => String(i.id) !== String(id)));
  }, []);

  const addDocument = useCallback(async (type: DocumentType) => {
    const baseRecord = {
      type,
      client_nom: '',
      client_adresse: '',
      client_rc: '',
      client_nif: '',
      client_nis: '',
      client_ai: '',
      client_telephone: '',
      date: new Date().toISOString().split('T')[0],
      status: DocumentStatus.DRAFT,
      tva_percent: 19,
      shipping: 0,
      timbre: 0,
      versement: 0
    };
    if (supabase) {
      const { data, error } = await supabase.from('documents').insert([baseRecord]).select().single();
      if (error) {
        console.error("Document Creation Failed:", error.message);
        return;
      }
      if (data) {
        setDocuments(prev => [data, ...prev]);
        return data.id;
      }
    } else {
      const id = crypto.randomUUID();
      const refPrefix = type === DocumentType.FACTURE ? 'F' : type === DocumentType.FACTURE_REAL ? 'FR' : type === DocumentType.PROFORMA ? 'P' : 'B';
      const ref = refPrefix + String(documents.length + 1).padStart(7, '0');
      setDocuments(p => [{ ...baseRecord, id, reference: ref, total_ht: 0, tva_amount: 0, total_ttc: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Document, ...p]);
      return id;
    }
  }, []);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(i => String(i.id) === String(id) ? { ...i, ...updates } : i));
    if (supabase) {
      const { error } = await supabase.from('documents').update(updates).eq('id', id);
      if (error) console.error("Supabase Update Error (Documents):", error.message);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    if (supabase) await supabase.from('documents').delete().eq('id', id);
    setDocuments(p => p.filter(i => String(i.id) !== String(id)));
    setDocumentItems(p => p.filter(i => String(i.document_id) !== String(id)));
  }, []);

  const addDocumentItem = useCallback(async (documentId: string) => {
    const baseRecord = {
      document_id: documentId,
      article: '',
      quantite: 1,
      prix_unitaire: 0
    };
    if (supabase) {
      const { data, error } = await supabase.from('document_items').insert([baseRecord]).select().single();
      if (error) {
        console.error("Document Item Creation Failed:", error.message);
        return;
      }
      if (data) setDocumentItems(prev => [...prev, data]);
    } else {
      setDocumentItems(p => [...p, { ...baseRecord, id: crypto.randomUUID(), total_ligne: 0 } as DocumentItem]);
    }
  }, []);

  const updateDocumentItem = useCallback(async (id: string, updates: Partial<DocumentItem>) => {
    setDocumentItems(prev => prev.map(i => String(i.id) === String(id) ? { ...i, ...updates, total_ligne: (updates.quantite ?? i.quantite) * (updates.prix_unitaire ?? i.prix_unitaire) } : i));
    
    // If not using Supabase, we need to trigger a re-render of documents to update totals
    // In this architecture, getCalculatedDocuments handles it via dependency on documentItems
    
    if (supabase) {
      const { error } = await supabase.from('document_items').update(updates).eq('id', id);
      if (error) console.error("Supabase Update Error (Document Items):", error.message);
    }
  }, []);

  const deleteDocumentItem = useCallback(async (id: string) => {
    if (supabase) await supabase.from('document_items').delete().eq('id', id);
    setDocumentItems(p => p.filter(i => String(i.id) !== String(id)));
  }, []);

  const importGros = useCallback(async (d: any[]) => { if (supabase) { const { data } = await supabase.from('commandes_gros').insert(d.map(computeGrosCalculatedFields)).select(); if (data) { setGros(prev => { const existingIds = new Set(prev.map(item => item.id)); const newItems = data.filter(item => !existingIds.has(item.id)); return [...newItems, ...prev]; }); } } else { setGros(p => [...d.map(i => ({ ...i, id: crypto.randomUUID() })), ...p]); } }, []);
  const importOffres = useCallback(async (d: any[]) => { if (supabase) { const { data } = await supabase.from('offres').insert(d).select(); if (data) { setOffres(prev => { const existingIds = new Set(prev.map(item => item.id)); const newItems = data.filter(item => !existingIds.has(item.id)); return [...newItems, ...prev]; }); } } else { setOffres(p => [...d.map(i => ({ ...i, id: crypto.randomUUID() })), ...p]); } }, []);
  const importInventory = useCallback(async (d: any[]) => { if (supabase) { const { data } = await supabase.from('inventory').insert(d.map(computeInventoryCalculatedFields)).select(); if (data) { setInventory(prev => { const existingIds = new Set(prev.map(item => item.id)); const newItems = data.filter(item => !existingIds.has(item.id)); return [...newItems, ...prev]; }); } } else { setInventory(p => [...d.map(i => ({ ...i, id: crypto.randomUUID() })), ...p]); } }, []);
  const importCharges = useCallback(async (d: any[]) => { if (supabase) { const { data } = await supabase.from('charges').insert(d).select(); if (data) { setCharges(prev => { const existingIds = new Set(prev.map(item => item.id)); const newItems = data.filter(item => !existingIds.has(item.id)); return [...newItems, ...prev]; }); } } else { setCharges(p => [...d.map(i => ({ ...i, id: crypto.randomUUID() })), ...p]); } }, []);

  const getCalculatedGros = useCallback((): CalculatedGros[] => gros.map(i => { const calc = computeGrosCalculatedFields(i); return { ...i, cost: calc.total_cout, profit_encaisse: i.status === GrosStatus.LIVREE_ENCAISSE ? calc.benefice_net : 0, profit_attendu: i.status === GrosStatus.LIVREE_NON_ENCAISSE ? calc.benefice_net : 0, perte: i.status === GrosStatus.RETOUR ? calc.total_cout : 0 }; }), [gros]);
  const getCalculatedMerch = useCallback((): CalculatedMerch[] => merch.map(computeMerchCalculatedFields), [merch]);
  const getCalculatedClientComptoir = useCallback((): CalculatedClientComptoir[] => clientComptoir.map(computeClientComptoirCalculatedFields), [clientComptoir]);
  
  const getCalculatedDocuments = useCallback((): Document[] => {
    return documents.map(doc => {
      const items = documentItems.filter(item => item.document_id === doc.id);
      const total_ht = items.reduce((acc, curr) => acc + (Number(curr.quantite) * Number(curr.prix_unitaire)), 0);
      const tva_amount = total_ht * (Number(doc.tva_percent || 0) / 100);
      const total_ttc = total_ht + tva_amount + Number(doc.shipping || 0) + Number(doc.timbre || 0);
      return { ...doc, total_ht, tva_amount, total_ttc };
    });
  }, [documents, documentItems]);

  const getDashboardData = useCallback((startDate?: string, endDate?: string): DashboardData => {
    const cg = getCalculatedGros(); 
    const cm = getCalculatedMerch();
    const filter = (d: string) => (!startDate || d >= startDate) && (!endDate || d <= endDate);
    
    let fcg = cg.filter(i => filter(i.date_created)); 
    let fcm = cm.filter(i => filter(i.created_at.split('T')[0]));
    const fo = offres.filter(i => filter(i.date));
    const fc = charges.filter(i => filter(i.date));
    const fms = marketingSpends.filter(i => filter(i.date_start));

    if (globalStatusFilter !== GlobalStatus.ALL) {
      if (globalStatusFilter === GlobalStatus.EN_PRODUCTION) {
        fcg = fcg.filter(i => i.status === GrosStatus.EN_PRODUCTION);
        fcm = [];
      } else if (globalStatusFilter === GlobalStatus.EN_LIVRAISON) {
        fcg = fcg.filter(i => i.status === GrosStatus.EN_LIVRAISON);
        fcm = fcm.filter(i => i.status === MerchStatus.EN_LIVRAISON);
      } else if (globalStatusFilter === GlobalStatus.LIVREE) {
        fcg = fcg.filter(i => [GrosStatus.LIVREE_ENCAISSE, GrosStatus.LIVREE_NON_ENCAISSE].includes(i.status));
        fcm = fcm.filter(i => [MerchStatus.LIVREE, MerchStatus.LIVREE_NON_ENCAISSEE].includes(i.status));
      } else if (globalStatusFilter === GlobalStatus.RETOUR) {
        fcg = fcg.filter(i => i.status === GrosStatus.RETOUR);
        fcm = fcm.filter(i => i.status === MerchStatus.RETOUR);
      } else if (globalStatusFilter === GlobalStatus.EN_COURS) {
        fcg = []; fcm = [];
      }
    }

    const encaisse_gros = fcg.reduce((a, c) => a + c.profit_encaisse, 0);
    const attendu_gros = fcg.reduce((a, c) => a + c.profit_attendu, 0);
    const pertes_gros = fcg.reduce((a, c) => a + c.perte, 0);

    const encaisse_merch = fcm.reduce((a, c) => a + c.impact_encaisse, 0);
    const attendu_merch = fcm.reduce((a, c) => a + c.impact_attendu, 0);
    const pertes_merch = fcm.reduce((a, c) => a + c.impact_perte, 0);

    const net_offres = fo.reduce((a, c) => a + (c.type === OffreType.REVENUE ? Number(c.montant) : -Number(c.montant)), 0);
    const total_charges = fc.reduce((a, c) => a + Number(c.montant), 0);
    const total_marketing_spend = fms.reduce((a, c) => a + Number(c.amount), 0);

    const fdocs = getCalculatedDocuments().filter(i => filter(i.date));
    const total_facture = fdocs.filter(i => (i.type === DocumentType.FACTURE || i.type === DocumentType.FACTURE_REAL) && i.status !== DocumentStatus.CANCELED).reduce((a, c) => a + c.total_ttc, 0);
    const total_encaisse_facture = fdocs.filter(i => (i.type === DocumentType.FACTURE || i.type === DocumentType.FACTURE_REAL) && i.status === DocumentStatus.PAID).reduce((a, c) => a + c.total_ttc, 0);

    const encaisse_reel = encaisse_gros + encaisse_merch;
    const profit_attendu = attendu_gros + attendu_merch;
    const pertes = pertes_gros + pertes_merch;

    const profit_net_final = encaisse_reel + net_offres - total_charges - total_marketing_spend;

    return {
      encaisse_reel,
      profit_attendu,
      pertes,
      net_offres,
      total_charges,
      total_marketing_spend,
      profit_net_final,
      total_facture,
      total_encaisse_facture
    };
  }, [getCalculatedGros, getCalculatedMerch, getCalculatedDocuments, offres, charges, marketingSpends]);

  const value: AppState = {
    gros, merch, clientComptoir, offres, inventory, charges, marketingSpends, retours, payouts, credits, fournisseurLedger,
    documents, documentItems,
    dashboardDateStart, dashboardDateEnd, isAuthenticated, isSyncing, isCloudActive, lastSynced, chatHistory,
    globalStatusFilter, setGlobalStatusFilter,
    addChatMessage, clearChat, login, logout, setDashboardDateRange,
    updateGros, addGros, deleteGros, importGros,
    updateMerch, addMerch, deleteMerch, importMerch,
    updateClientComptoir, addClientComptoir, deleteClientComptoir,
    getCalculatedGros, getCalculatedMerch, getCalculatedClientComptoir, getCalculatedDocuments, getDashboardData,
    syncData, updateOffre, addOffre, deleteOffre, importOffres,
    updateInventory, addInventory, deleteInventory, importInventory,
    updateCharge, addCharge, deleteCharge, importCharges,
    updateMarketingSpend, addMarketingSpend, deleteMarketingSpend,
    addRetour, deleteRetour,
    addPayout, updatePayout, deletePayout,
    addCredit, updateCredit, deleteCredit,
    addFournisseurLedger, updateFournisseurLedger, deleteFournisseurLedger,
    addDocument, updateDocument, deleteDocument, addDocumentItem, updateDocumentItem, deleteDocumentItem
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
