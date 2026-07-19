const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
let newCode = code.replace(/<Trash2 size=\{18\} \/>\n                      <\/button>\n\s+<\/td>/g, '<Trash2 size={18} />\n                      </button>\n                    </div>\n                  </td>');
fs.writeFileSync('pages/CommandesGros.tsx', newCode);
