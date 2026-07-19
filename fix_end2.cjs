const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
code = code.replace(/                      <EditableCell type="number" value={item.prix_impression} onSave={\(v\) => updateGros\(item.id, { prix_impression: v }\)} prefix="I: " className="text-\[10px\] h-auto text-slate-500 min-w-\[70px\]" \/>\n                       \n                  <\/td>/, '                      <EditableCell type="number" value={item.prix_impression} onSave={(v) => updateGros(item.id, { prix_impression: v })} prefix="I: " className="text-[10px] h-auto text-slate-500 min-w-[70px]" />\n                    </div>\n                  </td>');

fs.writeFileSync('pages/CommandesGros.tsx', code);
