import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Modal,
  Badge,
} from '../../../components/ui';
import {
  Truck,
  ShoppingBag,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getAllCommandes, updateCommandeStatut } from '../../commandes/api';
import type { Commande } from '../../commandes/types';
import { creer, soldes } from '../api';
import type { Reception, Solde } from '../types';

export function ReceptionForm({
  close,
  saved,
}: {
  close: () => void;
  saved: (r: Reception) => void;
}) {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [order, setOrder] = useState('');
  const [lines, setLines] = useState<Solde[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [note, setNote] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingLines, setLoadingLines] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const retry = useRef({ signature: '', key: '' });

  // Récupération des bons de commande éligibles
  useEffect(() => {
    let active = true;
    getAllCommandes()
      .then((data) => {
        if (active) {
          // Inclure VALIDEE, EXPEDIEE, EN_COURS pour permettre une réception complète ou partielle
          const eligible = data.filter((c) =>
            ['VALIDEE', 'EXPEDIEE', 'EN_COURS', 'EN_ATTENTE'].includes(c.statut)
          );
          setOrders(eligible);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Chargement des soldes restants lors de la sélection d'une commande
  useEffect(() => {
    if (!order) {
      setLines([]);
      setQuantities({});
      return;
    }

    const controller = new AbortController();
    setLoadingLines(true);
    setError('');

    soldes(Number(order), controller.signal)
      .then((fetchedLines) => {
        if (controller.signal.aborted) return;
        setLines(fetchedLines);
        // Initialiser les quantités à vide ou à préremplir
        const initialQty: Record<number, string> = {};
        fetchedLines.forEach((l) => {
          initialQty[l.ligneCommandeId] = '';
        });
        setQuantities(initialQty);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingLines(false);
      });

    return () => controller.abort();
  }, [order]);

  // Command sélectionnée
  const selectedOrder = orders.find((c) => String(c.id) === String(order));

  // Lignes avec quantités positives saisies
  const selected = lines
    .map((l) => ({
      ligneCommandeId: l.ligneCommandeId,
      quantiteRecue: Number(quantities[l.ligneCommandeId] || 0),
    }))
    .filter((l) => l.quantiteRecue > 0);

  const totalSelectedUnits = selected.reduce((sum, l) => sum + l.quantiteRecue, 0);

  // Remplir automatiquement tous les articles avec leur solde restant
  const handleReceiveAll = () => {
    const updated: Record<number, string> = {};
    lines.forEach((l) => {
      if (l.restante > 0) {
        updated[l.ligneCommandeId] = String(l.restante);
      }
    });
    setQuantities(updated);
  };

  // Réinitialiser les quantités
  const handleResetQuantities = () => {
    const updated: Record<number, string> = {};
    lines.forEach((l) => {
      updated[l.ligneCommandeId] = '';
    });
    setQuantities(updated);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected.length || saving) return;

    const payload = {
      commandeId: Number(order),
      lignes: selected,
      remarques: note.trim(),
    };

    const signature = JSON.stringify(payload);
    if (signature !== retry.current.signature) {
      retry.current = { signature, key: crypto.randomUUID() };
    }

    setSaving(true);
    setError('');

    try {
      const created = await creer({ ...payload, cleCreation: retry.current.key });

      // Vérifier si toutes les lignes de la commande sont entièrement reçues
      const willBeFullyReceived = lines.every((l) => {
        const receivedNow = Number(quantities[l.ligneCommandeId] || 0);
        return l.restante - receivedNow <= 0;
      });

      // Synchronisation immédiate du statut de la commande côté client
      try {
        await updateCommandeStatut(Number(order), willBeFullyReceived ? 'LIVREE' : 'EN_COURS');
      } catch (err) {
        console.warn('Statut commande sync warning:', err);
      }

      saved(created);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  const allLinesCompleted = Boolean(order) && !loadingLines && lines.length > 0 && lines.every((l) => l.restante === 0);

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!saving) close();
      }}
      title="Nouvelle Réception de Marchandises"
      description="Pointez les livraisons physiques et enregistrez les quantités réelles reçues."
      maxWidth="3xl"
    >
      <form onSubmit={submit} className="space-y-6 text-sm text-slate-800 dark:text-slate-100">
        <fieldset disabled={saving} className="space-y-5">
          {/* Sélection du bon de commande */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bon de Commande Associé <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value);
                  setError('');
                }}
                className="select-custom w-full h-11 px-4 pr-10 text-sm font-medium rounded-xl"
              >
                <option value="">Sélectionner un bon de commande à réceptionner...</option>
                {orders.map((c) => (
                  <option key={c.id} value={c.id}>
                    Commande #{c.id} — Statut: {c.statut} ({c.lignesCommande?.length || 0} article(s))
                  </option>
                ))}
              </select>
            </div>
            {loadingOrders && (
              <p className="text-xs text-slate-400 animate-pulse flex items-center gap-1.5 mt-1">
                Chargement des commandes en cours...
              </p>
            )}
          </div>

          {/* Aperçu de la commande sélectionnée */}
          {selectedOrder && (
            <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Bon de Commande #{selectedOrder.id}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                    ({selectedOrder.lignesCommande?.length || 0} référence(s))
                  </span>
                </div>
              </div>
              <Badge variant="teal" dot size="sm">
                {selectedOrder.statut}
              </Badge>
            </div>
          )}

          {/* Soldes & Quantités à pointer */}
          {order && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-teal-600" /> Articles & Lignes à Réceptionner
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saisissez les quantités livrées conformes pour chaque référence.
                  </p>
                </div>

                {!loadingLines && lines.some((l) => l.restante > 0) && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={handleResetQuantities}
                    >
                      Vider
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Sparkles className="w-3.5 h-3.5 text-teal-600" />}
                      onClick={handleReceiveAll}
                    >
                      Tout Réceptionner
                    </Button>
                  </div>
                )}
              </div>

              {loadingLines ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Calcul des soldes restants...
                </div>
              ) : allLinesCompleted ? (
                <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Cette commande a déjà été entièrement réceptionnée (solde restant = 0).</span>
                </div>
              ) : lines.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  Aucun article trouvé pour cette commande.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lines.map((l) => {
                    const currentVal = quantities[l.ligneCommandeId] || '';
                    const isExceeded = Number(currentVal) > l.restante;
                    const isFullyFilled = Number(currentVal) === l.restante && l.restante > 0;

                    return (
                      <div
                        key={l.ligneCommandeId}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isFullyFilled
                            ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800/70'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                {l.designation}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #L{l.ligneCommandeId}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span>Commandé : <strong>{l.quantiteCommandee}</strong></span>
                              <span>·</span>
                              <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                Reste à recevoir : {l.restante}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-32">
                              <input
                                type="number"
                                min="0"
                                max={l.restante}
                                step="1"
                                placeholder="0"
                                disabled={l.restante <= 0}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuantities({
                                    ...quantities,
                                    [l.ligneCommandeId]: val,
                                  });
                                }}
                                className={`w-full px-3 py-1.5 text-sm font-semibold text-right rounded-lg border bg-white dark:bg-slate-900 ${
                                  isExceeded
                                    ? 'border-rose-500 text-rose-600 focus:ring-rose-500'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-teal-500'
                                }`}
                              />
                            </div>

                            {l.restante > 0 && (
                              <button
                                type="button"
                                title="Recevoir le maximum restant"
                                onClick={() => {
                                  setQuantities({
                                    ...quantities,
                                    [l.ligneCommandeId]: String(l.restante),
                                  });
                                }}
                                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-600 transition-colors cursor-pointer"
                              >
                                Max
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Observations & Remarques Générales */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" /> Remarques & Observations de Contrôle
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : Colis vérifiés, conformité totale au bon de livraison transporteur..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>
        </fieldset>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Pied de formulaire avec récapitulatif & actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {totalSelectedUnits > 0 ? (
              <span className="font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200/70 dark:border-teal-800/70">
                ✓ {totalSelectedUnits} unité(s) sélectionnée(s) sur {selected.length} ligne(s)
              </span>
            ) : (
              <span>Aucune quantité sélectionnée</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={close}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selected.length || loadingLines || saving || allLinesCompleted}
              loading={saving}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Enregistrer la Réception
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
