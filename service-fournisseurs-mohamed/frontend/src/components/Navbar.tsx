import React from 'react';
import { Building2, Wifi, WifiOff, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  isBackendHealthy: boolean | null;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onRefreshHealth: () => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isBackendHealthy,
  demoMode,
  onToggleDemoMode,
  onRefreshHealth,
  onOpenCreateModal,
}) => {
  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                ProcuraFlow
              </span>
              <span className="text-slate-300">/</span>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/70">
                Fournisseurs
              </span>
              <span className="hidden lg:inline text-xs text-slate-400 font-medium">
                • Mohamed Bailla (:8081)
              </span>
            </div>
          </div>

          {/* Right: Actions and Status */}
          <div className="flex items-center space-x-2.5">
            {/* Keyboard shortcut hint to create */}
            <button
              onClick={onOpenCreateModal}
              title="Créer un fournisseur (Raccourci: N)"
              className="hidden sm:inline-flex items-center space-x-1.5 h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors"
            >
              <span>Nouveau</span>
              <kbd className="text-[10px] bg-white text-slate-500 px-1 py-0.2 rounded border border-slate-200 font-mono shadow-2xs">
                N
              </kbd>
            </button>

            {/* Health Status Indicator */}
            <button
              onClick={onRefreshHealth}
              title="Tester la connexion au serveur Spring Boot"
              className={`inline-flex items-center space-x-2 h-8 px-2.5 text-xs font-medium rounded-lg border transition-all ${
                demoMode
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
                  : isBackendHealthy
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                  : isBackendHealthy === false
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {demoMode ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mode Démo</span>
                </>
              ) : isBackendHealthy ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">API Connectée</span>
                  <span className="sm:hidden">En ligne</span>
                </>
              ) : isBackendHealthy === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
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
              className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all shadow-2xs ${
                demoMode
                  ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
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
