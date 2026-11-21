import React, { useState, useMemo } from 'react';
import { PieChart } from 'lucide-react';
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
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE'>('ALL');

  const formatMAD = (amount: number) => {
    return (
      new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0,
      }).format(amount) + ' MAD'
    );
  };

  // Filtrage selon le mode choisi (Tous les bons vs Engagements actifs)
  const visibleItems = useMemo(() => {
    if (filterMode === 'ACTIVE') {
      return items.filter((i) => i.statut !== 'ANNULEE');
    }
    return items;
  }, [items, filterMode]);

  // Total montant et total bons pour l'échantillon actuellement affiché
  const totalChartMontant = useMemo(() => {
    return visibleItems.reduce((acc, it) => acc + it.montantMAD, 0);
  }, [visibleItems]);

  const totalChartCount = useMemo(() => {
    return visibleItems.reduce((acc, it) => acc + it.count, 0);
  }, [visibleItems]);

  // Paramètres géométriques du Donut SVG
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Calcul dynamique des segments avec garantie absolue que la somme = 100%
  const segments = useMemo(() => {
    let cumulativePercent = 0;
    const isSingleSegment = visibleItems.length === 1;

    return visibleItems.map((item, index) => {
      const rawPercent = totalChartMontant > 0 ? (item.montantMAD / totalChartMontant) * 100 : 0;
      const percent = Math.min(100, Math.max(0, rawPercent));
      
      // Arc de cercle SVG
      const dashLength = (percent / 100) * circumference;
      const strokeDasharray = `${dashLength} ${circumference}`;
      const strokeDashoffset = -((cumulativePercent / 100) * circumference);
      cumulativePercent += percent;

      return {
        ...item,
        percent,
        strokeDasharray,
        strokeDashoffset,
        index,
        isSingleSegment,
      };
    });
  }, [visibleItems, totalChartMontant, circumference]);

  const activeItem = hoveredIndex !== null ? segments[hoveredIndex] : null;

  const totalAllCount = items.reduce((s, i) => s + i.count, 0);
  const totalActiveCount = items.filter((i) => i.statut !== 'ANNULEE').reduce((s, i) => s + i.count, 0);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      {/* En-tête avec toggle Tous / Actifs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Répartition par Statut</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ventilation des montants selon l'avancement dans le cycle d'achat
          </p>
        </div>

        {/* Boutons Toggle Filtre */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold w-fit">
          <button
            type="button"
            onClick={() => {
              setFilterMode('ALL');
              setHoveredIndex(null);
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Tous ({totalAllCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode('ACTIVE');
              setHoveredIndex(null);
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Actifs ({totalActiveCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center my-auto py-4">
        {/* Graphique Donut SVG */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-48 h-48 -rotate-90 transform"
            viewBox="0 0 160 160"
          >
            {/* Anneau de fond neutre */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />

            {/* Tranches dynamiques proportionnelles */}
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
                  strokeLinecap={seg.isSingleSegment ? 'round' : 'butt'}
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
                  {filterMode === 'ALL' ? 'Total Bons' : 'Budget Actif'}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
                  {formatMAD(totalChartMontant)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {totalChartCount} commande(s)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Légende interactive */}
        <div className="space-y-2">
          {segments.map((seg) => {
            const isHovered = hoveredIndex === seg.index;
            const displayPercent = Math.round(seg.percent);

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
                    {displayPercent}%
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
