
export enum GrosStatus {
  EN_PRODUCTION = 'en_production',
  EN_LIVRAISON = 'en_livraison',
  LIVREE_NON_ENCAISSE = 'livree_non_encaisse',
  LIVREE_ENCAISSE = 'livree_encaisse',
  RETOUR = 'retour'
}

export enum SitewebStatus {
  LIVREE = 'livrée',
  LIVREE_NON_ENCAISSEE = 'livrée_non_encaissée',
  EN_LIVRAISON = 'en_livraison',
  RETOUR = 'retour'
}

export enum MerchStatus {
  EN_LIVRAISON = 'en_livraison',
  LIVREE_NON_ENCAISSEE = 'livree_non_encaissee',
  LIVREE = 'livree',
  RETOUR = 'retour'
}

export enum MarketingStatus {
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule'
}

export enum OffreType {
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export enum OffreCategory {
  CREATIVE = 'creative',
  SUBSCRIPTIONS = 'subscriptions',
  OTHER = 'other'
}

export enum MarketingSpendSource {
  GROS = 'gros',
  SITEWEB = 'siteweb',
  MERCH = 'merch',
  OFFRES = 'offres',
  MARKETING_CLIENT = 'marketing_client'
}

export enum MarketingSpendType {
  ADS = 'ads',
  INFLUENCER = 'influencer',
  OTHER = 'other'
}

export interface MarketingSpend {
  id: string;
  date_start: string;
  date_end: string;
  source: MarketingSpendSource;
  type: MarketingSpendType;
  amount: number;
  note: string;
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
  processed: boolean;
}

export interface CommandeSiteweb {
  id: string;
  reference: string;
  date_created: string;
  cout_article: number;
  cout_impression: number;
  prix_vente: number;
  status: SitewebStatus;
  stock_note: string;
  vendeur_name: string;
  vendeur_benefice: number;
  processed: boolean;
}

export interface CommandeMerch {
  id: string;
  reference: string;
  client_name: string;
  produit: string;
  prix_achat: number;
  prix_vente: number;
  status: MerchStatus;
  created_at: string;
}

export interface MarketingService {
  id: string;
  client_name: string;
  service_description: string;
  date: string;
  revenue: number;
  client_charges: number;
  status: MarketingStatus;
}

export interface Offre {
  id: string;
  date: string;
  type: OffreType;
  montant: number;
  category: OffreCategory;
  description: string;
}

export interface Retour {
  id: string;
  order_reference: string;
  created_at: string;
}

export enum PayoutStatus {
  PAYEE = 'payee',
  NON_PAYEE = 'non_payee'
}

export interface Payout {
  id: string;
  created_at: string;
  vendeur: string;
  orders_count: number;
  amount_total: number;
  amount_remaining: number;
  status: PayoutStatus;
}

export enum CreditStatus {
  PAYEE = 'payee',
  NON_PAYEE = 'non_payee'
}

export interface Credit {
  id: string;
  created_at: string;
  client: string;
  amount: number;
  status: CreditStatus;
}

export interface CalculatedGros extends CommandeGros {
  cost: number;
  profit_encaisse: number;
  profit_attendu: number;
  perte: number;
}

export interface CalculatedSiteweb extends CommandeSiteweb {
  profit_net: number;
}

export interface CalculatedMerch extends CommandeMerch {
  profit: number;
  impact_encaisse: number;
  impact_attendu: number;
  impact_perte: number;
}

export interface CalculatedMarketing extends MarketingService {
  net_profit: number;
}

export interface DashboardData {
  encaisse_reel: number;
  profit_attendu: number;
  pertes: number;
  net_offres: number;
  total_charges: number;
  total_marketing_spend: number;
  profit_net_final: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
