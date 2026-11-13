import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Receipt,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Hash,
} from 'lucide-react';
import { Facture, FactureFormData, StatutPaiement } from '../types';

interface FactureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FactureFormData) => Promise<void>;
  factureToEdit?: Facture | null;
}

export const FactureModal: React.FC<FactureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  factureToEdit,
}) => {
  const [commandeId, setCommandeId] = useState<string>('');
  const [receptionId, setReceptionId] = useState<string>('');
  const [montantFacture, setMontantFacture] = useState<string>('');
  const [dateFacture, setDateFacture] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statutPaiement, setStatutPaiement] = useState<StatutPaiement>('NON_PAYEE');
  const [numeroFacture, setNumeroFacture] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const commandeInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(factureToEdit);

  // Initialize form state
  useEffect(() => {
    if (factureToEdit) {
      setCommandeId(String(factureToEdit.commande_id));
      setReceptionId(String(factureToEdit.reception_id));
      setMontantFacture(String(factureToEdit.montant_facture));
      const parsedDate = factureToEdit.date_facture
        ? new Date(factureToEdit.date_facture).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setDateFacture(parsedDate);
      setStatutPaiement(factureToEdit.statut_paiement || 'NON_PAYEE');
      setNumeroFacture(factureToEdit.numero_facture || '');
    } else {
      setCommandeId('');
      setReceptionId('');
      setMontantFacture('');
      setDateFacture(new Date().toISOString().split('T')[0]);
      setStatutPaiement('NON_PAYEE');
      setNumeroFacture('');
    }
    setErrorMessage(null);
  }, [factureToEdit, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        commandeInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCommandeValid = Number(commandeId) > 0;
  const isReceptionValid = Number(receptionId) > 0;
  const isMontantValid = Number(montantFacture) > 0;
  const isFormValid = isCommandeValid && isReceptionValid && isMontantValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage('Veuillez remplir correctement tous les champs obligatoires.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload: FactureFormData = {
        commande_id: Number(commandeId),
        reception_id: Number(receptionId),
        montant_facture: Number(montantFacture),
        date_facture: dateFacture ? new Date(dateFacture).toISOString() : new Date().toISOString(),
        statut_paiement: statutPaiement,
        ...(numeroFacture.trim() ? { numero_facture: numeroFacture.trim() } : {}),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Une erreur est survenue lors de l’enregistrement de la facture.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Modifier la Facture' : 'Nouvelle Facture'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEditing
                    ? `Mise à jour de ${factureToEdit?.numero_facture || `#${factureToEdit?.id}`}`
                    : 'Enregistrement et rapprochement Commande / Réception'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-sm rounded-xl p-3.5 flex items-start space-x-2.5 animate-fade-in-up">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Rapprochement section: Commande & Reception */}
            <div className="space-y-3.5">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Rapprochement 3-Voies (Obligatoire)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Commande ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="commande_id"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      N° Commande <span className="text-rose-500">*</span>
                    </label>
                    {isCommandeValid && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 animate-scale-in">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <ShoppingBag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      ref={commandeInputRef}
                      id="commande_id"
                      type="number"
                      min="1"
                      required
                      value={commandeId}
                      onChange={(e) => setCommandeId(e.target.value)}
                      placeholder="Ex: 101"
                      className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Reception ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="reception_id"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      N° Réception <span className="text-rose-500">*</span>
                    </label>
                    {isReceptionValid && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 animate-scale-in">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <PackageCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      id="reception_id"
                      type="number"
                      min="1"
                      required
                      value={receptionId}
                      onChange={(e) => setReceptionId(e.target.value)}
                      placeholder="Ex: 204"
                      className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-3.5 pt-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Détails Financiers & Date
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Montant Facture */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="montant_facture"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Montant Total (MAD) <span className="text-rose-500">*</span>
                    </label>
                    {isMontantValid && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 animate-scale-in">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      id="montant_facture"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={montantFacture}
                      onChange={(e) => setMontantFacture(e.target.value)}
                      placeholder="Ex: 14500.00"
                      className="w-full h-10 pl-10 pr-12 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                      MAD
                    </span>
                  </div>
                </div>

                {/* Date Facture */}
                <div>
                  <label
                    htmlFor="date_facture"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Date d’Émission <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      id="date_facture"
                      type="date"
                      required
                      value={dateFacture}
                      onChange={(e) => setDateFacture(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional / Status */}
            <div className="space-y-3.5 pt-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Statut de Paiement & Numéro
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Statut Paiement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Statut Initial
                  </label>
                  <select
                    value={statutPaiement}
                    onChange={(e) =>
                      setStatutPaiement(e.target.value as 'NON_PAYEE' | 'PAYEE')
                    }
                    className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                  >
                    <option value="NON_PAYEE">⏳ NON PAYÉE</option>
                    <option value="PAYEE">✅ PAYÉE</option>
                  </select>
                </div>

                {/* Numero Facture (Auto-generated or custom) */}
                <div>
                  <label
                    htmlFor="numero_facture"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Réf. Facture (Optionnel)
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      id="numero_facture"
                      type="text"
                      value={numeroFacture}
                      onChange={(e) => setNumeroFacture(e.target.value)}
                      placeholder="Auto: FAC-YYYY-XXXXX"
                      className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reconciliation Note Banner */}
            <div className="bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 rounded-xl p-3 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-teal-900 dark:text-teal-300/90 leading-relaxed">
                Le rapprochement à 3 voies vérifie la cohérence entre le bon de commande, la réception physique et le montant facturé pour autoriser le paiement.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="h-9 px-5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all duration-150 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Mettre à jour' : 'Créer la Facture'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

