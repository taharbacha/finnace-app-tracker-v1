
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  CommandeGros, CommandeExtern, Offre, 
  CalculatedGros, CalculatedExtern, DashboardData,
  GrosStatus, ExternStatus, OffreType
} from './types';
import { INITIAL_GROS, INITIAL_EXTERN, INITIAL_OFFRES } from './constants';

interface AppState {
  gros: CommandeGros[];
  extern: CommandeExtern[];
  offres: Offre[];
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  updateGros: (id: string, field: keyof CommandeGros, value: any) => void;
  addGros: () => void;
  deleteGros: (id: string) => void;
  importGros: (data: Omit<CommandeGros, 'id'>[]) => void;
  updateExtern: (id: string, field: keyof CommandeExtern, value: any) => void;
  addExtern: () => void;
  deleteExtern: (id: string) => void;
  importExtern: (data: Omit<CommandeExtern, 'id'>[]) => void;
  updateOffre: (id: string, field: keyof Offre, value: any) => void;
  addOffre: () => void;
  deleteOffre: (id: string) => void;
  importOffres: (data: Omit<Offre, 'id'>[]) => void;
  getCalculatedGros: () => CalculatedGros[];
  getCalculatedExtern: () => CalculatedExtern[];
  getDashboardData: () => DashboardData;
}

const AppContext = createContext<AppState | undefined>(undefined);

/**
 * PRODUCTION SECURITY:
 * Safely check for the environment variable. 
 * 'typeof process' check prevents ReferenceError in browser.
 */
const getAdminPassword = (): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.APP_PASSWORD) {
      // @ts-ignore
      return process.env.APP_PASSWORD;
    }
  } catch (e) {
    console.warn("Could not access process.env, using fallback.");
  }
  return "merchdz_private_2025";
};

