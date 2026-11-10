import React from 'react';
import { Building2, Wifi, WifiOff, Sparkles, RefreshCw, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  isBackendHealthy: boolean | null;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onRefreshHealth: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isBackendHealthy,
  demoMode,
  onToggleDemoMode,
  onRefreshHealth,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 glass-panel border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
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
          <div className="flex items-center space-x-2">
            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              className="inline-flex items-center space-x-1.5 h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-150 active:scale-[0.97]"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-90 duration-200" />
                  <span className="hidden sm:inline font-semibold">Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform duration-200" />
                  <span className="hidden sm:inline font-semibold">Sombre</span>
                </>
              )}
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
