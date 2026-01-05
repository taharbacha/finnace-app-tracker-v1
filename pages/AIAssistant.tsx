
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { Send, Bot, User, Loader2, Sparkles, Trash2, Info, ShieldCheck } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const { 
    getDashboardData, 
    inventory, 
    charges, 
    getCalculatedGros, 
    chatHistory,
    addChatMessage,
    clearChat
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Read-only context preparation
  const businessContext = useMemo(() => {
    const dash = getDashboardData();
    const lowStock = inventory.filter(i => i.quantity <= i.min_stock).map(i => `${i.name} (${i.quantity} left)`);
    const topCharges = [...charges].sort((a, b) => b.montant - a.montant).slice(0, 5).map(c => `${c.label}: ${c.montant} DA`);
    const recentGros = getCalculatedGros().slice(0, 5).map(g => `${g.reference}: ${g.prix_vente} DA (${g.status})`);
    
    return `
      SYSTEM_CONTEXT (READ_ONLY):
      - Total Net Profit: ${dash.profit_net_final} DA
      - Cash Collected: ${dash.encaisse_reel} DA
      - Marketing Spend: ${dash.total_marketing_spend} DA
      - Total Fixed Charges: ${dash.total_charges} DA
      - Returns/Losses: ${dash.pertes} DA
      
      STOCK ALERTS:
      ${lowStock.length > 0 ? lowStock.join(', ') : 'All healthy.'}
      
      RECENT EXPENSES:
      ${topCharges.join(', ')}
      
      RECENT SALES:
      ${recentGros.join(', ')}
    `;
  }, [getDashboardData, inventory, charges, getCalculatedGros]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage('user', userMessage);
    setIsLoading(true);

    try {
      const systemInstruction = `
        You are "MerchDZ Financial Analyst", an AI specialized in auditing the Merch By DZ business data.
        You have READ-ONLY access. 
        
        MANDATORY RULES:
        1. NO WRITE ACCESS: You cannot create, update, or delete any record. Explain this politely if asked.
        2. DATA DRIVEN: Only use provided context for financial answers.
        3. TONE: Objective, expert, and strategic.
        4. MODEL: moonshotai/kimi-k2:free (OpenRouter).
        
        ${businessContext}
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "moonshotai/kimi-k2:free",
          "messages": [
            { "role": "system", "content": systemInstruction },
            ...chatHistory.map(m => ({ role: m.role, content: m.text })),
            { "role": "user", "content": userMessage }
          ]
        })
      });

      if (!response.ok) throw new Error("Failed to connect to OpenRouter");
      
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer d'analyse.";
      
      addChatMessage('assistant', aiResponse);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      addChatMessage('assistant', "Erreur de connexion avec l'intelligence OpenRouter. Vérifiez votre clé API.");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Analyse de rentabilité ce mois",
    "État critique du stock ?",
    "Répartition des charges fixes",
    "Prévisions basées sur les ventes wholesale"
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Bot className="text-blue-600" size={28} />
            Analyste IA (Kimi K2)
          </h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            Lecture Seule via OpenRouter
          </p>
        </div>
        <button 
          onClick={clearChat}
          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Sparkles size={48} className="text-blue-600 mb-4" />
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Analyste Financier Prêt</h4>
              <p className="text-xs max-w-xs mx-auto mt-2">Posez vos questions sur la santé financière de Merch DZ.</p>
            </div>
          )}

          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                  ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin" />
                </div>
                <div className="p-5 bg-slate-50 text-slate-400 rounded-3xl rounded-tl-none border border-slate-100 italic">
                  Analyse des flux financiers...
                </div>
              </div>
            </div>
          )}
        </div>

        {chatHistory.length === 0 && (
          <div className="px-8 py-4 bg-slate-50/50 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-slate-50 bg-white">
          <div className="flex gap-3 relative items-center">
             <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Question sur la finance..."
              className="flex-1 pl-6 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-sm"
             />
             <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
             >
               <Send size={20} />
             </button>
          </div>
          <div className="mt-4 flex items-center gap-2 px-1">
             <Info size={12} className="text-slate-400" />
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">IA en Lecture Seule • Sécurité Financière Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
