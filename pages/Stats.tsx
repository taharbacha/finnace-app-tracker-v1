
import React, { useMemo } from 'react';
import { useAppStore } from '../store.tsx';
import { 
  GrosStatus, 
  SitewebStatus, 
  MerchStatus, 
  MarketingSpendSource 
} from '../types.ts';
import { 
  FileBarChart, 
  ArrowRight, 
  Minus, 
  Plus, 
  Equal, 
  Truck, 
  ShoppingBag, 
  Globe,
  Info
} from 'lucide-react';

const formatCurrency = (val: number) => val.toLocaleString('fr-DZ') + ' DA';

const AccountingRow = ({ label, value, type = 'expense' }: { label: string, value: number, type?: 'revenue' | 'expense' | 'total' }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 group">
    <div className="flex items-center gap-3">
      {type === 'revenue' && <Plus size={14} className="text-emerald-500" />}
      {type === 'expense' && <Minus size={14} className="text-red-400" />}
      {type === 'total' && <Equal size={14} className="text-blue-500" />}
      <span className={`text-xs font-bold uppercase tracking-wider ${type === 'total' ? 'text-slate-900' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
    <span className={`font-mono text-sm font-black tabular-nums ${
      type === 'revenue' ? 'text-emerald-600' : 
      type === 'expense' ? 'text-red-500' : 
      value >= 0 ? 'text-blue-600' : 'text-red-600'
    }`}>
      {type === 'expense' && value !== 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
    </span>
  </div>
);

const PillarStatsCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  ventes, 
  production, 
  retours, 
  ads, 
  commissions, 
  colorClass 
}: any) => {
  const profitFinal = ventes - production - retours - ads - (commissions || 0);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`p-8 border-b border-slate-50 ${colorClass.bg} flex items-center gap-4`}>
        <div className={`p-4 rounded-2xl bg-white shadow-sm ${colorClass.text