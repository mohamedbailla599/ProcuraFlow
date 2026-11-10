import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { FournisseurTable } from './components/FournisseurTable';
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

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

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
      // Auto fallback recommendation
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

  // Handle Create or Update
  const handleSaveFournisseur = async (payload: FournisseurRequest) => {
    if (demoMode) {
      if (fournisseurToEdit) {
        // Update mock
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
        // Create mock
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

    // Real API mode
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

  // Open Edit Modal
  const handleOpenEdit = (fournisseur: Fournisseur) => {
    setFournisseurToEdit(fournisseur);
    setIsModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFournisseurToEdit(null);
    setIsModalOpen(true);
  };

  // Open Commandes Drawer
  const handleViewCommandes = (fournisseur: Fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navigation Header */}
      <Navbar
        isBackendHealthy={isBackendHealthy}
        demoMode={demoMode}
        onToggleDemoMode={() => {
          setDemoMode((prev) => !prev);
          showToast('success', !demoMode ? 'Mode Démo activé.' : 'Mode API Réel activé.');
        }}
        onRefreshHealth={checkBackendHealth}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title and introduction */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Répertoire des Fournisseurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les fiches fournisseurs, vérifiez l'éligibilité et consultez l'historique des bons de commande.
          </p>
        </div>

        {/* Summary Stats */}
        <StatsBar fournisseurs={demoMode ? mockStore : fournisseurs} />

        {/* Search & Filter Bar */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenCreateModal={handleOpenCreate}
          onRefresh={loadFournisseurs}
          loading={loading}
        />

        {/* Main Suppliers Table */}
        <FournisseurTable
          fournisseurs={fournisseurs}
          loading={loading}
          onEdit={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
          onViewCommandes={handleViewCommandes}
        />
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

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

