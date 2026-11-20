import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import {
  Plus,
  Download,
  FileText,
  Upload,
  RotateCw,
  List,
  LayoutGrid,
  Map as MapIcon,
  CheckCircle2,
  XCircle,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatsBar } from '../components/StatsBar';
import { FilterBar, SortOption } from '../components/FilterBar';
import { FournisseurTable } from '../components/FournisseurTable';
import { FournisseurCards } from '../components/FournisseurCards';
import { PaginationBar } from '../components/PaginationBar';
import { FournisseurModal } from '../components/FournisseurModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { CommandesDrawer } from '../components/CommandesDrawer';
import { ImportModal } from '../components/ImportModal';
import { Toast, ToastMessage } from '../../../components/Toast';
import { MOROCCO_CITY_NAMES } from '../../../data/moroccoCities';
import { FilterParams, Fournisseur, FournisseurRequest, FournisseurStats } from '../types/fournisseur';
import { computeSupplierRating, saveSupplierRating } from '../utils/scoring';
import { computeOrderStats, SupplierOrderStats, formatMAD } from '../utils/orderStats';
import { exportCataloguePDF } from '../utils/pdfExport';
import {
  DEFAULT_PAGE_SIZE,
  PageSizeOption,
  computeDemoGlobalStats,
  filterAndSortSuppliers,
  getEntranceWaveDurationMs,
  mapSortOptionToApiSort,
  paginateDemoSuppliers,
  prefersReducedMotion,
} from '../utils/pagination';
import {
  fournisseurApi,
  INITIAL_MOCK_FOURNISSEURS,
  MOCK_COMMANDES,
} from '../api/fournisseurApi';
import { useTheme } from '../../../context/ThemeContext';
import { useApp, useRegisterCommands, PaletteCommand } from '../../../context/AppContext';

const FournisseurMap = lazy(() =>
  import('../components/FournisseurMap').then((m) => ({ default: m.FournisseurMap }))
);

interface SupplierQueryState {
  page: number;
  size: PageSizeOption;
  statusFilter: 'all' | 'active' | 'inactive';
  sortBy: SortOption;
  cityFilter: string;
  appliedSearch: string;
}

function buildApiFilterParams(q: Pick<SupplierQueryState, 'statusFilter' | 'sortBy' | 'cityFilter' | 'appliedSearch'>): FilterParams {
  return {
    sort: mapSortOptionToApiSort(q.sortBy),
    search: q.appliedSearch || undefined,
    ville: q.cityFilter !== 'all' ? q.cityFilter : undefined,
    actif:
      q.statusFilter === 'active'
        ? true
        : q.statusFilter === 'inactive'
        ? false
        : undefined,
    includeInactive: q.statusFilter === 'all' ? true : undefined,
  };
}

const EMPTY_STATS: FournisseurStats = {
  total: 0,
  actifs: 0,
  inactifs: 0,
  tauxEligibilite: 0,
  villes: [],
};

