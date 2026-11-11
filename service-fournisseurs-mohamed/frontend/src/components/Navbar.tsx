import React from 'react';
import { Building2, Wifi, WifiOff, Sparkles, RefreshCw, Sun, Moon, Search } from 'lucide-react';

interface NavbarProps {
  isBackendHealthy: boolean | null;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onRefreshHealth: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isBackendHealthy,
  demoMode,
  onToggleDemoMode,
  onRefreshHealth,
  isDarkMode,
  onToggleDarkMode,
  onOpenCommandPalette,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 active:scale-95">
              <Building2 className="w-4 h-4" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                ProcuraFlow
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 transition-colors">
                Fournisseurs
              </span>
              <span className="hidden lg:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
                • Mohamed Bailla (:8081)
              </span>
            </div>
          </div>

          {/* Right: Actions and Status */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Command Palette Button (Ctrl + K) */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                title="Ouvrir la palette de commandes rapides (Ctrl + K)"
                aria-label="Palette de commandes"
                className="hidden sm:inline-flex items-center space-x-2 h-8 px-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700/90 bg-slate-100/70 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-teal-400/60 dark:hover:border-teal-500/60 hover:bg-white dark:hover:bg-slate-750 transition-all shadow-2xs active:scale-95 group cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                <span className="font-medium text-[11px]">Rechercher...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300/80 dark:border-slate-600 text-slate-600 dark:text-slate-300 shadow-2xs">
                  Ctrl K
                </kbd>
              </button>
            )}

            {/* Animated Interactive Theme Toggle Switch */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              role="switch"
              aria-checked={isDarkMode}
              title={isDarkMode ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
              aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              className="relative inline-flex items-center h-8 w-16 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 select-none bg-slate-200/80 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 shadow-2xs group cursor-pointer"
            >
              {/* Sun icon on left */}
              <span className="flex-1 flex justify-center items-center pointer-events-none">
                <Sun
                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                    isDarkMode ? 'text-slate-400 opacity-40 scale-75' : 'text-amber-500 opacity-100 scale-100'
                  }`}
                />
              </span>

              {/* Moon icon on right */}
              <span className="flex-1 flex justify-center items-center pointer-events-none">
                <Moon
                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                    isDarkMode ? 'text-teal-400 opacity-100 scale-100' : 'text-slate-400 opacity-40 scale-75'
                  }`}
                />
              </span>

              {/* Sliding circle thumb with micro-animation */}
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200/90 dark:border-slate-700 flex items-center justify-center transform transition-transform duration-300 ease-out group-hover:scale-105 active:scale-95 pointer-events-none ${
                  isDarkMode ? 'translate-x-8' : 'translate-x-0'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-3.5 h-3.5 text-teal-400 transition-all duration-300 rotate-0 scale-100" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500 transition-all duration-300 rotate-0 scale-100" />
                )}
              </span>
            </button>

            {/* Health Status Indicator */}
            <button
              onClick={onRefreshHealth}
              title="Tester la connexion au serveur Spring Boot"
              className={`inline-flex items-center space-x-2 h-8 px-2.5 text-xs font-medium rounded-lg border transition-all duration-150 active:scale-[0.97] ${
                demoMode
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/40'
                  : isBackendHealthy
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40'
                  : isBackendHealthy === false
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 hover:bg-rose-100/70 dark:hover:bg-rose-900/40'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {demoMode ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Mode Démo</span>
                </>
              ) : isBackendHealthy ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="hidden sm:inline">API Connectée</span>
                  <span className="sm:hidden">En ligne</span>
                </>
              ) : isBackendHealthy === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">API Déconnectée</span>
                  <span className="sm:hidden">Hors-ligne</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                  <span>Connexion...</span>
                </>
              )}
            </button>

            {/* Demo Mode Toggle */}
            <button
              onClick={onToggleDemoMode}
              className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all duration-150 active:scale-[0.97] ${
                demoMode
                  ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {demoMode ? 'Mode Réel' : 'Mode Démo'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
