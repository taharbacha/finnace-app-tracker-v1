const fs = require('fs');

let code = fs.readFileSync('pages/CommandesImpression.tsx', 'utf8');

// Replace imports
code = code.replace(
  "import { Plus, Trash2, CheckCircle, TrendingDown } from 'lucide-react';",
  "import { Plus, Trash2, CheckCircle, TrendingDown, X, Save, FileText } from 'lucide-react';\nimport type { CommandeImpression } from '../types.ts';"
);

// Add state for selectedCommande and formData
code = code.replace(
  "const CommandesImpression = () => {\n  const { ",
  `const CommandesImpression = () => {
  const { `
);

code = code.replace(
  "  const sortedImpression = [...commandesImpression].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());",
  `  const [selectedCommande, setSelectedCommande] = useState<CommandeImpression | null>(null);
  const [formData, setFormData] = useState<Partial<CommandeImpression>>({});

  const openPopup = (item: CommandeImpression) => {
    setSelectedCommande(item);
    setFormData({
      description: item.description || '',
      somme_totale: item.somme_totale || 0,
      versement: item.versement || 0,
      rest: item.rest || 0,
      nombre_produit: item.nombre_produit || 0,
      produits: item.produits || '',
      avec_impression: item.avec_impression || false,
      frais_impression: item.frais_impression || 0
    });
  };

  const handleFormChange = (field: keyof CommandeImpression, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'somme_totale' || field === 'versement') {
        newData.rest = (Number(newData.somme_totale) || 0) - (Number(newData.versement) || 0);
      }
      return newData;
    });
  };

  const savePopup = () => {
    if (selectedCommande) {
      Object.entries(formData).forEach(([key, value]) => {
        updateCommandeImpression(selectedCommande.id, key as keyof CommandeImpression, value);
      });
      setSelectedCommande(null);
    }
  };

  const sortedImpression = [...commandesImpression].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());`
);

// Update table ref to be clickable
code = code.replace(
  /<td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">\s*\{item.ref\}\s*<\/td>/,
  `<td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">
                      <button onClick={() => openPopup(item)} className="hover:underline flex items-center gap-1">
                        <FileText size={14} /> {item.ref}
                      </button>
                    </td>`
);

// Add Popup UI at the end
code = code.replace(
  /    <\/div>\n  \);\n};\n\nexport default CommandesImpression;/s,
  `      {selectedCommande && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Détails Commande {selectedCommande.ref}
              </h3>
              <button onClick={() => setSelectedCommande(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description de commandes</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Somme Totale</label>
                  <input 
                    type="number" 
                    value={formData.somme_totale || 0} 
                    onChange={(e) => handleFormChange('somme_totale', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Versement</label>
                  <input 
                    type="number" 
                    value={formData.versement || 0} 
                    onChange={(e) => handleFormChange('versement', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rest</label>
                  <input 
                    type="number" 
                    value={formData.rest || 0} 
                    onChange={(e) => handleFormChange('rest', Number(e.target.value))}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Produit</label>
                  <input 
                    type="number" 
                    value={formData.nombre_produit || 0} 
                    onChange={(e) => handleFormChange('nombre_produit', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Produits</label>
                <textarea 
                  value={formData.produits || ''} 
                  onChange={(e) => handleFormChange('produits', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.avec_impression || false} 
                      onChange={(e) => handleFormChange('avec_impression', e.target.checked)}
                      className="w-5 h-5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Avec Impression</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frais d'impression</label>
                  <input 
                    type="number" 
                    value={formData.frais_impression || 0} 
                    onChange={(e) => handleFormChange('frais_impression', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    disabled={!formData.avec_impression}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedCommande(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={savePopup}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Save size={18} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandesImpression;
`
);

fs.writeFileSync('pages/CommandesImpression.tsx', code);
