const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
code = code.replace("import AdsModule from '../components/AdsModule.tsx';\n", "");
code = code.replace("  const [activeTab, setActiveTab] = useState<'commandes' | 'ads'>('commandes');\n", "");
code = code.replace(/          <div className="flex bg-slate-100 p-1 rounded-2xl mr-2">[\s\S]*?<\/button>\n          <\/div>\n          \{activeTab === 'commandes' && \(\n            <>/, "");
code = code.replace(/            <\/>\n      \)}\n        <\/div>\n      <\/div>\n      \{activeTab === 'ads' \? \(\n        <AdsModule type="gros" \/>\n      \) : \(\n        <>/, "        </div>\n      </div>");
code = code.replace(/        <\/div>\n      <\/div>\n    <\/>\n      \)}\n    <\/div>\n    <\/div>\n  \);\n};\n\nexport default CommandesGros;\n/, "        </div>\n      </div>\n    </div>\n  );\n};\n\nexport default CommandesGros;\n");
// let's just do a clean string replacement
fs.writeFileSync('pages/CommandesGros.tsx', code);
