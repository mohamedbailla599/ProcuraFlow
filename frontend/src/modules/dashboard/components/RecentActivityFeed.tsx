import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Clock,
  ShoppingBag,
  Truck,
  Receipt,
  CheckCircle2,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import type { RecentActivityItem } from '../types';

interface RecentActivityFeedProps {
  activities: RecentActivityItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const formatMAD = (amount?: number) => {
    if (amount === undefined || amount === null) return '';
    return (
      new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0,
      }).format(amount) + ' MAD'
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COMMANDE':
        return <ShoppingBag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
      case 'RECEPTION':
        return <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'FACTURE':
        return <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'PAIEMENT':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBadgeClass = (variant: string) => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/70';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/70';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/70';
      case 'teal':
      default:
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/70';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Journal d'Activité en Temps Réel</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Derniers événements enregistrés sur les commandes, réceptions et facturations
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-3">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucune activité récente enregistrée.
          </div>
        ) : (
          activities.map((item) => (
            <NavLink
              key={item.id}
              to={item.linkTo}
              className="py-3 px-2 flex items-center justify-between rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getActivityIcon(item.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(
                        item.badgeVariant
                      )}`}
                    >
                      {item.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-3 flex items-center space-x-2">
                <div>
                  {item.montant !== undefined && (
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono block">
                      {formatMAD(item.montant)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(item.date)}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
              </div>
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
};
