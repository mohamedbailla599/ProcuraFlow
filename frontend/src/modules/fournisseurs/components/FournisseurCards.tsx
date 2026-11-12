import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Edit2,
  Power,
  RotateCcw,
  Copy,
  Check,
  Star,
  TrendingUp,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';
import { computeSupplierRating } from '../utils/scoring';
import { SupplierOrderStats, formatMAD } from '../utils/orderStats';
import { getStaggerDelayMs } from '../utils/pagination';

interface FournisseurCardsProps {
  fournisseurs: Fournisseur[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  batchKey?: number;
  isAnimatingEntrance?: boolean;
  orderStats?: Record<number, SupplierOrderStats>;
  onEdit: (fournisseur: Fournisseur) => void;
  onToggleStatus: (fournisseur: Fournisseur) => void;
  onViewCommandes: (fournisseur: Fournisseur) => void;
}

export const FournisseurCards: React.FC<FournisseurCardsProps> = ({
  fournisseurs,
  loading,
  error = null,
  onRetry,
  batchKey = 0,
  isAnimatingEntrance = false,
  orderStats,
  onEdit,
  onToggleStatus,
  onViewCommandes,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'FO';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Skeleton loading
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-fade-in-up stagger-${i}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                <div className="h-3 w-1/3 rounded-md skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full rounded-md skeleton-shimmer" />
              <div className="h-3 w-4/5 rounded-md skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error && fournisseurs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/60 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5 border border-rose-100 dark:border-rose-900/60">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Impossible de charger cette page
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-4">
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (fournisseurs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-16 text-center shadow-xs animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Aucun fournisseur trouvé</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Aucun fournisseur ne correspond aux critères de filtre ou de recherche sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-150 ${
        loading ? 'opacity-55 pointer-events-none' : 'opacity-100'
      }`}
    >
      {fournisseurs.map((fournisseur, index) => {
        const initials = getInitials(fournisseur.nom);
        const rating = computeSupplierRating(fournisseur);
        const stats = orderStats?.[fournisseur.id];

        return (
          <div
            key={`${batchKey}-${fournisseur.id}`}
            className={`group rounded-xl border transition-all duration-200 flex flex-col justify-between ${
              isAnimatingEntrance ? 'supplier-entrance' : ''
            } ${
              fournisseur.actif
                ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-teal-300/60 dark:hover:border-teal-700/60 shadow-xs hover:shadow-lg hover:-translate-y-1'
                : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 opacity-85 hover:opacity-100 shadow-xs hover:shadow-md hover:-translate-y-0.5'
            }`}
            style={
              isAnimatingEntrance
                ? { animationDelay: `${getStaggerDelayMs(index, fournisseurs.length)}ms` }
                : undefined
            }
          >
            {/* Card Content */}
            <div className="p-5 space-y-3.5">
              {/* Header: Avatar + Nom + Statut */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none transition-all duration-200 group-hover:scale-110 ${
                      fournisseur.actif
                        ? 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="font-semibold text-slate-900 dark:text-white text-sm truncate group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors duration-150"
                      title={fournisseur.nom}
                    >
                      {fournisseur.nom}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      ID: #{fournisseur.id}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {fournisseur.actif ? (
                  <span className="badge-active shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span>Actif</span>
                  </span>
                ) : (
                  <span className="badge-inactive shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Inactif</span>
                  </span>
                )}
              </div>

              {/* Evaluation & Scoring Banner */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60">
                <div className="flex items-center space-x-1.5">
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(rating.score)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {rating.score.toFixed(1)}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${rating.badgeClass}`}
                  title={`Fiabilité opérationnelle : ${rating.fiabilitePct}%`}
                >
                  {rating.statusLabel}
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-xs">
                {/* Email with copy */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-700/60">
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate" title={fournisseur.email}>
                      {fournisseur.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(fournisseur.email, `grid-email-${fournisseur.id}`, e)}
                    title="Copier l'email"
                    aria-label="Copier l'email"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150 shrink-0 active:scale-90"
                  >
                    {copiedKey === `grid-email-${fournisseur.id}` ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Telephone with copy */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-700/60">
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate" title={fournisseur.telephone || 'Non renseigné'}>
                      {fournisseur.telephone || (
                        <span className="text-slate-400 dark:text-slate-500 italic">Non renseigné</span>
                      )}
                    </span>
                  </div>
                  {fournisseur.telephone && (
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(fournisseur.telephone!, `grid-phone-${fournisseur.id}`, e)}
                      title="Copier le téléphone"
                      aria-label="Copier le téléphone"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150 shrink-0 active:scale-90"
                    >
                      {copiedKey === `grid-phone-${fournisseur.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Address with copy */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-700/60">
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate" title={fournisseur.adresse || 'Non renseignée'}>
                      {fournisseur.adresse || (
                        <span className="text-slate-400 dark:text-slate-500 italic">Non renseignée</span>
                      )}
                    </span>
                  </div>
                  {fournisseur.adresse && (
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(fournisseur.adresse!, `grid-addr-${fournisseur.id}`, e)}
                      title="Copier l'adresse"
                      aria-label="Copier l'adresse"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150 shrink-0 active:scale-90"
                    >
                      {copiedKey === `grid-addr-${fournisseur.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Purchasing Statistics Section */}
              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100/90 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5" title="Volume global de commandes actives (inclut les commandes en attente)">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Total Commandé</span>
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {stats ? formatMAD(stats.totalOrderedAmount) : '0,00 MAD'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 flex items-center space-x-1.5" title="Engagements fermes validés (hors commandes en attente & annulations)">
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Total Engagé</span>
                  </span>
                  <span className="font-extrabold text-teal-900 dark:text-teal-100 text-xs">
                    {stats ? formatMAD(stats.totalCommittedAmount) : '0,00 MAD'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Commandes
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {stats ? `${stats.activeOrders} active${stats.activeOrders > 1 ? 's' : ''}` : '0'}
                      {stats && stats.completedOrders > 0 && (
                        <span className="text-purple-600 dark:text-purple-400 ml-1" title="Commandes réceptionnées ou facturées dans le workflow Commandes (service fait, hors paiement)">
                          ({stats.completedOrders} liv.)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Dernière Cde
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-end space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {stats?.latestOrderDate
                          ? new Date(stats.latestOrderDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : 'Aucune'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions Footer */}
            <div className="px-4 py-3 border-t border-slate-100/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-b-xl flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onViewCommandes(fournisseur)}
                className="inline-flex items-center space-x-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/80 transition-all duration-150 shadow-xs active:scale-[0.97]"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Commandes</span>
                {stats && stats.totalOrders > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white">
                    {stats.activeOrders}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onEdit(fournisseur)}
                  title="Modifier le fournisseur"
                  aria-label="Modifier"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all duration-150 active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {fournisseur.actif ? (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(fournisseur)}
                    title="Désactiver le fournisseur"
                    aria-label="Désactiver"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all duration-150 active:scale-95"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(fournisseur)}
                    title="Réactiver le fournisseur"
                    aria-label="Réactiver"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all duration-150 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
