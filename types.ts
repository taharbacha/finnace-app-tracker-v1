
export enum GrosStatus {
  EN_PRODUCTION = 'en_production',
  EN_LIVRAISON = 'en_livraison',
  LIVREE_NON_ENCAISSE = 'livree_non_encaisse',
  LIVREE_ENCAISSE = 'livree_encaisse',
  RETOUR = 'retour'
}

export enum MerchStatus {
  EN_LIVRAISON = 'en_livraison',
  LIVREE_NON_ENCAISSEE = 'livree_non_encaissee',
  LIVREE = 'livree',
  RETOUR = 'retour'
}

export enum ClientComptoirStatus {
  EN_PRODUCTION = 'en_production',
  EN_LIVRAISON = 'en_livraison',
  PAYEE = 'payee',
  NON_PAYEE = 'non_payee'
}

export interface ClientComptoir {
  id: string;
  reference: string;
  client_name: string;
  produit: string;
  charge: number;
  vente: number;
  status: ClientComptoirStatus;
  created_at: string;
}

export interface CalculatedClientComptoir extends ClientComptoir {
  benefice_net: number;
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
  OFFRES = 'offres'
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
  somme: number;
  reste: number;
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
  somme: number;
  status: CreditStatus;
}

export interface CalculatedGros extends CommandeGros {
  cost: number;
  profit_encaisse: number;
  profit_attendu: number;
  perte: number;
}

export interface CalculatedMerch extends CommandeMerch {
  profit: number;
  impact_encaisse: number;
  impact_attendu: number;
  impact_perte: number;
}

export interface DashboardData {
  encaisse_reel: number;
  profit_attendu: number;
  pertes: number;
  net_offres: number;
  total_charges: number;
  total_marketing_spend: number;
  profit_net_final: number;
  total_facture?: number;
  total_encaisse_facture?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// --- Fournisseurs Module Types ---

export enum GlobalStatus {
  ALL = 'all',
  EN_PRODUCTION = 'en_production',
  EN_LIVRAISON = 'en_livraison',
  LIVREE = 'livree',
  RETOUR = 'retour',
  EN_COURS = 'en_cours'
}

export enum FournisseurName {
  YASSIN = 'Yassin',
  CSS = 'CSS',
  BIVALENT = 'Bivalent'
}

export enum FournisseurForWho {
  GROS_ARTICLE = 'GROS Article',
  GROS_IMPRESSION = 'GROS Impression',
  MERCH = 'MERCH'
}

export interface FournisseurLedger {
  id: string;
  date: string;
  amount: number;
  fournisseur: FournisseurName;
  for_who: FournisseurForWho;
  notes: string;
  type: 'Owed' | 'Paid';
}

// --- Facturation Module Types ---

export enum DocumentType {
  FACTURE = 'facture',
  FACTURE_REAL = 'facture_real',
  PROFORMA = 'proforma',
  BON_LIVRAISON = 'bon_livraison'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  PAID = 'paid',
  CANCELED = 'canceled'
}

export interface Document {
  id: string;
  reference: string;
  type: DocumentType;
  client_nom: string;
  client_adresse: string;
  client_rc: string;
  client_nif: string;
  client_nis: string;
  client_ai: string;
  client_telephone: string;
  date: string;
  status: DocumentStatus;
  total_ht: number;
  tva_percent: number;
  tva_amount: number;
  shipping: number;
  timbre: number;
  versement: number;
  total_ttc: number;
  created_at: string;
  updated_at: string;
}

export interface CaisseTransaction {
  id: string;
  created_at: string;
  date: string;
  somme: number;
  description: string;
  agent: string;
}

export interface Employe {
  id: string;
  created_at: string;
  nom: string;
  salaire_base: number;
}

export interface SalairePayment {
  id: string;
  created_at: string;
  employe_id: string;
  date: string;
  amount: number;
  description: string;
}

export interface BankTransaction {
  id: string;
  created_at: string;
  date: string;
  somme: number;
  note: string;
}

export interface BankArchive {
  id: string;
  created_at: string;
  date: string;
  somme: number;
  tva: number;
  description: string;
}

export interface BankArchiveNote {
  id: string;
  created_at: string;
  content: string;
}

export interface CommandeImpression {
  id: string;
  created_at: string;
  ref: string;
  client_name: string;
  phone_number: string;
  cout_article: number;
  cout_impression: number;
  prix_vente: number;
  status: 'en production' | 'en livraison' | 'livree' | 'retour';
  has_versement: boolean;
}

export interface DocumentItem {
  id: string;
  document_id: string;
  article: string;
  quantite: number;
  prix_unitaire: number;
  total_ligne: number;
}
