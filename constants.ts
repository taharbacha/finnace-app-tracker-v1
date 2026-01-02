import { GrosStatus, ExternStatus, OffreType, OffreCategory, CommandeGros, CommandeExtern, Offre } from './types.ts';

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
    stock_note: 'Validated'
  },
  {
    id: '2',
    reference: 'G2',
    client_name: 'Wholesale Oran',
    client_phone: '0661223344',
    date_created: '2023-10-05',
    prix_achat_article: 1200,
    impression: false,
    prix_impression: 0,
    prix_vente: 2000,
    status: GrosStatus.EN_LIVRAISON,
    stock_note: ''
  }
];

export const INITIAL_EXTERN: CommandeExtern[] = [
  {
    id: 'e1',
    reference: 'D1',
    client_name: 'Ahmed Benali',
    client_phone: '0770998877',
    date_created: '2023-10-10',
    prix_achat_article: 1800,
    impression: true,
    prix_impression: 300,
    prix_vente: 3500,
    status: ExternStatus.LIVREE,
    stock_note: '',
    // Added missing mandatory properties for CommandeExtern
    vendeur_name: 'Vendeur Principal',
    vendeur_benefice: 0
  }
];

export const INITIAL_OFFRES: Offre[] = [
  {
    id: 'o1',
    date: '2023-10-01',
    type: OffreType.EXPENSE,
    montant: 50000,
    category: OffreCategory.ADS,
    description: 'Facebook Ads October Campaign'
  },
  {
    id: 'o2',
    date: '2023-10-02',
    type: OffreType.EXPENSE,
    montant: 15000,
    category: OffreCategory.PACKAGING,
    description: 'Cartons and bags supply'
  }
];

export const GROS_STATUS_OPTIONS = Object.values(GrosStatus);
export const EXTERN_STATUS_OPTIONS = Object.values(ExternStatus);
export const OFFRE_TYPE_OPTIONS = Object.values(OffreType);
export const OFFRE_CATEGORY_OPTIONS = Object.values(OffreCategory);