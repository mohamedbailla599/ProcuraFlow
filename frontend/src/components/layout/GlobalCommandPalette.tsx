import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Moon,
  Sun,
  Building2,
  ShoppingBag,
  Truck,
  Receipt,
  Sparkles,
  Command,
  ArrowRight,
  Activity,
  Layers,
  PanelLeft,
} from 'lucide-react';
import { useApp, PaletteCommand } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

export const GlobalCommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    openCommandPalette,
    registeredCommands,
    demoMode,
    toggleDemoMode,
    checkBackendHealth,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, openCommandPalette, closeCommandPalette]);

  // Focus and reset state when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCommandPaletteOpen]);

  // Build the complete list of items
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: PaletteCommand[] = [];

    // 1. Navigation items
    const navCommands: PaletteCommand[] = [
      {
        id: 'nav-fournisseurs',
        category: 'Navigation',
        title: 'Aller à Fournisseurs',
        subtitle: 'Référentiel des prestataires, éligibilité et notation (Mohamed • :8081)',
        badge: 'Opérationnel',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80',
        icon: <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        shortcut: 'Alt 1',
        onSelect: () => navigate('/fournisseurs'),
      },
      {
        id: 'nav-commandes',
        category: 'Navigation',
        title: 'Aller à Commandes',
        subtitle: "Bons de commande et lignes d'achat (Yassine • :8082)",
        badge: 'En préparation',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80',
        icon: <ShoppingBag className="w-4 h-4 text-blue-500" />,
        shortcut: 'Alt 2',
        onSelect: () => navigate('/commandes'),
      },
      {
        id: 'nav-receptions',
        category: 'Navigation',
        title: 'Aller à Réceptions',
        subtitle: 'Suivi des livraisons et contrôle de conformité (Ali • :8083)',
        badge: 'En préparation',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80',
        icon: <Truck className="w-4 h-4 text-emerald-500" />,
        shortcut: 'Alt 3',
        onSelect: () => navigate('/receptions'),
      },
      {
        id: 'nav-factures',
        category: 'Navigation',
        title: 'Aller à Factures',
        subtitle: 'Rapprochement 3-voies et validation des règlements (Hamza • :8084)',
        badge: 'En préparation',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80',
        icon: <Receipt className="w-4 h-4 text-purple-500" />,
        shortcut: 'Alt 4',
        onSelect: () => navigate('/factures'),
      },
    ];

    navCommands.forEach((cmd) => {
      if (!q || cmd.title.toLowerCase().includes(q) || (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))) {
        result.push(cmd);
      }
    });

    // 2. Global Actions
    const globalActions: PaletteCommand[] = [
      {
        id: 'action-theme',
        category: 'Actions Globales',
        title: isDarkMode ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre',
        subtitle: 'Alterner entre le thème clair et le thème sombre de l’interface',
        icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-teal-500" />,
        shortcut: 'Thème',
        onSelect: toggleDarkMode,
      },
      {
        id: 'action-sidebar-toggle',
        category: 'Actions Globales',
        title: isSidebarCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale',
        subtitle: 'Alterner entre le mode étendu (288px) et le mode compact (80px)',
        icon: <PanelLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        shortcut: 'Ctrl B',
        onSelect: toggleSidebarCollapsed,
      },
      {
        id: 'action-demo',
        category: 'Actions Globales',
        title: demoMode ? 'Désactiver le Mode Démo Fournisseurs' : 'Activer le Mode Démo Fournisseurs',
        subtitle: demoMode ? 'Bascule vers le backend Spring Boot réel (:8081)' : 'Utilise les données simulées en mémoire',
        badge: demoMode ? 'Démo Active' : 'API Réelle',
        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        onSelect: toggleDemoMode,
      },
      {
        id: 'action-health-check',
        category: 'Actions Globales',
        title: 'Tester la connexion API Fournisseurs',
        subtitle: 'Vérifier l’état de santé du backend Spring Boot sur http://localhost:8081/actuator/health',
        icon: <Activity className="w-4 h-4 text-emerald-500" />,
        shortcut: 'Ping',
        onSelect: () => checkBackendHealth(),
      },
    ];

    globalActions.forEach((act) => {
      if (!q || act.title.toLowerCase().includes(q) || (act.subtitle && act.subtitle.toLowerCase().includes(q))) {
        result.push(act);
      }
    });

    // 3. Module-Registered Commands (e.g. from Fournisseurs or future modules)
    registeredCommands.forEach((cmd) => {
      if (!q || cmd.title.toLowerCase().includes(q) || (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))) {
        result.push(cmd);
      }
    });

    return result;
  }, [query, navigate, isDarkMode, toggleDarkMode, demoMode, toggleDemoMode, checkBackendHealth, registeredCommands]);

  // Adjust selected index if bounds change
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
        closeCommandPalette();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center animate-fade-in-up">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeCommandPalette}
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
            placeholder="Rechercher une action, un module, un fournisseur... (ex: Commandes, Thème, Casablanca)"
            className="w-full h-14 pl-3.5 pr-20 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            aria-label="Palette de commandes globale"
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
              <p className="text-[11px] mt-1">Essayez avec « Fournisseurs », « Commandes », « Thème », ou « Démo ».</p>
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
                        closeCommandPalette();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs group ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-100 border border-teal-200/70 dark:border-teal-800/70 shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.icon || <Layers className="w-4 h-4" />}
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
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.badgeClass ||
                              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.shortcut && (
                          <kbd
                            className={`hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                              isSelected
                                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 border-teal-300/80 dark:border-teal-700/80'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            isSelected
                              ? 'text-teal-600 dark:text-teal-400 translate-x-0.5'
                              : 'opacity-0 text-slate-400'
                          }`}
                        />
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
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↓
              </kbd>
              <span>Naviguer</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↵
              </kbd>
              <span>Valider</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ESC
              </kbd>
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

