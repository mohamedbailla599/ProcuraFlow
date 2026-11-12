import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpDown,
  ArrowUpZA,
  Calendar,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  LayoutGrid,
  List,
  Map as MapIcon,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';
import { findMoroccoCity } from '../../../data/moroccoCities';

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'date-desc'
  | 'rating-desc'
  | 'status-desc';

type OpenMenu = 'sort' | 'city' | 'export' | 'more' | null;

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  cityFilter: string;
  onCityFilterChange: (city: string) => void;
  availableCities: string[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  viewMode?: 'table' | 'grid' | 'map';
  onViewModeChange?: (mode: 'table' | 'grid' | 'map') => void;
  onOpenCreateModal: () => void;
  onOpenImportModal?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onRefresh: () => void;
  onClearAllFilters?: () => void;
  loading: boolean;
  exporting?: boolean;
  exportTotalCount?: number;
  fournisseursToExport: Fournisseur[];
}

interface SortMeta {
  value: SortOption;
  label: string;
  shortLabel: string;
  hint?: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortMeta[] = [
  {
    value: 'name-asc',
    label: 'Nom A–Z',
    shortLabel: 'Nom A–Z',
    icon: <ArrowDownAZ className="w-3.5 h-3.5" />,
  },
  {
    value: 'name-desc',
    label: 'Nom Z–A',
    shortLabel: 'Nom Z–A',
    icon: <ArrowUpZA className="w-3.5 h-3.5" />,
  },
  {
    value: 'date-desc',
    label: 'Date de création',
    shortLabel: 'Date créat.',
    hint: 'Plus récents d’abord',
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  {
    value: 'rating-desc',
    label: 'Évaluation',
    shortLabel: 'Évaluation',
    hint: 'Meilleures notes',
    icon: <Star className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    value: 'status-desc',
    label: 'Statut',
    shortLabel: 'Statut',
    hint: 'Actifs en premier',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
];

const STATUS_TABS: Array<{
  value: 'all' | 'active' | 'inactive';
  label: string;
  dotClass?: string;
}> = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs', dotClass: 'bg-emerald-500' },
  { value: 'inactive', label: 'Inactifs', dotClass: 'bg-slate-400 dark:bg-slate-500' },
];

const VIEW_MODES: Array<{
  value: 'table' | 'grid' | 'map';
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'table', label: 'Vue Liste', icon: <List className="w-4 h-4" /> },
  { value: 'grid', label: 'Vue Cartes', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'map', label: 'Carte Géographique', icon: <MapIcon className="w-4 h-4" /> },
];

const CONTROL_FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 dark:focus-visible:ring-teal-400/40';

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  cityFilter,
  onCityFilterChange,
  availableCities,
  totalCount,
  activeCount,
  inactiveCount,
  viewMode = 'table',
  onViewModeChange,
  onOpenCreateModal,
  onOpenImportModal,
  onExportCSV,
  onExportPDF,
  onRefresh,
  onClearAllFilters,
  loading,
  exporting = false,
  exportTotalCount,
  fournisseursToExport,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [citySearch, setCitySearch] = useState('');

  // Close popovers on outside click / Escape and bind '/' shortcut to search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        return;
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reset local city popover query whenever menu closes
  useEffect(() => {
    if (openMenu !== 'city' && citySearch) {
      setCitySearch('');
    }
  }, [openMenu, citySearch]);

