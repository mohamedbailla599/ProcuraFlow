import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Moon,
  Sun,
  LayoutGrid,
  List,
  Download,
  Upload,
  FileText,
  RotateCw,
  Building2,
  MapPin,
  Map as MapIcon,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Star,
  Sparkles,
  Command,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';
import { SupplierOrderStats, formatMAD } from '../utils/orderStats';
import { computeSupplierRating } from '../utils/scoring';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  fournisseurs: Fournisseur[];
  orderStats?: Record<number, SupplierOrderStats>;
  onSelectFournisseur: (fournisseur: Fournisseur) => void;
  onEditFournisseur: (fournisseur: Fournisseur) => void;
  onOpenCreateModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  viewMode: 'table' | 'grid' | 'map';
  onViewModeChange: (mode: 'table' | 'grid' | 'map') => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  availableCities: string[];
  cityFilter: string;
  onCityFilterChange: (city: string) => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  onOpenImportModal?: () => void;
  onExportPDF?: () => void;
}

interface PaletteActionItem {
  id: string;
  category: 'Fournisseurs' | 'Actions Rapides' | 'Affichage' | 'Filtres Statut' | 'Filtres Ville';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClass?: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  fournisseurs,
  orderStats,
  onSelectFournisseur,
  onEditFournisseur,
  onOpenCreateModal,
  isDarkMode,
  onToggleDarkMode,
  demoMode,
  onToggleDemoMode,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  availableCities,
  cityFilter,
  onCityFilterChange,
  onRefresh,
  onExportCSV,
  onOpenImportModal,
  onExportPDF,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open and reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Compute all available actions and matched suppliers
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: PaletteActionItem[] = [];

