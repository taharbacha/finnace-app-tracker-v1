const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');

code = code.replace(/    <\/div>\n};\nexport default CommandesGros;\n  \);\n};\n\nexport default CommandesGros;\n/, '    </div>\n  );\n};\n\nexport default CommandesGros;\n');
fs.writeFileSync('pages/CommandesGros.tsx', code);
