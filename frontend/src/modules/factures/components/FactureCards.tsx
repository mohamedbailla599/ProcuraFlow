import React, { useState } from 'react';
import {
  Receipt,
  Calendar,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Facture } from '../types';
import { formatMAD, formatDate } from '../utils';

interface FactureCardsProps {
  factures: Facture[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onViewDetails: (facture: Facture) => void;
  onEdit: (facture: Facture) => void;
  onDelete: (facture: Facture) => void;
  onTogglePaiement: (facture: Facture) => void;
}

export const FactureCards: React.FC<FactureCardsProps> = ({
  factures,
  loading,
  error = null,
  onRetry,
  onViewDetails,
  onEdit,
  onDelete,
  onTogglePaiement,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Skeleton loading
  if (loading && factures.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-fade-in-up"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded-md skeleton-shimmer" />
              <div className="h-5 w-20 rounded-md skeleton-shimmer" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-7 w-36 rounded-md skeleton-shimmer" />
              <div className="h-3 w-48 rounded-md skeleton-shimmer" />
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <div className="h-8 w-20 rounded-md skeleton-shimmer" />
              <div className="h-8 w-24 rounded-md skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error && factures.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/60 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5 border border-rose-100 dark:border-rose-900/60">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Erreur de chargement des factures
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-4">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <span>Réessayer</span>
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (factures.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Aucune facture trouvée
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Aucune facture ne correspond à vos critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4.5">
      {factures.map((facture) => {
        const isPaid = facture.statut_paiement === 'PAYEE';
        const isAnnulee = facture.statut_paiement === 'ANNULEE';
        const copyKey = `fac-${facture.id}`;
        const isCopied = copiedKey === copyKey;

        return (
          <div
            key={facture.id}
            onClick={() => onViewDetails(facture)}
            className={`group relative rounded-xl border p-4.5 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              isAnnulee
                ? 'bg-rose-50/10 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400/60 opacity-85'
                : 'bg-white dark:bg-slate-900 border-slate-200/85 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/40'
            }`}
          >
            <div>
              {/* Header: Reference + Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isAnnulee
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                        : isPaid
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-mono text-xs font-bold transition-colors ${
                        isAnnulee 
                          ? 'text-slate-500 dark:text-slate-400 line-through' 
                          : 'text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400'
                      }`}>
                        {facture.numero_facture || `FAC-${facture.id}`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) =>
                          copyToClipboard(
                            facture.numero_facture || `FAC-${facture.id}`,
                            copyKey,
                            e
                          )
                        }
                        title="Copier la référence"
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      ID #{facture.id}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    isAnnulee
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                      : isPaid
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAnnulee 
                        ? 'bg-rose-500' 
                        : isPaid 
                        ? 'bg-emerald-500 animate-pulse' 
                        : 'bg-amber-500'
                    }`}
                  />
                  <span>{isAnnulee ? 'Annulée' : isPaid ? 'Payée' : 'Non Payée'}</span>
                </span>
              </div>

              {/* Montant */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 mb-3 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                  Montant Facturé
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatMAD(facture.montant_facture)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    TTC
                  </span>
                </div>
              </div>

              {/* Rapprochement Info */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 text-[11px]">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Commande</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                    CMD #{facture.commande_id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 text-[11px]">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Réception</span>
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                    REC #{facture.reception_id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date Facture</span>
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                    {formatDate(facture.date_facture)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div
              className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Payment toggle */}
              {!isAnnulee ? (
                <button
                  type="button"
                  onClick={() => onTogglePaiement(facture)}
                  className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                    isPaid
                      ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  }`}
                  title={isPaid ? 'Rétablir Non Payée' : 'Marquer comme Payée'}
                >
                  {isPaid ? (
                    <>
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Rétablir</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Payer</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400 italic">
                  Archivée
                </span>
              )}

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onViewDetails(facture)}
                  title="Détails"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {!isPaid && !isAnnulee && (
                  <button
                    type="button"
                    onClick={() => onEdit(facture)}
                    title="Modifier"
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(facture)}
                  title="Supprimer"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

