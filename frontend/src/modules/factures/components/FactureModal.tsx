import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  SlidersHorizontal,
  ChevronDown,
  Info,
  Layers,
} from 'lucide-react';
import { Facture, FactureFormData, StatutPaiement, DossierFacturable, DossierReceptionItem } from '../types';
import { getAllCommandes } from '../../commandes/api';
import { getAll as getAllReceptions } from '../../receptions/api';
import { fournisseurApi } from '../../fournisseurs/api/fournisseurApi';
import { Commande } from '../../commandes/types';
import { Reception } from '../../receptions/types';
import { Fournisseur } from '../../fournisseurs/types/fournisseur';
import { formatMAD, formatDate } from '../utils';

interface FactureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FactureFormData) => Promise<void>;
  factureToEdit?: Facture | null;
  existingFactures?: Facture[];
  initialCommandeId?: number | null;
}

export const FactureModal: React.FC<FactureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  factureToEdit,
  existingFactures = [],
  initialCommandeId = null,
}) => {
  // Form fields
  const [commandeId, setCommandeId] = useState<string>('');
  const [receptionId, setReceptionId] = useState<string>('');
  const [montantFacture, setMontantFacture] = useState<string>('');
  const [dateFacture, setDateFacture] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statutPaiement, setStatutPaiement] = useState<StatutPaiement>('NON_PAYEE');
  const [numeroFacture, setNumeroFacture] = useState<string>('');

  // Mode: Guided auto-matching vs Manual override
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  // Mode Facturation: Globale (toutes les réceptions) vs Partielle (par tranche / réception)
  const [facturationMode, setFacturationMode] = useState<'GLOBALE' | 'PARTIELLE'>('GLOBALE');

  // Cross-service data for real-time 3-way matching
  const [commandesList, setCommandesList] = useState<Commande[]>([]);
  const [receptionsList, setReceptionsList] = useState<Reception[]>([]);
  const [fournisseursMap, setFournisseursMap] = useState<Record<number, string>>({});
  const [loadingDossiers, setLoadingDossiers] = useState<boolean>(false);
  const [dossiersError, setDossiersError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const commandeInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(factureToEdit);

  // Load live cross-service data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchDossiersData = async () => {
      try {
        setLoadingDossiers(true);
        setDossiersError(null);

        const [cmdsResult, recsResult, fournsResult] = await Promise.allSettled([
          getAllCommandes(),
          getAllReceptions(),
          fournisseurApi.getFournisseurs(),
        ]);

        if (!isMounted) return;

        if (cmdsResult.status === 'fulfilled' && Array.isArray(cmdsResult.value)) {
          setCommandesList(cmdsResult.value);
        } else {
          setCommandesList([]);
        }

        if (recsResult.status === 'fulfilled' && Array.isArray(recsResult.value)) {
          setReceptionsList(recsResult.value);
        } else {
          setReceptionsList([]);
        }

        if (fournsResult.status === 'fulfilled' && Array.isArray(fournsResult.value)) {
          const map: Record<number, string> = {};
          fournsResult.value.forEach((f: Fournisseur) => {
            map[f.id] = f.nom;
          });
          setFournisseursMap(map);
        }
      } catch (err: any) {
        if (isMounted) {
          setDossiersError('Erreur lors du chargement des commandes et réceptions en direct.');
        }
      } finally {
        if (isMounted) {
          setLoadingDossiers(false);
        }
      }
    };

    fetchDossiersData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Helper to compute pro-rata amount for a reception based on line items or units
  const computeReceptionMontant = (
    reception: Reception,
    commande?: Commande | null
  ): number => {
    if (!commande || !commande.lignesCommande || commande.lignesCommande.length === 0) {
      return 0;
    }

    // 1. Try matching by ligneCommandeId
    if (reception.lignes && reception.lignes.length > 0) {
      const hasValidMatches = reception.lignes.some((lr) =>
        commande.lignesCommande.some((lc) => lc.id && lc.id === lr.ligneCommandeId)
      );
      if (hasValidMatches) {
        let sum = 0;
        for (const lr of reception.lignes) {
          const lc = commande.lignesCommande.find((c) => c.id === lr.ligneCommandeId);
          if (lc && typeof lc.prixUnitaire === 'number') {
            sum += (lr.quantiteRecue || 0) * lc.prixUnitaire;
          }
        }
        if (sum > 0) return Math.round(sum * 100) / 100;
      }
    }

    // 2. Fallback to total units pro-rata
    const totalUnitsCmd = commande.lignesCommande.reduce((acc, l) => acc + (l.quantite || 0), 0);
    const totalUnitsRec = reception.lignes?.reduce((acc, l) => acc + (l.quantiteRecue || 0), 0) || 0;

    if (totalUnitsCmd > 0 && totalUnitsRec > 0 && commande.montantTotal) {
      return Math.round(((totalUnitsRec / totalUnitsCmd) * commande.montantTotal) * 100) / 100;
    }

    return commande.montantTotal || 0;
  };

  // Compute eligible dossiers for real-time 3-way matching
  // Rule: Commande in VALIDEE or LIVREE, has un-invoiced conform receptions
  const dossiersFacturables = useMemo<DossierFacturable[]>(() => {
    if (!commandesList.length) return [];

    return commandesList
      .filter((cmd) => {
        // Backend requirement: STATUTS_FACTURABLES = ["VALIDEE", "LIVREE"]
        const st = (cmd.statut || '').toUpperCase();
        const isStatutEligible = st === 'VALIDEE' || st === 'LIVREE';
        if (!isStatutEligible) return false;

        // Check if an existing global invoice already paid 100% of this commande
        const isFullyInvoicedGlobally = existingFactures.some(
          (f) =>
            Number(f.commande_id) === Number(cmd.id) &&
            f.statut_paiement !== 'ANNULEE' &&
            (!factureToEdit || f.id !== factureToEdit.id) &&
            Math.abs(Number(f.montant_facture) - Number(cmd.montantTotal)) < 1
        );
        if (isFullyInvoicedGlobally && Number(cmd.id) !== Number(initialCommandeId)) {
          return false;
        }

        return true;
      })
      .map((cmd) => {
        // Find matching CONFORME receptions
        const conformReceptionsRaw = receptionsList.filter(
          (r) =>
            Number(r.commandeId) === Number(cmd.id) &&
            (r.statutReception || 'CONFORME').toUpperCase() === 'CONFORME'
        );

        const conformReceptions: DossierReceptionItem[] = conformReceptionsRaw.map((r) => {
          const nbUnites =
            r.lignes?.reduce((sum, l) => sum + (l.quantiteRecue || 0), 0) || 0;
          const montantEstime = computeReceptionMontant(r, cmd);
          const isInvoiced = existingFactures.some(
            (f) =>
              Number(f.reception_id) === Number(r.id) &&
              f.statut_paiement !== 'ANNULEE' &&
              (!factureToEdit || f.id !== factureToEdit.id)
          );
          return {
            id: r.id,
            statutReception: r.statutReception || 'CONFORME',
            dateReception: r.dateReception || '',
            nbUnites,
            montantEstime,
            isAlreadyInvoiced: isInvoiced,
          };
        });

        const fournisseurNom =
          fournisseursMap[cmd.fournisseurId] || `Fournisseur #${cmd.fournisseurId}`;

        return {
          commandeId: cmd.id,
          fournisseurId: cmd.fournisseurId,
          fournisseurNom,
          montantTotal: cmd.montantTotal || 0,
          statutCommande: cmd.statut,
          dateCommande: cmd.dateCommande,
          receptions: conformReceptions,
        };
      })
      .filter((dossier) => {
        if (dossier.receptions.length === 0) return false;
        // If all receptions are already invoiced, exclude unless it's initialCommandeId
        const allInvoiced = dossier.receptions.every((r) => r.isAlreadyInvoiced);
        if (allInvoiced && Number(dossier.commandeId) !== Number(initialCommandeId)) {
          return false;
        }
        return true;
      });
  }, [commandesList, receptionsList, fournisseursMap, existingFactures, factureToEdit, initialCommandeId]);

  // Selected dossier based on commandeId
  const selectedDossier = useMemo(() => {
    if (!commandeId) return null;
    return dossiersFacturables.find((d) => d.commandeId === Number(commandeId)) || null;
  }, [commandeId, dossiersFacturables]);

  // Current selected reception object
  const currentReception = useMemo(() => {
    if (!selectedDossier || !receptionId) return null;
    return selectedDossier.receptions.find((r) => r.id === Number(receptionId)) || null;
  }, [selectedDossier, receptionId]);

  // Handle dossier selection from guided dropdown
  const handleSelectDossier = (cmdIdStr: string) => {
    if (!cmdIdStr) {
      setCommandeId('');
      setReceptionId('');
      setMontantFacture('');
      return;
    }

    const dossier = dossiersFacturables.find((d) => d.commandeId === Number(cmdIdStr));
    if (dossier) {
      setCommandeId(String(dossier.commandeId));
      const hasMultiple = dossier.receptions.length > 1;
      const anyInvoiced = dossier.receptions.some((r) => r.isAlreadyInvoiced);

      if (hasMultiple && !anyInvoiced) {
        setFacturationMode('GLOBALE');
        // Set receptionId to the latest conform reception ID for complete closing reference
        const lastRec = dossier.receptions[dossier.receptions.length - 1];
        setReceptionId(String(lastRec.id));
        setMontantFacture(dossier.montantTotal.toFixed(2));
      } else if (hasMultiple && anyInvoiced) {
        setFacturationMode('PARTIELLE');
        const firstAvailable =
          dossier.receptions.find((r) => !r.isAlreadyInvoiced) || dossier.receptions[0];
        setReceptionId(String(firstAvailable.id));
        setMontantFacture((firstAvailable.montantEstime || 0).toFixed(2));
      } else {
        setFacturationMode('PARTIELLE');
        const defaultRec = dossier.receptions[0];
        setReceptionId(defaultRec ? String(defaultRec.id) : '');
        setMontantFacture(dossier.montantTotal.toFixed(2));
      }
      setErrorMessage(null);
    }
  };

  // Switch between Globale and Partielle modes
  const handleModeChange = (mode: 'GLOBALE' | 'PARTIELLE') => {
    setFacturationMode(mode);
    if (!selectedDossier) return;

    if (mode === 'GLOBALE') {
      const lastRec = selectedDossier.receptions[selectedDossier.receptions.length - 1];
      setReceptionId(String(lastRec.id));
      setMontantFacture(selectedDossier.montantTotal.toFixed(2));
    } else {
      const availableRec =
        selectedDossier.receptions.find((r) => String(r.id) === receptionId && !r.isAlreadyInvoiced) ||
        selectedDossier.receptions.find((r) => !r.isAlreadyInvoiced) ||
        selectedDossier.receptions[0];

      if (availableRec) {
        setReceptionId(String(availableRec.id));
        const montant =
          availableRec.montantEstime ??
          selectedDossier.montantTotal / selectedDossier.receptions.length;
        setMontantFacture(montant.toFixed(2));
      }
    }
  };

  // Switch specific reception in Partielle mode
  const handleReceptionChange = (recIdStr: string) => {
    setReceptionId(recIdStr);
    if (selectedDossier && facturationMode === 'PARTIELLE') {
      const rec = selectedDossier.receptions.find((r) => String(r.id) === recIdStr);
      if (rec && typeof rec.montantEstime === 'number') {
        setMontantFacture(rec.montantEstime.toFixed(2));
      }
    }
  };

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
      setIsManualMode(true); // Default to manual when editing existing invoice
    } else {
      setCommandeId(initialCommandeId ? String(initialCommandeId) : '');
      setReceptionId('');
      setMontantFacture('');
      setDateFacture(new Date().toISOString().split('T')[0]);
      setStatutPaiement('NON_PAYEE');
      setNumeroFacture('');
      setIsManualMode(false);
      setFacturationMode('GLOBALE');
    }
    setErrorMessage(null);
  }, [factureToEdit, initialCommandeId, isOpen]);

  // Auto-fill when initialCommandeId matches a loaded dossier
  useEffect(() => {
    if (!factureToEdit && initialCommandeId && dossiersFacturables.length > 0) {
      handleSelectDossier(String(initialCommandeId));
    }
  }, [initialCommandeId, dossiersFacturables, factureToEdit]);

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
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-scale-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-900/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Modifier la Facture' : 'Nouvelle Facture'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEditing
                    ? `Mise à jour de ${factureToEdit?.numero_facture || `#${factureToEdit?.id}`}`
                    : 'Rapprochement 3-voies temps réel (Commande ↔ Réception ↔ Facture)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
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

            {/* Section Rapprochement 3-Voies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  Rapprochement 3-Voies (Obligatoire)
                </p>

                {/* Toggle Mode Manuel / Automatique */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsManualMode(!isManualMode)}
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    {isManualMode ? 'Mode Détection Intelligente' : 'Saisie Manuelle d’ID'}
                  </button>
                )}
              </div>

              {/* Mode Automatique Guidé : Sélecteur de Dossier Facturable */}
              {!isManualMode ? (
                <div className="space-y-3">
                  {loadingDossiers ? (
                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500">
                      <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
                      <span>Recherche des bons de commande & réceptions conformes...</span>
                    </div>
                  ) : dossiersFacturables.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          Aucun bon de commande en attente de facturation automatique.
                          Les commandes doivent être <strong>Validées</strong> ou <strong>Livrées</strong> avec une réception <strong>Conforme</strong>.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManualMode(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-100 underline hover:no-underline cursor-pointer"
                      >
                        Basculer en saisie manuelle d'identifiants →
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Sélecteur de Dossier */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Sélectionner un dossier prêt à facturer <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <ShoppingBag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                          <select
                            value={commandeId}
                            onChange={(e) => handleSelectDossier(e.target.value)}
                            className="select-custom w-full h-11 pl-10 pr-9 text-xs sm:text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          >
                            <option value="">
                              -- Choisissez un dossier ({dossiersFacturables.length} disponibles) --
                            </option>
                            {dossiersFacturables.map((d) => (
                              <option key={d.commandeId} value={d.commandeId}>
                                BC-{String(d.commandeId).padStart(4, '0')} • {d.fournisseurNom} • {formatMAD(d.montantTotal)} ({d.receptions.length} réception(s) conforme(s))
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Sélecteur d'Option de Facturation (Quand la commande compte plusieurs réceptions) */}
                      {selectedDossier && selectedDossier.receptions.length > 1 && (
                        <div className="space-y-2 animate-fade-in pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              Option de facturation multi-réceptions
                            </label>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {selectedDossier.receptions.length} livraisons conformes
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Option 1: Globale */}
                            <button
                              type="button"
                              disabled={selectedDossier.receptions.some((r) => r.isAlreadyInvoiced)}
                              onClick={() => handleModeChange('GLOBALE')}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                facturationMode === 'GLOBALE'
                                  ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20 shadow-xs'
                                  : selectedDossier.receptions.some((r) => r.isAlreadyInvoiced)
                                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 opacity-50 cursor-not-allowed'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  Facturation Globale
                                </span>
                                {facturationMode === 'GLOBALE' && (
                                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                Facturer <strong>toutes les réceptions</strong> ensemble (solde 100% du BC : {formatMAD(selectedDossier.montantTotal)})
                              </p>
                              {selectedDossier.receptions.some((r) => r.isAlreadyInvoiced) && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
                                  Indisponible (tranche déjà facturée)
                                </span>
                              )}
                            </button>

                            {/* Option 2: Partielle */}
                            <button
                              type="button"
                              onClick={() => handleModeChange('PARTIELLE')}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                facturationMode === 'PARTIELLE'
                                  ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold flex items-center gap-1.5">
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  Facturation Partielle
                                </span>
                                {facturationMode === 'PARTIELLE' && (
                                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                Facturer <strong>une seule réception</strong> au prorata des articles reçus
                              </p>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Affichage des réceptions groupées en mode Global */}
                      {selectedDossier && selectedDossier.receptions.length > 1 && facturationMode === 'GLOBALE' && (
                        <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              {selectedDossier.receptions.length} réceptions groupées sur cette facture :
                            </span>
                            <span className="font-bold font-mono text-teal-700 dark:text-teal-300">
                              Total : {formatMAD(selectedDossier.montantTotal)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDossier.receptions.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs"
                              >
                                <PackageCheck className="w-3 h-3 text-teal-500" />
                                <span>REC #{r.id}</span>
                                <span className="text-slate-400">•</span>
                                <span>{r.nbUnites} u.</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-teal-600 dark:text-teal-400">{formatMAD(r.montantEstime || 0)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sélecteur de Réception si mode partiel ou si 1 seule réception */}
                      {selectedDossier && (facturationMode === 'PARTIELLE' || selectedDossier.receptions.length === 1) && (
                        <div className="animate-fade-in">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Réception associée <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <PackageCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <select
                              value={receptionId}
                              onChange={(e) => handleReceptionChange(e.target.value)}
                              className="select-custom w-full h-10 pl-10 pr-9 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            >
                              {selectedDossier.receptions.map((rec) => (
                                <option
                                  key={rec.id}
                                  value={rec.id}
                                  disabled={rec.isAlreadyInvoiced}
                                >
                                  Réception #{rec.id} • {rec.dateReception ? formatDate(rec.dateReception) : 'Date N/A'} • {rec.nbUnites} unité(s) conforme(s) • {formatMAD(rec.montantEstime || 0)}
                                  {rec.isAlreadyInvoiced ? ' (Déjà facturée)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Visual 3-Way Match Verification Card */}
                      {selectedDossier && (
                        <div className="rounded-xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/40 dark:bg-teal-950/20 p-3.5 space-y-3 animate-fade-in shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                                Rapprochement 3-Voies en Temps Réel
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Prêt pour Facturation
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* Commande */}
                            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="w-3 h-3 text-teal-500" /> Bon de Commande
                                </span>
                                <span className="font-mono text-slate-700 dark:text-slate-200">
                                  BC-{String(selectedDossier.commandeId).padStart(4, '0')}
                                </span>
                              </div>
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {selectedDossier.fournisseurNom}
                              </p>
                              <div className="flex items-center justify-between mt-1 text-[11px]">
                                <span className="text-slate-500">
                                  Statut : <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedDossier.statutCommande}</span>
                                </span>
                                <span className="font-bold font-mono text-teal-600 dark:text-teal-400">
                                  {formatMAD(selectedDossier.montantTotal)}
                                </span>
                              </div>
                            </div>

                            {/* Réception */}
                            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                                <span className="flex items-center gap-1">
                                  <PackageCheck className="w-3 h-3 text-teal-500" />
                                  {facturationMode === 'GLOBALE' && selectedDossier.receptions.length > 1
                                    ? 'Réceptions (Toutes)'
                                    : 'Réception'}
                                </span>
                                <span className="font-mono text-slate-700 dark:text-slate-200">
                                  {facturationMode === 'GLOBALE' && selectedDossier.receptions.length > 1
                                    ? selectedDossier.receptions.map((r) => `#${r.id}`).join(' & ')
                                    : `#${receptionId || 'N/A'}`}
                                </span>
                              </div>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {facturationMode === 'GLOBALE' && selectedDossier.receptions.length > 1
                                  ? 'Toutes conformes aux spécifications'
                                  : 'Conforme aux spécifications'}
                              </p>
                              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                                <span>
                                  {facturationMode === 'GLOBALE' && selectedDossier.receptions.length > 1
                                    ? `${selectedDossier.receptions.length} livraisons`
                                    : currentReception?.dateReception
                                    ? formatDate(currentReception.dateReception)
                                    : 'Réceptionnée'}
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {facturationMode === 'GLOBALE' && selectedDossier.receptions.length > 1
                                    ? `${selectedDossier.receptions.reduce((sum, r) => sum + r.nbUnites, 0)} unité(s) au total`
                                    : `${currentReception?.nbUnites ?? 0} unité(s)`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cohérence financière */}
                          <div className="flex items-center justify-between pt-1 px-1 text-[11px] border-t border-teal-100 dark:border-teal-900/40">
                            <span className="text-slate-500 dark:text-slate-400">Cohérence financière :</span>
                            {facturationMode === 'GLOBALE' || selectedDossier.receptions.length === 1 ? (
                              Math.abs(Number(montantFacture) - selectedDossier.montantTotal) < 0.01 ? (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Facture globale soldant 100% du BC ({formatMAD(selectedDossier.montantTotal)})
                                </span>
                              ) : (
                                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Ajustement manuel ({formatMAD(Number(montantFacture) || 0)} vs {formatMAD(selectedDossier.montantTotal)})
                                </span>
                              )
                            ) : (
                              Math.abs(Number(montantFacture) - (currentReception?.montantEstime || 0)) < 0.01 ? (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Facture partielle au prorata ({formatMAD(Number(montantFacture) || 0)} sur {formatMAD(selectedDossier.montantTotal)})
                                </span>
                              ) : (
                                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Ajustement partiel ({formatMAD(Number(montantFacture) || 0)} vs estimé {formatMAD(currentReception?.montantEstime || 0)})
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                /* Mode Manuel (Override) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fade-in">
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
              )}
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
                    className="select-custom w-full h-10 px-3 pr-9 text-sm font-semibold rounded-xl"
                  >
                    <option value="NON_PAYEE">⏳ NON PAYÉE</option>
                    <option value="PAYEE">✅ PAYÉE</option>
                  </select>
                </div>

                {/* Numero Facture */}
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
                Le rapprochement à 3 voies certifie la cohérence entre le bon de commande, la livraison physique conforme et la facture avant autorisation de règlement.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="h-9 px-5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all duration-150 flex items-center space-x-2 cursor-pointer"
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
