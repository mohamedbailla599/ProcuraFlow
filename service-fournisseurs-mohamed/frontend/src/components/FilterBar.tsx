import React from 'react';
import { Search, Plus, RefreshCw, X } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenCreateModal,
  onRefresh,
  loading,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => onStatusFilterChange('active')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Actifs
          </button>
          <button
            onClick={() => onStatusFilterChange('inactive')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-white text-rose-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactifs
          </button>
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-teal-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser la liste"
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>
    </div>
  );
};

