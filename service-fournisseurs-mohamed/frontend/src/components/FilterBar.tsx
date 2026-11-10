import React, { useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  X,
  LayoutGrid,
  List,
  Download,
  ArrowUpDown,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';

export type SortOption =
  | 'name-asc'
  | 'name-desc'
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

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs mb-5 transition-all duration-200 animate-fade-in-up">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: Search Bar, Status Filter & Sorting / City Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs md:max-w-sm lg:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-px rounded shadow-2xs">
                /
              </kbd>
            )}
          </div>

          {/* Segmented Status Tabs with integrated count badges */}
          <div className="inline-flex h-9 rounded-lg border border-slate-200/90 p-0.5 bg-slate-100/80 text-xs font-semibold shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`h-full px-3 rounded-md transition-all duration-150 active:scale-95 flex items-center space-x-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Tous</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-mono">
                {totalCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('active')}
              className={`h-full px-3 rounded-md transition-all duration-150 active:scale-95 flex items-center space-x-1.5 ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Actifs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                {activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('inactive')}
              className={`h-full px-3 rounded-md transition-all duration-150 active:scale-95 flex items-center space-x-1.5 ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Inactifs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* 1. Sorting Selector with Icon */}
          <div className="relative inline-flex items-center shrink-0">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="h-9 pl-8 pr-7 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer appearance-none shadow-2xs"
              title="Trier la liste des fournisseurs"
            >
              <option value="name-asc">Nom (A → Z)</option>
              <option value="name-desc">Nom (Z → A)</option>
              <option value="commands-desc">Nb Commandes ↓</option>
              <option value="date-desc">Plus récents</option>
              <option value="date-asc">Plus anciens</option>
              <option value="id-asc">ID (Croissant)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* 2. City Filter Selector with Icon */}
          <div className="relative inline-flex items-center shrink-0">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => onCityFilterChange(e.target.value)}
              className="h-9 pl-8 pr-7 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer appearance-none shadow-2xs"
              title="Filtrer par ville"
            >
              <option value="all">Toutes les villes</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Right: View Mode + Utilities + CTA */}
        <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 xl:pt-0">
          {/* View mode toggle (Table / Grid) */}
          <div className="inline-flex h-9 rounded-lg border border-slate-200/90 p-0.5 bg-slate-100/80 shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('table')}
              title="Affichage Tableau"
              aria-label="Affichage Tableau"
              className={`h-full px-2.5 rounded-md transition-all duration-150 active:scale-95 ${
                viewMode === 'table'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
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
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
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
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-xs transition-all duration-150 active:scale-[0.97] flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Actualiser les données"
            aria-label="Actualiser les données"
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-xs transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
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
