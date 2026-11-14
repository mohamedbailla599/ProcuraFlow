import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import {
  Plus,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Package,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  X,
  Building2,
  Calendar,
  Hash,
  BarChart3,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';
import {
  getAllCommandes,
  getCommandesByFournisseur,
  createCommande,
  updateCommande,
  updateCommandeStatut,
  deleteCommande,
} from '../api';
import { Commande, LigneCommande } from '../types';
import { formatMontant, formatDate } from '../utils';

type StatusFilter = 'ALL' | 'EN_ATTENTE' | 'VALIDEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
type SortOption = 'date-desc' | 'date-asc' | 'montant-desc' | 'montant-asc';

const WORKFLOW_STEPS = ['EN_ATTENTE', 'VALIDEE', 'EN_COURS', 'LIVREE'] as const;
const ITEMS_PER_PAGE = 5;

export const CommandesPage: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Liste des fournisseurs pour le sélecteur interactif & affichage enrichi
  const [fournisseursList, setFournisseursList] = useState<any[]>([]);

  // Filtres, Tri & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fournisseurFilter, setFournisseurFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Mode Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);

  // Formulaire nouvelle / modification commande
  const [fournisseurId, setFournisseurId] = useState<number>(1);
  const [lignes, setLignes] = useState<Omit<LigneCommande, 'id'>[]>([
    { designation: '', quantite: 1, prixUnitaire: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadCommandes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = fournisseurFilter.trim()
        ? await getCommandesByFournisseur(Number(fournisseurFilter))
        : await getAllCommandes();
      setCommandes(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de joindre le service Commandes (:8082)');
    } finally {
      setLoading(false);
    }
  };

  const loadFournisseurs = () => {
    fetch('/api/fournisseurs?includeInactive=true')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list = data.content || data;
        setFournisseursList(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setFournisseursList([]);
      });
  };

  useEffect(() => {
    loadCommandes();
    loadFournisseurs();
  }, []);

  useEffect(() => {
    if (isModalOpen && fournisseursList.length === 0) {
      loadFournisseurs();
    }
  }, [isModalOpen]);

  // Réinitialiser la page courante lorsqu'on filtre ou recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, fournisseurFilter]);

  const getFournisseurLabel = (id: number) => {
    const found = fournisseursList.find((f) => Number(f.id) === Number(id));
    return found ? `${found.nom}` : `Fournisseur #${id}`;
  };

  // Calcul des KPI en temps réel
  const kpiStats = useMemo(() => {
    const total = commandes.length;
    const enAttente = commandes.filter((c) => c.statut === 'EN_ATTENTE').length;
    const valideesOuLivrees = commandes.filter(
      (c) => c.statut === 'VALIDEE' || c.statut === 'LIVREE' || c.statut === 'EN_COURS'
    ).length;
    const montantEngage = commandes
      .filter((c) => c.statut !== 'ANNULEE')
      .reduce((sum, c) => sum + (c.montantTotal || 0), 0);

    return { total, enAttente, valideesOuLivrees, montantEngage };
  }, [commandes]);

  // Filtrage et tri côté client
  const filteredCommandes = useMemo(() => {
    return commandes
      .filter((cmd) => {
        if (statusFilter !== 'ALL' && cmd.statut !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = `#${cmd.id}`.includes(q) || String(cmd.id).includes(q);
          const matchFournisseur =
            `fournisseur #${cmd.fournisseurId}`.includes(q) ||
            String(cmd.fournisseurId).includes(q) ||
            getFournisseurLabel(cmd.fournisseurId).toLowerCase().includes(q);
          const matchArticle = cmd.lignesCommande?.some((l) =>
            l.designation.toLowerCase().includes(q)
          );
          if (!matchId && !matchFournisseur && !matchArticle) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'montant-desc':
            return (b.montantTotal || 0) - (a.montantTotal || 0);
          case 'montant-asc':
            return (a.montantTotal || 0) - (b.montantTotal || 0);
          case 'date-asc':
            return new Date(a.dateCommande).getTime() - new Date(b.dateCommande).getTime();
          case 'date-desc':
          default:
            return new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime();
        }
      });
  }, [commandes, statusFilter, searchQuery, sortBy, fournisseursList]);

  // Données paginées pour le tableau
  const totalPages = Math.ceil(filteredCommandes.length / ITEMS_PER_PAGE) || 1;
  const paginatedCommandes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCommandes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCommandes, currentPage]);

  // Statistiques pour les Charts (en bas de tableau)
  const chartStats = useMemo(() => {
    const counts = {
      EN_ATTENTE: commandes.filter((c) => c.statut === 'EN_ATTENTE').length,
      VALIDEE: commandes.filter((c) => c.statut === 'VALIDEE').length,
      EN_COURS: commandes.filter((c) => c.statut === 'EN_COURS').length,
      LIVREE: commandes.filter((c) => c.statut === 'LIVREE').length,
      ANNULEE: commandes.filter((c) => c.statut === 'ANNULEE').length,
    };

    // Top Fournisseurs par montant
    const fournisseurMap: { [key: number]: number } = {};
    commandes.forEach((c) => {
      if (c.statut !== 'ANNULEE') {
        fournisseurMap[c.fournisseurId] = (fournisseurMap[c.fournisseurId] || 0) + (c.montantTotal || 0);
      }
    });

    const topFournisseurs = Object.entries(fournisseurMap)
      .map(([id, montant]) => ({
        id: Number(id),
        nom: getFournisseurLabel(Number(id)),
        montant,
      }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 3);

    return { counts, topFournisseurs };
  }, [commandes, fournisseursList]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFournisseurId(1);
    setLignes([{ designation: '', quantite: 1, prixUnitaire: 0 }]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cmd: Commande) => {
    setEditingId(cmd.id);
    setFournisseurId(cmd.fournisseurId);
    setLignes(
      cmd.lignesCommande?.map((l) => ({
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })) || [{ designation: '', quantite: 1, prixUnitaire: 0 }]
    );
    setIsModalOpen(true);
  };

  const handleAddLigne = () => {
    setLignes([...lignes, { designation: '', quantite: 1, prixUnitaire: 0 }]);
  };

  const handleRemoveLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const handleLigneChange = (
    index: number,
    field: keyof Omit<LigneCommande, 'id'>,
    value: string | number
  ) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    setLignes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCommande(editingId, {
          fournisseurId: Number(fournisseurId),
          lignesCommande: lignes,
        });
      } else {
        await createCommande({
          fournisseurId: Number(fournisseurId),
          statut: 'EN_ATTENTE',
          lignesCommande: lignes,
        });
      }
      setIsModalOpen(false);
      setLignes([{ designation: '', quantite: 1, prixUnitaire: 0 }]);
      loadCommandes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatutChange = async (id: number, newStatut: string) => {
    try {
      const updated = await updateCommandeStatut(id, newStatut);
      if (selectedCommande && selectedCommande.id === id) {
        setSelectedCommande(updated);
      }
      loadCommandes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Supprimer définitivement la commande #${id} ?`)) return;
    try {
      await deleteCommande(id);
      if (selectedCommande && selectedCommande.id === id) {
        setSelectedCommande(null);
      }
      loadCommandes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSortBy('date-desc');
    if (fournisseurFilter) {
      setFournisseurFilter('');
      setTimeout(loadCommandes, 0);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
      case 'LIVREE':
        return (
          <Badge variant="success" dot size="sm">
            {statut}
          </Badge>
        );
      case 'ANNULEE':
        return (
          <Badge variant="danger" dot size="sm">
            {statut}
          </Badge>
        );
      case 'EN_COURS':
        return (
          <Badge variant="info" dot size="sm">
            {statut}
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" dot size="sm">
            {statut}
          </Badge>
        );
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'ALL' || fournisseurFilter.trim() !== '';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-6">
      <PageHeader
        badge={
          <Badge variant="teal" dot size="sm">
            Service Commandes (:8082)
          </Badge>
        }
        title="Gestion des Commandes"
        description="Créez, suivez et gérez les bons de commande et leurs lignes d'achat."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadCommandes}
            >
              Actualiser
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Nouvelle Commande
            </Button>
          </div>
        }
      />

      {/* Bandeau KPI Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-teal-500 ring-2 ring-teal-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Commandes
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/70 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpiStats.total}
            </span>
            <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
              Portefeuille global
            </span>
          </div>
        </button>

        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Budget Engagé (Hors Annulées)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatMontant(kpiStats.montantEngage)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter('VALIDEE')}
          className={`text-left p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer ${
            statusFilter === 'VALIDEE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Validées / En Exécution
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpiStats.valideesOuLivrees}
            </span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Bons actifs
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('EN_ATTENTE')}
          className={`text-left p-5 rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer ${
            statusFilter === 'EN_ATTENTE'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              En Attente de Validation
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/70 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {kpiStats.enAttente}
            </span>
            <span className="text-xs font-medium text-slate-500">À traiter</span>
          </div>
        </button>
      </div>

      {/* Barre d'outils & Filtres Pro */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par #ID commande, nom/ID fournisseur ou désignation d'article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm border rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  placeholder="ID Fournisseur API..."
                  value={fournisseurFilter}
                  onChange={(e) => setFournisseurFilter(e.target.value)}
                  className="w-44 px-3 py-2 text-sm border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Button variant="secondary" size="md" onClick={loadCommandes}>
                  Filtrer API
                </Button>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="date-desc">Plus récentes</option>
                  <option value="date-asc">Plus anciennes</option>
                  <option value="montant-desc">Montant décroissant</option>
                  <option value="montant-asc">Montant croissant</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="md" onClick={resetAllFilters}>
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {(
              [
                { id: 'ALL', label: 'Toutes', count: commandes.length },
                {
                  id: 'EN_ATTENTE',
                  label: 'En attente',
                  count: commandes.filter((c) => c.statut === 'EN_ATTENTE').length,
                },
                {
                  id: 'VALIDEE',
                  label: 'Validées',
                  count: commandes.filter((c) => c.statut === 'VALIDEE').length,
                },
                {
                  id: 'EN_COURS',
                  label: 'En cours',
                  count: commandes.filter((c) => c.statut === 'EN_COURS').length,
                },
                {
                  id: 'LIVREE',
                  label: 'Livrées',
                  count: commandes.filter((c) => c.statut === 'LIVREE').length,
                },
                {
                  id: 'ANNULEE',
                  label: 'Annulées',
                  count: commandes.filter((c) => c.statut === 'ANNULEE').length,
                },
              ] as { id: StatusFilter; label: string; count: number }[]
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tableau Professionnel des commandes avec Pagination intégrée */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bons de commande ({filteredCommandes.length}
            {filteredCommandes.length !== commandes.length ? ` sur ${commandes.length}` : ''})
          </CardTitle>
          <CardDescription>Données en temps réel depuis le backend Spring Boot (:8082)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <LoadingState message="Chargement des commandes depuis :8082..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadCommandes} />
          ) : filteredCommandes.length === 0 ? (
            <EmptyState
              title="Aucune commande trouvée"
              description={
                hasActiveFilters
                  ? 'Aucun bon de commande ne correspond à vos critères de filtrage.'
                  : 'Créez votre premier bon de commande pour commencer.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="md" onClick={resetAllFilters}>
                    Effacer les filtres
                  </Button>
                ) : (
                  <Button variant="primary" size="md" onClick={handleOpenCreate}>
                    Nouvelle Commande
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 rounded-tl-lg">Réf. BC</th>
                      <th className="py-3.5 px-4">Fournisseur</th>
                      <th className="py-3.5 px-4">Date Émission</th>
                      <th className="py-3.5 px-4">Aperçu des Articles</th>
                      <th className="py-3.5 px-4">Montant Total</th>
                      <th className="py-3.5 px-4">Statut & Workflow</th>
                      <th className="py-3.5 px-4 text-right rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {paginatedCommandes.map((cmd) => {
                      const firstArticle = cmd.lignesCommande?.[0]?.designation;
                      const extraCount = (cmd.lignesCommande?.length || 0) - 1;
                      return (
                        <tr
                          key={cmd.id}
                          className="group hover:bg-teal-50/30 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs">
                              <Hash className="w-3 h-3 text-teal-600" />
                              BC-{String(cmd.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800/70 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-xs shrink-0">
                                F{cmd.fournisseurId}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {getFournisseurLabel(cmd.fournisseurId)}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  ID Référentiel : #{cmd.fournisseurId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatDate(cmd.dateCommande)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                                <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {firstArticle || 'Aucun article'}
                                </span>
                              </span>
                              {extraCount > 0 && (
                                <span className="text-[11px] text-slate-400 pl-5">
                                  + {extraCount} autre(s) ligne(s)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-sm text-teal-700 dark:text-teal-400">
                              {formatMontant(cmd.montantTotal)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {getStatutBadge(cmd.statut)}
                              <select
                                value={cmd.statut}
                                onChange={(e) => handleStatutChange(cmd.id, e.target.value)}
                                className="text-xs font-medium border rounded-lg px-2 py-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                              >
                                <option value="EN_ATTENTE">EN_ATTENTE</option>
                                <option value="VALIDEE">VALIDEE</option>
                                <option value="EN_COURS">EN_COURS</option>
                                <option value="LIVREE">LIVREE</option>
                                <option value="ANNULEE">ANNULEE</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                icon={<Eye className="w-3.5 h-3.5" />}
                                onClick={() => setSelectedCommande(cmd)}
                              >
                                Détails
                              </Button>
                              <Button
                                variant="secondary"
                                size="xs"
                                icon={<Edit className="w-3.5 h-3.5" />}
                                onClick={() => handleOpenEdit(cmd)}
                              >
                                Modifier
                              </Button>
                              <Button
                                variant="danger"
                                size="xs"
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                onClick={() => handleDelete(cmd.id)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Barre de Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 gap-3">
                <div>
                  Affichage de{'5'} éléments par page (Page {currentPage} sur {totalPages})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={<ChevronLeft className="w-4 h-4" />}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    Précédent
                  </Button>
                  <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 font-bold rounded-lg text-slate-700 dark:text-slate-200">
                    {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={<ChevronRight className="w-4 h-4" />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Conteneur Graphiques Statistiques (Charts) en bas de tableau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Graphique 1 : Répartition des Statuts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="w-4 h-4 text-teal-600" />
                Répartition par Statut des Commandes
              </CardTitle>
              <span className="text-xs text-slate-400">En temps réel</span>
            </div>
            <CardDescription>Visualisation de l'état d'avancement du portefeuille</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {[
              { label: 'En Attente', count: chartStats.counts.EN_ATTENTE, color: 'bg-amber-500', text: 'text-amber-600' },
              { label: 'Validées', count: chartStats.counts.VALIDEE, color: 'bg-emerald-500', text: 'text-emerald-600' },
              { label: 'En Cours', count: chartStats.counts.EN_COURS, color: 'bg-blue-500', text: 'text-blue-600' },
              { label: 'Livrées', count: chartStats.counts.LIVREE, color: 'bg-teal-600', text: 'text-teal-600' },
              { label: 'Annulées', count: chartStats.counts.ANNULEE, color: 'bg-rose-500', text: 'text-rose-600' },
            ].map((item) => {
              const totalCount = commandes.length || 1;
              const pct = Math.round((item.count / totalCount) * 100);
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className={item.text}>
                      {item.count} commande(s) ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Graphique 2 : Top 3 Fournisseurs Engagés */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Top Fournisseurs par Volume Financier
              </CardTitle>
              <span className="text-xs text-slate-400">En MAD</span>
            </div>
            <CardDescription>Classement des principaux partenaires fournisseurs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {chartStats.topFournisseurs.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Aucune donnée financière disponible
              </div>
            ) : (
              chartStats.topFournisseurs.map((f, idx) => (
                <div key={f.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {f.nom}
                      </div>
                      <div className="text-xs text-slate-400">ID Fournisseur : #{f.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-teal-700 dark:text-teal-400">
                      {formatMontant(f.montant)}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600">Engagé</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Détails */}
      <Modal
        isOpen={!!selectedCommande}
        onClose={() => setSelectedCommande(null)}
        title={`Bon de Commande #BC-${String(selectedCommande?.id || 0).padStart(4, '0')}`}
        description={`Dossier d'achat rattaché à ${
          selectedCommande ? getFournisseurLabel(selectedCommande.fournisseurId) : ''
        }`}
        maxWidth="3xl"
        footer={
          <div className="w-full flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setSelectedCommande(null)}>
              Fermer
            </Button>
          </div>
        }
      >
        {selectedCommande && (
          <div className="space-y-6">
            {selectedCommande.statut !== 'ANNULEE' ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Avancement du cycle de vie
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const currentIdx = WORKFLOW_STEPS.indexOf(
                      selectedCommande.statut as (typeof WORKFLOW_STEPS)[number]
                    );
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div key={step} className="flex flex-col gap-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCompleted
                              ? 'bg-teal-600'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            isCurrent
                              ? 'text-teal-700 dark:text-teal-400'
                              : isCompleted
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                Ce bon de commande a été annulé.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Fournisseur
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {getFournisseurLabel(selectedCommande.fournisseurId)}
                </span>
                <span className="text-xs text-slate-500">ID #{selectedCommande.fournisseurId}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Date de création
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {formatDate(selectedCommande.dateCommande)}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedCommande.lignesCommande?.length || 0} article(s)
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Statut Actuel
                </span>
                <div className="mt-1">{getStatutBadge(selectedCommande.statut)}</div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Désignation de l'article</th>
                    <th className="py-3 px-4 text-center">Quantité</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedCommande.lignesCommande?.map((ligne, idx) => (
                    <tr key={ligne.id || idx}>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {ligne.designation}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-xs">
                          {ligne.quantite}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                        {formatMontant(ligne.prixUnitaire)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatMontant(ligne.quantite * ligne.prixUnitaire)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-teal-50/70 dark:bg-teal-950/40 border-t-2 border-teal-200 dark:border-teal-800">
                    <td
                      colSpan={4}
                      className="py-3.5 px-4 text-right text-xs font-extrabold uppercase tracking-wider text-teal-900 dark:text-teal-300"
                    >
                      Montant Total TTC du Bon de Commande
                    </td>
                    <td className="py-3.5 px-4 text-right text-base font-extrabold text-teal-700 dark:text-teal-400">
                      {formatMontant(selectedCommande.montantTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Création / Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Modifier la Commande #${editingId}` : "Nouvelle Commande"}
        description="Sélectionnez un fournisseur ou saisissez son identifiant et configurez les lignes d'achat."
        maxWidth="3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {editingId ? "Mettre à jour" : "Enregistrer la commande"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fournisseur concerné
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <select
                  value={fournisseurId}
                  onChange={(e) => setFournisseurId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {fournisseursList.length === 0 ? (
                    <option value={fournisseurId}>
                      Fournisseur #{fournisseurId} (Saisie manuelle)
                    </option>
                  ) : (
                    fournisseursList
                      .filter((f: any) => f.actif !== false)
                      .map((f: any) => (
                        <option key={f.id} value={f.id}>
                          #{f.id} — {f.nom} {f.ville ? `(${f.ville})` : ''}
                        </option>
                      ))
                  )}
                </select>
              </div>
              <div className="sm:col-span-4 flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">ID direct :</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={fournisseurId}
                  onChange={(e) => setFournisseurId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-semibold border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-center"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-600" />
              Connecté au référentiel Fournisseurs (:8081).
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lignes de commande
                </h4>
                <p className="text-xs text-slate-500">
                  Ajoutez les articles composant ce bon de commande.
                </p>
              </div>
              <Button
                type="button"
                variant="teal-subtle"
                size="xs"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddLigne}
              >
                Ajouter une ligne
              </Button>
            </div>

            <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-5">Désignation de l'article</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-3 text-right">Prix Unitaire (MAD)</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {lignes.map((ligne, index) => {
                const sousTotal = ligne.quantite * ligne.prixUnitaire;
                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xs"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        required
                        placeholder="Ex: PC Portable Gamer"
                        value={ligne.designation}
                        onChange={(e) =>
                          handleLigneChange(index, 'designation', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="Qté"
                        value={ligne.quantite}
                        onChange={(e) =>
                          handleLigneChange(index, 'quantite', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 text-sm text-center border rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={ligne.prixUnitaire}
                        onChange={(e) =>
                          handleLigneChange(index, 'prixUnitaire', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 text-sm text-right border rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                      {sousTotal.toFixed(2)} MAD
                    </div>
                    <div className="sm:col-span-1 text-right">
                      {lignes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLigne(index)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 px-4 py-3 rounded-xl mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Montant Total Estimé
              </span>
              <span className="text-base font-extrabold text-teal-700 dark:text-teal-400">
                {lignes
                  .reduce((acc, l) => acc + l.quantite * l.prixUnitaire, 0)
                  .toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};