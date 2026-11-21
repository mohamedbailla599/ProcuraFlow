import React from 'react';
import { Building2, Award, ExternalLink, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { TopFournisseurStat } from '../types';

interface TopFournisseursBarChartProps {
  topFournisseurs: TopFournisseurStat[];
}

export const TopFournisseursBarChart: React.FC<TopFournisseursBarChartProps> = ({
  topFournisseurs,
}) => {
  const formatMAD = (amount: number) => {
    return (
      new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0,
      }).format(amount) + ' MAD'
    );
  };

  const maxAmount = Math.max(...topFournisseurs.map((f) => f.montantTotal), 1);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Top Fournisseurs par Volume</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Concentration des dépenses auprès des prestataires universitaires agréés
          </p>
        </div>
        <NavLink
          to="/fournisseurs"
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
        >
          <span>Répertoire complet</span>
          <ExternalLink className="w-3 h-3" />
        </NavLink>
      </div>

      <div className="space-y-4 my-auto py-3">
        {topFournisseurs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucune commande enregistrée pour le moment.
          </div>
        ) : (
          topFournisseurs.map((fournisseur, index) => {
            const barWidthPercent = Math.round((fournisseur.montantTotal / maxAmount) * 100);

            return (
              <div key={fournisseur.id} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : index === 2
                          ? 'bg-amber-700/20 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate">
                      {fournisseur.nom}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0 hidden sm:inline-flex">
                      <MapPin className="w-2.5 h-2.5" />
                      {fournisseur.ville}
                    </span>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {formatMAD(fournisseur.montantTotal)}
                    </span>
                  </div>
                </div>

                {/* Barre de progression avec dégradé subtil */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 group-hover:from-teal-400 group-hover:to-emerald-400"
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-0.5">
                  <span>
                    {fournisseur.nombreCommandes} commande(s) · {fournisseur.facturesPayees} réglée(s)
                  </span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {fournisseur.pourcentageBudget}% du budget engagé
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
