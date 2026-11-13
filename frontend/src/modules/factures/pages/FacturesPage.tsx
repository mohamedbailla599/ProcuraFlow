import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt,
  Plus,
  RotateCw,
  FileDown,
  Download,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { Toast, ToastMessage } from '../../../components/Toast';

import {
  Facture,
  FactureFormData,
  FactureStatusFilter,
  FactureSortOption,
  FactureViewMode,
  StatutPaiement,
} from '../types';
import {
  factureApi,
  INITIAL_MOCK_FACTURES,
} from '../api';
import {
  computeFactureStats,
  exportFacturesCSV,
  exportFacturesPDF,
  formatMAD,
} from '../utils';

import {
  FactureStatsBar,
  FactureFilterBar,
  FactureTable,
  FactureCards,
  FactureModal,
  FactureDrawer,
} from '../components';

export const FacturesPage: React.FC = () => {
  // Factures state
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Filters & display state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FactureStatusFilter>('all');
  const [sortBy, setSortBy] = useState<FactureSortOption>('date_desc');
  const [viewMode, setViewMode] = useState<FactureViewMode>('table');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [factureToEdit, setFactureToEdit] = useState<Facture | null>(null);
  const [selectedFactureForDrawer, setSelectedFactureForDrawer] = useState<Facture | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'success' | 'warning';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmer',
    variant: 'danger',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
      const id = String(Date.now() + Math.random());
      setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    },
    []
  );

  const handleCloseToast = useCallback((id?: string) => {
    if (!id) {
      setToasts([]);
    } else {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  // Fetch factures from backend or fallback to mock
  const loadFactures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await factureApi.getFactures();

      if (Array.isArray(data)) {
        setFactures(data);
        setIsLiveBackend(true);
      } else {
        setFactures(INITIAL_MOCK_FACTURES);
        setIsLiveBackend(false);
      }
    } catch (err: any) {
      console.warn('Backend service-factures-hamza non joignable, bascule en mode Démo :', err);
      setFactures(INITIAL_MOCK_FACTURES);
      setIsLiveBackend(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  // Compute live stats
  const stats = useMemo(() => computeFactureStats(factures), [factures]);

  // Filter and sort factures
  const filteredFactures = useMemo(() => {
    let list = [...factures];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((f) => f.statut_paiement === statusFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => {
        const refMatch = (f.numero_facture || '').toLowerCase().includes(q);
        const idMatch = String(f.id).includes(q);
        const cmdMatch = String(f.commande_id).includes(q);
        const recMatch = String(f.reception_id).includes(q);
        const montantMatch = String(f.montant_facture).includes(q);
        return refMatch || idMatch || cmdMatch || recMatch || montantMatch;
      });
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date_facture).getTime() - new Date(b.date_facture).getTime();
        case 'date_desc':
          return new Date(b.date_facture).getTime() - new Date(a.date_facture).getTime();
        case 'montant_asc':
          return Number(a.montant_facture) - Number(b.montant_facture);
        case 'montant_desc':
          return Number(b.montant_facture) - Number(a.montant_facture);
        case 'id_desc':
          return Number(b.id) - Number(a.id);
        default:
          return 0;
      }
    });

    return list;
  }, [factures, statusFilter, searchQuery, sortBy]);

  // Handlers for CRUD operations
  const handleCreateFacture = () => {
    setFactureToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditFacture = (facture: Facture) => {
    setFactureToEdit(facture);
    setIsModalOpen(true);
  };

  const handleViewDetails = (facture: Facture) => {
    setSelectedFactureForDrawer(facture);
    setIsDrawerOpen(true);
  };

  // Save (Create or Update)
  const handleSaveFacture = async (formData: FactureFormData) => {
    try {
      if (factureToEdit) {
        // Update
        if (isLiveBackend) {
          const updated = await factureApi.updateFacture(factureToEdit.id, formData);
          if (updated) {
            setFactures((prev) =>
              prev.map((f) => (f.id === factureToEdit.id ? updated : f))
            );
          }
        } else {
          // Local update
          setFactures((prev) =>
            prev.map((f) =>
              f.id === factureToEdit.id
                ? {
                    ...f,
                    commande_id: Number(formData.commande_id),
                    reception_id: Number(formData.reception_id),
                    montant_facture: Number(formData.montant_facture),
                    date_facture: formData.date_facture || f.date_facture,
                    statut_paiement: formData.statut_paiement || f.statut_paiement,
                    numero_facture: formData.numero_facture || f.numero_facture,
                    updated_at: new Date().toISOString(),
                  }
                : f
            )
          );
        }
        showToast('success', `Facture mise à jour avec succès`);
      } else {
        // Create
        if (isLiveBackend) {
          const created = await factureApi.createFacture(formData);
          if (created) {
            setFactures((prev) => [created, ...prev]);
          }
        } else {
          // Local create
          const newId = Math.max(0, ...factures.map((f) => Number(f.id))) + 1;
          const newFac: Facture = {
            id: newId,
            commande_id: Number(formData.commande_id),
            reception_id: Number(formData.reception_id),
            montant_facture: Number(formData.montant_facture),
            date_facture: formData.date_facture || new Date().toISOString(),
            statut_paiement: formData.statut_paiement || 'NON_PAYEE',
            numero_facture:
              formData.numero_facture ||
              `FAC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setFactures((prev) => [newFac, ...prev]);
        }
        showToast('success', `Facture enregistrée et rapprochée avec succès`);
      }
    } catch (err: any) {
      showToast('error', err.message || "Erreur lors de l'enregistrement");
      throw err;
    }
  };

  // Toggle payment status
  const handleTogglePaiement = (facture: Facture) => {
    const isPaying = facture.statut_paiement !== 'PAYEE';
    const targetStatus: StatutPaiement = isPaying ? 'PAYEE' : 'NON_PAYEE';

    setConfirmConfig({
      isOpen: true,
      title: isPaying ? 'Confirmer le règlement' : 'Rétablir en impayée',
      message: isPaying
        ? `Voulez-vous marquer la facture ${
            facture.numero_facture || `#${facture.id}`
          } d’un montant de ${formatMAD(facture.montant_facture)} comme PAYÉE ?`
        : `Voulez-vous repasser la facture ${
            facture.numero_facture || `#${facture.id}`
          } au statut NON PAYÉE ?`,
      confirmLabel: isPaying ? 'Valider le paiement' : 'Rétablir statut',
      variant: isPaying ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          if (isLiveBackend) {
            const updated = await factureApi.updatePaiement(facture.id, targetStatus);
            if (updated) {
              setFactures((prev) =>
                prev.map((f) => (f.id === facture.id ? updated : f))
              );
              if (selectedFactureForDrawer?.id === facture.id) {
                setSelectedFactureForDrawer(updated);
              }
            }
          } else {
            // Local state update
            const updated: Facture = {
              ...facture,
              statut_paiement: targetStatus,
              updated_at: new Date().toISOString(),
            };
            setFactures((prev) =>
              prev.map((f) => (f.id === facture.id ? updated : f))
            );
            if (selectedFactureForDrawer?.id === facture.id) {
              setSelectedFactureForDrawer(updated);
            }
          }

          showToast(
            'success',
            isPaying
              ? `Facture ${facture.numero_facture || `#${facture.id}`} marquée comme PAYÉE !`
              : `Facture ${facture.numero_facture || `#${facture.id}`} rétablie à NON PAYÉE`
          );
        } catch (err: any) {
          showToast('error', err.message || 'Erreur lors du changement de statut');
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete invoice
  const handleDeleteFacture = (facture: Facture) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Supprimer la facture',
      message: `Êtes-vous sûr de vouloir supprimer définitivement la facture ${
        facture.numero_facture || `#${facture.id}`
      } (${formatMAD(facture.montant_facture)}) ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer définitivement',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (isLiveBackend) {
            await factureApi.deleteFacture(facture.id);
          }
          setFactures((prev) => prev.filter((f) => f.id !== facture.id));
          if (selectedFactureForDrawer?.id === facture.id) {
            setIsDrawerOpen(false);
          }
          showToast('success', 'Facture supprimée avec succès');
        } catch (err: any) {
          showToast('error', err.message || 'Erreur lors de la suppression');
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Export handlers
  const handleExportCSV = () => {
    if (filteredFactures.length === 0) {
      showToast('warning', 'Aucune facture à exporter');
      return;
    }
    exportFacturesCSV(filteredFactures);
    showToast('success', `${filteredFactures.length} facture(s) exportée(s) en CSV`);
  };

  const handleExportPDF = () => {
    if (filteredFactures.length === 0) {
      showToast('warning', 'Aucune facture à exporter');
      return;
    }
    exportFacturesPDF(filteredFactures);
    showToast('success', `Rapport PDF généré pour ${filteredFactures.length} facture(s)`);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-5 animate-fade-in-up">
      {/* Page Header */}
      <PageHeader
        badge={
          isLiveBackend ? (
            <Badge variant="success" dot size="sm">
              Connecté :8084 • Neon DB
            </Badge>
          ) : (
            <Badge variant="warning" dot size="sm">
              Mode Démo • Port :8084
            </Badge>
          )
        }
        title="Gestion & Rapprochement des Factures"
        description="Enregistrement des factures fournisseurs, contrôle de conformité financière et rapprochement à 3 voies (Commande - Réception - Facture)."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={loadFactures}
              disabled={loading}
              title="Actualiser les données"
            >
              <span className="hidden sm:inline">Actualiser</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportCSV}
              title="Exporter en CSV"
            >
              <span className="hidden sm:inline">CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<FileDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              title="Générer Rapport PDF"
            >
              <span className="hidden sm:inline">PDF</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreateFacture}
            >
              Nouvelle Facture
            </Button>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <FactureStatsBar
        stats={stats}
        currentFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* Filter and Control Bar */}
      <FactureFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadFactures}
        onCreateFacture={handleCreateFacture}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        totalCount={factures.length}
        filteredCount={filteredFactures.length}
        isRefreshing={loading}
      />

      {/* Main Content: Table or Cards view */}
      {viewMode === 'table' ? (
        <FactureTable
          factures={filteredFactures}
          loading={loading}
          error={error}
          onRetry={loadFactures}
          onViewDetails={handleViewDetails}
          onEdit={handleEditFacture}
          onDelete={handleDeleteFacture}
          onTogglePaiement={handleTogglePaiement}
        />
      ) : (
        <FactureCards
          factures={filteredFactures}
          loading={loading}
          error={error}
          onRetry={loadFactures}
          onViewDetails={handleViewDetails}
          onEdit={handleEditFacture}
          onDelete={handleDeleteFacture}
          onTogglePaiement={handleTogglePaiement}
        />
      )}

      {/* Create / Edit Modal */}
      <FactureModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFactureToEdit(null);
        }}
        onSubmit={handleSaveFacture}
        factureToEdit={factureToEdit}
      />

      {/* Invoice Details Drawer */}
      <FactureDrawer
        facture={selectedFactureForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedFactureForDrawer(null);
        }}
        onTogglePaiement={handleTogglePaiement}
        onEdit={(facture) => {
          setIsDrawerOpen(false);
          handleEditFacture(facture);
        }}
      />

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Stacked Toasts */}
      <Toast toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
};
