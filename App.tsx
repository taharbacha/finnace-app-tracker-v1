
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import CommandesGros from './pages/CommandesGros.tsx';
import CommandesDetail from './pages/CommandesDetail.tsx';
import Inventory from './pages/Inventory.tsx';
import Offres from './pages/Offres.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { AppProvider, useAppStore } from './store.tsx';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/gros" element={<ProtectedLayout><CommandesGros /></ProtectedLayout>} />
      <Route path="/detail" element={<ProtectedLayout><CommandesDetail /></ProtectedLayout>} />
      <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
      <Route path="/offres" element={<ProtectedLayout><Offres /></ProtectedLayout>} />
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
