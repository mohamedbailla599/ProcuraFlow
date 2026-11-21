import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  AlertCircle,
  Building2,
  ShoppingBag,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';
import { SupplierOrderStats, formatMAD } from '../utils/orderStats';

interface DeleteSuppliersModalProps {
  isOpen: boolean;
  suppliers: Fournisseur[];
  orderStats?: Record<number, SupplierOrderStats>;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteSuppliersModal: React.FC<DeleteSuppliersModalProps> = ({
  isOpen,
  suppliers,
  orderStats,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !loading) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, loading]);

  if (!isOpen || suppliers.length === 0) return null;

  // Calcul du total des commandes potentiellement impactées
  const totalImpactedOrders = suppliers.reduce((sum, f) => {
    const s = orderStats?.[f.id];
    return sum + (s?.totalOrders || 0);
  }, 0);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'FO';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-suppliers-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200/90 dark:border-rose-900/70 w-full max-w-xl overflow-hidden animate-scale-in z-10"
      >
        {/* Bandeau supérieur d'avertissement */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="delete-suppliers-modal-title" className="font-extrabold text-base">
                  Suppression Exceptionnelle Définitive
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  {suppliers.length} sélectionné{suppliers.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-rose-100">
                Action administrative irréversible sur la base de données
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Avertissement majeur */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-amber-900 dark:text-amber-200 block">
                Attention : Cette opération est définitive et irréversible !
              </span>
              <p>
                Contrairement à la désactivation logique qui préserve la piste d'audit, la
                suppression exceptionnelle effacera physiquement ces fiches fournisseurs du
                système.
              </p>
              {totalImpactedOrders > 0 && (
                <p className="font-semibold text-rose-700 dark:text-rose-400 pt-1">
                  ⚠️ {totalImpactedOrders} bon(s) de commande sont associés à cette sélection.
                </p>
              )}
            </div>
          </div>

          {/* Liste des fournisseurs sélectionnés */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              <span>Fournisseurs ciblés ({suppliers.length})</span>
              <span className="text-[11px] font-normal lowercase">vérifiez avant confirmation</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 rounded-xl">
              {suppliers.map((f) => {
                const stats = orderStats?.[f.id];
                const hasOrders = stats && stats.totalOrders > 0;
                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {getInitials(f.nom)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {f.nom}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          #{f.id} · {f.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {hasOrders ? (
                        <span
                          title={`${stats.totalOrders} commande(s) · Total: ${formatMAD(
                            stats.totalOrderedAmount
                          )}`}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        >
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>{stats.totalOrders} cde(s)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Sans commande
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.actif
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {f.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Case à cocher de sécurité */}
          <div
            onClick={() => setConfirmed(!confirmed)}
            className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 flex items-start space-x-2.5 cursor-pointer select-none hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <button
              type="button"
              className="p-0.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
            >
              {confirmed ? (
                <CheckSquare className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <Square className="w-4 h-4 text-rose-400" />
              )}
            </button>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Je confirme vouloir supprimer définitivement {suppliers.length > 1 ? 'ces' : 'ce'}{' '}
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''}
              </span>{' '}
              de la base de données.
            </label>
          </div>
        </div>

        {/* Boutons d'actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-extrabold rounded-xl text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Suppression en cours...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  Confirmer la suppression ({suppliers.length})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
