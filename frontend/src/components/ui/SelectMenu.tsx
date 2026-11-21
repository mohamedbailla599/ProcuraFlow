import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface SelectMenuProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  menuWidth?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export function SelectMenu<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  icon,
  size = 'md',
  className = '',
  menuWidth = 'w-56',
  align = 'left',
  disabled = false,
}: SelectMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fermer avec la touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = useCallback(
    (val: T) => {
      onChange(val);
      setIsOpen(false);
    },
    [onChange]
  );

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3 text-xs',
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Bouton Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-2 rounded-xl border font-semibold transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
          sizeClasses[size]
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            : isOpen
            ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-500/80 dark:border-teal-600 text-teal-900 dark:text-teal-200 shadow-xs ring-2 ring-teal-500/20'
            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200/90 dark:border-slate-750 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-slate-300 dark:hover:border-slate-650'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <span className="text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 transition-colors">
              {icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
          }`}
        />
      </button>

      {/* Menu Déroulant Flottant */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 ${menuWidth} max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-750 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">Aucune option</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl font-medium transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/60 shadow-2xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
