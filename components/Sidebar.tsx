import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store.tsx';
import { 
  LayoutDashboard, 
  Truck, 
  ShoppingBag, 
  TrendingUp,
  User,
  LogOut,
  ShieldCheck
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
    <aside className="w-64 bg-slate-900 text-slate-400 h-screen sticky top-0 flex flex-col z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-blue-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">M</div>
        <div>
          <h1 className="font-black text-white text-lg leading-tight tracking-tighter">Merch By DZ</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Back-Office v2.5</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5">
        <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Menu Principal</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mx-4 mb-8 bg-slate-800/50 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
            <User size={16} />
          </div>
          <div className="flex-1 truncate">
            <p className="text-xs font-bold text-white truncate">Administrateur</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-500" /> Session Sécurisée
            </p>
          </div>
        </div>
        <button 
          onClick={() => { if(confirm('Confirmer la déconnexion ?')) logout(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all font-bold text-xs"
        >
          <LogOut size={16} />
          <span>Quitter le système</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;