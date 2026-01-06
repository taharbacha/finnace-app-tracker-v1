
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store.tsx';
import { 
  LayoutDashboard, 
  Truck, 
  TrendingUp,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Package,
  Wallet,
  Globe,
  UserCheck,
  Megaphone,
  Cloud,
  Bot,
  RotateCcw,
  X
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const { isSyncing, isCloudActive, syncData, lastSynced } = useAppStore();
  
  // Group 1: Finance & Ops
  const primaryNavItems = [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/gros', label: 'Commandes GROS', icon: Truck },
    { to: '/detail', label: 'Commandes sitweb', icon: Globe },
    { to: '/retour', label: 'Retours', icon: RotateCcw },
    { to: '/offres', label: 'Les Offres', icon: TrendingUp },
    { to: '/charges', label: 'Les Charges', icon: Wallet },
  ];

  // Group 2: Marketing & Growth
  const secondaryNavItems = [
    { to: '/marketing', label: 'Marketing Clients', icon: UserCheck },
    { to: '/marketing-spend', label: 'Marketing Spend', icon: Megaphone },
    { to: '/inventory', label: 'Stock & Inventaire', icon: Package },
    { to: '/ai', label: 'Assistant IA', icon: Bot },
  ];

  const renderNavLink = (item: any) => (
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
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0 md:h-screen md:sticky md:top-0
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-8 pb-4 flex items-center justify-between pt-[calc(2rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Merch By DZ" className="w-10 h-10 object-contain rounded-xl" />
          <div>
            <h1 className="font-black text-white text-lg leading-tight tracking-tighter">Merch By DZ</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cloud OS v3.5</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Finance & Ops</p>
        {primaryNavItems.map(renderNavLink)}
        
        <div className="my-6 border-t border-slate-800/30 mx-4" />
        
        <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Marketing & Stock</p>
        {secondaryNavItems.map(renderNavLink)}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800/50 bg-slate-900/50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
      
      <div className="p-4 mx-4 mb-8 md:mb-8 bg-slate-800/5 rounded-3xl border border-slate-800/20 flex items-center justify-center">
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Opérations Ouvertes</p>
      </div>
    </aside>
  );
};

export default Sidebar;
