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
  Clock,
  CheckCircle2,
  Truck,
  Receipt,
  Ban,
  Mail,
  Phone,
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

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !fournisseur) return null;

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusConfig = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />,
        };
      case 'RECEPTIONNEE':
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200/90',
          icon: <Truck className="w-3.5 h-3.5 text-blue-600 mr-1" />,
        };
      case 'FACTUREE':
        return {
          badge: 'bg-purple-50 text-purple-700 border-purple-200/90',
          icon: <Receipt className="w-3.5 h-3.5 text-purple-600 mr-1" />,
        };
      case 'EN_ATTENTE':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200/90',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 mr-1" />,
        };
      case 'ANNULEE':
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-200/90',
          icon: <Ban className="w-3.5 h-3.5 text-rose-600 mr-1" />,
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: null,
        };
    }
  };

  const initials = fournisseur.nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'FO';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: '150ms' }}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-teal-50/30 dark:from-slate-850 dark:to-teal-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-teal-500/20">
              {initials}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <span>{fournisseur.nom}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Historique des bons de commande • Fournisseur #{fournisseur.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
            aria-label="Fermer le panneau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Supplier quick summary card */}
          <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 space-y-3.5 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">E-mail :</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{fournisseur.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">Téléphone :</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{fournisseur.telephone || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Statut du contrat :</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                  fournisseur.actif
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {fournisseur.actif ? 'Actif (Éligible)' : 'Inactif (Suspendu)'}
              </span>
            </div>
          </div>

          {/* Degraded mode alert */}
          {error && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl p-5 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3.5 shadow-xs animate-fade-in-up">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-bold text-amber-950 dark:text-amber-200">Microservice Commandes non démarré :</p>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">{error}</p>
                <p className="pt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  Le contrat d'intégration ProcuraFlow intercepte cette coupure avec un statut HTTP 503 pour préserver la disponibilité de votre service Fournisseurs.
                </p>
              </div>
            </div>
          )}

          {/* Loading Shimmer */}
          {loading && (
            <div className="space-y-3 py-6">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-1/3 rounded-md skeleton-shimmer" />
                    <div className="h-4 w-1/4 rounded-md skeleton-shimmer" />
                  </div>
                  <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && commandes.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 animate-fade-in-up">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucune commande enregistrée</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Ce fournisseur ne possède actuellement aucun bon de commande associé dans le système.
              </p>
            </div>
          )}

          {/* Orders List */}
          {!loading && commandes.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Commandes ({commandes.length})
                </p>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/70 dark:border-teal-800/60">
                  Total : {commandes.reduce((acc, c) => acc + c.montantTotal, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                </span>
              </div>

              {commandes.map((cmd) => {
                const isExpanded = expandedId === cmd.id;
                const statusConfig = getStatusConfig(cmd.statut);
                const formattedDate = new Date(cmd.dateCommande).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={cmd.id}
                    className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
                  >
                    <div
                      onClick={() => toggleExpand(cmd.id)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                            Commande #{cmd.id}
                          </span>
                          <span
                            className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${statusConfig.badge}`}
                          >
                            {statusConfig.icon}
                            {cmd.statut}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Émise le {formattedDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {cmd.montantTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                        <div className="p-1 rounded-lg text-slate-400 group-hover:text-slate-600 bg-slate-100/80 dark:bg-slate-700">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded order lines */}
                    {isExpanded && cmd.lignes && cmd.lignes.length > 0 && (
                      <div className="px-5 pb-5 pt-3 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span>Détail des articles commandés :</span>
                        </p>
                        <div className="space-y-1.5">
                          {cmd.lignes.map((ligne, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-2xs"
                            >
                              <div className="text-slate-800 dark:text-slate-200">
                                <span className="font-semibold text-slate-900 dark:text-white">{ligne.designation}</span>
                                <span className="text-slate-400 dark:text-slate-500 ml-2">Qté : {ligne.quantite}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                   {(ligne.quantite * ligne.prixUnitaire).toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                  })} MAD
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                  ({ligne.prixUnitaire.toFixed(2)} MAD / u)
                                </span>
                              </div>
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
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 shadow-xs transition-all duration-150 active:scale-95"
          >
            Fermer le volet
          </button>
        </div>
      </div>
    </div>
  );
};
