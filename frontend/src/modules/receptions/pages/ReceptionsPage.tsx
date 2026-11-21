import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Truck,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Eye,
  X,
  Calendar,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../../components/ui';
import { list, getAll } from '../api';
import { getAllCommandes } from '../../commandes/api';
import { ReceptionForm } from '../components/ReceptionForm';
import { ReceptionDetailModal } from '../components/ReceptionDetailModal';
import type { Reception } from '../types';
import type { Commande } from '../../commandes/types';
import {
  formatReceptionDate,
  getTotalUnitesRecues,
  calculateConformiteRate,
  exportReceptionsToCsv,
} from '../utils';

type ConformiteFilter = 'ALL' | 'CONFORME' | 'NON_CONFORME';
type SortOption = 'date-desc' | 'date-asc' | 'commande-desc' | 'commande-asc' | 'id-desc';

const ITEMS_PER_PAGE = 10;

export function ReceptionsPage() {
  const [rows, setRows] = useState<Reception[]>([]);
  const [allReceptions, setAllReceptions] = useState<Reception[]>([]);
  const [commandesList, setCommandesList] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  // Filtres, Recherche & Tri
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [conformiteFilter, setConformiteFilter] = useState<ConformiteFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [detail, setDetail] = useState<Reception | null>(null);
  const [creating, setCreating] = useState(false);

  // Chargement des données globales (pour KPI et liste enrichie)
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [receptionsData, commandesData] = await Promise.all([
        getAll(),
        getAllCommandes().catch(() => [] as Commande[]),
      ]);
      setAllReceptions(Array.isArray(receptionsData) ? receptionsData : []);
      setCommandesList(Array.isArray(commandesData) ? commandesData : []);
    } catch (e: any) {
      setError(e.message || 'Impossible de joindre le service Réceptions (:8083)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [revision]);

  // Réinitialiser la page courante lors d'un changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, orderFilter, conformiteFilter, sortBy]);

  // Calcul des statistiques KPI globales
  const kpiStats = useMemo(() => {
    const total = allReceptions.length;
    const conformes = allReceptions.filter(
      (r) => (r.statutReception || 'CONFORME').toUpperCase() === 'CONFORME'
    ).length;
    const nonConformes = total - conformes;
    const totalUnites = allReceptions.reduce((sum, r) => sum + getTotalUnitesRecues(r), 0);
    const conformiteRate = calculateConformiteRate(total, conformes);

    return { total, conformes, nonConformes, totalUnites, conformiteRate };
  }, [allReceptions]);

  // Filtrage et Tri en mémoire
  const filteredReceptions = useMemo(() => {
    return allReceptions
      .filter((r) => {
        // Filtre par conformité
        if (conformiteFilter === 'CONFORME') {
          if ((r.statutReception || 'CONFORME').toUpperCase() !== 'CONFORME') return false;
        } else if (conformiteFilter === 'NON_CONFORME') {
          if ((r.statutReception || 'CONFORME').toUpperCase() === 'CONFORME') return false;
        }

        // Filtre par numéro de commande
        if (orderFilter.trim()) {
          const matchOrder = String(r.commandeId).includes(orderFilter.trim());
          if (!matchOrder) return false;
        }

        // Recherche textuelle
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = `#${r.id}`.includes(q) || String(r.id).includes(q);
          const matchCmd = `#${r.commandeId}`.includes(q) || String(r.commandeId).includes(q);
          const matchRemarques = (r.remarques || '').toLowerCase().includes(q);
          const matchLignes = r.lignes?.some((l) =>
            String(l.ligneCommandeId).includes(q) || (l.remarques || '').toLowerCase().includes(q)
          );

          if (!matchId && !matchCmd && !matchRemarques && !matchLignes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return new Date(a.dateReception || 0).getTime() - new Date(b.dateReception || 0).getTime();
          case 'commande-desc':
            return b.commandeId - a.commandeId;
          case 'commande-asc':
            return a.commandeId - b.commandeId;
          case 'id-desc':
            return b.id - a.id;
          case 'date-desc':
          default:
            return new Date(b.dateReception || 0).getTime() - new Date(a.dateReception || 0).getTime();
        }
      });
  }, [allReceptions, conformiteFilter, orderFilter, searchQuery, sortBy]);

  // Données de la page actuelle
  const totalPages = Math.max(1, Math.ceil(filteredReceptions.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReceptions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReceptions, currentPage]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || orderFilter.trim() !== '' || conformiteFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    setOrderFilter('');
    setConformiteFilter('ALL');
    setSortBy('date-desc');
  };

  const getCommandeDetails = (commandeId: number) => {
    return commandesList.find((c) => Number(c.id) === Number(commandeId));
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-6">
      {/* En-tête de page moderne */}
      <PageHeader
        badge={<Badge variant="teal" dot size="sm">Service Réceptions (:8083)</Badge>}
        title="Réceptions & Suivi des Livraisons"
        description="Contrôlez les livraisons physiques, inspectez la conformité des articles et pointez les entrées en stock."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadData}
            >
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => exportReceptionsToCsv(allReceptions)}
              disabled={allReceptions.length === 0}
            >
              Exporter CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setCreating(true)}
            >
              Nouvelle Réception
            </Button>
          </div>
        }
      />

      {/* Grille de 4 Cartes KPI Interactives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 : Total Réceptions */}
        <button
          type="button"
          onClick={() => setConformiteFilter('ALL')}
          className={`text-left p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer ${
            conformiteFilter === 'ALL'
              ? 'border-teal-500 ring-2 ring-teal-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Réceptions
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpiStats.total}
            </span>
            <span className="text-xs font-semibold text-slate-400">bons de livraison</span>
          </div>
        </button>

        {/* KPI 2 : Livrées Conformes */}
        <button
          type="button"
          onClick={() => setConformiteFilter('CONFORME')}
          className={`text-left p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer ${
            conformiteFilter === 'CONFORME'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Livrées Conformes
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {kpiStats.conformes}
            </span>
            <Badge variant="success" size="xs">
              {kpiStats.conformiteRate}% conformité
            </Badge>
          </div>
        </button>

        {/* KPI 3 : Avec Réserves / Litiges */}
        <button
          type="button"
          onClick={() => setConformiteFilter('NON_CONFORME')}
          className={`text-left p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer ${
            conformiteFilter === 'NON_CONFORME'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avec Réserves
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {kpiStats.nonConformes}
            </span>
            <span className="text-xs font-semibold text-slate-400">anomalies signalées</span>
          </div>
        </button>

        {/* KPI 4 : Total Unités Réceptionnées */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unités Réceptionnées
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpiStats.totalUnites}
            </span>
            <span className="text-xs font-semibold text-slate-400">articles physiques</span>
          </div>
        </div>
      </div>

      {/* Barre d'Outils, Recherche & Filtres */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Barre de recherche plein texte */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par #ID réception, #ID commande, ou mot-clé de remarque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm border rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtre direct par commande */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
              <div className="relative">
                <input
                  type="search"
                  inputMode="numeric"
                  placeholder="N° Commande..."
                  value={orderFilter}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      setOrderFilter(e.target.value);
                    }
                  }}
                  className="w-36 px-3 py-2 text-sm border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {orderFilter && (
                  <button
                    type="button"
                    onClick={() => setOrderFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sélecteur de tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="date-desc">Plus récentes</option>
                <option value="date-asc">Plus anciennes</option>
                <option value="commande-desc">Commande (décroissant)</option>
                <option value="commande-asc">Commande (croissant)</option>
                <option value="id-desc">N° Réception (décroissant)</option>
              </select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  icon={<X className="w-3.5 h-3.5" />}
                >
                  Effacer
                </Button>
              )}
            </div>
          </div>

          {/* Onglets Filtres par Statut de Conformité */}
          <div className="flex items-center space-x-1 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Statut :
            </span>
            <button
              type="button"
              onClick={() => setConformiteFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                conformiteFilter === 'ALL'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Toutes ({kpiStats.total})
            </button>
            <button
              type="button"
              onClick={() => setConformiteFilter('CONFORME')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                conformiteFilter === 'CONFORME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Conformes ({kpiStats.conformes})
            </button>
            <button
              type="button"
              onClick={() => setConformiteFilter('NON_CONFORME')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                conformiteFilter === 'NON_CONFORME'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Avec réserves ({kpiStats.nonConformes})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des Réceptions */}
      <Card>
        {loading ? (
          <div className="py-16">
            <LoadingState message="Chargement des réceptions en cours..." />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState
              message={error}
              onRetry={() => {
                setRevision((v) => v + 1);
              }}
            />
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Truck className="w-10 h-10 text-teal-600" />}
              title={
                hasActiveFilters
                  ? 'Aucune réception ne correspond à vos filtres'
                  : 'Aucune réception enregistrée'
              }
              description={
                hasActiveFilters
                  ? 'Essayez de modifier votre numéro de commande ou d’effacer les filtres.'
                  : 'Pointez votre premier bon de livraison en cliquant sur "Nouvelle Réception".'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={resetAllFilters}>
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setCreating(true)}
                  >
                    Nouvelle Réception
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Réception</th>
                    <th className="py-3.5 px-4">Bon de Commande</th>
                    <th className="py-3.5 px-4">Date de Livraison</th>
                    <th className="py-3.5 px-4">Articles / Unités</th>
                    <th className="py-3.5 px-4">Conformité</th>
                    <th className="py-3.5 px-4">Remarques</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRows.map((row) => {
                    const isConforme =
                      (row.statutReception || 'CONFORME').toUpperCase() === 'CONFORME';
                    const unitesCount = getTotalUnitesRecues(row);
                    const associatedCmd = getCommandeDetails(row.commandeId);

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Réception #ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                              #{row.id}
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              BL-{String(row.id).padStart(4, '0')}
                            </span>
                          </div>
                        </td>

                        {/* Commande #ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="inline-flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                                #{row.commandeId}
                              </span>
                              {associatedCmd?.statut && (
                                <span className="text-[10px] font-bold text-slate-400">
                                  ({associatedCmd.statut})
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Date de réception */}
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatReceptionDate(row.dateReception)}
                          </span>
                        </td>

                        {/* Articles & Quantités */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80">
                              <Package className="w-3 h-3 mr-1" />
                              {row.lignes?.length || 0} ligne(s) · {unitesCount} unité(s)
                            </span>
                          </div>
                        </td>

                        {/* Conformité */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={isConforme ? 'success' : 'warning'}
                            dot
                            size="sm"
                          >
                            {row.statutReception || 'CONFORME'}
                          </Badge>
                        </td>

                        {/* Remarques */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {row.remarques ? (
                            <span title={row.remarques}>{row.remarques}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 italic">
                              Sans réserve
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setDetail(row)}
                          >
                            Détail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination & Compteur */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div>
                Affichage de{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{' '}
                à{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredReceptions.length)}
                </span>{' '}
                sur{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {filteredReceptions.length}
                </span>{' '}
                réception(s)
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Précédent
                  </Button>
                  <span className="px-2 font-medium">
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Modal Nouvelle Réception */}
      {creating && (
        <ReceptionForm
          close={() => setCreating(false)}
          saved={(newReception) => {
            setCreating(false);
            setOrderFilter('');
            setSearchQuery('');
            setDetail(newReception);
            setRevision((v) => v + 1);
          }}
        />
      )}

      {/* Modal Détail & Bordereau de Réception */}
      {detail && (
        <ReceptionDetailModal
          reception={detail}
          commande={getCommandeDetails(detail.commandeId)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
