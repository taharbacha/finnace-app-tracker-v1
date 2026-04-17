
import { GrosStatus, MerchStatus, OffreType, OffreCategory, MarketingSpendSource, MarketingSpendType, CommandeGros, Offre } from './types.ts';

export const INITIAL_GROS: CommandeGros[] = [
  {
    id: '1',
    reference: 'G1',
    client_name: 'Shopify DZ',
    client_phone: '0550123456',
    date_created: '2023-10-01',
    prix_achat_article: 1500,
    impression: true,
    prix_impression: 200,
    prix_vente: 2500,
    status: GrosStatus.LIVREE_ENCAISSE,
    stock_note: 'Validated',
    // Added processed property to satisfy CommandeGros interface requirements
    processed: true
  }
];

export const INITIAL_OFFRES: Offre[] = [
  {
    id: 'o1',
    date: '2023-10-01',
    type: OffreType.REVENUE,
    montant: 12000,
    category: OffreCategory.SUBSCRIPTIONS,
    description: 'Abonnement Plan Pro - Client A'
  }
];

export const GROS_STATUS_OPTIONS = Object.values(GrosStatus);
export const MERCH_STATUS_OPTIONS = Object.values(MerchStatus);
export const OFFRE_TYPE_OPTIONS = Object.values(OffreType);
export const OFFRE_CATEGORY_OPTIONS = Object.values(OffreCategory);
export const MARKETING_SPEND_SOURCE_OPTIONS = Object.values(MarketingSpendSource);
export const MARKETING_SPEND_TYPE_OPTIONS = Object.values(MarketingSpendType);
