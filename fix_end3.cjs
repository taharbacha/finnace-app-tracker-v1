const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
code = code.replace(/                      <\/button>\n                       \n                  <\/td>/, '                      </button>\n                    </div>\n                  </td>');
fs.writeFileSync('pages/CommandesGros.tsx', code);
