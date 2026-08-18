const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

code = code.replace(/export interface CommandeImpression {[\s\S]*?has_versement: boolean;\n\}/, `export interface CommandeImpression {
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
  description?: string;
  somme_totale?: number;
  versement?: number;
  rest?: number;
  nombre_produit?: number;
  produits?: string;
  avec_impression?: boolean;
  frais_impression?: number;
}`);

fs.writeFileSync('types.ts', code);
