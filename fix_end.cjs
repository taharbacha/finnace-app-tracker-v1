const fs = require('fs');
let lines = fs.readFileSync('pages/CommandesGros.tsx', 'utf8').split('\n');

// let's remove line 434 and 445 (0-indexed 433 and 444)
// actually it's easier to just remove all `    </div>` that are inside `<td>`
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
code = code.replace(/    <\/div>\n                  <\/td>/g, '                  </td>');
fs.writeFileSync('pages/CommandesGros.tsx', code);
