import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart3,
  Check,
} from 'lucide-react';
import { Fournisseur, CommandeSummary, ApiErrorResponse } from '../types/fournisseur';
import { fournisseurApi, MOCK_COMMANDES } from '../api/fournisseurApi';
import { computeOrderStats, formatMAD } from '../utils/orderStats';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    if (!fournisseur || !isOpen) {
      setCommandes([]);
      setError(null);
      setStatusFilter('ALL');
      return;
    }

    const loadCommandes = async () => {
      setLoading(true);
      setError(null);
      setStatusFilter('ALL');

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

  const stats = useMemo(() => computeOrderStats(commandes), [commandes]);

  const filteredCommandes = useMemo(() => {
    return commandes.filter((cmd) => {
      if (statusFilter === 'ACTIVE') return cmd.statut === 'EN_ATTENTE' || cmd.statut === 'VALIDEE';
      if (statusFilter === 'COMPLETED') return cmd.statut === 'RECEPTIONNEE' || cmd.statut === 'FACTUREE';
      if (statusFilter === 'CANCELLED') return cmd.statut === 'ANNULEE';
      return true;
    });
  }, [commandes, statusFilter]);

  const formattedLatestDate = useMemo(() => {
    if (!stats.latestOrderDate) return 'Aucune commande';
    return new Date(stats.latestOrderDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [stats.latestOrderDate]);

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

          {/* Orders List & Purchasing Stats */}
          {!loading && commandes.length > 0 && (
            <div className="space-y-4">
              {/* Purchasing KPI Statistics Grid */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Statistiques d'Approvisionnement</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Total Commandé (Engagé) */}
                  <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/70 shadow-2xs">
                    <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Engagé</span>
                      <ShoppingBag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="mt-1 text-base font-extrabold text-teal-900 dark:text-teal-100">
                      {formatMAD(stats.totalOrderedAmount)}
                    </div>
                    <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5 font-medium">
                      {stats.activeOrders} commande{stats.activeOrders > 1 ? 's' : ''} active{stats.activeOrders > 1 ? 's' : ''} (hors annulations)
                    </p>
                  </div>

                  {/* Dépenses Réalisées (Livrées & Facturées) */}
                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/70 shadow-2xs">
                    <div className="flex items-center justify-between text-purple-800 dark:text-purple-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Dépenses Réalisées</span>
                      <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="mt-1 text-base font-extrabold text-purple-900 dark:text-purple-100">
                      {formatMAD(stats.totalSpentAmount)}
                    </div>
                    <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5 font-medium">
                      {stats.completedOrders} réceptionnée{stats.completedOrders > 1 ? 's' : ''} ou facturée{stats.completedOrders > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* État du portefeuille */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Exécution des commandes
                    </span>
                    <div className="mt-1 flex items-baseline space-x-1.5">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {stats.completedOrders} / {stats.totalOrders}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">honorées</span>
                    </div>
                    {stats.cancelledOrders > 0 ? (
                      <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 block mt-0.5">
                        {stats.cancelledOrders} annulée{stats.cancelledOrders > 1 ? 's' : ''} (exclue{stats.cancelledOrders > 1 ? 's' : ''} des totaux)
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        0 annulation
                      </span>
                    )}
                  </div>

                  {/* Dernière Commande */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Dernière commande
                    </span>
                    <div className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {formattedLatestDate}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Devise : {stats.currency} (Dirham marocain)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Tabs Filter */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Toutes ({stats.totalOrders})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  En cours ({stats.pendingOrders})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Livrées/Facturées ({stats.completedOrders})
                </button>
                {stats.cancelledOrders > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('CANCELLED')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      statusFilter === 'CANCELLED'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Annulées ({stats.cancelledOrders})
                  </button>
                )}
              </div>

              {/* Order Cards */}
              <div className="space-y-3">
                {filteredCommandes.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 italic">
                    Aucune commande dans cette catégorie.
                  </p>
                ) : (
                  filteredCommandes.map((cmd) => {
                    const isExpanded = expandedId === cmd.id;
                    const statusConfig = getStatusConfig(cmd.statut);
                    const formattedDate = new Date(cmd.dateCommande).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const isCancelled = cmd.statut === 'ANNULEE';

                    return (
                      <div
                        key={cmd.id}
                        className={`border rounded-2xl shadow-xs overflow-hidden transition-all ${
                          isCancelled
                            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 opacity-80'
                            : 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                        }`}
                      >
                        <div
                          onClick={() => toggleExpand(cmd.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-700/60 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                                Commande #{cmd.id}
                              </span>
                              <span
                                className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${statusConfig.badge}`}
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

                          <div className="flex items-center space-x-3 text-right">
                            <div>
                              <span
                                className={`font-extrabold text-sm block ${
                                  isCancelled
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {formatMAD(cmd.montantTotal)}
                              </span>
                              {isCancelled && (
                                <span className="text-[10px] text-rose-500 dark:text-rose-400 block font-medium">
                                  Non comptabilisée
                                </span>
                              )}
                            </div>
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
                          <div className="px-4 pb-4 pt-2.5 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-700 text-xs">
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
                                      {formatMAD(ligne.quantite * ligne.prixUnitaire)}
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
                  })
                )}
              </div>
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
