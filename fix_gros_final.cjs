const fs = require('fs');

let old_gros = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');

// I will just use regex to clean up all the mess at the bottom.
// I will find the end of the `</tbody>` and rewrite from there.
let index = old_gros.indexOf('</tbody>');
if(index > -1) {
  let rest = old_gros.substring(0, index + 8);
  rest += '\n          </table>\n        </div>\n      </div>\n    </>\n    )}\n    </div>\n  );\n};\n\nexport default CommandesGros;\n';
  fs.writeFileSync('pages/CommandesGros.tsx', rest);
}
