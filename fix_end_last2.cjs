const fs = require('fs');
let lines = fs.readFileSync('pages/CommandesGros.tsx', 'utf8').split('\n');
let newLines = lines.slice(0, lines.length - 8);
newLines.push('    </div>');
newLines.push('  );');
newLines.push('};');
newLines.push('');
newLines.push('export default CommandesGros;');
fs.writeFileSync('pages/CommandesGros.tsx', newLines.join('\n'));
