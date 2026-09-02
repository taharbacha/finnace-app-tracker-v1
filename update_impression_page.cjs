const fs = require('fs');

let code = fs.readFileSync('pages/CommandesImpression.tsx', 'utf8');

// 1. Add date filters state
code = code.replace(
  "const [formData, setFormData] = useState<Partial<CommandeImpression>>({});",
  `const [formData, setFormData] = useState<Partial<CommandeImpression>>({});
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');`
);

// 2. Add filtered calculation
code = code.replace(
  "  const sortedImpression = [...commandesImpression].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());\n\n  const stats = useMemo(() => {",
  `  const filteredImpression = useMemo(() => {
    let filtered = commandesImpression;
    if (dateStart) {
      filtered = filtered.filter(item => new Date(item.created_at) >= new Date(dateStart));
    }
    if (dateEnd) {
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.created_at) <= end);
    }
    return filtered;
  }, [commandesImpression, dateStart, dateEnd]);

  const sortedImpression = [...filteredImpression].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats = useMemo(() => {`
);

// Update stats to use filteredImpression
code = code.replace(
  "commandesImpression.forEach(item => {",
  "filteredImpression.forEach(item => {"
);
code = code.replace(
  "}, [commandesImpression]);",
  "}, [filteredImpression]);"
);

// 3. Add date filter UI
const uiFilterString = `
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commande Impression</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200">
            <span className="text-sm font-bold text-slate-500">Du</span>
            <input 
              type="date" 
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="border-none outline-none text-sm bg-transparent font-bold text-slate-700"
            />
            <span className="text-sm font-bold text-slate-500 ml-2">Au</span>
            <input 
              type="date" 
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="border-none outline-none text-sm bg-transparent font-bold text-slate-700"
            />
            {(dateStart || dateEnd) && (
              <button 
                onClick={() => { setDateStart(''); setDateEnd(''); }}
                className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={addCommandeImpression}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> Nouvelle Commande
          </button>
        </div>
      </div>
`;

code = code.replace(
  /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">[\s\S]*?<\/div>/,
  uiFilterString
);

// 4. Update Ref and Date cells
code = code.replace(
  /<td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">\s*<button onClick=\{\(\) => openPopup\(item\)\} className="hover:underline flex items-center gap-1">\s*<FileText size=\{14\} \/> \{item.ref\}\s*<\/button>\s*<\/td>/,
  `<td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openPopup(item)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors" title="Détails">
                          <FileText size={16} />
                        </button>
                        <EditableCell 
                          value={item.ref} 
                          onSave={(val) => updateCommandeImpression(item.id, 'ref', val)} 
                          className="font-bold text-indigo-600"
                        />
                      </div>
                    </td>`
);

code = code.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">\s*\{new Date\(item.created_at\).toLocaleDateString\('fr-FR'\)\}\s*<\/td>/,
  `<td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">
                      <EditableCell 
                        type="date"
                        value={item.created_at} 
                        onSave={(val) => {
                          if (val) {
                            const newDate = new Date(val);
                            // Preserve current time if possible
                            const oldDate = new Date(item.created_at);
                            newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
                            updateCommandeImpression(item.id, 'created_at', newDate.toISOString());
                          }
                        }}
                      />
                    </td>`
);

fs.writeFileSync('pages/CommandesImpression.tsx', code);
