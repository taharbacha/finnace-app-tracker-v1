
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import CommandesGros from './pages/CommandesGros.tsx';
import CommandesDetail from './pages/CommandesDetail.tsx';
import CommandeMerch from './pages/CommandeMerch.tsx';
import MarketingClient from './pages/MarketingClient.tsx';
import MarketingSpend from './pages/MarketingSpend.tsx';
import Inventory from './pages/Inventory.tsx';
import Offres from './pages/Offres.tsx';
import Charges from './pages/Charges.tsx';
import AIAssistant from './pages/AIAssistant.tsx';
import Retour from './pages/Retour.tsx';
import { AppProvider } from './store.tsx';
import { Menu } from 'lucide-react';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-100 p-4 sticky top-0 z-30 flex items-center justify-between pt-[calc(1rem+env(safe-area-inset-top))]">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Merch By DZ" className="w-8 h-8 object-contain" />
            <span className="font-black text-slate-800 text-sm tracking-tight">Merch DZ</span>
          </div>

          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/gros" element={<AppLayout><CommandesGros /></AppLayout>} />
      <Route path="/detail" element={<AppLayout><CommandesDetail /></AppLayout>} />
      <Route path="/merch" element={<AppLayout><CommandeMerch /></AppLayout>} />
      <Route path="/marketing" element={<AppLayout><MarketingClient /></AppLayout>} />
      <Route path="/marketing-spend" element={<AppLayout><MarketingSpend /></AppLayout>} />
      <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
      <Route path="/charges" element={<AppLayout><Charges /></AppLayout>} />
      <Route path="/offres" element={<AppLayout><Offres /></AppLayout>} />
      <Route path="/ai" element={<AppLayout><AIAssistant /></AppLayout>} />
      <Route path="/retour" element={<AppLayout><Retour /></AppLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