  const toggleMenu = (menu: Exclude<OpenMenu, null>) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role^="menuitem"]:not(:disabled)')
    );
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const triggerExportCSV = () => {
    setOpenMenu(null);
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    if (fournisseursToExport.length === 0) return;
    const headers = ['ID', 'Nom', 'Email', 'Telephone', 'Adresse', 'Statut', 'DateCreation'];
    const rows = fournisseursToExport.map((f) => [
      f.id,
      `"${f.nom.replace(/"/g, '""')}"`,
      `"${f.email}"`,
      `"${f.telephone || ''}"`,
      `"${(f.adresse || '').replace(/"/g, '""')}"`,
      f.actif ? 'Actif' : 'Inactif',
      f.createdAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `fournisseurs_procuraflow_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerExportPDF = () => {
    setOpenMenu(null);
    onExportPDF?.();
  };

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];
  const isSortCustom = sortBy !== 'name-asc';
  const isCityCustom = cityFilter !== 'all';
  const hasTrimmedSearch = searchTerm.trim().length > 0;
  const hasActiveFilters =
    hasTrimmedSearch || statusFilter !== 'all' || isCityCustom || isSortCustom;

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return availableCities;
    return availableCities.filter((city) => city.toLowerCase().includes(q));
  }, [availableCities, citySearch]);

  const statusCounts: Record<'all' | 'active' | 'inactive', number> = {
    all: totalCount,
    active: activeCount,
    inactive: inactiveCount,
  };

  const handleSegmentedKeyDown = <T extends string>(
    e: React.KeyboardEvent,
    items: T[],
    current: T,
    onSelect: (val: T) => void
  ) => {
    const idx = items.indexOf(current);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelect(items[(idx + 1) % items.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelect(items[(idx - 1 + items.length) % items.length]);
    }
  };

  const handleClearAll = () => {
    setOpenMenu(null);
    if (onClearAllFilters) {
      onClearAllFilters();
      return;
    }
    onSearchChange('');
    onStatusFilterChange('all');
    onCityFilterChange('all');
    onSortChange('name-asc');
  };

  const secondaryBtnBase = `h-9 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-medium shadow-2xs transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer ${CONTROL_FOCUS_RING}`;

  const activeFilterChips: Array<{
    key: string;
    category: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    onRemove: () => void;
  }> = [];

  if (hasTrimmedSearch) {
    activeFilterChips.push({
      key: 'search',
      category: 'Recherche',
      value: `"${searchTerm.trim()}"`,
      icon: <Search className="w-3 h-3 text-sky-500" />,
      colorClass:
        'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/90 dark:border-sky-800/60 text-sky-900 dark:text-sky-200',
      onRemove: () => onSearchChange(''),
    });
  }
  if (statusFilter !== 'all') {
    activeFilterChips.push({
      key: 'status',
      category: 'Statut',
      value: statusFilter === 'active' ? 'Actif' : 'Inactif',
      icon:
        statusFilter === 'active' ? (
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
        ) : (
          <SlidersHorizontal className="w-3 h-3 text-slate-500" />
        ),
      colorClass:
        statusFilter === 'active'
          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/90 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
          : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200',
      onRemove: () => onStatusFilterChange('all'),
    });
  }
  if (isCityCustom) {
    activeFilterChips.push({
      key: 'city',
      category: 'Ville',
      value: cityFilter,
      icon: <MapPin className="w-3 h-3 text-teal-500" />,
      colorClass:
        'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200/90 dark:border-teal-800/60 text-teal-900 dark:text-teal-200',
      onRemove: () => onCityFilterChange('all'),
    });
  }
  if (isSortCustom) {
    activeFilterChips.push({
      key: 'sort',
      category: 'Tri',
      value: currentSort.label,
      icon: <ArrowUpDown className="w-3 h-3 text-violet-500" />,
      colorClass:
        'bg-violet-50/80 dark:bg-violet-950/40 border-violet-200/90 dark:border-violet-800/60 text-violet-900 dark:text-violet-200',
      onRemove: () => onSortChange('name-asc'),
    });
  }

  const exportCount = exportTotalCount ?? fournisseursToExport.length;

  return (
    <section
      ref={toolbarRef}
      aria-label="Barre de filtrage et d'actions fournisseurs"
      className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs mb-5 transition-colors duration-200"
    >
      {/* Main Toolbar Row */}
      <div className="p-3 sm:px-4 sm:py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
        {/* Left Cluster: Search + Status Segmented + Sort + Location */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 2xl:gap-2 flex-1 min-w-0">
          {/* 1. Primary Search Input (full-width on narrow phones, fluid up to 220px at xl / 320px at 2xl) */}
          <div className="group relative basis-full sm:basis-auto sm:flex-1 sm:min-w-[150px] sm:max-w-[220px] 2xl:max-w-xs">
            <Search
              aria-hidden="true"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-400 transition-colors pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher nom, email, ville..."
              aria-label="Rechercher un fournisseur"
              className="w-full h-9 pl-9 pr-9 text-xs font-medium bg-slate-50/90 dark:bg-slate-950/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 border border-slate-200/90 dark:border-slate-700/80 focus:border-teal-500 dark:focus:border-teal-400 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400/75 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-150"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer ${CONTROL_FOCUS_RING}`}
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd
                title="Appuyez sur / pour rechercher"
                className="hidden sm:inline-flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 h-5 min-w-[20px] px-1.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs pointer-events-none select-none"
              >
                /
              </kbd>
            )}
          </div>

          {/* 2. Segmented Status Control */}
          <div
            role="tablist"
            aria-label="Filtrer par statut d'éligibilité"
            className="inline-flex h-9 items-center rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-0.5 shrink-0 max-w-full overflow-x-auto"
          >
            {STATUS_TABS.map((tab) => {
              const selected = statusFilter === tab.value;
              const count = statusCounts[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onStatusFilterChange(tab.value)}
                  onKeyDown={(e) =>
                    handleSegmentedKeyDown(
                      e,
                      STATUS_TABS.map((t) => t.value),
                      tab.value,
                      onStatusFilterChange
                    )
                  }
                  className={`h-full px-2.5 sm:px-3 rounded-[7px] text-xs transition-all duration-150 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${CONTROL_FOCUS_RING} ${
                    selected
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  {tab.dotClass && (
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dotClass}`}
                    />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-px rounded-full font-mono tabular-nums ${
                      selected
                        ? tab.value === 'active'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700/90 text-slate-700 dark:text-slate-200'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. Sorting Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleMenu('sort')}
              aria-haspopup="menu"
              aria-expanded={openMenu === 'sort'}
              title={`Trier par : ${currentSort.label}`}
              className={`h-9 px-2.5 rounded-lg border text-xs inline-flex items-center gap-1.5 whitespace-nowrap transition-all duration-150 cursor-pointer ${CONTROL_FOCUS_RING} ${
                openMenu === 'sort' || isSortCustom
                  ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-300/90 dark:border-teal-700/80 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-medium shadow-2xs'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="hidden sm:inline">
                {isSortCustom ? currentSort.shortLabel : 'Trier'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-150 ${
                  openMenu === 'sort' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openMenu === 'sort' && (
              <div
                role="menu"
                aria-label="Options de tri"
                onKeyDown={handleMenuKeyDown}
                className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700/90 py-1.5 z-50"
              >
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Trier par
                  </span>
                  {isSortCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        onSortChange('name-asc');
                        setOpenMenu(null);
                      }}
                      className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className="py-1">
                  {SORT_OPTIONS.map((opt) => {
                    const selected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          onSortChange(opt.value);
                          setOpenMenu(null);
                        }}
                        className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={
                              selected
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }
                          >
                            {opt.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate">{opt.label}</div>
                            {opt.hint && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                {opt.hint}
                              </div>
                            )}
                          </div>
                        </div>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Location (Ville) Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleMenu('city')}
              aria-haspopup="menu"
              aria-expanded={openMenu === 'city'}
              title={
                isCityCustom
                  ? `Localisation filtrée : ${cityFilter}`
                  : 'Filtrer par ville'
              }
              className={`h-9 px-2.5 rounded-lg border text-xs inline-flex items-center gap-1.5 whitespace-nowrap max-w-[175px] transition-all duration-150 cursor-pointer ${CONTROL_FOCUS_RING} ${
                openMenu === 'city' || isCityCustom
                  ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-300/90 dark:border-teal-700/80 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-medium shadow-2xs'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="truncate hidden sm:inline">
                {isCityCustom ? cityFilter : 'Ville'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-150 ${
                  openMenu === 'city' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openMenu === 'city' && (
              <div
                role="menu"
                aria-label="Filtrer par localisation"
                onKeyDown={handleMenuKeyDown}
                className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700/90 py-1.5 z-50"
              >
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Villes du Maroc ({availableCities.length})
                  </span>
                  {isCityCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        onCityFilterChange('all');
                        setOpenMenu(null);
                      }}
                      className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {availableCities.length > 6 && (
                  <div className="px-2.5 pt-2 pb-1">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Rechercher une ville (ex: Guelmim)..."
                      aria-label="Filtrer la liste des villes"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div className="py-1 max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={cityFilter === 'all'}
                    onClick={() => {
                      onCityFilterChange('all');
                      setOpenMenu(null);
                    }}
                    className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      cityFilter === 'all'
                        ? 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe
                        className={`w-3.5 h-3.5 ${
                          cityFilter === 'all'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span>Toutes les villes</span>
                    </div>
                    {cityFilter === 'all' && (
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    )}
                  </button>

                  {availableCities.length > 0 && (
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  )}

                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => {
                      const selected = cityFilter.toLowerCase() === city.toLowerCase();
                      const moroccoInfo = findMoroccoCity(city);
                      return (
                        <button
                          key={city}
                          type="button"
                          role="menuitemradio"
                          aria-checked={selected}
                          onClick={() => {
                            onCityFilterChange(city);
                            setOpenMenu(null);
                          }}
                          className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                            selected
                              ? 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                selected
                                  ? 'text-teal-600 dark:text-teal-400'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                            <div className="truncate">
                              <span className="block truncate">{city}</span>
                              {moroccoInfo && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate font-normal">
                                  {moroccoInfo.region}
                                </span>
                              )}
                            </div>
                          </div>
                          {selected && (
                            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                      {availableCities.length === 0
                        ? 'Aucune ville répertoriée'
                        : 'Aucune ville correspondante'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subtle vertical divider on wide screens */}
        <div
          aria-hidden="true"
          className="hidden xl:block w-px h-5 bg-slate-200/80 dark:bg-slate-800 shrink-0"
        />

        {/* Right Cluster: Unified View Selector + Import + Export Dropdown + Refresh + CTA */}
        <div className="flex items-center gap-1.5 2xl:gap-2 shrink-0">
          {/* 5. Unified View Selector (List / Grid / Map) */}
          <div
            role="tablist"
            aria-label="Mode d'affichage des fournisseurs"
            className="inline-flex h-9 items-center rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-0.5 shrink-0"
          >
            {VIEW_MODES.map((mode) => {
              const selected = viewMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={mode.label}
                  aria-label={mode.label}
                  onClick={() => onViewModeChange?.(mode.value)}
                  onKeyDown={(e) => {
                    if (!onViewModeChange) return;
                    handleSegmentedKeyDown(
                      e,
                      VIEW_MODES.map((m) => m.value),
                      mode.value,
                      onViewModeChange
                    );
                  }}
                  className={`h-full w-8 inline-flex items-center justify-center rounded-[7px] transition-all duration-150 cursor-pointer ${CONTROL_FOCUS_RING} ${
                    selected
                      ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-2xs ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {mode.icon}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 2xl:gap-2">
            {/* Desktop/Tablet Utilities: Importer, Exporter Dropdown, Refresh */}
            <div className="hidden md:flex items-center gap-1.5 2xl:gap-2">
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  title="Importer des fournisseurs (CSV / Excel)"
                  className={`${secondaryBtnBase} px-3 font-semibold`}
                >
                  <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Importer</span>
                </button>
              )}

              {/* Unified Export Dropdown (CSV + PDF) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleMenu('export')}
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'export'}
                  title="Exporter les données"
                  className={`${secondaryBtnBase} px-3 font-semibold ${
                    openMenu === 'export'
                      ? 'border-teal-300 dark:border-teal-700 bg-slate-50 dark:bg-slate-800'
                      : ''
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Exporter</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-60 transition-transform duration-150 ${
                      openMenu === 'export' ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openMenu === 'export' && (
                  <div
                    role="menu"
                    aria-label="Options d'exportation"
                    onKeyDown={handleMenuKeyDown}
                    className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700/90 py-1.5 z-50"
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Exporter</span>
                      <span className="font-mono font-medium normal-case text-slate-400 dark:text-slate-500">
                        {exportCount} résultat{exportCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={exportCount === 0 || exporting}
                        onClick={triggerExportCSV}
                        className="w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            Exporter en CSV
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            Données tabulaires UTF-8 (tous les résultats filtrés)
                          </div>
                        </div>
                      </button>

                      {onExportPDF && (
                        <button
                          type="button"
                          role="menuitem"
                          disabled={exportCount === 0 || exporting}
                          onClick={triggerExportPDF}
                          className="w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              Exporter en PDF
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              Rapport ProcuraFlow complet filtré
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Actualiser les données"
                aria-label="Actualiser les données"
                className={`${secondaryBtnBase} w-9 justify-center disabled:opacity-50`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loading ? 'animate-spin text-teal-600 dark:text-teal-400' : ''
                  }`}
                />
              </button>
            </div>

            {/* Mobile/Compact Overflow Menu (< md) */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => toggleMenu('more')}
                aria-haspopup="menu"
                aria-expanded={openMenu === 'more'}
                aria-label="Plus d'actions (Importer, Exporter, Actualiser)"
                className={`${secondaryBtnBase} px-2.5`}
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="text-xs font-semibold">Actions</span>
              </button>

              {openMenu === 'more' && (
                <div
                  role="menu"
                  aria-label="Actions secondaires"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700/90 py-1.5 z-50"
                >
                  {onOpenImportModal && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null);
                        onOpenImportModal();
                      }}
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Importer (CSV / Excel)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    disabled={exportCount === 0 || exporting}
                    onClick={triggerExportCSV}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Exporter en CSV ({exportCount})</span>
                  </button>

                  {onExportPDF && (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={exportCount === 0 || exporting}
                      onClick={triggerExportPDF}
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span>Exporter en PDF</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    role="menuitem"
                    disabled={loading}
                    onClick={() => {
                      setOpenMenu(null);
                      onRefresh();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loading ? 'animate-spin text-teal-600 dark:text-teal-400' : ''
                      }`}
                    />
                    <span>Actualiser les données</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Primary Creation CTA (Icon-only to save space and preserve single-line toolbar) */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              title="Nouveau Fournisseur"
              aria-label="Nouveau Fournisseur"
              className={`h-9 w-9 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-xs hover:shadow-sm inline-flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.95] cursor-pointer ${CONTROL_FOCUS_RING}`}
            >
              <Plus className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Active Filters Strip */}
      {hasActiveFilters && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 via-slate-50/40 to-slate-50/80 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/40 px-3.5 sm:px-4 py-2.5 rounded-b-2xl flex flex-wrap items-center justify-between gap-2.5 transition-all">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
              <SlidersHorizontal className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>Filtres ({activeFilterChips.length})</span>
            </span>

            {activeFilterChips.map((chip) => (
              <span
                key={chip.key}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs border shadow-2xs transition-all hover:shadow-xs ${chip.colorClass}`}
              >
                {chip.icon}
                <span className="text-[10px] font-semibold opacity-75 uppercase tracking-wider">
                  {chip.category} :
                </span>
                <span className="font-bold">{chip.value}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Supprimer le filtre ${chip.category}`}
                  title={`Supprimer le filtre ${chip.category}`}
                  className="p-0.5 ml-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/15 text-current transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      )}
    </section>
  );
};
