import React from 'react';
import {
  Wallet,
  Receipt,
  CheckCircle2,
  Truck,
  Building2,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import type { DashboardStats } from '../types';

interface DashboardKpisProps {
  stats: DashboardStats;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({ stats }) => {
  const formatMAD = (amount: number) => {
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' MAD'
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* KPI 1 : Budget Total Engagé */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Budget Engagé
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatMAD(stats.budgetTotalEngage)}
          </span>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.totalCommandes} bon(s) émis</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {stats.commandesValideesOuLivrees} en exécution
            </span>
          </div>
        </div>
      </div>

      {/* KPI 2 : Montant Total Facturé */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Facturé & Rapproché
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
            {formatMAD(stats.montantTotalFacture)}
          </span>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.totalFactures} facture(s) 3-voies</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
              {stats.tauxRapprochement3Voies}% 3-voies
            </span>
          </div>
        </div>
      </div>

      {/* KPI 3 : Montant Payé / Réglé */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Décaissements Réglés
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatMAD(stats.montantTotalPaye)}
          </span>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.facturesPayeesCount} réglée(s)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {stats.tauxReglement}% payé
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4 : Taux de Conformité Réceptions */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Conformité Livraisons
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.tauxConformite}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              sans réserve
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.totalReceptions} bon(s) reçus</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {stats.totalUnitesRecues} unités
            </span>
          </div>
        </div>
      </div>

      {/* KPI 5 : Répertoire Fournisseurs */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fournisseurs Actifs
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.fournisseursActifs}
            </span>
            <span className="text-xs font-medium text-slate-400">/ {stats.totalFournisseurs} total</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Éligibilité globale</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {stats.tauxEligibilite}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
