import React, { useEffect, useRef } from 'react';
import { AlertTriangle, RotateCcw, Power, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'warning';
  supplierName?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  variant = 'danger',
  supplierName,
  onConfirm,
  onClose,
  loading = false,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the action button & listen for Escape
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: '150ms' }}
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header decoration */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                isDanger
                  ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
              }`}
            >
              {isDanger ? (
                <Power className="w-5 h-5 text-rose-600" />
              ) : (
                <RotateCcw className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="font-bold text-slate-900 text-base leading-snug"
              >
                {title}
              </h3>
              {supplierName && (
                <div className="inline-flex items-center space-x-1.5 mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800">
                  <span className="truncate max-w-[240px]">{supplierName}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <div className="px-6 pb-5 pt-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            {message}
          </p>

          {isDanger && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-2 text-[11px] text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Le fournisseur désactivé ne pourra plus être sélectionné pour l'émission de nouveaux bons de commande.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 active:scale-[0.97]"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-9 px-4 text-xs font-semibold text-white rounded-lg shadow-sm transition-all duration-150 flex items-center space-x-1.5 active:scale-[0.97] disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
