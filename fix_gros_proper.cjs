const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');

// I will just get the previous version from git? The repository is not a git repo.
// Wait, I can see the previous state by checking the file history or I just use regex to clean up everything from line 166 up to line 219.
code = code.replace(/<div className="flex flex-wrap items-center gap-3">[\s\S]*?Nouvelle Commande\s*<\/button>\s*<\/div>\s*<\/div>/, `<div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setAnalysisMode(!analysisMode)}
            className={\`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
              \${analysisMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'}\`}
          >
            <Filter size={16} />
            {analysisMode ? 'Analyse Active' : 'Mode Analyse OFF'}
          </button>
          
          <button 
            onClick={() => setShowHeaders(!showHeaders)}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
            title={showHeaders ? "Masquer les KPIs" : "Afficher les KPIs"}
          >
            {showHeaders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

          <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-all">
            <Upload size={18} />
          </button>
          
          <button type="button" onClick={addGros} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Commande
          </button>
        </div>
      </div>`);

// Also fix bottom
code = code.replace(/    <\/>\n      \)}\n    <\/div>\n  \);\n};\n\nexport default CommandesGros;\n/, "    </div>\n  );\n};\n\nexport default CommandesGros;\n");
fs.writeFileSync('pages/CommandesGros.tsx', code);
