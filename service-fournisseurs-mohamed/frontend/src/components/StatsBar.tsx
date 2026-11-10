import React from 'react';
import { Users, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';

interface StatsBarProps {
  fournisseurs: Fournisseur[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ fournisseurs }) => {
  const total = fournisseurs.length;
  const actifs = fournisseurs.filter((f) => f.actif).length;
  const inactifs = total - actifs;
  const tauxActif = total > 0 ? Math.round((actifs / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Fournisseurs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Actifs Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fournisseurs Actifs</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{actifs}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* Inactifs Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fournisseurs Inactifs</p>
          <p className="text-2xl font-bold text-slate-500 mt-1">{inactifs}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
          <XCircle className="w-5 h-5" />
        </div>
      </div>

      {/* Taux d'activité */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Disponibilité</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{tauxActif}%</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