const ADMIN_PASSWORD = getAdminPassword();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('merch_dz_auth') === 'true';
  });

  const [gros, setGros] = useState<CommandeGros[]>(() => {
    const saved = localStorage.getItem('merch_dz_gros');
    return saved ? JSON.parse(saved) : INITIAL_GROS;
  });

  const [extern, setExtern] = useState<CommandeExtern[]>(() => {
    const saved = localStorage.getItem('merch_dz_extern');
    return saved ? JSON.parse(saved) : INITIAL_EXTERN;
  });

  const [offres, setOffres] = useState<Offre[]>(() => {
    const saved = localStorage.getItem('merch_dz_offres');
    return saved ? JSON.parse(saved) : INITIAL_OFFRES;
  });

  useEffect(() => {
    localStorage.setItem('merch_dz_gros', JSON.stringify(gros));
  }, [gros]);

  useEffect(() => {
    localStorage.setItem('merch_dz_extern', JSON.stringify(extern));
  }, [extern]);

  useEffect(() => {
    localStorage.setItem('merch_dz_offres', JSON.stringify(offres));
  }, [offres]);

  const login = (password: string) => {
    if (password && password === ADMIN_PASSWORD) {
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

  const updateGros = (id: string, field: keyof CommandeGros, value: any) => {
    setGros(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addGros = () => {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setGros(prev => [
      ...prev,
      {
        id: newId,
        reference: `G${prev.length + 1}`,
        client_name: '',
        client_phone: '',
        date_created: new Date().toISOString().split('T')[0],
        prix_achat_article: 0,
        impression: false,
        prix_impression: 0,
        prix_vente: 0,
        status: GrosStatus.EN_PRODUCTION,
        stock_note: ''
      }
    ]);
  };

  const deleteGros = (id: string) => {
    setGros(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  const importGros = (newData: Omit<CommandeGros, 'id'>[]) => {
    const itemsWithIds = newData.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setGros(prev => [...prev, ...itemsWithIds]);
  };

  const updateExtern = (id: string, field: keyof CommandeExtern, value: any) => {
    setExtern(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addExtern = () => {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setExtern(prev => [
      ...prev,
      {
        id: newId,
        reference: `D${prev.length + 1}`,
        client_name: '',
        client_phone: '',
        date_created: new Date().toISOString().split('T')[0],
        prix_achat_article: 0,
        impression: false,
        prix_impression: 0,
        prix_vente: 0,
        status: ExternStatus.EN_PRODUCTION,
        stock_note: ''
      }
    ]);
  };

  const deleteExtern = (id: string) => {
    setExtern(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  const importExtern = (newData: Omit<CommandeExtern, 'id'>[]) => {
    const itemsWithIds = newData.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setExtern(prev => [...prev, ...itemsWithIds]);
  };

  const updateOffre = (id: string, field: keyof Offre, value: any) => {
    setOffres(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addOffre = () => {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setOffres(prev => [
      ...prev,
      {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        type: OffreType.EXPENSE,
        montant: 0,
        category: 'other' as any,
        description: ''
      }
    ]);
  };

  const deleteOffre = (id: string) => {
    setOffres(prev => prev.filter(item => String(item.id) !== String(id)));
  };

  const importOffres = (newData: Omit<Offre, 'id'>[]) => {
    const itemsWithIds = newData.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setOffres(prev => [...prev, ...itemsWithIds]);
  };

  const getCalculatedGros = useCallback((): CalculatedGros[] => {
    return gros.map(item => {
      const cost = Number(item.prix_achat_article) + Number(item.prix_impression);
      const profit = Number(item.prix_vente) - cost;
      
      return {
        ...item,
        cost,
        profit_encaisse: item.status === GrosStatus.LIVREE_ENCAISSE ? profit : 0,
        profit_attendu: item.status === GrosStatus.LIVREE_NON_ENCAISSE ? profit : 0,
        perte: item.status === GrosStatus.RETOUR ? cost : 0
      };
    });
  }, [gros]);

  const getCalculatedExtern = useCallback((): CalculatedExtern[] => {
    return extern.map(item => {
      const cost = Number(item.prix_achat_article) + Number(item.prix_impression);
      const profit = Number(item.prix_vente) - cost;
      
      return {
        ...item,
        cost,
        profit_reel: item.status === ExternStatus.LIVREE ? profit : 0,
        perte: item.status === ExternStatus.RETOUR ? cost : 0
      };
    });
  }, [extern]);

  const getDashboardData = useCallback((): DashboardData => {
    const cGros = getCalculatedGros();
    const cExtern = getCalculatedExtern();

    const grosEncaisse = cGros.reduce((acc, curr) => acc + curr.profit_encaisse, 0);
    const externEncaisse = cExtern.reduce((acc, curr) => acc + curr.profit_reel, 0);
    const profitAttendu = cGros.reduce((acc, curr) => acc + curr.profit_attendu, 0);
    const pertes = cGros.reduce((acc, curr) => acc + curr.perte, 0) + cExtern.reduce((acc, curr) => acc + curr.perte, 0);
    
    const rev = offres.filter(o => o.type === OffreType.REVENUE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const exp = offres.filter(o => o.type === OffreType.EXPENSE).reduce((acc, curr) => acc + Number(curr.montant), 0);
    const netOffres = rev - exp;

    const encaisseReel = grosEncaisse + externEncaisse;
    const profitNetFinal = encaisseReel + profitAttendu + netOffres - pertes;

    return {
      encaisse_reel: encaisseReel,
      profit_attendu: profitAttendu,
      pertes: pertes,
      net_offres: netOffres,
      profit_net_final: profitNetFinal
    };
  }, [getCalculatedGros, getCalculatedExtern, offres]);

  return (
    <AppContext.Provider value={{ 
      gros, extern, offres, isAuthenticated, login, logout,
      updateGros, addGros, deleteGros, importGros,
      updateExtern, addExtern, deleteExtern, importExtern,
      updateOffre, addOffre, deleteOffre, importOffres,
      getCalculatedGros, getCalculatedExtern, getDashboardData 
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
