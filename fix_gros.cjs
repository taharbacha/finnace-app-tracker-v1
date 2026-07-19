const fs = require('fs');
let lines = fs.readFileSync('pages/CommandesGros.tsx', 'utf8').split('\n');
lines.splice(218, 7, '            </>', '          )}', '        </div>', '      </div>');
fs.writeFileSync('pages/CommandesGros.tsx', lines.join('\n'));
