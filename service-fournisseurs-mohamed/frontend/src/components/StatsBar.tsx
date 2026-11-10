import React from 'react';
import { Users, CheckCircle2, XCircle, Percent } from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';

interface StatsBarProps {
  fournisseurs: Fournisseur[];
  currentStatusFilter: 'all' | 'active' | 'inactive';
  onSelectStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  fournisseurs,
  currentStatusFilter,
  onSelectStatusFilter,
}) => {
  const total = fournisseurs.length;
  const actifs = fournisseurs.filter((f) => f.actif).length;
  const inactifs = total - actifs;
  const tauxActif = total > 0 ? Math.round((actifs / total) * 100) : 0;

  const cardBase =
    'group relative rounded-xl border p-5 transition-all duration-200 cursor-pointer active:scale-[0.98]';
  const cardSelected = (color: string) =>
    `bg-white border-${color}-500 shadow-sm ring-2 ring-${color}-500/20`;
  const cardDefault =
    'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Fournisseurs */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStatusFilter('all')}
        onKeyDown={(e) => e.key === 'Enter' && onSelectStatusFilter('all')}
        className={`${cardBase} animate-fade-in-up stagger-1 ${
          currentStatusFilter === 'all'
            ? 'bg-white border-teal-500 shadow-sm ring-2 ring-teal-500/20'
            : cardDefault
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Fournisseurs
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center transition-all duration-200 group-hover:bg-slate-200/70 group-hover:scale-105">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight animate-count-up">
            {total}
          </span>
          <span className="text-[11px] font-medium text-slate-400 pb-1">
            Répertoire global
          </span>
        </div>
      </div>

      {/* 2. Fournisseurs Actifs */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStatusFilter('active')}
        onKeyDown={(e) => e.key === 'Enter' && onSelectStatusFilter('active')}
        className={`${cardBase} animate-fade-in-up stagger-2 ${
          currentStatusFilter === 'active'
            ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
            : cardDefault
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Fournisseurs Actifs
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all duration-200 group-hover:bg-emerald-100/70 group-hover:scale-105 border border-emerald-100">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-extrabold text-emerald-600 tracking-tight animate-count-up">
            {actifs}
          </span>
          <span className="text-[11px] font-medium text-emerald-600/70 pb-1">
            Commandes autorisées
          </span>
        </div>
      </div>

      {/* 3. Fournisseurs Inactifs */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStatusFilter('inactive')}
        onKeyDown={(e) => e.key === 'Enter' && onSelectStatusFilter('inactive')}
        className={`${cardBase} animate-fade-in-up stagger-3 ${
          currentStatusFilter === 'inactive'
            ? 'bg-white border-slate-400 shadow-sm ring-2 ring-slate-400/25'
            : cardDefault
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Fournisseurs Inactifs
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all duration-200 group-hover:bg-slate-200/70 group-hover:scale-105">
            <XCircle className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-extrabold text-slate-600 tracking-tight animate-count-up">
            {inactifs}
          </span>
          <span className="text-[11px] font-medium text-slate-400 pb-1">
            Désactivés
          </span>
        </div>
      </div>

      {/* 4. Taux d'Éligibilité */}
      <div className={`${cardBase} animate-fade-in-up stagger-4 bg-white border-slate-200/80`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
            Taux d'Éligibilité
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Percent className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-extrabold text-teal-700 tracking-tight animate-count-up">
            {tauxActif}%
          </span>
          <span className="text-[11px] font-medium text-teal-600/70 pb-1">
            {actifs} sur {total}
          </span>
        </div>
        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-600 to-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${tauxActif}%` }}
          />
        </div>
      </div>
    </div>
  );
};
