import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronDown, Check } from 'lucide-react';
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
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setIsPageSizeOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPageSizeOpen(false);
      }
    };
    if (isPageSizeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPageSizeOpen]);

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
        {/* Modern Custom Page-size selector */}
        <div ref={pageSizeRef} className="relative flex items-center gap-2">
          <span
            id="suppliers-page-size-label"
            className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Par page
          </span>

          <button
            type="button"
            id="suppliers-page-size"
            aria-haspopup="listbox"
            aria-expanded={isPageSizeOpen}
            aria-labelledby="suppliers-page-size-label suppliers-page-size"
            disabled={loading}
            onClick={() => setIsPageSizeOpen((prev) => !prev)}
            className={`h-9 pl-3 pr-2.5 text-xs font-semibold rounded-xl border transition-all duration-150 inline-flex items-center gap-2 shadow-2xs cursor-pointer ${
              isPageSizeOpen
                ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-500/90 dark:border-teal-600/80 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="tabular-nums font-bold">{size}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                isPageSizeOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
              }`}
            />
          </button>

          {/* Floating Upward Popover */}
          {isPageSizeOpen && (
            <div
              role="listbox"
              aria-labelledby="suppliers-page-size-label"
              className="absolute right-0 bottom-full mb-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 rounded-xl shadow-xl py-1.5 z-50 animate-scale-in"
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Lignes par page
              </div>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <div className="py-0.5">
                {PAGE_SIZE_OPTIONS.map((option) => {
                  const isSelected = size === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onPageSizeChange(option);
                        setIsPageSizeOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-semibold">{option}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                          lignes
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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

