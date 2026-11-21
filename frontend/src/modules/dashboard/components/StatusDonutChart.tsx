import React, { useState } from 'react';
import { PieChart, Info } from 'lucide-react';
import type { StatusDistributionItem } from '../types';

interface StatusDonutChartProps {
  items: StatusDistributionItem[];
  totalBudget: number;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  items,
  totalBudget,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatMAD = (amount: number) => {
    return (
      new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0,
      }).format(amount) + ' MAD'
    );
  };

  // Paramètres du Donut SVG
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Calcul des segments
  let cumulativePercent = 0;
  const segments = items.map((item, index) => {
    const percent = totalBudget > 0 ? (item.montantMAD / totalBudget) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += percent;

    return {
      ...item,
      percent,
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeItem = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Répartition par Statut</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ventilation des montants selon l'avancement dans le cycle d'achat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center my-auto py-4">
        {/* Graphique Donut SVG */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-48 h-48 -rotate-90 transform"
            viewBox="0 0 160 160"
          >
            {/* Anneau de fond */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            {/* Tranches dynamiques */}
            {segments.map((seg) => {
              const isHovered = hoveredIndex === seg.index;
              return (
                <circle
                  key={seg.statut}
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(seg.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(13, 148, 136, 0.4))' : undefined,
                  }}
                />
              );
            })}
          </svg>

          {/* Centre du Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            {activeItem ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {activeItem.label}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
                  {formatMAD(activeItem.montantMAD)}
                </span>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                  {Math.round(activeItem.percent)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
                  {formatMAD(totalBudget)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {items.reduce((s, i) => s + i.count, 0)} commande(s)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Légende interactive */}
        <div className="space-y-2">
          {segments.map((seg) => {
            const isHovered = hoveredIndex === seg.index;
            return (
              <div
                key={seg.statut}
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800 scale-[1.02]'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-md shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {seg.label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {seg.count} bon(s)
                    </span>
                  </div>
                </div>

                <div className="text-right pl-2 shrink-0">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block font-mono">
                    {formatMAD(seg.montantMAD)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {Math.round(seg.percent)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
