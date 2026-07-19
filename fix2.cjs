const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
code = code.replace('              </button>\n                      )}\n            </div>\n          </div>', '              </button>\n            </>\n          )}\n        </div>\n      </div>');
fs.writeFileSync('pages/CommandesGros.tsx', code);
