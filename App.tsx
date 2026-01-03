
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import CommandesGros from './pages/CommandesGros.tsx';
import CommandesDetail from './pages/CommandesDetail.tsx';
import MarketingClient from './pages/MarketingClient.tsx';
import MarketingSpend from './pages/MarketingSpend.tsx';
import Inventory from './pages/Inventory.tsx';
import Offres from './pages/Offres.tsx';
import Charges from './pages/Charges.tsx';
import { AppProvider } from './store.tsx';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/gros" element={<AppLayout><CommandesGros /></AppLayout>} />
      <Route path="/detail" element={<AppLayout><CommandesDetail /></AppLayout>} />
      <Route path="/marketing" element={<AppLayout><MarketingClient /></AppLayout>} />
      <Route path="/marketing-spend" element={<AppLayout><MarketingSpend /></AppLayout>} />
      <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
      <Route path="/charges" element={<AppLayout><Charges /></AppLayout>} />
      <Route path="/offres" element={<AppLayout><Offres /></AppLayout>} />
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
