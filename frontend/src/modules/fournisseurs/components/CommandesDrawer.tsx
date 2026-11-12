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
  Info,
  ShieldCheck,
  FileDown,
} from 'lucide-react';
import { Fournisseur, CommandeSummary, ApiErrorResponse } from '../types/fournisseur';
import { fournisseurApi, MOCK_COMMANDES } from '../api/fournisseurApi';
import { computeOrderStats, formatMAD } from '../utils/orderStats';
import { exportSupplierDossierPDF } from '../utils/pdfExport';

interface CommandesDrawerProps {
  fournisseur: Fournisseur | null;
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
}

type ModuleTab = 'commandes' | 'receptions' | 'factures';

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
  const [activeModule, setActiveModule] = useState<ModuleTab>('commandes');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!fournisseur || !isOpen) {
      setCommandes([]);
      setError(null);
      setStatusFilter('ALL');
      setActiveModule('commandes');
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
    if (!stats.latestOrderDate) return 'Aucune';
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

  const handleExportDossierPDF = async () => {
    setExportingPdf(true);
    try {
      await exportSupplierDossierPDF({ fournisseur, commandes });
    } catch (err) {
      console.error('Erreur lors de l’export PDF de la fiche fournisseur:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusConfig = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/80',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />,
        };
      case 'RECEPTIONNEE':
        return {
          badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/80',
          icon: <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mr-1" />,
        };
      case 'FACTUREE':
        return {
          badge: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/90 dark:border-purple-800/80',
          icon: <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mr-1" />,
        };
      case 'EN_ATTENTE':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/90 dark:border-amber-800/80',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mr-1" />,
        };
      case 'ANNULEE':
        return {
          badge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/90 dark:border-rose-800/80',
          icon: <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mr-1" />,
        };
      default:
        return {
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
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
                Dossier Achats & Activité Fournisseur • ID #{fournisseur.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportDossierPDF}
              disabled={exportingPdf || loading}
              title="Télécharger la fiche individuelle fournisseur en PDF"
              aria-label="Exporter la fiche fournisseur en PDF"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 text-xs font-semibold shadow-2xs transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{exportingPdf ? 'Export...' : 'Fiche PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
              aria-label="Fermer le panneau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Supplier quick summary card */}
          <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 space-y-2.5 text-xs shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">E-mail :</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{fournisseur.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">Téléphone :</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{fournisseur.telephone || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Statut administratif :</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  fournisseur.actif
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {fournisseur.actif ? 'Actif (Éligible aux commandes)' : 'Inactif (Suspendu)'}
              </span>
            </div>
          </div>

          {/* Multi-Service Module Navigation Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveModule('commandes')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
                activeModule === 'commandes'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Commandes</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                {stats.totalOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('receptions')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
                activeModule === 'receptions'
                  ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Réceptions</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                {stats.completedOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('factures')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-semibold transition-all ${
                activeModule === 'factures'
                  ? 'bg-white dark:bg-slate-700 text-purple-800 dark:text-purple-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Factures</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                {stats.completedOrders}
              </span>
            </button>
          </div>

          {/* Degraded mode alert for Commandes service */}
          {error && activeModule === 'commandes' && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl p-4 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3 shadow-xs animate-fade-in-up">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold text-amber-950 dark:text-amber-200">Microservice Commandes non démarré :</p>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">{error}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Le contrat d'intégration intercepte cette coupure avec un statut HTTP 503 pour préserver la résilience du service Fournisseurs.
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

          {/* MODULE 1: COMMANDES */}
          {activeModule === 'commandes' && !loading && (
            <>
              {commandes.length === 0 && !error ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 animate-fade-in-up">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucune commande enregistrée</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Ce fournisseur ne possède actuellement aucun bon de commande associé dans le système.
                  </p>
                </div>
              ) : commandes.length > 0 && (
                <div className="space-y-4">
                  {/* Purchasing KPI Statistics Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <BarChart3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Indicateurs Financiers & Engagements</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* 1. Total Commandé (Volume initié) */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Total Commandé</span>
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                          {formatMAD(stats.totalOrderedAmount)}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {stats.activeOrders} cde{stats.activeOrders > 1 ? 's' : ''} actives ({stats.pendingOrders} en attente)
                        </p>
                      </div>

                      {/* 2. Total Engagé (Commandes validées / fermes) */}
                      <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/70 shadow-2xs">
                        <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Total Engagé</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="mt-1 text-base font-extrabold text-teal-900 dark:text-teal-100">
                          {formatMAD(stats.totalCommittedAmount)}
                        </div>
                        <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5 font-medium">
                          Engagements fermes validés (hors attente & annulations)
                        </p>
                      </div>

                      {/* 3. Montant des commandes réceptionnées / facturées */}
                      <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/70 shadow-2xs">
                        <div className="flex items-center justify-between text-purple-800 dark:text-purple-300">
                          <span className="text-[10px] font-bold uppercase tracking-wider" title="Montant des commandes réceptionnées ou facturées dans le workflow Commandes (hors décaissement/paiement réel)">
                            Cdes réceptionnées / facturées
                          </span>
                          <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="mt-1 text-base font-extrabold text-purple-900 dark:text-purple-100">
                          {formatMAD(stats.receivedOrInvoicedAmount)}
                        </div>
                        <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5 font-medium">
                          {stats.completedOrders} cde{stats.completedOrders > 1 ? 's' : ''} livrée{stats.completedOrders > 1 ? 's' : ''} ou facturée{stats.completedOrders > 1 ? 's' : ''} (service fait, hors paiement)
                        </p>
                      </div>

                      {/* 4. Statut Exécution & Dernière Commande */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Dernière Cde</span>
                          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {formattedLatestDate}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {stats.completedOrders} / {stats.totalOrders} honorées
                          {stats.cancelledOrders > 0 && ` • ${stats.cancelledOrders} annulée`}
                        </p>
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
                      En cours ({stats.pendingOrders + stats.validatedOrders})
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
                      Livrées / Facturées ({stats.completedOrders})
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

                  {/* Orders List */}
                  <div className="space-y-3">
                    {filteredCommandes.map((cmd) => {
                      const statusConfig = getStatusConfig(cmd.statut);
                      const isExpanded = expandedId === cmd.id;
                      const formattedDate = new Date(cmd.dateCommande).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const isCancelled = cmd.statut === 'ANNULEE';

                      return (
                        <div
                          key={cmd.id}
                          className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                            isCancelled
                              ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-900/40 opacity-80'
                              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div
                            onClick={() => toggleExpand(cmd.id)}
                            className="p-4 flex items-center justify-between cursor-pointer select-none group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  Commande #{cmd.id}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${statusConfig.badge}`}
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
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* MODULE 2: RÉCEPTIONS (ALI) */}
          {activeModule === 'receptions' && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Status Notice: Service Réceptions Status */}
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Microservice Réceptions (Ali • Port 8083)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    En attente d'API
                  </span>
                </div>
                <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                  Le suivi physique des réceptions, les pointages de conformité et les bordereaux transporteur sont placés sous la responsabilité du service Réceptions. Aucun endpoint REST n'est actuellement exposé par ce service.
                </p>
                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 flex items-start space-x-2 text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Les livraisons partielles et observations transporteur nécessitent l'implémentation de la table <code>schema_receptions.receptions</code> par Ali.
                  </span>
                </div>
              </div>

              {/* Verified Receptions projection from Commandes lifecycle */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Projection dérivée du statut des commandes (service Commandes) :</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                    Note : Ces éléments constituent une projection basée sur les statuts déclarés dans le microservice Commandes. Les réceptions physiques réelles, pointages et bordereaux seront synchronisés dès l'activation de l'API Réceptions d'Ali.
                  </p>
                </div>

                {commandes.filter((c) => c.statut === 'RECEPTIONNEE' || c.statut === 'FACTUREE').length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                    Aucune commande n'a encore été réceptionnée pour ce fournisseur.
                  </div>
                ) : (
                  commandes
                    .filter((c) => c.statut === 'RECEPTIONNEE' || c.statut === 'FACTUREE')
                    .map((cmd) => (
                      <div
                        key={cmd.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Commande #{cmd.id}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Truck className="w-3 h-3 mr-1" />
                              Réception constatée
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Montant : {formatMAD(cmd.montantTotal)} • Émise le{' '}
                            {new Date(cmd.dateCommande).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* MODULE 3: FACTURES (HAMZA) */}
          {activeModule === 'factures' && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Status Notice: Service Factures Status */}
              <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/70 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-purple-900 dark:text-purple-200 font-bold">
                    <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Microservice Factures (Hamza • Port 8084)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    En attente d'API
                  </span>
                </div>
                <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
                  La gestion des factures fournisseurs et le suivi des décaissements réels relèvent exclusivement du service Factures. Aucun endpoint REST n'est actuellement exposé par ce service.
                </p>
                <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60 flex items-start space-x-2 text-[11px] text-purple-700 dark:text-purple-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                  <span>
                    Règle d'intégrité comptable : aucun montant n'est qualifié de "Payé" sans confirmation de règlement émise par le service Factures.
                  </span>
                </div>
              </div>

              {/* Verified Factures projection from Commandes lifecycle */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Projection dérivée du statut des commandes (service Commandes) :</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                    Note : Ces éléments constituent une projection des commandes marquées comme facturées dans le microservice Commandes. Les numéros de facture certifiés, échéances et confirmations de décaissement seront synchronisés dès l'activation de l'API Factures de Hamza.
                  </p>
                </div>

                {commandes.filter((c) => c.statut === 'FACTUREE').length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                    Aucune commande n'est encore passée au statut Facturée pour ce fournisseur.
                  </div>
                ) : (
                  commandes
                    .filter((c) => c.statut === 'FACTUREE')
                    .map((cmd) => (
                      <div
                        key={cmd.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Commande #{cmd.id}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Receipt className="w-3 h-3 mr-1" />
                              Facturée
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Montant facturé : {formatMAD(cmd.montantTotal)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                            Règlement
                          </span>
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            En attente Factures
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