    // 1. Matched Suppliers (up to 8)
    const matchedSuppliers = fournisseurs.filter((f) => {
      if (!q) return true;
      return (
        f.nom.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.telephone && f.telephone.toLowerCase().includes(q)) ||
        (f.adresse && f.adresse.toLowerCase().includes(q)) ||
        String(f.id).includes(q)
      );
    }).slice(0, 8);

    matchedSuppliers.forEach((f) => {
      const stats = orderStats?.[f.id];
      const rating = computeSupplierRating(f);
      result.push({
        id: `supplier-${f.id}`,
        category: 'Fournisseurs',
        title: f.nom,
        subtitle: `${f.email} • ID #${f.id}${f.adresse ? ` • ${f.adresse}` : ''}`,
        badge: stats && stats.activeOrders > 0
          ? `${stats.activeOrders} cde(s) • ${formatMAD(stats.totalOrderedAmount)}`
          : `${rating.score.toFixed(1)} ★`,
        badgeClass: f.actif
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
        icon: (
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
            f.actif
              ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {f.nom.slice(0, 2).toUpperCase()}
          </div>
        ),
        shortcut: 'Dossier',
        onSelect: () => onSelectFournisseur(f),
      });
    });

    // 2. Actions Rapides
    const actions: PaletteActionItem[] = [
      {
        id: 'action-new',
        category: 'Actions Rapides',
        title: 'Nouveau Fournisseur',
        subtitle: 'Ajouter un nouveau fournisseur au répertoire',
        icon: <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        shortcut: 'N',
        onSelect: onOpenCreateModal,
      },
      {
        id: 'action-theme',
        category: 'Actions Rapides',
        title: isDarkMode ? 'Passer en Mode Clair' : 'Passer en Mode Sombre',
        subtitle: 'Changer le thème visuel de l’application',
        icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-teal-500" />,
        shortcut: 'Thème',
        onSelect: onToggleDarkMode,
      },
      {
        id: 'action-export-csv',
        category: 'Actions Rapides',
        title: 'Exporter le répertoire en CSV',
        subtitle: 'Télécharger les fournisseurs filtrés au format tableur',
        icon: <Download className="w-4 h-4 text-blue-500" />,
        shortcut: 'CSV',
        onSelect: onExportCSV,
      },
      ...(onExportPDF
        ? [
            {
              id: 'action-export-pdf',
              category: 'Actions Rapides' as const,
              title: 'Exporter le rapport catalogue en PDF',
              subtitle: 'Générer un rapport officiel A4 paysage avec synthèse et KPIs',
              icon: <FileText className="w-4 h-4 text-rose-500" />,
              shortcut: 'PDF',
              onSelect: onExportPDF,
            },
          ]
        : []),
      ...(onOpenImportModal
        ? [
            {
              id: 'action-import',
              category: 'Actions Rapides' as const,
              title: 'Importer des fournisseurs (CSV / Excel)',
              subtitle: 'Importation en masse avec détection automatique des doublons',
              icon: <Upload className="w-4 h-4 text-teal-500" />,
              shortcut: 'Import',
              onSelect: onOpenImportModal,
            },
          ]
        : []),
      {
        id: 'action-refresh',
        category: 'Actions Rapides',
        title: 'Rafraîchir les données',
        subtitle: 'Recharger les fournisseurs et les statistiques',
        icon: <RotateCw className="w-4 h-4 text-emerald-500" />,
        shortcut: 'Sync',
        onSelect: onRefresh,
      },
      {
        id: 'action-demo',
        category: 'Actions Rapides',
        title: demoMode ? 'Désactiver le Mode Démo (Retour API)' : 'Activer le Mode Démo (Hors-ligne)',
        subtitle: demoMode ? 'Bascule vers le microservice Spring Boot réel (:8081)' : 'Utilise le store simulé en mémoire',
        icon: <Database className="w-4 h-4 text-purple-500" />,
        badge: demoMode ? 'Démo Active' : 'API Réelle',
        onSelect: onToggleDemoMode,
      },
    ];

    // Filter actions by query
    actions.forEach((act) => {
      if (!q || act.title.toLowerCase().includes(q) || (act.subtitle && act.subtitle.toLowerCase().includes(q))) {
        result.push(act);
      }
    });

    // 3. Affichage / Vues
    const views: PaletteActionItem[] = [
      {
        id: 'view-table',
        category: 'Affichage',
        title: 'Vue Tableau d’entreprise',
        subtitle: 'Affichage compact sans défilement horizontal',
        badge: viewMode === 'table' ? 'Actif' : undefined,
        icon: <List className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
        onSelect: () => onViewModeChange('table'),
      },
      {
        id: 'view-grid',
        category: 'Affichage',
        title: 'Vue Grille de Cartes',
        subtitle: 'Affichage en cartes avec KPIs détaillés',
        badge: viewMode === 'grid' ? 'Actif' : undefined,
        icon: <LayoutGrid className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
        onSelect: () => onViewModeChange('grid'),
      },
      {
        id: 'view-map',
        category: 'Affichage',
        title: 'Vue Carte Interactive (OpenStreetMap)',
        subtitle: 'Localiser les fournisseurs marocains et internationaux sur la carte',
        badge: viewMode === 'map' ? 'Actif' : undefined,
        icon: <MapIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        onSelect: () => onViewModeChange('map'),
      },
    ];
    views.forEach((v) => {
      if (!q || v.title.toLowerCase().includes(q) || (v.subtitle && v.subtitle.toLowerCase().includes(q))) {
        result.push(v);
      }
    });

    // 4. Filtres de Statut
    const statusFilters: PaletteActionItem[] = [
      {
        id: 'filter-status-all',
        category: 'Filtres Statut',
        title: 'Tous les statuts',
        subtitle: 'Afficher les fournisseurs actifs et inactifs',
        badge: statusFilter === 'all' ? 'Actif' : undefined,
        icon: <Building2 className="w-4 h-4 text-slate-500" />,
        onSelect: () => onStatusFilterChange('all'),
      },
      {
        id: 'filter-status-active',
        category: 'Filtres Statut',
        title: 'Fournisseurs Actifs uniquement',
        subtitle: 'Fournisseurs éligibles aux commandes',
        badge: statusFilter === 'active' ? 'Actif' : undefined,
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        onSelect: () => onStatusFilterChange('active'),
      },
      {
        id: 'filter-status-inactive',
        category: 'Filtres Statut',
        title: 'Fournisseurs Inactifs uniquement',
        subtitle: 'Fournisseurs désactivés / suspendus',
        badge: statusFilter === 'inactive' ? 'Actif' : undefined,
        icon: <XCircle className="w-4 h-4 text-rose-500" />,
        onSelect: () => onStatusFilterChange('inactive'),
      },
    ];
    statusFilters.forEach((sf) => {
      if (!q || sf.title.toLowerCase().includes(q)) {
        result.push(sf);
      }
    });

    // 5. Filtres par Ville (si disponibles)
    if (availableCities.length > 0) {
      availableCities.forEach((city) => {
        if (!q || city.toLowerCase().includes(q) || 'ville'.includes(q)) {
          result.push({
            id: `filter-city-${city}`,
            category: 'Filtres Ville',
            title: `Ville : ${city}`,
            subtitle: `Filtrer les fournisseurs situés à ${city}`,
            badge: cityFilter.toLowerCase() === city.toLowerCase() ? 'Sélectionné' : undefined,
            icon: <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
            onSelect: () => onCityFilterChange(city),
          });
        }
      });
    }

    return result;
  }, [
    query,
    fournisseurs,
    orderStats,
    onSelectFournisseur,
    onOpenCreateModal,
    isDarkMode,
    onToggleDarkMode,
    onExportCSV,
    onRefresh,
    demoMode,
    onToggleDemoMode,
    viewMode,
    onViewModeChange,
    statusFilter,
    onStatusFilterChange,
    availableCities,
    cityFilter,
    onCityFilterChange,
  ]);

  // Adjust selection if out of bounds
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center animate-fade-in-up">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transform transition-all"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/70">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher un fournisseur, une action, une ville... (ex: Atlas, Agadir, Thème)"
            className="w-full h-14 pl-3.5 pr-20 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            aria-label="Palette de commandes"
          />

          <div className="absolute right-4 flex items-center space-x-1.5">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded shadow-2xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100/60 dark:divide-slate-800/60"
        >
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Aucun résultat trouvé pour « {query} »</p>
              <p className="text-[11px] mt-1">Essayez avec un nom de fournisseur, une ville, ou une action comme « Thème » ou « CSV ».</p>
            </div>
          ) : (
            (() => {
              let currentCategory = '';
              return items.map((item, index) => {
                const isSelected = index === selectedIndex;
                const showCategoryHeader = item.category !== currentCategory;
                if (showCategoryHeader) {
                  currentCategory = item.category;
                }

                return (
                  <React.Fragment key={item.id}>
                    {showCategoryHeader && (
                      <div className="px-3 pt-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        {item.category}
                      </div>
                    )}
                    <button
                      type="button"
                      data-index={index}
                      onClick={() => {
                        item.onSelect();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs group ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-100 border border-teal-200/70 dark:border-teal-800/70 shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-3">
                        {item.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.shortcut && (
                          <kbd className={`hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                            isSelected
                              ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 border-teal-300/80 dark:border-teal-700/80'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}>
                            {item.shortcut}
                          </kbd>
                        )}
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isSelected
                            ? 'text-teal-600 dark:text-teal-400 translate-x-0.5'
                            : 'opacity-0 text-slate-400'
                        }`} />
                      </div>
                    </button>
                  </React.Fragment>
                );
              });
            })()
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 select-none">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              <span>Naviguer</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              <span>Valider</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">ESC</kbd>
              <span>Fermer</span>
            </span>
          </div>

          <span className="font-medium text-slate-500 dark:text-slate-400">
            {items.length} résultat{items.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

