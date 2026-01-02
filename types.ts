

export enum GrosStatus {
  EN_PRODUCTION = 'en_production',
  EN_LIVRAISON = 'en_livraison',
  LIVREE_NON_ENCAISSE = 'livree_non_encaisse',
  LIVREE_ENCAISSE = 'livree_encaisse',
  RETOUR = 'retour'
}

export enum ExternStatus {
  EN_PRODUCTION = 'en_production',
  LIVREE = 'livree',
  RETOUR = 'retour'
}

export enum OffreType {
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export enum OffreCategory {
  ADS = 'ads',
  CREATIVE = 'creative',
  PACKAGING = 'packaging',
  TRANSPORT = 'transport',
  MANUAL = 'manual',
  OTHER = 'other'
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  min_stock: number;
  unit_cost: number;
  supplier: string;
}

export interface Charge {
  id: string;
  date: string;
  label: string;
  montant: number;
  note: string;
}

export interface CommandeGros {
  id: string;
  reference: string;
  client_name: string;
  client_phone: string;
  date_created: string;
  prix_achat_article: number;
  impression: boolean;
  prix_impression: number;
  prix_vente: number;
  status: GrosStatus;
  stock_note: string;
}

export interface CommandeExtern {
  id: string;
  reference: string;
  client_name: string;
  client_phone: string;
  date_created: string;
  prix_achat_article: number;
  impression: boolean;
  prix_impression: number;
  prix_vente: number;
  status: ExternStatus;
  stock_note: string;
  vendeur_name: string;
  vendeur_benefice: number;
}

// Added the missing Offre interface to resolve type errors in store and constants
export interface Offre {
  id: string;
  date: string;
  type: OffreType;
  montant: number;
  category: OffreCategory;
  description: string;
}

export interface CalculatedGros extends CommandeGros {
  cost: number;
  profit_encaisse: number;
  profit_attendu: number;
  perte: number;
}

export interface CalculatedExtern extends CommandeExtern {
  cost: number;
  profit_reel: number;
  perte: number;
}

export interface DashboardData {
  encaisse_reel: number;
  profit_attendu: number;
  pertes: number;
  net_offres: number;
  total_charges: number;
  profit_net_final: number;
}