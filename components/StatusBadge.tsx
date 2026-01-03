
import React from 'react';
// Fixed import: ExternStatus does not exist in types.ts
import { GrosStatus, SitewebStatus } from '../types.ts';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  [GrosStatus.EN_PRODUCTION]: { label: 'En Production', color: 'bg-yellow-100 text-yellow-700' },
  [GrosStatus.EN_LIVRAISON]: { label: 'En Livraison', color: 'bg-blue-100 text-blue-700' },
  [GrosStatus.LIVREE_NON_ENCAISSE]: { label: 'Livré (Non Encaissé)', color: 'bg-purple-100 text-purple-700' },
  [GrosStatus.LIVREE_ENCAISSE]: { label: 'Livré (Encaissé)', color: 'bg-emerald-100 text-emerald-700' },
  [GrosStatus.RETOUR]: { label: 'Retour', color: 'bg-red-100 text-red-700' },
  // Fix: Removed duplicate key ExternStatus.LIVREE_ENCAISSE which shares the same string value 'livree_encaisse' as GrosStatus.LIVREE_ENCAISSE
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;