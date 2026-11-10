import React, { useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  X,
  LayoutGrid,
  List,
  Download,
  Filter,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  loading: boolean;
  totalFiltered: number;
  fournisseursToExport: Fournisseur[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onOpenCreateModal,
  onRefresh,
  loading,
  totalFiltered,
  fournisseursToExport,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
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
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fournisseurs_procuraflow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
      {/* Left: Search input & Status Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        {/* Search input with focus glow */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom ou email... (appuyer sur /)"
            className="w-full pl-10 pr-9 py-2 text-sm bg-white border border-slate-200/90 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all placeholder:text-slate-400"
          />
          {searchTerm ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
              /
            </span>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="inline-flex rounded-xl border border-slate-200/90 p-1 bg-slate-100/70 text-xs font-semibold shadow-inner">
          <button
            onClick={() => onStatusFilterChange('active')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs scale-100 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Actifs
          </button>
          <button
            onClick={() => onStatusFilterChange('inactive')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              statusFilter === 'inactive'
                ? 'bg-white text-rose-700 shadow-xs scale-100 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactifs
          </button>
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
              statusFilter === 'all'
                ? 'bg-white text-teal-700 shadow-xs scale-100 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous
          </button>
        </div>

        {/* Total found badge */}
        <span className="hidden lg:flex items-center text-xs font-medium text-slate-500 bg-slate-100/70 border border-slate-200/70 px-2.5 py-1 rounded-lg">
          <Filter className="w-3 h-3 text-slate-400 mr-1.5" />
          {totalFiltered} résultat{totalFiltered > 1 ? 's' : ''}
        </span>
      </div>

      {/* Right: View Mode Toggle + Export + Create Button */}
      <div className="flex items-center space-x-2">
        {/* View Switcher (Table vs Grid) */}
        <div className="inline-flex rounded-xl border border-slate-200/90 p-1 bg-slate-100/70 shadow-inner">
          <button
            onClick={() => onViewModeChange('table')}
            title="Vue Tableau"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            title="Vue Cartes"
            className={`p-1.5 rounded-lg transition-all ${
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
          onClick={handleExportCSV}
          title="Exporter la liste au format CSV"
          className="p-2 border border-slate-200/90 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser la liste"
          className="p-2 border border-slate-200/90 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>

        {/* Create Primary Button */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-teal-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>
    </div>
  );
};
