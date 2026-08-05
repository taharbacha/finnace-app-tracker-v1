const fs = require('fs');
let code = fs.readFileSync('pages/CommandesImpression.tsx', 'utf8');

code = code.replace("import AdsModule from '../components/AdsModule.tsx';\n", "");
code = code.replace("  const [activeTab, setActiveTab] = useState<'commandes' | 'ads'>('commandes');\n\n", "");

code = code.replace(/        <div className="flex items-center gap-3">[\s\S]*?<Plus size=\{16\} \/> Nouvelle Commande\n            <\/button>\n          \)}\n        <\/div>\n      <\/div>\n\n      \{activeTab === 'ads' \? \(\n        <AdsModule type="impression" \/>\n      \) : \(\n        <>/, `<button 
          onClick={addCommandeImpression}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nouvelle Commande
        </button>
      </div>`);

code = code.replace(/      <\/div>\n        <\/>\n      \)}\n    <\/div>\n  \);\n};\n\nexport default CommandesImpression;\n/, "      </div>\n    </div>\n  );\n};\n\nexport default CommandesImpression;\n");
fs.writeFileSync('pages/CommandesImpression.tsx', code);
