import React from 'react';
import { Building2, Activity, Wifi, WifiOff, Sparkles } from 'lucide-react';

interface NavbarProps {
  isBackendHealthy: boolean | null;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isBackendHealthy,
  demoMode,
  onToggleDemoMode,
  onRefreshHealth,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Module Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">ProcuraFlow</span>
                <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  Service Fournisseurs
                </span>
              </div>
              <p className="text-xs text-slate-500">Module Mohamed Bailla • Port 8081</p>
            </div>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center space-x-3">
            {/* Backend status indicator */}
            <button
              onClick={onRefreshHealth}
              title="Cliquer pour vérifier l'état du backend Spring Boot"
              className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                demoMode
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : isBackendHealthy
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isBackendHealthy === false
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {demoMode ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                  <span>Mode Démo Actif</span>
                </>
              ) : isBackendHealthy ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Spring Boot En ligne</span>
                </>
              ) : isBackendHealthy === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>API Déconnectée (:8081)</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Connexion...</span>
                </>
              )}
            </button>

            {/* Demo mode toggle switch */}
            <button
              onClick={onToggleDemoMode}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                demoMode
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {demoMode ? 'Basculer en Mode Réel' : 'Activer Mode Démo'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

