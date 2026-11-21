import React from 'react';
import {
  ShoppingBag,
  Truck,
  Receipt,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { CycleFunnelStep } from '../types';

interface CycleFunnelChartProps {
  funnel: CycleFunnelStep[];
}

export const CycleFunnelChart: React.FC<CycleFunnelChartProps> = ({ funnel }) => {
  const formatMAD = (val: number) => {
    return (
      new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0,
      }).format(val) + ' MAD'
    );
  };

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'Truck':
        return <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Receipt':
        return <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'CheckCircle2':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Cycle d'Achat & Rapprochement 3-Voies</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des flux financiers et physiques, de l'engagement initial jusqu'au décaissement bancaire.
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/70 w-fit">
          Cycle complet en direct
        </span>
      </div>

      {/* Grid des 4 étapes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {funnel.map((step, idx) => {
          const isLast = idx === funnel.length - 1;
          return (
            <div
              key={step.id}
              className="relative p-4 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shadow-2xs">
                    {idx + 1}
                  </span>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs">
                    {getStepIcon(step.iconName)}
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {step.label}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">
                    {formatMAD(step.montantMAD)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {step.count} élément(s)
                  </span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400">
                    {step.percentageOfCommitted}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${step.percentageOfCommitted}%`,
                      backgroundColor: step.color,
                    }}
                  />
                </div>
              </div>

              {/* Flèche indicatrice sur grand écran si ce n'est pas la dernière étape */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs items-center justify-center text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
