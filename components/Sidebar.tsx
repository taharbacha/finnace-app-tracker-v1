
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store';
import { 
  LayoutDashboard, 
  Truck, 
  ShoppingBag, 
  TrendingUp,
  User,
  LogOut
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { logout } = useAppStore();
  const navItems = [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/gros', label: 'Commandes GROS', icon: Truck },
    { to: '/detail', label: 'Commandes Détail', icon: ShoppingBag },
    { to: '/offres', label: 'Offres & Frais', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">M</div>
        <h1 className="font-bold text-slate-800 text-lg tracking-tight">Merch By DZ</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3 px-4 py-3 text-slate-500">
          <User size={20} />
          <span className="text-sm font-medium">Administrateur</span>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
