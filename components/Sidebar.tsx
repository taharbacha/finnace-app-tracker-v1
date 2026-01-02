
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
  ShieldCheck,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Package
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { logout, isSyncing, isCloudActive, syncData, lastSynced } = useAppStore();
  const navItems = [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/gros', label: 'Commandes GROS', icon: Truck },
    { to: '/detail', label: 'Commandes Détail', icon: ShoppingBag },
    { to: '/inventory', label: 'Stock & Inventaire', icon: Package },
    { to: '/offres', label: 'Offres & Frais', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 h-screen sticky top-0 flex flex-col z-50 shadow-2xl">
      <div className="p-8 flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">M</div>
        <div>
          <h1 className="font-black text-white text-lg leading-tight tracking-tighter">Merch By DZ</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cloud OS v3.5</p>
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

      <div className="px-6 py-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
            {isCloudActive ? (
              isSyncing ? <RefreshCw size={14} className="text-blue-400 animate-spin" /> : <CheckCircle2 size={14} className="text-emerald-500" />
            ) : (
              <CloudOff size={14} className="text-slate-600" />
            )}
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {isSyncing ? "Sync..." : (isCloudActive ? "Cloud à jour" : "Mode Local")}
              </span>
              {lastSynced && isCloudActive && !isSyncing && (
                <span className="block text-[9px] text-slate-600 font-medium">Vu à {lastSynced}</span>
              )}
            </div>
           </div>
           {isCloudActive && (
             <button 
              onClick={() => syncData()}
              className={`p-2 hover:bg-slate-800 rounded-xl transition-all ${isSyncing ? 'opacity-50 pointer-events-none' : ''}`}
             >
               <Cloud size={14} className={isSyncing ? 'text-blue-400' : 'text-slate-400'} />
             </button>
           )}
        </div>
      </div>

      <div className="p-4 mx-4 mb-8 bg-slate-800/50 rounded-3xl border border-slate-800">
        <button 
          onClick={() => { if(confirm('Confirmer la déconnexion ?')) logout(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all font-bold text-xs"
        >
          <LogOut size={16} />
          <span>Quitter</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
