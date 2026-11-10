import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
} from 'lucide-react';
import { Fournisseur, CommandeSummary, ApiErrorResponse } from '../types/fournisseur';
import { fournisseurApi, MOCK_COMMANDES } from '../api/fournisseurApi';

interface CommandesDrawerProps {
  fournisseur: Fournisseur | null;
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
}

export const CommandesDrawer: React.FC<CommandesDrawerProps> = ({
  fournisseur,
  isOpen,
  onClose,
  demoMode,
}) => {
  const [commandes, setCommandes] = useState<CommandeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!fournisseur || !isOpen) {
      setCommandes([]);
      setError(null);
      return;
    }

    const loadCommandes = async () => {
      setLoading(true);
      setError(null);

      if (demoMode) {
        // Return demo orders if available
        const list = MOCK_COMMANDES[fournisseur.id] || [];
        setCommandes(list);
        setLoading(false);
        return;
      }

      try {
        const data = await fournisseurApi.getCommandes(fournisseur.id);
        setCommandes(data);
      } catch (err: unknown) {
        const apiErr = err as ApiErrorResponse;
        if (apiErr?.status === 503 || apiErr?.status === 502) {
          setError(
            'Le microservice Commandes (port 8082) est temporairement indisponible ou non démarré. (Mode dégradé actif).'
          );
        } else if (apiErr?.message) {
          setError(apiErr.message);
        } else {
          setError('Impossible de récupérer l’historique des commandes.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadCommandes();
  }, [fournisseur, isOpen, demoMode]);

  if (!isOpen || !fournisseur) return null;

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RECEPTIONNEE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FACTUREE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EN_ATTENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ANNULEE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Commandes du Fournisseur</h2>
              <p className="text-xs text-slate-500">
                {fournisseur.nom} (ID: #{fournisseur.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Supplier quick summary banner */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Contact e-mail :</span>
              <span className="font-medium text-slate-800">{fournisseur.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Téléphone :</span>
              <span className="font-medium text-slate-800">{fournisseur.telephone || 'Non renseigné'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut actuel :</span>
              <span className={fournisseur.actif ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-semibold'}>
                {fournisseur.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Error / Degraded mode alert */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Communication inter-services :</p>
                <p>{error}</p>
                <p className="mt-1 text-amber-700 italic">
                  Note : Ce comportement est conforme au contrat d'intégration (fallback HTTP 503 sans bloquer le reste de l'application).
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-2" />
              <p className="text-xs text-slate-500">Interrogation du service Commandes...</p>
            </div>
          )}

          {/* Orders list */}
          {!loading && !error && commandes.length === 0 && (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Aucune commande trouvée</p>
              <p className="text-xs text-slate-500 mt-1">
                Aucun bon de commande n'a encore été émis pour ce fournisseur.
              </p>
            </div>
          )}

          {!loading && commandes.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Historique ({commandes.length} commande{commandes.length > 1 ? 's' : ''})
              </p>

              {commandes.map((cmd) => {
                const isExpanded = expandedId === cmd.id;
                const formattedDate = new Date(cmd.dateCommande).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={cmd.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    <div
                      onClick={() => toggleExpand(cmd.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">Commande #{cmd.id}</span>
                          <span
                            className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                              cmd.statut
                            )}`}
                          >
                            {cmd.statut}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-sm text-slate-900">
                          {cmd.montantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded order lines */}
                    {isExpanded && cmd.lignes && cmd.lignes.length > 0 && (
                      <div className="px-4 pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 text-xs">
                        <p className="font-semibold text-slate-600 mb-2 flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Lignes de commande :</span>
                        </p>
                        <div className="space-y-1.5">
                          {cmd.lignes.map((ligne, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200/60"
                            >
                              <div className="text-slate-800">
                                <span className="font-medium">{ligne.designation}</span>
                                <span className="text-slate-400 ml-1.5">× {ligne.quantite}</span>
                              </div>
                              <span className="font-medium text-slate-700">
                                {(ligne.quantite * ligne.prixUnitaire).toLocaleString('fr-FR', {
                                  minimumFractionDigits: 2,
                                })} MAD
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

