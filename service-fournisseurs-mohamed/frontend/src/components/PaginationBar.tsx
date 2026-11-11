import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, PageSizeOption, buildPageNumbers } from '../utils/pagination';

interface PaginationBarProps {
  page: number; // 0-indexed
  size: number;
  totalElements: number;
  totalPages: number;
  currentCount: number;
  loading?: boolean;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: PageSizeOption) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  size,
  totalElements,
  totalPages,
  currentCount,
  loading = false,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeTotalPages = Math.max(0, totalPages);
  const startItem = totalElements === 0 || currentCount === 0 ? 0 : page * size + 1;
  const endItem = totalElements === 0 || currentCount === 0 ? 0 : Math.min(totalElements, startItem + currentCount - 1);

  const isFirst = page <= 0;
  const isLast = safeTotalPages === 0 || page >= safeTotalPages - 1;
  const pageTokens = buildPageNumbers(page, safeTotalPages);

  return (
    <nav
      aria-label="Pagination des fournisseurs"
      className="mt-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs px-4 sm:px-5 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 transition-colors"
    >
      {/* Left: Results summary & current page indicator */}
      <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
        {totalElements === 0 ? (
          <span>
            Affichage <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">0</strong> sur{' '}
            <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">0</strong> fournisseur
          </span>
        ) : (
          <span>
            Affichage{' '}
            <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {startItem}–{endItem}
            </strong>{' '}
            sur{' '}
            <strong className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {totalElements}
            </strong>{' '}
            {totalElements > 1 ? 'fournisseurs' : 'fournisseur'}
          </span>
        )}

        {safeTotalPages > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 tabular-nums">
            Page {page + 1} sur {safeTotalPages}
          </span>
        )}
      </div>

      {/* Right: Page size selector & page navigation controls */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
        {/* Page-size selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="suppliers-page-size"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Par page
          </label>
          <select
            id="suppliers-page-size"
            value={size}
            disabled={loading}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="h-9 pl-2.5 pr-7 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation buttons */}
        {safeTotalPages > 0 && (
          <div className="flex items-center gap-1" role="group" aria-label="Navigation entre les pages">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={isFirst || loading}
              className="h-9 inline-flex items-center gap-1 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            <div className="flex items-center gap-1 mx-0.5">
              {pageTokens.map((token, idx) =>
                token === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    aria-hidden="true"
                    className="w-8 h-9 inline-flex items-center justify-center text-slate-400 dark:text-slate-500 select-none"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </span>
                ) : (
                  <button
                    key={`page-${token}`}
                    type="button"
                    onClick={() => {
                      if (token !== page && !loading) {
                        onPageChange(token);
                      }
                    }}
                    disabled={loading && token !== page}
                    aria-current={token === page ? 'page' : undefined}
                    aria-label={`Page ${token + 1}`}
                    className={`min-w-[2.25rem] h-9 px-2 inline-flex items-center justify-center text-xs font-semibold rounded-xl tabular-nums transition-all cursor-pointer ${
                      token === page
                        ? 'bg-teal-600 text-white shadow-xs border border-teal-600 dark:bg-teal-500 dark:border-teal-500'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50'
                    }`}
                  >
                    {token + 1}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={isLast || loading}
              className="h-9 inline-flex items-center gap-1 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              aria-label="Page suivante"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

