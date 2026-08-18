const fs = require('fs');
let code = fs.readFileSync('store.tsx', 'utf8');

code = code.replace(/        prix_vente: 0,\n        status: 'en production',\n        has_versement: false\n      \};/, `        prix_vente: 0,
        status: 'en production',
        has_versement: false,
        description: '',
        somme_totale: 0,
        versement: 0,
        rest: 0,
        nombre_produit: 0,
        produits: '',
        avec_impression: false,
        frais_impression: 0
      };`);

fs.writeFileSync('store.tsx', code);
