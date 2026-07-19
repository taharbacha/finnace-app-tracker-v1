const fs = require('fs');
let text = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');

// I replaced `    </div>` with `    </div>\n  );`
text = text.replace(/    <\/div>\n  \);\n/g, '    </div>\n');

fs.writeFileSync('pages/CommandesGros.tsx', text);
