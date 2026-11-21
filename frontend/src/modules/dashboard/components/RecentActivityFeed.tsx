import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Clock,
  ShoppingBag,
  Truck,
  Receipt,
  CheckCircle2,
  Activity,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { RecentActivityItem, ActivityType } from '../types';

interface RecentActivityFeedProps {
  activities: RecentActivityItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const [selectedType, setSelectedType] = useState<ActivityType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const formatMAD = (amount?: number) => {
    if (amount === undefined || amount === null) return '';
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ' MAD'
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtrage selon le type et la recherche
  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badgeText.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [activities, selectedType, searchQuery]);

  // Nombre d'activités affichées
  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 8);

  // Compteurs par type
  const counts = useMemo(() => {
    return {
      ALL: activities.length,
      COMMANDE: activities.filter((a) => a.type === 'COMMANDE').length,
      RECEPTION: activities.filter((a) => a.type === 'RECEPTION').length,
      FACTURE: activities.filter((a) => a.type === 'FACTURE').length,
      PAIEMENT: activities.filter((a) => a.type === 'PAIEMENT').length,
    };
  }, [activities]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'COMMANDE':
        return <ShoppingBag className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'RECEPTION':
        return <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'FACTURE':
        return <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'PAIEMENT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityIconBg = (type: ActivityType) => {
    switch (type) {
      case 'COMMANDE':
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60';
      case 'RECEPTION':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
      case 'FACTURE':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60';
      case 'PAIEMENT':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
    <div className="w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
      {/* En-tête avec titre, indicateur live et recherche */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Journal d'Activité en Temps Réel
                </h3>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Flux Actif</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Piste d'audit consolidée des commandes, livraisons physiques, facturations et décaissements
              </p>
            </div>
          </div>
        </div>

        {/* Barre de recherche intégrée */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer par réf, fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Onglets Filtres par Module / Type d'activité */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedType('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Tous les flux ({counts.ALL})
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('COMMANDE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            selectedType === 'COMMANDE'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ShoppingBag className="w-3 h-3" />
          <span>Commandes ({counts.COMMANDE})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('RECEPTION')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            selectedType === 'RECEPTION'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Truck className="w-3 h-3" />
          <span>Réceptions ({counts.RECEPTION})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('FACTURE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            selectedType === 'FACTURE'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Receipt className="w-3 h-3" />
          <span>Factures ({counts.FACTURE})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('PAIEMENT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            selectedType === 'PAIEMENT'
              ? 'bg-green-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Règlements ({counts.PAIEMENT})</span>
        </button>
      </div>

      {/* Liste des Cartes d'Activité */}
      <div className="space-y-2.5">
        {displayedActivities.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800">
            <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Aucun événement ne correspond à vos critères
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Essayez de modifier votre recherche ou de sélectionner un autre type de flux.
            </p>
            {(searchQuery || selectedType !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType('ALL');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          displayedActivities.map((item) => (
            <NavLink
              key={item.id}
              to={item.linkTo}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-xs transition-all duration-150 group"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                {/* Icône de type */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getActivityIconBg(
                    item.type
                  )} group-hover:scale-105 transition-transform`}
                >
                  {getActivityIcon(item.type)}
                </div>

                {/* Titre et détails */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
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
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Montant, date et action */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-1 sm:pl-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800/80 shrink-0">
                {item.montant !== undefined && (
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white font-mono block">
                    {formatMAD(item.montant)}
                  </span>
                )}
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDate(item.date)}
                  </span>
                  <span className="hidden sm:inline text-teal-600 dark:text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </NavLink>
          ))
        )}
      </div>

      {/* Bouton Afficher plus / Afficher moins */}
      {filteredActivities.length > 8 && (
        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Afficher moins (8 récents)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>
                  Afficher tout l'historique ({filteredActivities.length - 8} supplémentaires)
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
