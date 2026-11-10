import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  X,
  LayoutGrid,
  List,
  Download,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpZA,
  ShoppingBag,
  Clock,
  History,
  Hash,
  MapPin,
  Globe,
  Check,
  Star,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'rating-desc'
  | 'commands-desc'
  | 'date-desc'
  | 'date-asc'
  | 'id-asc';

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
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  loading: boolean;
  fournisseursToExport: Fournisseur[];
}

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
  onRefresh,
  loading,
  fournisseursToExport,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  const sortContainerRef = useRef<HTMLDivElement>(null);
  const cityContainerRef = useRef<HTMLDivElement>(null);

  // Close custom dropdowns on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortContainerRef.current && !sortContainerRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (cityContainerRef.current && !cityContainerRef.current.contains(e.target as Node)) {
        setIsCityOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSortOpen(false);
        setIsCityOpen(false);
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
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

  // Export to CSV helper
  const handleExportCSV = () => {
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
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fournisseurs_procuraflow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'name-asc', label: 'Nom (A → Z)', icon: <ArrowDownAZ className="w-3.5 h-3.5" /> },
    { value: 'name-desc', label: 'Nom (Z → A)', icon: <ArrowUpZA className="w-3.5 h-3.5" /> },
    { value: 'rating-desc', label: 'Mieux notés d\'abord', icon: <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> },
    { value: 'commands-desc', label: 'Nb Commandes (Plus élevé)', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { value: 'date-desc', label: "Plus récents d'abord", icon: <Clock className="w-3.5 h-3.5" /> },
    { value: 'date-asc', label: "Plus anciens d'abord", icon: <History className="w-3.5 h-3.5" /> },
    { value: 'id-asc', label: 'ID (Croissant)', icon: <Hash className="w-3.5 h-3.5" /> },
  ];

  const getSortTitle = (sort: SortOption): string => {
    const match = sortOptions.find((o) => o.value === sort);
    return match ? `Tri : ${match.label}` : 'Trier la liste';
  };

  const isSortCustom = sortBy !== 'name-asc';
  const isCityCustom = cityFilter !== 'all';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-xs mb-5 transition-all duration-200 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Search Bar, Status Filter & Custom Popover Menus */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs md:max-w-sm lg:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-px rounded shadow-2xs">
                /
              </kbd>
            )}
          </div>

          {/* Segmented Status Tabs with integrated count badges */}
          <div className="inline-flex h-9 rounded-lg border border-slate-200/90 dark:border-slate-700 p-0.5 bg-slate-100/80 dark:bg-slate-800/80 text-xs font-semibold shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`h-full px-2.5 sm:px-3 rounded-md transition-all duration-150 active:scale-95 flex items-center space-x-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Tous</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                {totalCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('active')}
              className={`h-full px-2.5 sm:px-3 rounded-md transition-all duration-150 active:scale-95 flex items-center space-x-1.5 ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Actifs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                {activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('inactive')}
              className={`h-full px-2.5 sm:px-3 rounded-md transition-all duration-150 active:scale-95 flex items-center space-x-1.5 ${
                statusFilter === 'inactive'
                  ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Inactifs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* 1. Custom Popover: Sorting */}
          <div ref={sortContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSortOpen((prev) => !prev);
                setIsCityOpen(false);
              }}
              title={getSortTitle(sortBy)}
              aria-expanded={isSortOpen}
              className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-150 shadow-2xs group active:scale-95 ${
                isSortOpen || isSortCustom
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 shadow-xs ring-2 ring-teal-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-4 h-4 transition-transform group-hover:scale-105" />
              {isSortCustom && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Custom Popover Menu */}
            {isSortOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Trier les fournisseurs</span>
                  {isSortCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        onSortChange('name-asc');
                        setIsSortOpen(false);
                      }}
                      className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 normal-case font-semibold text-[11px]"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className="py-1">
                  {sortOptions.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onSortChange(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}>
                            {opt.icon}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Custom Popover: City Filter */}
          <div ref={cityContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsCityOpen((prev) => !prev);
                setIsSortOpen(false);
              }}
              title={
                isCityCustom
                  ? `Ville filtrée : ${cityFilter} (cliquer pour modifier)`
                  : 'Filtrer par ville : Toutes les villes'
              }
              aria-expanded={isCityOpen}
              className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-150 shadow-2xs group active:scale-95 ${
                isCityOpen || isCityCustom
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 shadow-xs ring-2 ring-teal-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 transition-transform group-hover:scale-105" />
              {isCityCustom && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Custom Popover Menu */}
            {isCityOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Filtrer par ville</span>
                  {isCityCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        onCityFilterChange('all');
                        setIsCityOpen(false);
                      }}
                      className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 normal-case font-semibold text-[11px]"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                <div className="py-1 max-h-60 overflow-y-auto">
                  {/* Option: Toutes les villes */}
                  <button
                    type="button"
                    onClick={() => {
                      onCityFilterChange('all');
                      setIsCityOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                      cityFilter === 'all'
                        ? 'bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Globe className={`w-3.5 h-3.5 ${cityFilter === 'all' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>Toutes les villes</span>
                    </div>
                    {cityFilter === 'all' && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* List of detected cities */}
                  {availableCities.length > 0 ? (
                    availableCities.map((city) => {
                      const isSelected = cityFilter.toLowerCase() === city.toLowerCase();
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            onCityFilterChange(city);
                            setIsCityOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                            isSelected
                              ? 'bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span>{city}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                      Aucune ville répertoriée
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: View Mode + Utilities + CTA */}
        <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0">
          {/* View mode toggle (Table / Grid) */}
          <div className="inline-flex h-9 rounded-lg border border-slate-200/90 dark:border-slate-700 p-0.5 bg-slate-100/80 dark:bg-slate-800/80 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('table')}
              title="Affichage Tableau"
              aria-label="Affichage Tableau"
              className={`h-full px-2.5 rounded-md transition-all duration-150 active:scale-95 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('grid')}
              title="Affichage Cartes"
              aria-label="Affichage Cartes"
              className={`h-full px-2.5 rounded-md transition-all duration-150 active:scale-95 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCSV}
            title="Exporter les fournisseurs filtrés (CSV)"
            aria-label="Exporter CSV"
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all duration-150 active:scale-[0.97] flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Actualiser les données"
            aria-label="Actualiser les données"
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600 dark:text-teal-400' : ''}`} />
          </button>

          {/* Create CTA Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="h-9 px-3.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm hover:shadow-md flex items-center space-x-1.5 transition-all duration-150 active:scale-[0.97] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Fournisseur</span>
          </button>
        </div>
      </div>
    </div>
  );
};
