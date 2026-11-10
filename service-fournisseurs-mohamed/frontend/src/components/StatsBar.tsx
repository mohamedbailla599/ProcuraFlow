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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. Total Fournisseurs */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStatusFilter('all')}
        onKeyDown={(e) => e.key === 'Enter' && onSelectStatusFilter('all')}
        className={`group relative rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
          currentStatusFilter === 'all'
            ? 'bg-white border-teal-500 shadow-sm ring-1 ring-teal-500/20'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Fournisseurs
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center transition-colors group-hover:bg-slate-200/70">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{total}</span>
          <span className="text-[11px] font-medium text-slate-400">Répertoire</span>
        </div>
      </div>

      {/* 2. Fournisseurs Actifs */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStatusFilter('active')}
        onKeyDown={(e) => e.key === 'Enter' && onSelectStatusFilter('active')}
        className={`group relative rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
          currentStatusFilter === 'active'
            ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Fournisseurs Actifs
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-100/70 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-600 tracking-tight">{actifs}</span>
          <span className="text-[11px] font-medium text-emerald-700/80">Commandes autorisées</span>
        </div>
      </div>

      {/* 3. Fournisseurs Inactifs */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectStatusFilter('inactive')}
        onKeyDown={(e) => e.key === 'Enter' && onSelectStatusFilter('inactive')}
        className={`group relative rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
          currentStatusFilter === 'inactive'
            ? 'bg-white border-slate-400 shadow-sm ring-1 ring-slate-400/20'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Fournisseurs Inactifs
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center transition-colors group-hover:bg-slate-200/70">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-600 tracking-tight">{inactifs}</span>
          <span className="text-[11px] font-medium text-slate-400">Désactivés</span>
        </div>
      </div>

      {/* 4. Taux d'Éligibilité */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
            Taux d'Éligibilité
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-teal-700 tracking-tight">{tauxActif}%</span>
          <span className="text-[11px] font-medium text-teal-700/70">{actifs} sur {total}</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-teal-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${tauxActif}%` }}
          />
        </div>
      </div>
    </div>
  );
};
