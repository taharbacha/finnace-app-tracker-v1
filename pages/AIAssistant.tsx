
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, MessageSquare } from 'lucide-react';

interface LocalMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  // FULL ISOLATION: We use local state and localStorage for persistence
  // This ensures the AI feature doesn't depend on or interfere with store.tsx
  const [messages, setMessages] = useState<LocalMessage[]>(() => {
    try {
      const saved = localStorage.getItem('merchdz_ai_chat_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom and persist messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    localStorage.setItem('merchdz_ai_chat_v2', JSON.stringify(messages));
  }, [messages, isLoading]);

  const handleClear = () => {
    if (window.confirm('Voulez-vous effacer l\'historique de votre conversation avec l\'assistant ?')) {
      setMessages([]);
      localStorage.removeItem('merchdz_ai_chat_v2');
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: LocalMessage = { role: 'user', content: trimmedInput };
    const updatedHistory = [...messages, userMessage];
    
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedHistory })
      });

      if (!response.ok) {
        throw new Error('Response error');
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "Désolé, je rencontre des difficultés à traiter votre demande.";
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiResponse 
      }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Une erreur est survenue lors de la communication avec le serveur AI. Veuillez réessayer ultérieurement." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Bot size={24} />
            </div>
            Assistant IA
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Consultant stratégique Merch By DZ • Propulsé par Kimi-k2</p>
        </div>
        
        {messages.length > 0 && (
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Trash2 size={16} />
            Effacer
          </button>
        )}
      </div>

      <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden">
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce duration-1000">
                <Sparkles size={40} />
              </div>
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Prêt à vous aider</h4>
              <p className="text-slate-400 text-xs max-w-xs mx-auto mt-3 leading-relaxed">
                Posez des questions sur l'optimisation de vos ventes, vos stratégies marketing ou la gestion de vos opérations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-lg w-full">
                {[
                  "Comment améliorer mon ROI marketing ?",
                  "Stratégie pour augmenter le volume Wholesale",
                  "Conseils pour la gestion des stocks critiques",
                  "Optimiser les commissions vendeurs"
                ].map((hint) => (
                  <button 
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 transition-all"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 md:gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                  ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl text-sm leading-relaxed whitespace-pre-wrap
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
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin" />
                </div>
                <div className="p-5 bg-slate-50 text-slate-400 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-slate-50 bg-white">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <MessageSquare size={18} />
              </div>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message à l'Assistant..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-sm"
                disabled={isLoading}
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-300 mt-4 uppercase font-black tracking-widest">
            Module IA Isolé • Merch By DZ Operations
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
