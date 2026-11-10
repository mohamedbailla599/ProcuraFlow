import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { FilterBar, SortOption } from './components/FilterBar';
import { FournisseurTable } from './components/FournisseurTable';
import { FournisseurCards } from './components/FournisseurCards';
import { FournisseurModal } from './components/FournisseurModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CommandesDrawer } from './components/CommandesDrawer';
import { Toast, ToastMessage } from './components/Toast';
import { Fournisseur, FournisseurRequest, FilterParams } from './types/fournisseur';
import {
  fournisseurApi,
  INITIAL_MOCK_FOURNISSEURS,
  MOCK_COMMANDES,
} from './api/fournisseurApi';

// Helper to extract city name from address
const extractCity = (adresse?: string | null): string => {
  if (!adresse) return '';
  const normalized = adresse.trim();
  const knownCities = [
    'Agadir',
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Tanger',
    'Fès',
    'Meknès',
    'Oujda',
    'Kenitra',
    'Tétouan',
    'Salé',
    'Paris',
    'Lyon',
    'Marseille',
  ];
  for (const city of knownCities) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(normalized)) {
      return city;
    }
  }
  const parts = normalized.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 2].replace(/\d+/g, '').trim();
  }
  return parts[0] || '';
};

export default function App() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [allFournisseurs, setAllFournisseurs] = useState<Fournisseur[]>([]);
  const [mockStore, setMockStore] = useState<Fournisseur[]>(INITIAL_MOCK_FOURNISSEURS);
  const [loading, setLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // View mode (table or grid)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [commandCounts, setCommandCounts] = useState<Record<number, number>>({});

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fournisseurToEdit, setFournisseurToEdit] = useState<Fournisseur | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    fournisseur: Fournisseur | null;
  }>({
    isOpen: false,
    fournisseur: null,
  });

  // Notifications
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Theme (Dark / Light mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('procuraflow-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try {
        localStorage.setItem('procuraflow-theme', 'dark');
      } catch {
        // ignore
      }
    } else {
      root.classList.remove('dark');
      try {
        localStorage.setItem('procuraflow-theme', 'light');
      } catch {
        // ignore
      }
    }
  }, [isDarkMode]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ id: String(Date.now()), type, text });
  };

  // Check Spring Boot backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      await fournisseurApi.checkHealth();
      setIsBackendHealthy(true);
    } catch {
      setIsBackendHealthy(false);
    }
  }, []);

  // Dynamic available cities extracted from existing suppliers
  const availableCities = useMemo(() => {
    const pool = demoMode ? mockStore : allFournisseurs.length > 0 ? allFournisseurs : fournisseurs;
    const citiesSet = new Set<string>();
    pool.forEach((f) => {
      const city = extractCity(f.adresse);
      if (city && city.length > 1) {
        citiesSet.add(city);
      }
    });
    return Array.from(citiesSet).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [demoMode, mockStore, allFournisseurs, fournisseurs]);

  // Status counts for tabs
  const currentPool = demoMode ? mockStore : allFournisseurs.length > 0 ? allFournisseurs : fournisseurs;
  const totalCount = currentPool.length;
  const activeCount = currentPool.filter((f) => f.actif).length;
  const inactiveCount = currentPool.filter((f) => !f.actif).length;

  // Sorting helper
  const applySort = useCallback(
    (list: Fournisseur[], sort: SortOption, counts: Record<number, number>) => {
      const copy = [...list];
      copy.sort((a, b) => {
        switch (sort) {
          case 'name-asc':
            return a.nom.localeCompare(b.nom, 'fr');
          case 'name-desc':
            return b.nom.localeCompare(a.nom, 'fr');
          case 'commands-desc':
            return (counts[b.id] || 0) - (counts[a.id] || 0);
          case 'date-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'id-asc':
            return a.id - b.id;
          default:
            return 0;
        }
      });
      return copy;
    },
    []
  );

  // Fetch suppliers list
  const loadFournisseurs = useCallback(async () => {
    setLoading(true);

    if (demoMode) {
      const counts: Record<number, number> = {};
      mockStore.forEach((f) => {
        counts[f.id] = MOCK_COMMANDES[f.id]?.length || 0;
      });
      setCommandCounts(counts);

      let filtered = [...mockStore];
      if (statusFilter === 'active') {
        filtered = filtered.filter((f) => f.actif);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((f) => !f.actif);
      }
      if (cityFilter !== 'all') {
        filtered = filtered.filter(
          (f) => extractCity(f.adresse).toLowerCase() === cityFilter.toLowerCase()
        );
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (f) =>
            f.nom.toLowerCase().includes(query) ||
            f.email.toLowerCase().includes(query) ||
            (f.telephone && f.telephone.toLowerCase().includes(query)) ||
            (f.adresse && f.adresse.toLowerCase().includes(query))
        );
      }

      setFournisseurs(applySort(filtered, sortBy, counts));
      setLoading(false);
      return;
    }

    try {
      const params: FilterParams = {};
      if (statusFilter === 'active') {
        params.actif = true;
      } else if (statusFilter === 'inactive') {
        params.actif = false;
      } else {
        params.includeInactive = true;
      }

      const [data, fullList] = await Promise.all([
        fournisseurApi.getFournisseurs(params),
        fournisseurApi.getFournisseurs({ includeInactive: true }),
      ]);

      setAllFournisseurs(fullList);

      // Background command count loading without blocking
      fullList.forEach(async (f) => {
        try {
          const cmds = await fournisseurApi.getCommandes(f.id);
          setCommandCounts((prev) => ({ ...prev, [f.id]: cmds.length }));
        } catch {
          // If microservice 8082 is down, ignore
        }
      });

      let filtered = data;
      if (cityFilter !== 'all') {
        filtered = filtered.filter(
          (f) => extractCity(f.adresse).toLowerCase() === cityFilter.toLowerCase()
        );
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (f) =>
            f.nom.toLowerCase().includes(query) ||
            f.email.toLowerCase().includes(query) ||
            (f.telephone && f.telephone.toLowerCase().includes(query)) ||
            (f.adresse && f.adresse.toLowerCase().includes(query))
        );
      }

      setFournisseurs(applySort(filtered, sortBy, commandCounts));
      setIsBackendHealthy(true);
    } catch (err) {
      console.error('Failed to load suppliers from backend:', err);
      setIsBackendHealthy(false);
      showToast(
        'error',
        'Backend Spring Boot inaccessible sur :8081. Vous pouvez basculer en "Mode Démo" pour tester l\'interface.'
      );
    } finally {
      setLoading(false);
    }
  }, [demoMode, mockStore, statusFilter, searchTerm, cityFilter, sortBy, commandCounts, applySort]);

  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  useEffect(() => {
    loadFournisseurs();
  }, [loadFournisseurs]);

  // Global keyboard shortcut 'N' to open create modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !isModalOpen &&
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
  }, [isModalOpen]);

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
        const newSupplier: Fournisseur = {
          id: newId,
          nom: payload.nom,
          email: payload.email,
          telephone: payload.telephone || null,
          adresse: payload.adresse || null,
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
      await fournisseurApi.createFournisseur(payload);
      showToast('success', `Fournisseur "${payload.nom}" enregistré avec succès !`);
    }
    loadFournisseurs();
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
      loadFournisseurs();
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950/20 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        isBackendHealthy={isBackendHealthy}
        demoMode={demoMode}
        onToggleDemoMode={() => {
          setDemoMode((prev) => !prev);
          showToast('success', !demoMode ? 'Mode Démo activé.' : 'Mode API Réel activé.');
        }}
        onRefreshHealth={checkBackendHealth}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          setIsDarkMode((prev) => {
            const next = !prev;
            showToast('success', next ? 'Mode Sombre activé.' : 'Mode Clair activé.');
            return next;
          });
        }}
        onOpenCreateModal={handleOpenCreate}
      />

      {/* Main Container: Wide, Spacious & Responsive Enterprise Layout */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-7">
        {/* Hero Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center space-x-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full mb-2.5 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
              </span>
              <span>Gestion des Achats & Approvisionnements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Répertoire des Fournisseurs
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Consultez les fiches fournisseurs, gérez l'éligibilité aux consultations et explorez l'historique complet des bons de commande.
            </p>
          </div>
        </div>

        {/* Stats Cards (Interactive Click-to-filter) */}
        <StatsBar
          fournisseurs={demoMode ? mockStore : (allFournisseurs.length > 0 ? allFournisseurs : fournisseurs)}
          currentStatusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
        />

        {/* Search, Filter & View Controls */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          cityFilter={cityFilter}
          onCityFilterChange={setCityFilter}
          availableCities={availableCities}
          totalCount={totalCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenCreateModal={handleOpenCreate}
          onRefresh={loadFournisseurs}
          loading={loading}
          fournisseursToExport={fournisseurs}
        />

        {/* Data View (Table or Grid Cards) */}
        {viewMode === 'table' ? (
          <FournisseurTable
            fournisseurs={fournisseurs}
            loading={loading}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
            onViewCommandes={handleViewCommandes}
          />
        ) : (
          <FournisseurCards
            fournisseurs={fournisseurs}
            loading={loading}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
            onViewCommandes={handleViewCommandes}
          />
        )}
      </main>

      {/* Modal Create / Edit */}
      <FournisseurModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveFournisseur}
        fournisseurToEdit={fournisseurToEdit}
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

      {/* Floating Animated Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
