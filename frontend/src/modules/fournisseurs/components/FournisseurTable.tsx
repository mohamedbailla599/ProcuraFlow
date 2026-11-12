import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  AlertCircle,
  RefreshCw,
  Download,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';
import { computeSupplierRating } from '../utils/scoring';
import { SupplierOrderStats, formatMAD } from '../utils/orderStats';
import { getStaggerDelayMs } from '../utils/pagination';

interface FournisseurTableProps {
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
  onCityFilter?: (city: string) => void;
  onNotify?: (type: 'success' | 'error' | 'warning', text: string) => void;
}

export const FournisseurTable: React.FC<FournisseurTableProps> = ({
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
  onCityFilter,
  onNotify,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clear selections when page suppliers list changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [fournisseurs]);

  // Guarantee that the table is always scrolled to the start on load/update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [fournisseurs]);

  // Escape key cancels bulk selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        setSelectedIds(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size]);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onNotify) {
      onNotify('success', `Copié dans le presse-papiers : ${text}`);
    }
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

  // Selection handlers
  const allSelected = useMemo(() => {
    return fournisseurs.length > 0 && fournisseurs.every((f) => selectedIds.has(f.id));
  }, [fournisseurs, selectedIds]);

  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fournisseurs.map((f) => f.id)));
    }
  };

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk Export CSV for selected items
  const handleBulkExportSelected = () => {
    const selectedList = fournisseurs.filter((f) => selectedIds.has(f.id));
    if (selectedList.length === 0) return;

    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Adresse', 'Statut', 'Date Création'];
    const rows = selectedList.map((f) => [
      f.id,
      `"${f.nom.replace(/"/g, '""')}"`,
      `"${f.email.replace(/"/g, '""')}"`,
      `"${(f.telephone || '').replace(/"/g, '""')}"`,
      `"${(f.adresse || '').replace(/"/g, '""')}"`,
      f.actif ? 'Actif' : 'Inactif',
      f.createdAt || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `selection_fournisseurs_${selectedList.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onNotify) {
      onNotify('success', `${selectedList.length} fournisseur(s) sélectionné(s) exporté(s) en CSV !`);
    }
  };

  // Loading Skeleton State
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden animate-fade-in-up">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
          <div className="h-4 w-48 rounded-md skeleton-shimmer" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex items-center justify-between p-5 space-x-6 stagger-${i}`}>
              <div className="flex items-center space-x-3.5 w-1/3">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="h-4 w-1/4 rounded-md skeleton-shimmer" />
              <div className="h-4 w-1/5 rounded-md skeleton-shimmer" />
              <div className="h-6 w-18 rounded-full skeleton-shimmer" />
              <div className="h-8 w-28 rounded-lg skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error && fournisseurs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 p-12 text-center shadow-xs">
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

  // Empty State
  if (fournisseurs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-16 text-center shadow-xs animate-fade-in-up">
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
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {loading && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-teal-500/20 overflow-hidden z-20"
        >
          <div className="h-full w-1/3 bg-teal-600 dark:bg-teal-400 animate-pulse rounded-full" />
        </div>
      )}

      {/* Table Container with Controlled Scroll and Sticky Header */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto w-full max-h-[720px] overflow-y-auto scroll-smooth"
      >
        <table className="w-full min-w-[1000px] text-left border-collapse table-fixed">
          {/* Column definitions with Checkbox Column */}
          <colgroup>
            <col className="w-[48px] min-w-[48px]" />
            <col className="w-[28%] min-w-[210px]" />
            <col className="w-[22%] min-w-[180px]" />
            <col className="w-[22%] min-w-[170px]" />
            <col className="w-[12%] min-w-[110px]" />
            <col className="w-[8%] min-w-[85px]" />
            <col className="w-[145px] min-w-[145px]" />
          </colgroup>

          {/* Sticky Header with Backdrop Blur */}
          <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider select-none shadow-2xs">
            <tr>
              {/* Checkbox Header */}
              <th scope="col" className="pl-4 pr-1 py-3.5 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  aria-label={allSelected ? 'Tout désélectionner' : 'Tout sélectionner sur la page'}
                  title={allSelected ? 'Tout désélectionner' : 'Tout sélectionner sur la page'}
                  className="p-1 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ) : someSelected ? (
                    <MinusSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5">
                Fournisseur
              </th>
              <th scope="col" className="px-4 py-3.5">
                Coordonnées
              </th>
              <th scope="col" className="px-4 py-3.5">
                Adresse & Ville
              </th>
              <th scope="col" className="px-3 py-3.5">
                Évaluation
              </th>
              <th scope="col" className="px-3 py-3.5 text-center">
                Statut
              </th>
              <th scope="col" className="pr-5 pl-2 py-3.5 text-right w-[145px] min-w-[145px] whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>

          <tbody
            className={`divide-y divide-slate-100/80 dark:divide-slate-800/80 text-sm transition-opacity duration-150 ${
              loading ? 'opacity-55 pointer-events-none' : 'opacity-100'
            }`}
          >
            {fournisseurs.map((fournisseur, index) => {
              const initials = getInitials(fournisseur.nom);
              const rating = computeSupplierRating(fournisseur);
              const stats = orderStats?.[fournisseur.id];
              const isSelected = selectedIds.has(fournisseur.id);

              return (
                <tr
                  key={`${batchKey}-${fournisseur.id}`}
                  onClick={() => onViewCommandes(fournisseur)}
                  className={`transition-colors duration-150 group cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/70 dark:bg-teal-950/40 border-l-4 border-l-teal-600'
                      : 'hover:bg-teal-50/30 dark:hover:bg-slate-800/50'
                  } ${isAnimatingEntrance ? 'supplier-entrance' : ''}`}
                  style={
                    isAnimatingEntrance
                      ? { animationDelay: `${getStaggerDelayMs(index, fournisseurs.length)}ms` }
                      : undefined
                  }
                >
                  {/* Colonne 0: Checkbox */}
                  <td
                    className="pl-4 pr-1 py-4 align-middle text-center"
                    onClick={(e) => toggleSelectRow(fournisseur.id, e)}
                  >
                    <button
                      type="button"
                      aria-label={`Sélectionner ${fournisseur.nom}`}
                      className="p-1 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <Square className="w-4 h-4 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                      )}
                    </button>
                  </td>

                  {/* Colonne 1: Fournisseur (Avatar + Nom + ID) */}
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none transition-all duration-200 group-hover:scale-105 shadow-2xs ${
                          fournisseur.actif
                            ? 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-150 truncate text-sm"
                          title={fournisseur.nom}
                        >
                          {fournisseur.nom}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          ID: #{fournisseur.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Colonne 2: Coordonnées (Email + Téléphone avec copie rapide) */}
                  <td className="px-4 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col space-y-1.5 min-w-0">
                      {/* Email avec bouton copie 1-clic */}
                      <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 min-w-0 text-xs group/mail">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate" title={fournisseur.email}>
                          {fournisseur.email}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(fournisseur.email, `mail-${fournisseur.id}`, e)}
                          title="Copier l'adresse email"
                          aria-label="Copier l'adresse email"
                          className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-150 shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                        >
                          {copiedKey === `mail-${fournisseur.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>

                      {/* Téléphone */}
                      {fournisseur.telephone ? (
                        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 min-w-0 text-xs group/phone">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate" title={fournisseur.telephone}>
                            {fournisseur.telephone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(fournisseur.telephone!, `phone-${fournisseur.id}`, e)}
                            title="Copier le téléphone"
                            aria-label="Copier le téléphone"
                            className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-150 shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                          >
                            {copiedKey === `phone-${fournisseur.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Téléphone non renseigné</span>
                      )}
                    </div>
                  </td>

                  {/* Colonne 3: Adresse & Ville */}
                  <td className="px-4 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                    {fournisseur.adresse ? (
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 min-w-0 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate flex-1" title={fournisseur.adresse}>
                          {fournisseur.adresse}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Adresse non renseignée</span>
                    )}
                  </td>

                  {/* Colonne 4: Évaluation & Scoring (Stars) */}
                  <td className="px-3 py-4 align-middle whitespace-nowrap">
                    <div
                      className="flex items-center space-x-1.5"
                      title={`Évaluation : ${rating.score.toFixed(1)} / 5.0 (${rating.fiabilitePct}% de fiabilité)`}
                    >
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
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
                  </td>

                  {/* Colonne 5: Statut (Actif / Inactif) */}
                  <td className="px-3 py-4 align-middle text-center whitespace-nowrap">
                    {fournisseur.actif ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <span>Actif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Inactif</span>
                      </span>
                    )}
                  </td>

                  {/* Colonne 6: Actions */}
                  <td
                    className="pr-5 pl-2 py-4 align-middle text-right whitespace-nowrap w-[145px] min-w-[145px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end space-x-1.5 shrink-0">
                      {/* Action Voir Commandes (Icon-only with glowing hover and order counter badge) */}
                      <button
                        type="button"
                        onClick={() => onViewCommandes(fournisseur)}
                        title={
                          stats && stats.totalOrders > 0
                            ? `${fournisseur.nom} : ${stats.activeOrders} commande(s) active(s) · Total : ${formatMAD(stats.totalOrderedAmount)}`
                            : `Consulter les bons de commande de ${fournisseur.nom}`
                        }
                        aria-label={`Voir les commandes de ${fournisseur.nom}`}
                        className="relative group/cmd w-8 h-8 flex items-center justify-center rounded-lg border border-teal-200/90 dark:border-teal-800/80 bg-teal-50/80 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 transition-all duration-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 hover:border-teal-400 dark:hover:border-teal-400 hover:shadow-[0_0_12px_rgba(20,184,166,0.55)] dark:hover:shadow-[0_0_16px_rgba(45,212,191,0.45)] hover:scale-105 active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 transition-transform duration-200 group-hover/cmd:scale-110" />
                        {stats && stats.totalOrders > 0 && (
                          <span
                            className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 flex items-center justify-center text-[9px] font-extrabold rounded-full bg-teal-600 text-white shadow-xs border border-white dark:border-slate-900"
                            title={`${stats.activeOrders} commande(s) active(s)`}
                          >
                            {stats.activeOrders}
                          </span>
                        )}
                      </button>

                      {/* Action Modifier */}
                      <button
                        type="button"
                        onClick={() => onEdit(fournisseur)}
                        title="Modifier la fiche fournisseur"
                        aria-label="Modifier le fournisseur"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all duration-150 active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Action Activer / Désactiver */}
                      {fournisseur.actif ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Désactiver ce fournisseur"
                          aria-label="Désactiver le fournisseur"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all duration-150 active:scale-95"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Réactiver ce fournisseur"
                          aria-label="Réactiver le fournisseur"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all duration-150 active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Actions Bar (Appears when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-teal-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Action Exporter la sélection */}
          <button
            type="button"
            onClick={handleBulkExportSelected}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-colors active:scale-95 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV ({selectedIds.size})</span>
          </button>

          {/* Action Tout désélectionner */}
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            title="Désélectionner (Échap)"
            className="inline-flex items-center space-x-1 p-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">Annuler</span>
          </button>
        </div>
      )}
    </div>
  );
};
