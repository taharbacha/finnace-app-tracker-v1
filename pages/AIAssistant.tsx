
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { Send, Bot, User, Loader2, Sparkles, Trash2, MessageSquare, Info } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const { getDashboardData, inventory, gros, siteweb } = useAppStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('merchdz_advisor_chat');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // BUILD EXPLICIT CONTEXT STRING
  const businessContext = useMemo(() => {
    const d = getDashboardData();
    const lowStock = inventory.filter(i => i.quantity <= i.min_stock).map(i => `${i.name} (${i.quantity}/${i.min_stock})`).join(', ');
    const recentGros = gros.slice(0, 5).map(g => `${g.reference}: ${g.status}`).join(' | ');
    
    return `
    Dashboard Summary:
    - Real Profit: ${d.encaisse_reel} DA
    - Pending: ${d.profit_attendu} DA
    - Losses: ${d.pertes} DA
    - Net Final: ${d.profit_net_final} DA
    - Total Mkt Spend: ${d.total_marketing_spend} DA
    
    Inventory Alerts: ${lowStock || 'None'}
    Recent Wholesale Activity: ${recentGros}
    Total Retail Orders: ${siteweb.length}
    `.trim();
  }, [getDashboardData, inventory, gros, siteweb]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    localStorage.setItem('merchdz_advisor_chat', JSON.stringify(messages));
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    
    setMessages(history);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: history,
          context: businessContext
        })
      });

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "Désolé, je ne peux pas répondre pour le moment.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion avec le service IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Effacer la conversation ?')) {
      setMessages([]);
      localStorage.removeItem('merchdz_advisor_chat');
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Bot className="text-blue-600" size={32} />
            Conseiller Stratégique
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Analyse intelligente basée sur vos données réelles.</p>
        </div>
        <button onClick={clearChat} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden relative">
        {/* Context Status Indicator */}
        <div className="absolute top-4 right-6 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Données synchronisées
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
                <Sparkles size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Comment puis-je vous aider ?</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Je peux analyser votre ROI marketing, identifier les stocks critiques ou suggérer des optimisations pour vos marges Wholesale.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-md">
                {[
                  "Analyse mon profit net actuel",
                  "Quels stocks sont prioritaires ?",
                  "Conseils pour mon ROI marketing",
                  "Résumé de l'activité Wholesale"
                ].map(hint => (
                  <button 
                    key={hint} 
                    onClick={() => setInput(hint)}
                    className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 transition-all text-left"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                  ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-50 bg-white">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez une question sur votre business..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-sm"
                disabled={isLoading}
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
            <Info size={12} />
            Intelligence Artificielle de Consultation • Mode Lecture Seule
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