export const FournisseursPage = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const {
    demoMode,
    toggleDemoMode,
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    checkBackendHealth,
  } = useApp();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [mapFournisseurs, setMapFournisseurs] = useState<Fournisseur[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importExistingPool, setImportExistingPool] = useState<Fournisseur[] | null>(null);
  const [mockStore, setMockStore] = useState<Fournisseur[]>(INITIAL_MOCK_FOURNISSEURS);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // View mode (table, grid, or interactive map)
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'map'>('table');

  // Unified query & pagination state (atomic updates prevent duplicate API calls)
  const [searchTerm, setSearchTerm] = useState('');
  const [queryState, setQueryState] = useState<SupplierQueryState>({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    statusFilter: 'all',
    sortBy: 'name-asc',
    cityFilter: 'all',
    appliedSearch: '',
  });
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [globalStats, setGlobalStats] = useState<FournisseurStats>(EMPTY_STATS);
  const [demoAvgRating, setDemoAvgRating] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [statsTick, setStatsTick] = useState(0);

  // Progressive entrance animation state
  const [animationState, setAnimationState] = useState<{
    batchKey: number;
    active: boolean;
  }>({ batchKey: 0, active: false });
  const batchCounterRef = useRef(0);
  const animationTimerRef = useRef<number | null>(null);
  const requestSeqRef = useRef(0);
  const mapRequestSeqRef = useRef(0);
  const fetchedOrderStatsIdsRef = useRef<Set<number>>(new Set());

  const [orderStats, setOrderStats] = useState<Record<number, SupplierOrderStats>>({});

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fournisseurToEdit, setFournisseurToEdit] = useState<Fournisseur | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    fournisseur: Fournisseur | null;
  }>({
    isOpen: false,
    fournisseur: null,
  });

  // Notifications (stacked modern toast queue)
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
  }, []);

  const handleCloseToast = useCallback((id?: string) => {
    if (!id) {
      setToasts([]);
    } else {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  // Debounce free-text search and reset to page 0 atomically when query changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchTerm.trim();
      setQueryState((prev) =>
        prev.appliedSearch === trimmed ? prev : { ...prev, appliedSearch: trimmed, page: 0 }
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // Clean up any active animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const startEntranceAnimation = useCallback((itemCount: number) => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    const nextBatch = ++batchCounterRef.current;
    if (itemCount <= 0 || prefersReducedMotion()) {
      setAnimationState({ batchKey: nextBatch, active: false });
      return;
    }

    setAnimationState({ batchKey: nextBatch, active: true });
    const durationMs = getEntranceWaveDurationMs(itemCount);
    animationTimerRef.current = window.setTimeout(() => {
      setAnimationState((prev) =>
        prev.batchKey === nextBatch ? { ...prev, active: false } : prev
      );
      animationTimerRef.current = null;
    }, durationMs);
  }, []);

  const triggerReload = useCallback((includeStats = false) => {
    setRefreshTick((t) => t + 1);
    if (includeStats) {
      setStatsTick((t) => t + 1);
    }
  }, []);

  // Atomic query setters (no duplicate API calls)
  const handleStatusFilterChange = useCallback((nextStatus: 'all' | 'active' | 'inactive') => {
    setQueryState((prev) =>
      prev.statusFilter === nextStatus && prev.page === 0
        ? prev
        : { ...prev, statusFilter: nextStatus, page: 0 }
    );
  }, []);

  const handleSortChange = useCallback((nextSort: SortOption) => {
    setQueryState((prev) =>
      prev.sortBy === nextSort && prev.page === 0 ? prev : { ...prev, sortBy: nextSort, page: 0 }
    );
  }, []);

  const handleCityFilterChange = useCallback((nextCity: string) => {
    setQueryState((prev) =>
      prev.cityFilter === nextCity && prev.page === 0
        ? prev
        : { ...prev, cityFilter: nextCity, page: 0 }
    );
  }, []);

  // Comprehensive national cities list (Catalogue du Maroc + villes personnalisées existantes)
  const allAvailableCities = useMemo(() => {
    const set = new Set<string>(MOROCCO_CITY_NAMES);
    (globalStats.villes || []).forEach((v) => {
      if (
        v &&
        v.length <= 25 &&
        !v.toLowerCase().includes('rue') &&
        !v.toLowerCase().includes('bloc') &&
        !v.toLowerCase().includes('hay')
      ) {
        set.add(v);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [globalStats.villes]);

  const handlePageSizeChange = useCallback((nextSize: PageSizeOption) => {
    setQueryState((prev) =>
      prev.size === nextSize && prev.page === 0 ? prev : { ...prev, size: nextSize, page: 0 }
    );
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setQueryState((prev) => (prev.page === nextPage ? prev : { ...prev, page: Math.max(0, nextPage) }));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setQueryState((prev) => ({
      ...prev,
      page: 0,
      statusFilter: 'all',
      sortBy: 'name-asc',
      cityFilter: 'all',
      appliedSearch: '',
    }));
  }, []);

  const handleToggleDemoMode = useCallback(() => {
    toggleDemoMode();
    showToast('success', !demoMode ? 'Mode Démo activé.' : 'Mode API Réel activé.');
    fetchedOrderStatsIdsRef.current.clear();
    setQueryState((prev) => ({ ...prev, page: 0 }));
    setStatsTick((t) => t + 1);
  }, [demoMode, toggleDemoMode, showToast]);

  // Fetch global stats independently from pagination
  useEffect(() => {
    if (demoMode) {
      const { stats, avgRating } = computeDemoGlobalStats(mockStore);
      setGlobalStats(stats);
      setDemoAvgRating(avgRating);
      return;
    }

    const controller = new AbortController();
    setDemoAvgRating(null);
    fournisseurApi
      .getGlobalStats(controller.signal)
      .then((stats) => {
        if (!controller.signal.aborted) {
          setGlobalStats(stats);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err?.name !== 'AbortError') {
          console.error('Failed to load global supplier stats:', err);
        }
      });

    return () => controller.abort();
  }, [demoMode, mockStore, statsTick]);

  // Fetch paginated suppliers (server-side or demo store) and trigger progressive entrance after arrival
  useEffect(() => {
    const seq = ++requestSeqRef.current;
    const controller = new AbortController();
    setLoading(true);
    setPageError(null);

    if (demoMode) {
      const demoStatsMap: Record<number, SupplierOrderStats> = {};
      mockStore.forEach((f) => {
        demoStatsMap[f.id] = computeOrderStats(MOCK_COMMANDES[f.id] || []);
      });
      setOrderStats(demoStatsMap);

      const pageResult = paginateDemoSuppliers(mockStore, {
        page: queryState.page,
        size: queryState.size,
        sortBy: queryState.sortBy,
        statusFilter: queryState.statusFilter,
        searchTerm: queryState.appliedSearch,
        cityFilter: queryState.cityFilter === 'all' ? '' : queryState.cityFilter,
      });

      if (pageResult.empty && pageResult.totalPages > 0 && queryState.page >= pageResult.totalPages) {
        setQueryState((prev) => ({ ...prev, page: pageResult.totalPages - 1 }));
        return () => controller.abort();
      }

      setFournisseurs(pageResult.content);
      setTotalElements(pageResult.totalElements);
      setTotalPages(pageResult.totalPages);
      setLoading(false);
      startEntranceAnimation(pageResult.content.length);
      return () => controller.abort();
    }

    const apiParams = {
      ...buildApiFilterParams(queryState),
      page: queryState.page,
      size: queryState.size,
    };

    fournisseurApi
      .getFournisseursPage(apiParams, controller.signal)
      .then((pageResult) => {
        if (controller.signal.aborted || seq !== requestSeqRef.current) return;

        const rawContent = Array.isArray(pageResult?.content) ? pageResult.content : [];
        const safeContent =
          queryState.sortBy === 'rating-desc'
            ? [...rawContent].sort(
                (a, b) => computeSupplierRating(b).score - computeSupplierRating(a).score
              )
            : rawContent;
        const safeTotalPages = typeof pageResult?.totalPages === 'number' ? pageResult.totalPages : 0;
        const safeTotalElements =
          typeof pageResult?.totalElements === 'number' ? pageResult.totalElements : safeContent.length;

        if (pageResult?.empty && safeTotalPages > 0 && queryState.page >= safeTotalPages) {
          setQueryState((prev) => ({ ...prev, page: safeTotalPages - 1 }));
          return;
        }

        setFournisseurs(safeContent);
        setTotalElements(safeTotalElements);
        setTotalPages(safeTotalPages);
        checkBackendHealth();
        setLoading(false);
        startEntranceAnimation(safeContent.length);

        // Lazy-load commandes summaries strictly for visible rows not yet cached (no refetch cascade)
        const pendingSuppliers = safeContent.filter(
          (f) => !fetchedOrderStatsIdsRef.current.has(f.id)
        );
        pendingSuppliers.forEach(async (f) => {
          fetchedOrderStatsIdsRef.current.add(f.id);
          try {
            const cmds = await fournisseurApi.getCommandes(f.id);
            if (controller.signal.aborted) return;
            setOrderStats((prev) => ({ ...prev, [f.id]: computeOrderStats(cmds) }));
          } catch {
            // Commandes microservice may be unavailable; do not block supplier management
            fetchedOrderStatsIdsRef.current.delete(f.id);
          }
        });
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === 'AbortError' || seq !== requestSeqRef.current) {
          return;
        }
        console.error('Failed to load paginated suppliers from backend:', err);
        checkBackendHealth();
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Backend Spring Boot inaccessible sur :8081. Vous pouvez basculer en "Mode Démo" pour tester l\'interface.';
        setPageError(msg);
        setLoading(false);
        showToast('error', msg);
      });

    return () => controller.abort();
  }, [demoMode, mockStore, queryState, refreshTick, showToast, startEntranceAnimation, checkBackendHealth]);

  // Lazy-fetch full supplier list only if user opens ImportModal (for duplicate email checking)
  useEffect(() => {
    if (!isImportModalOpen || demoMode) {
      setImportExistingPool(null);
      return;
    }
    let cancelled = false;
    fournisseurApi
      .getFournisseurs({ includeInactive: true })
      .then((list) => {
        if (!cancelled) setImportExistingPool(list);
      })
      .catch(() => {
        if (!cancelled) setImportExistingPool(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isImportModalOpen, demoMode]);

  // Quick add shortcut: 'N' to open create modal (when not typing in inputs/modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick add modal (only if palette/modal aren't open and user isn't in an input)
      if (
        (e.key === 'n' || e.key === 'N') &&
        !isModalOpen &&
        !isCommandPaletteOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setFournisseurToEdit(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isCommandPaletteOpen]);

  // Handle Create or Update
  const handleSaveFournisseur = async (payload: FournisseurRequest) => {
    if (demoMode) {
      if (fournisseurToEdit) {
        const updated = mockStore.map((f) =>
          f.id === fournisseurToEdit.id
            ? {
                ...f,
                ...payload,
                telephone: payload.telephone || null,
                adresse: payload.adresse || null,
                updatedAt: new Date().toISOString(),
              }
            : f
        );
        setMockStore(updated);
        showToast('success', `Fournisseur "${payload.nom}" mis à jour avec succès (Démo) !`);
      } else {
        const newId = Math.max(...mockStore.map((f) => f.id), 0) + 1;
        if (payload.rating) {
          saveSupplierRating(newId, payload.rating);
        }
        const newSupplier: Fournisseur = {
          id: newId,
          nom: payload.nom,
          email: payload.email,
          telephone: payload.telephone || null,
          adresse: payload.adresse || null,
          rating: payload.rating,
          actif: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMockStore([newSupplier, ...mockStore]);
        showToast('success', `Fournisseur "${payload.nom}" créé avec succès (Démo) !`);
      }
      return;
    }

    if (fournisseurToEdit) {
      await fournisseurApi.updateFournisseur(fournisseurToEdit.id, payload);
      showToast('success', `Fournisseur "${payload.nom}" mis à jour avec succès !`);
    } else {
      const created = await fournisseurApi.createFournisseur(payload);
      if (payload.rating && created?.id) {
        saveSupplierRating(created.id, payload.rating);
      }
      showToast('success', `Fournisseur "${payload.nom}" enregistré avec succès !`);
    }
    triggerReload(true);
  };

  // Handle Deactivate / Reactivate with Custom Modal
  const handleToggleStatus = (fournisseur: Fournisseur) => {
    setConfirmModalConfig({
      isOpen: true,
      fournisseur,
    });
  };

  const handleConfirmToggleStatus = async () => {
    const fournisseur = confirmModalConfig.fournisseur;
    if (!fournisseur) return;
    setConfirmModalConfig({ isOpen: false, fournisseur: null });

    if (demoMode) {
      const updated = mockStore.map((f) =>
        f.id === fournisseur.id
          ? { ...f, actif: !f.actif, updatedAt: new Date().toISOString() }
          : f
      );
      setMockStore(updated);
      showToast(
        'success',
        `Fournisseur "${fournisseur.nom}" ${fournisseur.actif ? 'désactivé' : 'réactivé'} avec succès (Démo) !`
      );
      return;
    }

    try {
      if (fournisseur.actif) {
        await fournisseurApi.desactiverFournisseur(fournisseur.id);
        showToast('success', `Fournisseur "${fournisseur.nom}" désactivé.`);
      } else {
        await fournisseurApi.reactiverFournisseur(fournisseur.id);
        showToast('success', `Fournisseur "${fournisseur.nom}" réactivé.`);
      }
      triggerReload(true);
    } catch {
      showToast('error', `Échec lors du changement de statut de ${fournisseur.nom}`);
    }
  };

  const handleOpenEdit = (fournisseur: Fournisseur) => {
    setFournisseurToEdit(fournisseur);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setFournisseurToEdit(null);
    setIsModalOpen(true);
  };

  const handleViewCommandes = (fournisseur: Fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setIsDrawerOpen(true);
  };

  // Lazily fetch all filtered & sorted suppliers ONLY when Map View is active (Table/Cards stay paginated)
  useEffect(() => {
    if (viewMode !== 'map') {
      setMapFournisseurs([]);
      setMapLoading(false);
      return;
    }

    if (demoMode) {
      setMapFournisseurs(
        filterAndSortSuppliers(mockStore, {
          sortBy: queryState.sortBy,
          statusFilter: queryState.statusFilter,
          searchTerm: queryState.appliedSearch,
          cityFilter: queryState.cityFilter,
        })
      );
      setMapLoading(false);
      return;
    }

    const seq = ++mapRequestSeqRef.current;
    const controller = new AbortController();
    setMapLoading(true);

    fournisseurApi
      .getFournisseurs(buildApiFilterParams(queryState), controller.signal)
      .then((raw) => {
        if (controller.signal.aborted || seq !== mapRequestSeqRef.current) return;
        const filtered = filterAndSortSuppliers(Array.isArray(raw) ? raw : [], {
          sortBy: queryState.sortBy,
          statusFilter: queryState.statusFilter,
          searchTerm: queryState.appliedSearch,
          cityFilter: queryState.cityFilter,
        });
        setMapFournisseurs(filtered);
        checkBackendHealth();
        setMapLoading(false);
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          err?.name === 'AbortError' ||
          seq !== mapRequestSeqRef.current
        ) {
          return;
        }
        console.error('Failed to load map suppliers from backend:', err);
        setMapFournisseurs([]);
        showToast('error', 'Impossible de charger tous les fournisseurs sur la carte.');
        setMapLoading(false);
      });

    return () => controller.abort();
  }, [
    viewMode,
    demoMode,
    mockStore,
    queryState.statusFilter,
    queryState.sortBy,
    queryState.cityFilter,
    queryState.appliedSearch,
    refreshTick,
    showToast,
    checkBackendHealth,
  ]);

  const fetchAllMatchingForExport = useCallback(async (): Promise<Fournisseur[]> => {
    const effectiveSearch = searchTerm.trim();
    const effectiveQuery = {
      statusFilter: queryState.statusFilter,
      sortBy: queryState.sortBy,
      cityFilter: queryState.cityFilter,
      appliedSearch: effectiveSearch,
    };

    if (demoMode) {
      return filterAndSortSuppliers(mockStore, {
        sortBy: effectiveQuery.sortBy,
        statusFilter: effectiveQuery.statusFilter,
        searchTerm: effectiveQuery.appliedSearch,
        cityFilter: effectiveQuery.cityFilter,
      });
    }

    if (
      viewMode === 'map' &&
      !mapLoading &&
      effectiveSearch === queryState.appliedSearch &&
      mapFournisseurs.length > 0
    ) {
      return mapFournisseurs;
    }

    const raw = await fournisseurApi.getFournisseurs(buildApiFilterParams(effectiveQuery));
    return filterAndSortSuppliers(Array.isArray(raw) ? raw : [], {
      sortBy: effectiveQuery.sortBy,
      statusFilter: effectiveQuery.statusFilter,
      searchTerm: effectiveQuery.appliedSearch,
      cityFilter: effectiveQuery.cityFilter,
    });
  }, [
    demoMode,
    mockStore,
    searchTerm,
    queryState.statusFilter,
    queryState.sortBy,
    queryState.cityFilter,
    queryState.appliedSearch,
    viewMode,
    mapLoading,
    mapFournisseurs,
  ]);

  const handleExportCSV = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const list = await fetchAllMatchingForExport();
      if (list.length === 0) {
        showToast('error', 'Aucun fournisseur à exporter.');
        return;
      }
      const headers = ['ID', 'Nom', 'Email', 'Telephone', 'Adresse', 'Statut', 'DateCreation'];
      const rows = list.map((f) => [
        f.id,
        `"${f.nom.replace(/"/g, '""')}"`,
        `"${f.email}"`,
        `"${(f.telephone || '').replace(/"/g, '""')}"`,
        `"${(f.adresse || '').replace(/"/g, '""')}"`,
        f.actif ? 'Actif' : 'Inactif',
        f.createdAt,
      ]);
      const csvBody = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', blobUrl);
      link.setAttribute('download', `fournisseurs_procuraflow_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast('success', `${list.length} fournisseur(s) exporté(s) en CSV.`);
    } catch (err) {
      console.error('Erreur lors de l’export CSV du catalogue:', err);
      showToast('error', 'Échec de récupération des fournisseurs pour l’export CSV.');
    } finally {
      setExporting(false);
    }
  }, [exporting, fetchAllMatchingForExport, showToast]);

  const handleExportPDF = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      showToast('success', 'Génération du rapport PDF en cours...');
      const list = await fetchAllMatchingForExport();
      if (list.length === 0) {
        showToast('error', 'Aucun fournisseur à exporter.');
        return;
      }
      await exportCataloguePDF({
        fournisseurs: list,
        orderStats,
        statusFilter: queryState.statusFilter,
        cityFilter: queryState.cityFilter,
        searchTerm,
      });
      showToast('success', `Rapport PDF téléchargé (${list.length} fournisseur(s)) !`);
    } catch (err) {
      console.error('Erreur lors de l’export PDF du catalogue:', err);
      showToast('error', 'Échec de génération du rapport PDF.');
    } finally {
      setExporting(false);
    }
  }, [
    exporting,
    fetchAllMatchingForExport,
    orderStats,
    queryState.statusFilter,
    queryState.cityFilter,
    searchTerm,
    showToast,
  ]);

  // Dynamic registration of Fournisseurs commands for the global Ctrl+K palette
  const fournisseurCommands = useMemo<PaletteCommand[]>(() => {
    const list = demoMode ? mockStore : fournisseurs;
    const result: PaletteCommand[] = [];

    // Up to 8 suppliers
    list.slice(0, 8).forEach((f) => {
      const stats = orderStats[f.id];
      const rating = computeSupplierRating(f);
      result.push({
        id: `supplier-${f.id}`,
        category: 'Fournisseurs',
        title: f.nom,
        subtitle: `${f.email} • ID #${f.id}${f.adresse ? ` • ${f.adresse}` : ''}`,
        badge:
          stats && stats.activeOrders > 0
            ? `${stats.activeOrders} cde(s) • ${formatMAD(stats.totalOrderedAmount)}`
            : `${rating.score.toFixed(1)} ★`,
        badgeClass: f.actif
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
        icon: (
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
              f.actif
                ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {f.nom.slice(0, 2).toUpperCase()}
          </div>
        ),
        shortcut: 'Dossier',
        onSelect: () => handleViewCommandes(f),
      });
    });

    // Quick actions
    result.push({
      id: 'action-new-supplier',
      category: 'Actions Fournisseurs',
      title: 'Nouveau Fournisseur',
      subtitle: 'Ajouter un nouveau fournisseur au répertoire',
      icon: <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      shortcut: 'N',
      onSelect: handleOpenCreate,
    });

    result.push({
      id: 'action-export-csv',
      category: 'Actions Fournisseurs',
      title: 'Exporter le répertoire en CSV',
      subtitle: 'Télécharger les fournisseurs filtrés au format tableur',
      icon: <Download className="w-4 h-4 text-blue-500" />,
      shortcut: 'CSV',
      onSelect: handleExportCSV,
    });

    result.push({
      id: 'action-export-pdf',
      category: 'Actions Fournisseurs',
      title: 'Exporter le catalogue en PDF',
      subtitle: 'Générer un rapport officiel A4 paysage avec KPIs',
      icon: <FileText className="w-4 h-4 text-rose-500" />,
      shortcut: 'PDF',
      onSelect: handleExportPDF,
    });

    result.push({
      id: 'action-import',
      category: 'Actions Fournisseurs',
      title: 'Importer des fournisseurs (CSV / Excel)',
      subtitle: 'Importation en masse avec détection des doublons',
      icon: <Upload className="w-4 h-4 text-teal-500" />,
      shortcut: 'Import',
      onSelect: () => setIsImportModalOpen(true),
    });

    result.push({
      id: 'action-refresh',
      category: 'Actions Fournisseurs',
      title: 'Rafraîchir le catalogue',
      subtitle: 'Recharger les fournisseurs et les statistiques',
      icon: <RotateCw className="w-4 h-4 text-emerald-500" />,
      shortcut: 'Sync',
      onSelect: () => triggerReload(true),
    });

    // Views
    result.push({
      id: 'view-table',
      category: 'Affichage Fournisseurs',
      title: 'Vue Tableau d’entreprise',
      subtitle: 'Tableau compact avec pagination et actions',
      badge: viewMode === 'table' ? 'Actif' : undefined,
      icon: <List className="w-4 h-4 text-slate-500" />,
      onSelect: () => setViewMode('table'),
    });

    result.push({
      id: 'view-grid',
      category: 'Affichage Fournisseurs',
      title: 'Vue Grille de Cartes',
      subtitle: 'Cartes visuelles avec badges et notation',
      badge: viewMode === 'grid' ? 'Actif' : undefined,
      icon: <LayoutGrid className="w-4 h-4 text-slate-500" />,
      onSelect: () => setViewMode('grid'),
    });

    result.push({
      id: 'view-map',
      category: 'Affichage Fournisseurs',
      title: 'Vue Carte Interactive (OpenStreetMap)',
      subtitle: 'Géolocalisation des fournisseurs sur la carte du Maroc',
      badge: viewMode === 'map' ? 'Actif' : undefined,
      icon: <MapIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      onSelect: () => setViewMode('map'),
    });

    // Filters
    result.push({
      id: 'filter-active',
      category: 'Filtres Fournisseurs',
      title: 'Fournisseurs Actifs uniquement',
      subtitle: 'Afficher uniquement les fournisseurs éligibles',
      badge: queryState.statusFilter === 'active' ? 'Sélectionné' : undefined,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      onSelect: () => handleStatusFilterChange('active'),
    });

    result.push({
      id: 'filter-inactive',
      category: 'Filtres Fournisseurs',
      title: 'Fournisseurs Inactifs uniquement',
      subtitle: 'Afficher uniquement les fournisseurs suspendus',
      badge: queryState.statusFilter === 'inactive' ? 'Sélectionné' : undefined,
      icon: <XCircle className="w-4 h-4 text-rose-500" />,
      onSelect: () => handleStatusFilterChange('inactive'),
    });

    globalStats.villes.slice(0, 5).forEach((city) => {
      result.push({
        id: `filter-city-${city}`,
        category: 'Filtres par Ville',
        title: `Ville : ${city}`,
        subtitle: `Filtrer les fournisseurs à ${city}`,
        badge: queryState.cityFilter === city ? 'Sélectionné' : undefined,
        icon: <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        onSelect: () => handleCityFilterChange(city),
      });
    });

    return result;
  }, [
    demoMode,
    mockStore,
    fournisseurs,
    orderStats,
    handleViewCommandes,
    handleOpenCreate,
    handleExportCSV,
    handleExportPDF,
    triggerReload,
    viewMode,
    setViewMode,
    queryState.statusFilter,
    handleStatusFilterChange,
    globalStats.villes,
    queryState.cityFilter,
    handleCityFilterChange,
  ]);

  useRegisterCommands('fournisseurs', fournisseurCommands);

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10">
      {/* Page Header with Shared Component */}
      <PageHeader
        badge={
          <div className="inline-flex items-center space-x-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
            </span>
            <span>Gestion des Achats & Approvisionnements</span>
          </div>
        }
        title="Répertoire des Fournisseurs"
        description="Consultez les fiches fournisseurs, gérez l'éligibilité aux consultations et explorez l'historique complet des bons de commande."
      />

      {/* Stats Cards (Interactive Click-to-filter, computed globally) */}
      <StatsBar
        stats={globalStats}
        avgRating={demoMode ? demoAvgRating : null}
        currentStatusFilter={queryState.statusFilter}
        onSelectStatusFilter={handleStatusFilterChange}
      />

      {/* Search, Filter & View Controls */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={queryState.statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        sortBy={queryState.sortBy}
        onSortChange={handleSortChange}
        cityFilter={queryState.cityFilter}
        onCityFilterChange={handleCityFilterChange}
        availableCities={allAvailableCities}
        totalCount={globalStats.total}
        activeCount={globalStats.actifs}
        inactiveCount={globalStats.inactifs}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenCreateModal={handleOpenCreate}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onRefresh={() => triggerReload(true)}
        onClearAllFilters={handleClearAllFilters}
        loading={loading || (viewMode === 'map' && mapLoading)}
        exporting={exporting}
        exportTotalCount={totalElements}
        fournisseursToExport={fournisseurs}
      />

      {/* Data View (Table, Grid Cards, or Interactive Map) */}
      {viewMode === 'table' ? (
        <>
          <FournisseurTable
            fournisseurs={fournisseurs}
            loading={loading}
            error={pageError}
            onRetry={() => triggerReload(true)}
            batchKey={animationState.batchKey}
            isAnimatingEntrance={animationState.active}
            orderStats={orderStats}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
            onViewCommandes={handleViewCommandes}
            onCityFilter={handleCityFilterChange}
            onNotify={showToast}
          />
          {!(pageError && fournisseurs.length === 0) && (
            <PaginationBar
              page={queryState.page}
              size={queryState.size}
              totalElements={totalElements}
              totalPages={totalPages}
              currentCount={fournisseurs.length}
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      ) : viewMode === 'grid' ? (
        <>
          <FournisseurCards
            fournisseurs={fournisseurs}
            loading={loading}
            error={pageError}
            onRetry={() => triggerReload(true)}
            batchKey={animationState.batchKey}
            isAnimatingEntrance={animationState.active}
            orderStats={orderStats}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
            onViewCommandes={handleViewCommandes}
          />
          {!(pageError && fournisseurs.length === 0) && (
            <PaginationBar
              page={queryState.page}
              size={queryState.size}
              totalElements={totalElements}
              totalPages={totalPages}
              currentCount={fournisseurs.length}
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      ) : (
        <Suspense
          fallback={
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 h-[580px] flex items-center justify-center shadow-sm">
              <div className="flex items-center space-x-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Chargement de la carte interactive OpenStreetMap...</span>
              </div>
            </div>
          }
        >
          <FournisseurMap
            fournisseurs={mapFournisseurs}
            loading={mapLoading}
            isDarkMode={isDarkMode}
            orderStats={orderStats}
            onEdit={handleOpenEdit}
            onViewCommandes={handleViewCommandes}
            onNotify={showToast}
          />
        </Suspense>
      )}

      {/* Modal Create / Edit */}
      <FournisseurModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveFournisseur}
        fournisseurToEdit={fournisseurToEdit}
        customCities={allAvailableCities}
      />

      {/* Confirmation Modal (Activate / Deactivate) */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={
          confirmModalConfig.fournisseur?.actif
            ? 'Désactiver le fournisseur'
            : 'Réactiver le fournisseur'
        }
        message={
          confirmModalConfig.fournisseur?.actif
            ? 'Êtes-vous sûr de vouloir désactiver ce fournisseur ? Ses coordonnées et l’historique de ses commandes seront intégralement conservés.'
            : 'Êtes-vous sûr de vouloir réactiver ce fournisseur ? Il sera de nouveau éligible et disponible pour l’émission de bons de commande.'
        }
        supplierName={confirmModalConfig.fournisseur?.nom}
        variant={confirmModalConfig.fournisseur?.actif ? 'danger' : 'success'}
        confirmLabel={
          confirmModalConfig.fournisseur?.actif
            ? 'Désactiver le fournisseur'
            : 'Réactiver le fournisseur'
        }
        cancelLabel="Conserver l'état actuel"
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setConfirmModalConfig({ isOpen: false, fournisseur: null })}
      />

      {/* Drawer Commandes History */}
      <CommandesDrawer
        fournisseur={selectedFournisseur}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        demoMode={demoMode}
      />

      {/* Import Modal (CSV / Excel) */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingFournisseurs={demoMode ? mockStore : importExistingPool ?? fournisseurs}
        onSaveSupplier={handleSaveFournisseur}
        onImportSuccess={(count) => {
          triggerReload(true);
          showToast('success', `${count} fournisseur(s) importé(s) avec succès !`);
        }}
      />

      {/* Stacked Animated Modern Toasts */}
      <Toast toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};
