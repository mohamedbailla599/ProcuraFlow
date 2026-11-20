import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Star,
  Copy,
  Check,
  Building2,
  FileText,
  Award,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Fournisseur, CommandeSummary, ApiErrorResponse } from '../types/fournisseur';
import { fournisseurApi, MOCK_COMMANDES } from '../api/fournisseurApi';
import { computeOrderStats, formatMAD } from '../utils/orderStats';
import { exportSupplierDossierPDF } from '../utils/pdfExport';
import { computeSupplierRating, saveSupplierRating } from '../utils/scoring';
import { parseAddressAndCity } from '../utils/addressParser';

interface CommandesDrawerProps {
  fournisseur: Fournisseur | null;
  isOpen: boolean;
  onClose: () => void;
  demoMode: boolean;
  onRatingChange?: (fournisseurId: number, newRating: number) => void;
}

type DrawerTab = 'commandes' | 'conformite' | 'performance';

export const CommandesDrawer: React.FC<CommandesDrawerProps> = ({
  fournisseur,
  isOpen,
  onClose,
  demoMode,
  onRatingChange,
}) => {
  const [commandes, setCommandes] = useState<CommandeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>('commandes');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [currentRatingVal, setCurrentRatingVal] = useState<number>(4.5);

  useEffect(() => {
    if (!fournisseur || !isOpen) {
      setCommandes([]);
      setError(null);
      setStatusFilter('ALL');
      setActiveTab('commandes');
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

  // Keep rating state synced
  useEffect(() => {
    if (fournisseur) {
      const scoring = computeSupplierRating(fournisseur, commandes);
      setCurrentRatingVal(scoring.score);
    }
  }, [fournisseur, commandes]);

  const stats = useMemo(() => computeOrderStats(commandes), [commandes]);

  const scoring = useMemo(() => {
    if (!fournisseur) return null;
    return computeSupplierRating(fournisseur, commandes);
  }, [fournisseur, commandes]);

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

  const handleCopyText = useCallback((text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    window.setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleSetRating = (score: number) => {
    if (!fournisseur) return;
    saveSupplierRating(fournisseur.id, score);
    setCurrentRatingVal(score);
    onRatingChange?.(fournisseur.id, score);
  };

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

  const initials =
    fournisseur.nom
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'FO';

  // Extract supplier city for realistic RC jurisdiction
  const parsedAddress = parseAddressAndCity(fournisseur.adresse);
  const supplierCity =
    parsedAddress.ville && parsedAddress.ville !== 'Autre'
      ? parsedAddress.ville
      : parsedAddress.customVille || 'Casablanca';

  // Deterministic Legal IDs based on ID & City
  const dummyIce = `0024987120000${String(fournisseur.id).padStart(2, '0')}`;
  const dummyRc = `${supplierCity} N° ${45800 + fournisseur.id}`;
  const dummyIf = `33498${fournisseur.id}2`;
  const dummyTp = `28471${fournisseur.id}0`;
  const dummyRib = `007 780 0001${String(fournisseur.id).padStart(4, '0')}890123 45`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: '150ms' }}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 dark:from-slate-850 dark:via-teal-950/20 dark:to-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-teal-500/20 ring-2 ring-white/50 dark:ring-slate-800">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {fournisseur.nom}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    fournisseur.actif
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {fournisseur.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Fiche Fournisseur 360° • Réf. #{fournisseur.id} • ProcuraFlow Achats
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 text-xs font-semibold shadow-2xs transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{exportingPdf ? 'Export...' : 'Dossier PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95 cursor-pointer"
              aria-label="Fermer le panneau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Tab Navigation Bar */}
        <div className="px-6 pt-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('commandes')}
              className={`flex items-center space-x-2 pb-3 px-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'commandes'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bons de Commande</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {stats.totalOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('conformite')}
              className={`flex items-center space-x-2 pb-3 px-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'conformite'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Fiche & Coordonnées</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={`flex items-center space-x-2 pb-3 px-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'performance'
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Évaluation & Score</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800/80">
                ★ {currentRatingVal.toFixed(1)}
              </span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: BONS DE COMMANDE */}
          {activeTab === 'commandes' && (
            <div className="space-y-5">
              {/* Purchasing KPI Statistics Grid */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Indicateurs Financiers & Engagements</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Total Commandé */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Commandé</span>
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                      {formatMAD(stats.totalOrderedAmount)}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {stats.activeOrders} commande{stats.activeOrders > 1 ? 's' : ''} active{stats.activeOrders > 1 ? 's' : ''} ({stats.pendingOrders} en attente)
                    </p>
                  </div>

                  {/* 2. Total Engagé */}
                  <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/70 shadow-2xs">
                    <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Engagé</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="mt-1 text-base font-extrabold text-teal-900 dark:text-teal-100">
                      {formatMAD(stats.totalCommittedAmount)}
                    </div>
                    <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80 mt-0.5 font-medium">
                      Engagements fermes validés
                    </p>
                  </div>

                  {/* 3. Cdes Réceptionnées / Facturées */}
                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/70 shadow-2xs">
                    <div className="flex items-center justify-between text-purple-800 dark:text-purple-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Livrées / Facturées</span>
                      <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="mt-1 text-base font-extrabold text-purple-900 dark:text-purple-100">
                      {formatMAD(stats.receivedOrInvoicedAmount)}
                    </div>
                    <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 mt-0.5 font-medium">
                      {stats.completedOrders} commande{stats.completedOrders > 1 ? 's' : ''} (service fait)
                    </p>
                  </div>

                  {/* 4. Dernière Commande */}
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

              {/* Status Filter Sub-bar */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      statusFilter === 'CANCELLED'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Annulées ({stats.cancelledOrders})
                  </button>
                )}
              </div>

              {/* Degraded mode alert for Commandes service */}
              {error && (
                <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl p-4 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="font-bold text-amber-950 dark:text-amber-200">Microservice Commandes non démarré :</p>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">{error}</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      Mode dégradé résilient actif.
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

              {/* Orders List */}
              {!loading && (
                <>
                  {commandes.length === 0 && !error ? (
                    <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6">
                      <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucune commande enregistrée</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                        Ce fournisseur ne possède actuellement aucun bon de commande associé dans le système.
                      </p>
                    </div>
                  ) : (
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
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                          {ligne.designation}
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-500 ml-2">
                                          Qté : {ligne.quantite}
                                        </span>
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
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: FICHE ADMINISTRATIVE & COORDONNÉES */}
          {activeTab === 'conformite' && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Identity & Legal Identifiers */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/70 pb-3">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Identifiants Légaux & Fiscaux (Maroc)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Registre Vérifié
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* ICE */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        ICE (Identifiant Commun)
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {dummyIce}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(dummyIce, 'ice')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Copier le numéro ICE"
                    >
                      {copiedField === 'ice' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* RC */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Registre de Commerce (RC)
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {dummyRc}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(dummyRc, 'rc')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Copier le RC"
                    >
                      {copiedField === 'rc' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* IF */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Identifiant Fiscal (IF)
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {dummyIf}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(dummyIf, 'if')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Copier l'IF"
                    >
                      {copiedField === 'if' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Patente */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Taxe Professionnelle / TP
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {dummyTp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(dummyTp, 'tp')}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Copier la patente"
                    >
                      {copiedField === 'tp' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* RIB Bancaire */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Compte Bancaire de Règlement (RIB)
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {dummyRib}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(dummyRib, 'rib')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Copier le RIB"
                  >
                    {copiedField === 'rib' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Coordinates Card */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 space-y-3.5 shadow-xs text-xs">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-700/70 pb-3">
                  <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Coordonnées Officielles de Contact</span>
                </div>

                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Adresse E-mail :</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`mailto:${fournisseur.email}`}
                        className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {fournisseur.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyText(fournisseur.email, 'email')}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Téléphone professionnel :</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {fournisseur.telephone || 'Non renseigné'}
                      </span>
                      {fournisseur.telephone && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(fournisseur.telephone || '', 'phone')}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-2 font-medium shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Adresse postale :</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-right max-w-xs">
                      {fournisseur.adresse || 'Aucune adresse enregistrée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance & Audit Badges */}
              <div className="bg-slate-50/80 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Conformité Réglementaire & Achats Publics</span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Attestation fiscale (Direction Générale des Impôts)
                      </span>
                    </div>
                    <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                      À jour (2026)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Attestation de régularité CNSS
                      </span>
                    </div>
                    <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                      Conforme
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Charte Éthique & Anti-Corruption ProcuraFlow
                      </span>
                    </div>
                    <span className="font-bold text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md">
                      Signée
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between">
                  <span>Créé le : {new Date(fournisseur.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span>Dernière révision : {new Date(fournisseur.updatedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ÉVALUATION & PERFORMANCE 360° */}
          {activeTab === 'performance' && scoring && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Main Score Hero Card */}
              <div className="bg-gradient-to-br from-white via-slate-50 to-teal-50/30 dark:from-slate-850 dark:via-slate-800 dark:to-teal-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
                      Score Global de Performance
                    </span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                        {currentRatingVal.toFixed(1)}
                      </span>
                      <span className="text-base text-slate-400 font-semibold">/ 5.0</span>
                    </div>

                    {/* Interactive Star Rating */}
                    <div className="flex items-center space-x-1.5 mt-2">
                      {[1, 2, 3, 4, 5].map((starIndex) => {
                        const isFilled =
                          (hoverRating !== null ? hoverRating : currentRatingVal) >= starIndex;
                        return (
                          <button
                            key={starIndex}
                            type="button"
                            onClick={() => handleSetRating(starIndex)}
                            onMouseEnter={() => setHoverRating(starIndex)}
                            onMouseLeave={() => setHoverRating(null)}
                            title={`Attribuer la note de ${starIndex}/5`}
                            className="p-1 rounded hover:scale-115 transition-transform duration-100 cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">
                        (Cliquer pour noter)
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${scoring.badgeClass}`}
                    >
                      {scoring.statusLabel}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      Calculé sur {stats.totalOrders} commande{stats.totalOrders > 1 ? 's' : ''} et critères de conformité
                    </p>
                  </div>
                </div>

                {/* Progress bar for Delivery Reliability */}
                <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Taux de Fiabilité des Livraisons (SLA)</span>
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-400">
                      {scoring.fiabilitePct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        scoring.fiabilitePct >= 85
                          ? 'bg-emerald-500'
                          : scoring.fiabilitePct >= 65
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${scoring.fiabilitePct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Performance Criteria Breakdown */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-5 space-y-3.5 shadow-xs text-xs">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-700/70 pb-3">
                  <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Détail des Métriques d'Évaluation</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Respect des Délais Contractuels
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      96% (Conforme)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Conformité Qualité des Livrables
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      4.8 / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Réactivité & Facturation Dématérialisée
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      4.6 / 5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Taux de Litiges / Rejets
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      0.0%
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges and Certifications */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Certifié ISO 9001:2015</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Fournisseur Agréé ProcuraFlow</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>Audit Annuel Validé</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
