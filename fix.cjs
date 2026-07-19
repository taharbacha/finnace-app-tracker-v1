const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');

// The active tab ternary opens a fragment that needs to be closed before the outermost div is closed.
// Let's replace the last 3 divs with the correct closing tags.

let lines = code.split('\n');
lines.pop(); // ''
lines.pop(); // export default CommandesGros;
lines.pop(); // };
lines.pop(); // );
lines.pop(); // </div>
lines.pop(); // </div>
lines.pop(); // </div>

lines.push('        </div>');
lines.push('      </div>');
lines.push('    </>');
lines.push('    )}');
lines.push('    </div>');
lines.push('  );');
lines.push('};');
lines.push('');
lines.push('export default CommandesGros;');

fs.writeFileSync('pages/CommandesGros.tsx', lines.join('\n'));
