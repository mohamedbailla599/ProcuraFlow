import React from 'react';
import { Receipt, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { FactureStats, FactureStatusFilter } from '../types';
import { formatMAD } from '../utils';

interface FactureStatsBarProps {
  stats: FactureStats;
  currentStatusFilter?: FactureStatusFilter;
  currentFilter?: FactureStatusFilter;
  onSelectStatusFilter?: (status: FactureStatusFilter) => void;
  onSelectFilter?: (status: FactureStatusFilter) => void;
}

export const FactureStatsBar: React.FC<FactureStatsBarProps> = ({
  stats,
  currentStatusFilter,
  currentFilter,
  onSelectStatusFilter,
  onSelectFilter,
}) => {
  const activeFilter = currentFilter || currentStatusFilter || 'all';
  const handleSelect = onSelectFilter || onSelectStatusFilter || (() => {});
  const {
    totalCount,
    nonPayeesCount,
    payeesCount,
    montantTotal,
    montantNonPaye,
    montantPaye,
    tauxReglement,
  } = stats;

  const cardBase =
    'group relative rounded-xl border p-5 transition-all duration-200 cursor-pointer active:scale-[0.98]';
  const cardDefault =
    'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Factures */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSelect('all')}
        onKeyDown={(e) => e.key === 'Enter' && handleSelect('all')}
        className={`${cardBase} animate-fade-in-up stagger-1 ${
          activeFilter === 'all'
            ? 'bg-white dark:bg-slate-900 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
            : cardDefault
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Factures
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all duration-200 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700 group-hover:scale-105">
            <Receipt className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-count-up">
              {totalCount}
            </span>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Vol. {formatMAD(montantTotal)}
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pb-1">
            Global
          </span>
        </div>
      </div>

      {/* 2. Factures Non Payées */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSelect('NON_PAYEE')}
        onKeyDown={(e) => e.key === 'Enter' && handleSelect('NON_PAYEE')}
        className={`${cardBase} animate-fade-in-up stagger-2 ${
          activeFilter === 'NON_PAYEE'
            ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
            : cardDefault
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            En Attente (Non Payées)
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all duration-200 group-hover:bg-amber-100/70 dark:group-hover:bg-amber-900/80 group-hover:scale-105 border border-amber-100 dark:border-amber-900/60">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight animate-count-up">
              {nonPayeesCount}
            </span>
            <div className="text-[11px] font-medium text-amber-600/80 dark:text-amber-400/80 mt-1">
              Reste {formatMAD(montantNonPaye)}
            </div>
          </div>
          <span className="text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70 pb-1">
            À régler
          </span>
        </div>
      </div>

      {/* 3. Factures Payées */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSelect('PAYEE')}
        onKeyDown={(e) => e.key === 'Enter' && handleSelect('PAYEE')}
        className={`${cardBase} animate-fade-in-up stagger-3 ${
          activeFilter === 'PAYEE'
            ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
            : cardDefault
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Règlements Effectués
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-all duration-200 group-hover:bg-emerald-100/70 dark:group-hover:bg-emerald-900/80 group-hover:scale-105 border border-emerald-100 dark:border-emerald-900/60">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight animate-count-up">
              {payeesCount}
            </span>
            <div className="text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Réglé {formatMAD(montantPaye)}
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70 pb-1">
            Conformes
          </span>
        </div>
      </div>

      {/* 4. Taux de Règlement */}
      <div className={`${cardBase} ${cardDefault} animate-fade-in-up stagger-4 cursor-default`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
            Taux de Règlement
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center transition-all duration-200 group-hover:bg-teal-100/70 dark:group-hover:bg-teal-900/80 group-hover:scale-105 border border-teal-100 dark:border-teal-900/60">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight animate-count-up">
              {tauxReglement}%
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {payeesCount}/{totalCount || 1} factures
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, tauxReglement))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
