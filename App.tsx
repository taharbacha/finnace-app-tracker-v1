
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import CommandesGros from './pages/CommandesGros.tsx';
import MarketingSpend from './pages/MarketingSpend.tsx';
import Inventory from './pages/Inventory.tsx';
import Offres from './pages/Offres.tsx';
import Charges from './pages/Charges.tsx';
import Credit from './pages/Credit.tsx';
import Stats from './pages/Stats.tsx';
import Fournisseurs from './pages/Fournisseurs.tsx';
import Facturation from './pages/Facturation.tsx';
import { AppProvider } from './store.tsx';
import { Menu, PanelLeftOpen } from 'lucide-react';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const location = useLocation();

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
  }

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
        isHidden={isSidebarHidden}
        onToggle={() => setIsSidebarHidden(!isSidebarHidden)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Desktop Show Sidebar Button - Only visible when hidden */}
        {isSidebarHidden && (
          <button 
            onClick={() => setIsSidebarHidden(false)}
            className="hidden md:flex fixed left-6 top-6 z-50 p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-xl hover:bg-slate-50 transition-all animate-in slide-in-from-left-4 duration-300"
            title="Afficher la barre latérale"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

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

        <main className={`flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ${isSidebarHidden ? 'md:pt-20' : ''}`}>
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
      <Route path="/stats" element={<AppLayout><Stats /></AppLayout>} />
      <Route path="/gros" element={<AppLayout><CommandesGros /></AppLayout>} />
      <Route path="/marketing-spend" element={<AppLayout><MarketingSpend /></AppLayout>} />
      <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
      <Route path="/charges" element={<AppLayout><Charges /></AppLayout>} />
      <Route path="/offres" element={<AppLayout><Offres /></AppLayout>} />
      <Route path="/fournisseurs" element={<AppLayout><Fournisseurs /></AppLayout>} />
      <Route path="/facturation" element={<AppLayout><Facturation /></AppLayout>} />
      <Route path="/credit" element={<AppLayout><Credit /></AppLayout>} />
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
