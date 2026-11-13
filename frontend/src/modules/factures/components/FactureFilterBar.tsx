import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { FactureStatusFilter, FactureSortOption, FactureViewMode } from '../types';

interface FactureFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: FactureStatusFilter;
  onStatusChange: (status: FactureStatusFilter) => void;
  sortBy: FactureSortOption;
  onSortChange: (sort: FactureSortOption) => void;
  viewMode: FactureViewMode;
  onViewModeChange: (mode: FactureViewMode) => void;
  onOpenCreateModal?: () => void;
  onCreateFacture?: () => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  loading?: boolean;
  isRefreshing?: boolean;
  totalFiltered?: number;
  filteredCount?: number;
  totalCount?: number;
}

export const FactureFilterBar: React.FC<FactureFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
  onCreateFacture,
  onRefresh,
  onExportCSV,
  onExportPDF,
  loading = false,
  isRefreshing = false,
  totalFiltered,
  filteredCount,
}) => {
  const triggerCreate = onCreateFacture || onOpenCreateModal || (() => {});
  const displayFiltered = totalFiltered ?? filteredCount ?? 0;
  const isLoading = loading || isRefreshing;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier "/" pour cibler la recherche
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1 min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par N° facture (ex: FAC-2026), commande, réception..."
            className="w-full pl-10 pr-16 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-750 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex absolute right-3 top-2.5 items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              /
            </kbd>
          )}
        </div>

        {/* Boutons d'actions principales */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Actualiser */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            loading={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            title="Rafraîchir les données"
          >
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          {/* Export CSV */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportCSV}
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            title="Exporter en CSV"
          >
            <span className="hidden sm:inline">CSV</span>
          </Button>

          {/* Export PDF */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportPDF}
            icon={<FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
            title="Générer un PDF professionnel"
          >
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {/* Nouvelle Facture */}
          <Button
            variant="primary"
            size="sm"
            onClick={triggerCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            Nouvelle Facture
          </Button>
        </div>
      </div>

      {/* Rangée inférieure : Filtres de statut, Tri et Switch de vue */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-150 dark:border-slate-800 text-xs">
        {/* Onglets Filtres de Statut */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-750 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all duration-150 ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Toutes
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('NON_PAYEE')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all duration-150 ${
              statusFilter === 'NON_PAYEE'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Non Payées
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('PAYEE')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all duration-150 ${
              statusFilter === 'PAYEE'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Payées
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('ANNULEE')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all duration-150 ${
              statusFilter === 'ANNULEE'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Annulées
          </button>
        </div>

        {/* Contrôles de droite : Tri & Bascule Vue */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Sélecteur de Tri */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
              Trier par :
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as FactureSortOption)}
              className="py-1 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="date_desc">Date récente</option>
              <option value="date_asc">Date ancienne</option>
              <option value="montant_desc">Montant décroissant</option>
              <option value="montant_asc">Montant croissant</option>
              <option value="id_desc">Dernier ID créé</option>
            </select>
          </div>

          {/* Switch Tableau / Cartes */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-750">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vue Tableau"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vue Grille de Cartes"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-1">
            {displayFiltered} résultat{displayFiltered > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
