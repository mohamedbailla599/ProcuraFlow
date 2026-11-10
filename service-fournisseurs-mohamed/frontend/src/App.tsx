import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { FournisseurTable } from './components/FournisseurTable';
import { FournisseurCards } from './components/FournisseurCards';
import { FournisseurModal } from './components/FournisseurModal';
import { CommandesDrawer } from './components/CommandesDrawer';
import { Toast, ToastMessage } from './components/Toast';
import { Fournisseur, FournisseurRequest, FilterParams } from './types/fournisseur';
import {
  fournisseurApi,
  INITIAL_MOCK_FOURNISSEURS,
} from './api/fournisseurApi';

export default function App() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [mockStore, setMockStore] = useState<Fournisseur[]>(INITIAL_MOCK_FOURNISSEURS);
  const [loading, setLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // View mode (table or grid)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fournisseurToEdit, setFournisseurToEdit] = useState<Fournisseur | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Notifications
  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  // Fetch suppliers list
  const loadFournisseurs = useCallback(async () => {
    setLoading(true);

    if (demoMode) {
      let filtered = [...mockStore];
      if (statusFilter === 'active') {
        filtered = filtered.filter((f) => f.actif);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((f) => !f.actif);
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (f) =>
            f.nom.toLowerCase().includes(query) ||
            f.email.toLowerCase().includes(query)
        );
      }
      setFournisseurs(filtered);
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

      if (searchTerm.trim()) {
        params.nom = searchTerm.trim();
      }

      const data = await fournisseurApi.getFournisseurs(params);
      setFournisseurs(data);
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
  }, [demoMode, mockStore, statusFilter, searchTerm]);

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

  // Handle Deactivate / Reactivate
  const handleToggleStatus = async (fournisseur: Fournisseur) => {
    const actionName = fournisseur.actif ? 'désactiver' : 'réactiver';
    const confirmMessage = `Êtes-vous sûr de vouloir ${actionName} le fournisseur "${fournisseur.nom}" ?`;
    if (!window.confirm(confirmMessage)) return;

    if (demoMode) {
      const updated = mockStore.map((f) =>
        f.id === fournisseur.id
          ? { ...f, actif: !f.actif, updatedAt: new Date().toISOString() }
          : f
      );
      setMockStore(updated);
      showToast(
        'success',
        `Fournisseur ${fournisseur.nom} ${fournisseur.actif ? 'désactivé' : 'réactivé'} avec succès (Démo) !`
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/20 text-slate-800">
      {/* Top Navbar */}
      <Navbar
        isBackendHealthy={isBackendHealthy}
        demoMode={demoMode}
        onToggleDemoMode={() => {
          setDemoMode((prev) => !prev);
          showToast('success', !demoMode ? 'Mode Démo activé.' : 'Mode API Réel activé.');
        }}
        onRefreshHealth={checkBackendHealth}
        onOpenCreateModal={handleOpenCreate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full mb-2 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              <span>Gestion des Achats & Approvisionnements</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Répertoire des Fournisseurs
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Consultez les fiches fournisseurs, vérifiez l'éligibilité et explorez l'historique des bons de commande émis via le microservice Commandes.
            </p>
          </div>
        </div>

        {/* Stats Cards (Interactive Click-to-filter) */}
        <StatsBar
          fournisseurs={demoMode ? mockStore : fournisseurs}
          currentStatusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
        />

        {/* Search, Filter & View Controls */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenCreateModal={handleOpenCreate}
          onRefresh={loadFournisseurs}
          loading={loading}
          totalFiltered={fournisseurs.length}
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
