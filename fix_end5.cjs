const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
code = code.replace(/<p className="text-sm font-black uppercase tracking-widest text-slate-300">Aucune commande trouvée<\/p>\n\s+<\/td>/, '<p className="text-sm font-black uppercase tracking-widest text-slate-300">Aucune commande trouvée</p>\n                    </div>\n                  </td>');
fs.writeFileSync('pages/CommandesGros.tsx', code);
