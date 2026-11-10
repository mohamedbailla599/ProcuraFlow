import React from 'react';
import { Building2, Wifi, WifiOff, Sparkles, RefreshCw, Command } from 'lucide-react';

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
    <header className="glass-panel sticky top-0 z-30 border-b border-slate-200/80 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 group-hover:shadow-teal-500/40 transition-all duration-300">
                <Building2 className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  demoMode ? 'bg-amber-400' : isBackendHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                  demoMode ? 'bg-amber-500' : isBackendHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
                  ProcuraFlow
                </span>
                <span className="text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                  Fournisseurs
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Module Mohamed Bailla • Port 8081
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Quick shortcut pill */}
            <button
              onClick={onOpenCreateModal}
              title="Raccourci : Créer un nouveau fournisseur"
              className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Command className="w-3 h-3 text-slate-400" />
              <span>Nouveau</span>
              <kbd className="text-[10px] bg-white text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200 font-mono shadow-2xs">
                N
              </kbd>
            </button>

            {/* Backend Connectivity Status Button */}
            <button
              onClick={onRefreshHealth}
              title="Cliquer pour tester la connectivité backend"
              className={`group flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all duration-200 shadow-2xs ${
                demoMode
                  ? 'bg-amber-50/90 border-amber-200 text-amber-800 hover:bg-amber-100/90'
                  : isBackendHealthy
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 hover:bg-emerald-100/90'
                  : isBackendHealthy === false
                  ? 'bg-rose-50/90 border-rose-200 text-rose-800 hover:bg-rose-100/90'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {demoMode ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Mode Démo</span>
                </>
              ) : isBackendHealthy ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>API En ligne (:8081)</span>
                </>
              ) : isBackendHealthy === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>API Déconnectée</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Vérification...</span>
                </>
              )}
            </button>

            {/* Mode switch pill */}
            <button
              onClick={onToggleDemoMode}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all duration-200 shadow-xs ${
                demoMode
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-transparent hover:shadow-teal-500/25 hover:shadow-md hover:scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {demoMode ? 'Passer en Mode Réel' : 'Activer Mode Démo'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
