import React from 'react';
import { Users, CheckCircle2, XCircle, TrendingUp, Sparkles } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
      {/* Total Card */}
      <div
        onClick={() => onSelectStatusFilter('all')}
        className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
          currentStatusFilter === 'all'
            ? 'bg-gradient-to-br from-white via-slate-50 to-teal-50/40 border-teal-500 shadow-md shadow-teal-500/10 ring-2 ring-teal-500/20'
            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fournisseurs</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100/80 text-slate-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="font-medium text-teal-700 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Répertoire complet</span>
          </span>
        </div>
      </div>

      {/* Actifs Card */}
      <div
        onClick={() => onSelectStatusFilter('active')}
        className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
          currentStatusFilter === 'active'
            ? 'bg-gradient-to-br from-white via-emerald-50/30 to-emerald-50/60 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Fournisseurs Actifs</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">{actifs}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          <span>Éligibles aux commandes</span>
        </div>
      </div>

      {/* Inactifs Card */}
      <div
        onClick={() => onSelectStatusFilter('inactive')}
        className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
          currentStatusFilter === 'inactive'
            ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100/60 border-slate-500 shadow-md ring-2 ring-slate-400/20'
            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fournisseurs Inactifs</p>
            <p className="text-3xl font-extrabold text-slate-600 mt-1 tracking-tight">{inactifs}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-inner">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span>Désactivés logiquement</span>
        </div>
      </div>

      {/* Disponibilité / Taux Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Taux d'Éligibilité</p>
            <p className="text-3xl font-extrabold text-teal-700 mt-1 tracking-tight">{tauxActif}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-50 to-emerald-50 text-teal-600 flex items-center justify-center shadow-inner border border-teal-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${tauxActif}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
