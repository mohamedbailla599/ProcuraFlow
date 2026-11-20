import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Eye,
  CreditCard,
  ShoppingBag,
  PackageCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Facture } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatDate, formatMAD } from '../utils';

interface FactureTableProps {
  factures: Facture[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onViewDetails: (facture: Facture) => void;
  onEdit: (facture: Facture) => void;
  onPay?: (facture: Facture) => void;
  onTogglePaiement?: (facture: Facture) => void;
  onDelete: (facture: Facture) => void;
}

export const FactureTable: React.FC<FactureTableProps> = ({
  factures,
  loading = false,
  error = null,
  onRetry,
  onViewDetails,
  onEdit,
  onPay,
  onTogglePaiement,
  onDelete,
}) => {
  const handlePaiementAction = onTogglePaiement || onPay || (() => {});

  // Skeleton loading
  if (loading && factures.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4 animate-fade-in">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 w-1/4">
              <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="h-4 w-32 rounded skeleton-shimmer" />
            <div className="h-4 w-24 rounded skeleton-shimmer" />
            <div className="h-4 w-20 rounded skeleton-shimmer" />
            <div className="h-6 w-24 rounded-full skeleton-shimmer" />
            <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error && factures.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 rounded-2xl shadow-sm p-12 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5 border border-rose-100 dark:border-rose-900/60">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Erreur de chargement des factures
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (factures.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-12 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Aucune facture trouvée
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Aucune facture ne correspond aux filtres ou à la recherche courante.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Facture & Réf</th>
              <th className="py-3.5 px-4">Rapprochement</th>
              <th className="py-3.5 px-4">Date Émission</th>
              <th className="py-3.5 px-4 text-right">Montant TTC</th>
              <th className="py-3.5 px-4 text-center">Statut Règlement</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-800/80 text-xs sm:text-sm">
            {factures.map((facture) => {
              const isPayee = facture.statut_paiement === 'PAYEE';
              const isAnnulee = facture.statut_paiement === 'ANNULEE';

              return (
                <tr
                  key={facture.id}
                  className={`group transition-colors duration-150 ${
                    isAnnulee
                      ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 opacity-80'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Colonne Facture & Réf */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isAnnulee
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                            : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => onViewDetails(facture)}
                          className={`font-mono text-xs sm:text-sm font-bold text-left transition-colors ${
                            isAnnulee
                              ? 'text-slate-500 dark:text-slate-400 line-through'
                              : 'text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400'
                          }`}
                        >
                          {facture.numero_facture || `FAC-${facture.id}`}
                        </button>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          ID #{facture.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Colonne Rapprochement */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                        <ShoppingBag className="w-3 h-3 text-slate-400" />
                        <span>CMD #{facture.commande_id}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                        <PackageCheck className="w-3 h-3 text-slate-400" />
                        <span>REC #{facture.reception_id}</span>
                      </span>
                    </div>
                  </td>

                  {/* Colonne Date */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                    {formatDate(facture.date_facture)}
                  </td>

                  {/* Colonne Montant */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatMAD(facture.montant_facture)}
                    </span>
                  </td>

                  {/* Colonne Statut Règlement */}
                  <td className="py-3.5 px-4 text-center">
                    {isAnnulee ? (
                      <Badge variant="danger" size="sm" dot>
                        ANNULÉE
                      </Badge>
                    ) : (
                      <Badge
                        variant={isPayee ? 'success' : 'warning'}
                        size="sm"
                        dot
                      >
                        {isPayee ? 'PAYÉE' : 'NON PAYÉE'}
                      </Badge>
                    )}
                  </td>

                  {/* Colonne Actions */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {/* Payer button (masqué si annulée) */}
                      {!isAnnulee && (
                        <button
                          type="button"
                          onClick={() => handlePaiementAction(facture)}
                          title={isPayee ? 'Rétablir Non Payée' : 'Marquer comme payée'}
                          className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 font-medium ${
                            isPayee
                              ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">{isPayee ? 'Rétablir' : 'Payer'}</span>
                        </button>
                      )}

                      {/* Consulter */}
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => onViewDetails(facture)}
                        title="Consulter les détails"
                      />

                      {/* Modifier (masqué si payée ou annulée) */}
                      {!isPayee && !isAnnulee && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<Edit2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                          onClick={() => onEdit(facture)}
                          title="Modifier la facture"
                        />
                      )}

                      {/* Supprimer */}
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        onClick={() => onDelete(facture)}
                        title="Supprimer la facture"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
