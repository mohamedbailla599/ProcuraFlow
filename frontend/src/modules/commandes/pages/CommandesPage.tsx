import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  SelectMenu,
} from '../../../components/ui';
import {
  Plus,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Download,
  Package,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  Clock,
  X,
  Building2,
  Calendar,
  BarChart3,
  PieChart,
  Edit,
  AlertCircle,
  SlidersHorizontal,
  Printer,
  ArrowUpDown,
  ChevronDown,
  Receipt,
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
import { formatMontant, formatDate, exportCommandesToCsv } from '../utils';
import { useApp } from '../../../context/AppContext';

type StatusFilter = 'ALL' | 'EN_ATTENTE' | 'VALIDEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
type SortOption = 'date-desc' | 'date-asc' | 'montant-desc' | 'montant-asc';

const WORKFLOW_STEPS = ['EN_ATTENTE', 'VALIDEE', 'EN_COURS', 'LIVREE'] as const;

const WORKFLOW_STEP_CONFIG: Record<
  (typeof WORKFLOW_STEPS)[number],
  { label: string; sub: string }
> = {
  EN_ATTENTE: { label: 'En Attente', sub: 'Émission initiale' },
  VALIDEE: { label: 'Validée', sub: 'Accord & signature' },
  EN_COURS: { label: 'En Cours', sub: 'Expédition active' },
  LIVREE: { label: 'Livrée', sub: 'Réception conforme' },
};

const formatStatutLabel = (st: string) => {
  switch (st) {
    case 'EN_ATTENTE': return 'En Attente';
    case 'VALIDEE': return 'Validée';
    case 'EN_COURS': return 'En Cours';
    case 'LIVREE': return 'Livrée';
    case 'ANNULEE': return 'Annulée';
    default: return st;
  }
};

const ITEMS_PER_PAGE = 8;

export const CommandesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSidebarCollapsed } = useApp();
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
    { designation: '', quantite: 1, prixUnitaire: 1 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
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
  }, [searchQuery, statusFilter, fournisseurFilter, sortBy]);

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
          const matchId = `#${cmd.id}`.includes(q) || String(cmd.id).includes(q) || `bc-${cmd.id}`.includes(q);
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
      .slice(0, 4);

    return { counts, topFournisseurs };
  }, [commandes, fournisseursList]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError(null);
    setFournisseurId(1);
    setLignes([{ designation: '', quantite: 1, prixUnitaire: 1 }]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cmd: Commande) => {
    setEditingId(cmd.id);
    setFormError(null);
    setFournisseurId(cmd.fournisseurId);
    setLignes(
      cmd.lignesCommande?.map((l) => ({
        designation: l.designation,
        quantite: Math.max(1, Math.round(l.quantite)),
        prixUnitaire: Math.max(1, Math.round(l.prixUnitaire)),
      })) || [{ designation: '', quantite: 1, prixUnitaire: 1 }]
    );
    setIsModalOpen(true);
  };

  const handleAddLigne = () => {
    setFormError(null);
    setLignes([...lignes, { designation: '', quantite: 1, prixUnitaire: 1 }]);
  };

  const handleRemoveLigne = (index: number) => {
    if (lignes.length > 1) {
      setFormError(null);
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const handleLigneChange = (
    index: number,
    field: keyof Omit<LigneCommande, 'id'>,
    value: string | number
  ) => {
    setFormError(null);
    const updated = [...lignes];

    if (field === 'quantite' || field === 'prixUnitaire') {
      const parsed = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
      updated[index] = {
        ...updated[index],
        [field]: isNaN(parsed) ? 0 : parsed,
      };
    } else {
      updated[index] = { ...updated[index], designation: String(value) };
    }

    setLignes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i];
      if (!l.designation.trim()) {
        setFormError(`Veuillez saisir la désignation de l'article à la ligne ${i + 1}.`);
        return;
      }
      if (!Number.isInteger(l.quantite) || l.quantite < 1) {
        setFormError(`La quantité de la ligne ${i + 1} doit être un entier supérieur ou égal à 1.`);
        return;
      }
      if (!Number.isInteger(l.prixUnitaire) || l.prixUnitaire <= 0) {
        setFormError(`Le prix unitaire de la ligne ${i + 1} doit être un entier strictement positif (> 0 MAD).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const cleanLignes = lignes.map((l) => ({
        designation: l.designation.trim(),
        quantite: Math.round(l.quantite),
        prixUnitaire: Math.round(l.prixUnitaire),
      }));

      if (editingId) {
        await updateCommande(editingId, {
          fournisseurId: Number(fournisseurId),
          lignesCommande: cleanLignes,
        });
      } else {
        await createCommande({
          fournisseurId: Number(fournisseurId),
          statut: 'EN_ATTENTE',
          lignesCommande: cleanLignes,
        });
      }
      setIsModalOpen(false);
      setLignes([{ designation: '', quantite: 1, prixUnitaire: 1 }]);
      loadCommandes();
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de l'enregistrement.");
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
    if (!window.confirm(`Supprimer définitivement la commande #BC-${String(id).padStart(4, '0')} ?`)) return;
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

  const getStatusStyle = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
      case 'LIVREE':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70 focus:ring-emerald-500';
      case 'EN_COURS':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/70 focus:ring-blue-500';
      case 'ANNULEE':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/70 focus:ring-rose-500';
      case 'EN_ATTENTE':
      default:
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/70 focus:ring-amber-500';
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'ALL' || fournisseurFilter.trim() !== '';

  const totalFormMontant = lignes.reduce(
    (acc, l) => acc + Math.round(l.quantite || 0) * Math.round(l.prixUnitaire || 0),
    0
  );

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-6">
      {/* En-tête de page moderne sans boutons dupliqués */}
      <PageHeader
        badge={<Badge variant="teal" dot size="sm">Service Commandes (:8082)</Badge>}
        title="Gestion des Bons de Commande"
        description="Créez, pilotez le cycle d'achat et gérez les lignes de commande auprès des fournisseurs agréés."
      />

      {/* Grille de 4 Cartes KPI Interactives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 : Total Commandes */}
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
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpiStats.total}
            </span>
            <span className="text-xs font-semibold text-slate-400">bons d'achat</span>
          </div>
        </button>

        {/* KPI 2 : Budget Engagé */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Budget Engagé
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatMontant(kpiStats.montantEngage)}
            </span>
          </div>
        </div>

        {/* KPI 3 : Validées / Exécution */}
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
              Validées / Exécution
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpiStats.valideesOuLivrees}
            </span>
            <span className="text-xs font-semibold text-slate-400">en cours de livraison</span>
          </div>
        </button>

        {/* KPI 4 : En Attente */}
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
              En Attente
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {kpiStats.enAttente}
            </span>
            <span className="text-xs font-semibold text-slate-400">à valider</span>
          </div>
        </button>
      </div>

      {/* Barre d'Outils, Recherche, Filtres & 3 Boutons d'Action intégrés */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
            {/* Recherche globale */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par #ID, BC-000x, fournisseur ou article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm border rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtre par Fournisseur, Tri & Actions intégrées */}
            <div className="flex flex-wrap items-center gap-2">
              <SelectMenu
                value={fournisseurFilter}
                onChange={(val) => setFournisseurFilter(val)}
                options={[
                  { value: '', label: 'Tous les fournisseurs' },
                  ...fournisseursList.map((f: any) => ({
                    value: String(f.id),
                    label: `${f.nom}`,
                    badge: `#${f.id}`,
                  })),
                ]}
                placeholder="Tous les fournisseurs"
                icon={<Building2 className="w-3.5 h-3.5" />}
                menuWidth="w-64"
              />

              {fournisseurFilter && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadCommandes}
                >
                  Filtrer API
                </Button>
              )}

              {/* Sélecteur de Tri */}
              <SelectMenu
                value={sortBy}
                onChange={(val) => setSortBy(val as SortOption)}
                options={[
                  { value: 'date-desc', label: 'Plus récentes' },
                  { value: 'date-asc', label: 'Plus anciennes' },
                  { value: 'montant-desc', label: 'Montant décroissant' },
                  { value: 'montant-asc', label: 'Montant croissant' },
                ]}
                placeholder="Trier par"
                icon={<ArrowUpDown className="w-3.5 h-3.5" />}
                menuWidth="w-52"
              />

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

              {/* Séparateur élégant */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Les 3 Boutons d'Action :
                  - Mode Icônes seules quand la sidebar n'est PAS repliée (!isSidebarCollapsed)
                  - Mode Icône + Texte quand la sidebar EST repliée (isSidebarCollapsed)
              */}
              <button
                type="button"
                onClick={loadCommandes}
                title="Actualiser les commandes"
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer group"
              >
                <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 group-hover:rotate-180 transition-all duration-300" />
                {isSidebarCollapsed && <span className="hidden md:inline">Actualiser</span>}
              </button>

              <button
                type="button"
                onClick={() => exportCommandesToCsv(commandes)}
                disabled={commandes.length === 0}
                title="Exporter la liste en CSV"
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 group"
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 transition-colors" />
                {isSidebarCollapsed && <span className="hidden md:inline">Exporter CSV</span>}
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                title="Créer une nouvelle commande"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-teal-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                {isSidebarCollapsed && <span className="hidden md:inline">Nouvelle Commande</span>}
              </button>
            </div>
          </div>

          {/* Onglets Filtres par Statut de Commande */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Statut :
            </span>
            {[
              { id: 'ALL', label: 'Toutes', count: chartStats.counts.EN_ATTENTE + chartStats.counts.VALIDEE + chartStats.counts.EN_COURS + chartStats.counts.LIVREE + chartStats.counts.ANNULEE },
              { id: 'EN_ATTENTE', label: 'En Attente', count: chartStats.counts.EN_ATTENTE },
              { id: 'VALIDEE', label: 'Validées', count: chartStats.counts.VALIDEE },
              { id: 'EN_COURS', label: 'En Cours', count: chartStats.counts.EN_COURS },
              { id: 'LIVREE', label: 'Livrées', count: chartStats.counts.LIVREE },
              { id: 'ANNULEE', label: 'Annulées', count: chartStats.counts.ANNULEE },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des Bons de Commande */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bons de Commande ({filteredCommandes.length})</CardTitle>
              <CardDescription>
                Synchronisation en direct avec le microservice Spring Boot (:8082)
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Badge variant="teal" size="xs">
                Filtre actif ({filteredCommandes.length} / {commandes.length})
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-16">
              <LoadingState message="Chargement des commandes en cours..." />
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorState message={error} onRetry={loadCommandes} />
            </div>
          ) : filteredCommandes.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<ShoppingBag className="w-10 h-10 text-teal-600" />}
                title={
                  hasActiveFilters
                    ? 'Aucune commande ne correspond à vos filtres'
                    : 'Aucun bon de commande enregistré'
                }
                description={
                  hasActiveFilters
                    ? 'Essayez de réinitialiser la recherche ou le filtre de fournisseur.'
                    : 'Créez votre première commande d’achat en cliquant sur "Nouvelle Commande".'
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
                      onClick={handleOpenCreate}
                    >
                      Nouvelle Commande
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 whitespace-nowrap">Réf. BC</th>
                      <th className="py-3.5 px-4">Fournisseur</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Date Émission</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Articles</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Montant Total</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {paginatedCommandes.map((cmd) => (
                      <tr
                        key={cmd.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Réf. BC : Garanti sans retour à la ligne */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                              #{cmd.id}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">
                              BC-{String(cmd.id).padStart(4, '0')}
                            </span>
                          </div>
                        </td>

                        {/* Fournisseur */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">
                              {getFournisseurLabel(cmd.fournisseurId)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Réf. #{cmd.fournisseurId}
                            </span>
                          </div>
                        </td>

                        {/* Date Émission avec Icône */}
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {formatDate(cmd.dateCommande)}
                          </span>
                        </td>

                        {/* Nombre de lignes */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Package className="w-3 h-3 mr-1 text-teal-600" />
                            {cmd.lignesCommande?.length || 0} ligne(s)
                          </span>
                        </td>

                        {/* Montant Total */}
                        <td className="py-3.5 px-4 font-extrabold text-teal-600 dark:text-teal-400 whitespace-nowrap text-sm">
                          {formatMontant(cmd.montantTotal)}
                        </td>

                        {/* Sélecteur de Statut Unifié & Élégant */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="relative inline-flex items-center">
                            <select
                              value={cmd.statut}
                              onChange={(e) => handleStatutChange(cmd.id, e.target.value)}
                              className={`appearance-none text-xs font-semibold pl-3 pr-7 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 transition-all ${getStatusStyle(
                                cmd.statut
                              )}`}
                              title="Modifier le statut d'avancement de la commande"
                            >
                              <option value="EN_ATTENTE">● En Attente</option>
                              <option value="VALIDEE">● Validée</option>
                              <option value="EN_COURS">● En Cours</option>
                              <option value="LIVREE">● Livrée</option>
                              <option value="ANNULEE">● Annulée</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none opacity-60" />
                          </div>
                        </td>

                        {/* Actions : Boutons icônes avec magnifique effet de survol (hover) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {/* Bouton Facturer (Rapprochement 3-voies) si LIVREE ou VALIDEE */}
                            {(cmd.statut === 'LIVREE' || cmd.statut === 'VALIDEE') && (
                              <button
                                type="button"
                                onClick={() => navigate(`/factures?commandeId=${cmd.id}`)}
                                title="Établir la facture (Rapprochement 3-voies)"
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-600 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700/80 shadow-2xs hover:shadow-xs hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                              >
                                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </button>
                            )}

                            {/* Bouton Détails : Icône Eye avec hover teal */}
                            <button
                              type="button"
                              onClick={() => setSelectedCommande(cmd)}
                              title="Voir le dossier d'achat complet"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-teal-600 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-700/80 shadow-2xs hover:shadow-xs hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Bouton Modifier : Icône Edit avec hover bleu */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cmd)}
                              title="Modifier la commande et ses lignes d'achat"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700/80 shadow-2xs hover:shadow-xs hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Bouton Supprimer : Icône Trash2 avec hover rouge */}
                            <button
                              type="button"
                              onClick={() => handleDelete(cmd.id)}
                              title="Supprimer définitivement la commande"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/70 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-700/80 shadow-2xs hover:shadow-xs hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination & Compteur */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <div>
                  Affichage de{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  à{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredCommandes.length)}
                  </span>{' '}
                  sur{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {filteredCommandes.length}
                  </span>{' '}
                  commande(s)
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Précédent
                    </Button>
                    <span className="px-2 font-medium">
                      Page {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Graphiques & Tableaux d'Analyse en bas de page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Répartition par Statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <PieChart className="w-4 h-4 text-teal-600" /> Répartition du Pipeline d'Achats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {[
              { label: 'En Attente', count: chartStats.counts.EN_ATTENTE, color: 'bg-amber-500' },
              { label: 'Validées', count: chartStats.counts.VALIDEE, color: 'bg-emerald-500' },
              { label: 'En Cours', count: chartStats.counts.EN_COURS, color: 'bg-blue-500' },
              { label: 'Livrées', count: chartStats.counts.LIVREE, color: 'bg-teal-600' },
              { label: 'Annulées', count: chartStats.counts.ANNULEE, color: 'bg-rose-500' },
            ].map((item) => {
              const pct = (item.count / (commandes.length || 1)) * 100;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {item.count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Fournisseurs par Volume Engagé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="w-4 h-4 text-teal-600" /> Fournisseurs les Plus Sollicités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {chartStats.topFournisseurs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune commande validée pour le moment.</p>
            ) : (
              chartStats.topFournisseurs.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {f.nom}
                    </span>
                  </div>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400 text-xs shrink-0 ml-2">
                    {formatMontant(f.montant)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Création / Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Modifier la Commande #BC-${String(editingId).padStart(4, '0')}` : 'Nouveau Bon de Commande'}
        description="Configurez le fournisseur attributaire et les lignes d'achat associées."
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {editingId ? 'Mettre à jour la commande' : 'Enregistrer la commande'}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6 pt-3 mt-1 transition-all duration-300 ease-out"
        >
          {formError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Bloc Fournisseur */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 transition-all duration-200 hover:border-teal-300 dark:hover:border-teal-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fournisseur concerné
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <select
                  value={fournisseurId}
                  onChange={(e) => setFournisseurId(Number(e.target.value))}
                  className="select-custom w-full px-3.5 pr-9 py-2.5 text-sm font-semibold rounded-xl"
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
                  type="text"
                  inputMode="numeric"
                  required
                  value={fournisseurId}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                    setFournisseurId(isNaN(val) || val < 1 ? 1 : val);
                  }}
                  className="w-full px-3 py-2 text-sm font-semibold border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-600" />
              Connecté en temps réel au référentiel Fournisseurs (:8081).
            </p>
          </div>

          {/* Bloc Lignes de commande */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lignes d'achat
                </h4>
                <p className="text-xs text-slate-500">
                  Désignation, quantité et prix unitaire des articles.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddLigne}
              >
                Ajouter une ligne
              </Button>
            </div>

            <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-4">Désignation de l'article</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-3 text-right">Prix Unitaire (MAD)</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {lignes.map((ligne, index) => {
                const isPriceInvalid = !ligne.prixUnitaire || ligne.prixUnitaire <= 0;
                const sousTotal = Math.round(ligne.quantite || 0) * Math.round(ligne.prixUnitaire || 0);
                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xs transition-all duration-200 hover:shadow-sm hover:border-teal-300/80 dark:hover:border-teal-800"
                  >
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        required
                        placeholder="Ex: PC Portable Gamer"
                        value={ligne.designation}
                        onChange={(e) =>
                          handleLigneChange(index, 'designation', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="1"
                        value={ligne.quantite === 0 ? '' : ligne.quantite}
                        onChange={(e) =>
                          handleLigneChange(index, 'quantite', e.target.value)
                        }
                        onBlur={() => {
                          if (!ligne.quantite || ligne.quantite < 1) {
                            handleLigneChange(index, 'quantite', 1);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm text-center font-semibold border rounded-lg bg-slate-50/50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="Ex: 1500"
                        value={ligne.prixUnitaire === 0 ? '' : ligne.prixUnitaire}
                        onChange={(e) =>
                          handleLigneChange(index, 'prixUnitaire', e.target.value)
                        }
                        className={`w-full px-3 py-2 text-sm text-right font-semibold border rounded-lg bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          isPriceInvalid
                            ? 'border-rose-400 focus:ring-rose-500 text-rose-600'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                        }`}
                      />
                    </div>
                    <div className="sm:col-span-2 text-right text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {sousTotal.toLocaleString('fr-FR')} MAD
                    </div>
                    <div className="sm:col-span-1 text-right">
                      {lignes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLigne(index)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 cursor-pointer"
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

            {/* Montant Total Estimé */}
            <div className="flex justify-between items-center bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 px-4 py-3.5 rounded-xl mt-4 transition-all duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Montant Total Estimé
              </span>
              <span className="text-lg font-extrabold text-teal-700 dark:text-teal-400">
                {totalFormMontant.toLocaleString('fr-FR')} MAD
              </span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Détails & Dossier d'Achat */}
      <Modal
        isOpen={!!selectedCommande}
        onClose={() => setSelectedCommande(null)}
        title={`Bon de Commande #BC-${String(selectedCommande?.id || 0).padStart(4, '0')}`}
        description={`Dossier d'achat rattaché à ${
          selectedCommande ? getFournisseurLabel(selectedCommande.fournisseurId) : ''
        }`}
        maxWidth="3xl"
        footer={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Imprimer le Bon
              </Button>
              {selectedCommande && (selectedCommande.statut === 'LIVREE' || selectedCommande.statut === 'VALIDEE') && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Receipt className="w-4 h-4" />}
                  onClick={() => {
                    const cmdId = selectedCommande.id;
                    setSelectedCommande(null);
                    navigate(`/factures?commandeId=${cmdId}`);
                  }}
                >
                  Établir Facture
                </Button>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedCommande(null)}>
              Fermer
            </Button>
          </div>
        }
      >
        {selectedCommande && (
          <div className="space-y-5 text-slate-800 dark:text-slate-100">
            {/* Cycle de vie du bon de commande (Stepper élégant) */}
            {selectedCommande.statut !== 'ANNULEE' ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    Progression du cycle d'achat
                  </span>
                  {(() => {
                    const currentIdx = WORKFLOW_STEPS.indexOf(
                      selectedCommande.statut as (typeof WORKFLOW_STEPS)[number]
                    );
                    return (
                      <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 px-2.5 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/60">
                        Étape {currentIdx >= 0 ? currentIdx + 1 : 1} sur 4
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const currentIdx = WORKFLOW_STEPS.indexOf(
                      selectedCommande.statut as (typeof WORKFLOW_STEPS)[number]
                    );
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isPassed = idx < currentIdx;
                    const cfg = WORKFLOW_STEP_CONFIG[step];

                    return (
                      <div key={step} className="flex flex-col gap-2">
                        {/* Barre de progression avec transition fluide */}
                        <div className="relative flex items-center">
                          <div
                            className={`h-2 w-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-teal-600 dark:bg-teal-500 shadow-2xs'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        </div>

                        {/* Intitulé & description de l'étape */}
                        <div>
                          <div
                            className={`text-xs font-bold transition-colors flex items-center gap-1 ${
                              isCurrent
                                ? 'text-teal-700 dark:text-teal-400'
                                : isCompleted
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            ) : isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse shrink-0" />
                            ) : null}
                            <span className="truncate">{cfg.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block truncate mt-0.5">
                            {cfg.sub}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Ce bon de commande a été annulé dans le circuit d'achat.</span>
              </div>
            )}

            {/* Fiches de Synthèse Équilibrées */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Fournisseur */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    Fournisseur Attributaire
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {getFournisseurLabel(selectedCommande.fournisseurId)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ID #{selectedCommande.fournisseurId}
                  </span>
                </div>
              </div>

              {/* Date d'Émission */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    Date d'Émission
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {formatDate(selectedCommande.dateCommande)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedCommande.lignesCommande?.length || 0} référence(s)
                  </span>
                </div>
              </div>

              {/* Statut de Traitement */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    Statut de Traitement
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(
                        selectedCommande.statut
                      )}`}
                    >
                      ● {formatStatutLabel(selectedCommande.statut)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des Lignes de Commande */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Nomenclature des Articles Commandés
                </h4>
                <span className="text-xs font-medium text-slate-400">
                  {selectedCommande.lignesCommande?.length || 0} référence(s)
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 text-center w-12">#</th>
                      <th className="py-3 px-4">Désignation de l'article</th>
                      <th className="py-3 px-4 text-center">Quantité</th>
                      <th className="py-3 px-4 text-right">Prix Unitaire</th>
                      <th className="py-3 px-4 text-right">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedCommande.lignesCommande?.map((ligne, idx) => (
                      <tr key={ligne.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-xs text-slate-400 font-mono text-center">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {ligne.designation}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {ligne.quantite}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                          {formatMontant(ligne.prixUnitaire)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatMontant(ligne.quantite * ligne.prixUnitaire)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Engagement Budgétaire Total (Bandeau de synthèse luxueux) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-200/80 dark:border-teal-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                    Engagement Budgétaire Total
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCommande.lignesCommande?.reduce((acc, l) => acc + (l.quantite || 0), 0) || 0} unité(s) au total • Prix fermes TTC garantis
                  </span>
                </div>
              </div>

              <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-teal-200/60 dark:border-teal-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Montant Total TTC
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-400 tracking-tight">
                  {formatMontant(selectedCommande.montantTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
