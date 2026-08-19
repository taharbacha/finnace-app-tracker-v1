const fs = require('fs');

let code = fs.readFileSync('pages/CommandesImpression.tsx', 'utf8');

// Add Date header
code = code.replace(
  '<th className="px-4 py-4">Ref</th>',
  '<th className="px-4 py-4">Ref</th>\n                <th className="px-4 py-4">Date</th>'
);

// Add Date cell
code = code.replace(
  /<td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">\s*<button onClick=\{\(\) => openPopup\(item\)\} className="hover:underline flex items-center gap-1">\s*<FileText size=\{14\} \/> \{item\.ref\}\s*<\/button>\s*<\/td>/,
  `<td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">
                      <button onClick={() => openPopup(item)} className="hover:underline flex items-center gap-1">
                        <FileText size={14} /> {item.ref}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
                    </td>`
);

// Add colSpan change for empty state
code = code.replace(
  '<td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-medium">',
  '<td colSpan={11} className="px-4 py-8 text-center text-slate-500 font-medium">'
);

fs.writeFileSync('pages/CommandesImpression.tsx', code);
