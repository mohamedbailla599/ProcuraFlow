import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Sparkles,
  WifiOff,
  RefreshCw,
  Building2,
  ShoppingBag,
  Truck,
  Receipt,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { factureApi } from '../../modules/factures/api';

interface ModuleMetadata {
  title: string;
  subtitle: string;
  owner: string;
  port: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULE_META: Record<string, ModuleMetadata> = {
  '/fournisseurs': {
    title: 'Fournisseurs',
    subtitle: 'Référentiel & Éligibilité',
    owner: 'Mohamed Bailla',
    port: ':8081',
    icon: Building2,
  },
  '/commandes': {
    title: 'Commandes',
    subtitle: "Bons & Lignes d'achat",
    owner: 'Yassine',
    port: ':8082',
    icon: ShoppingBag,
  },
  '/receptions': {
    title: 'Réceptions',
    subtitle: 'Suivi des livraisons',
    owner: 'Ali',
    port: ':8083',
    icon: Truck,
  },
  '/factures': {
    title: 'Factures',
    subtitle: 'Rapprochement 3-voies',
    owner: 'Hamza',
    port: ':8084',
    icon: Receipt,
  },
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const {
    isBackendHealthy,
    checkBackendHealth,
    demoMode,
    toggleDemoMode,
    openCommandPalette,
    toggleMobileSidebar,
  } = useApp();

  const [isFacturesHealthy, setIsFacturesHealthy] = useState<boolean | null>(null);

  const isFacturesRoute = location.pathname.startsWith('/factures');
  const currentMeta = MODULE_META[location.pathname] || MODULE_META['/fournisseurs'];
  const Icon = currentMeta.icon;

  useEffect(() => {
    if (isFacturesRoute) {
      factureApi.checkHealth().then(setIsFacturesHealthy).catch(() => setIsFacturesHealthy(false));
    }
  }, [isFacturesRoute]);

  const handleHealthCheckClick = () => {
    if (isFacturesRoute) {
      setIsFacturesHealthy(null);
      factureApi.checkHealth().then(setIsFacturesHealthy).catch(() => setIsFacturesHealthy(false));
    } else {
      checkBackendHealth();
    }
  };

  return (
    <header className="h-16 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200 z-10">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="Ouvrir le menu de navigation"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 items-center justify-center text-teal-600 dark:text-teal-400">
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                {currentMeta.title}
              </span>
              <span className="hidden md:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
                • {currentMeta.owner} ({currentMeta.port})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Palette, Theme, Health & Demo Mode */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Command Palette Button (Ctrl + K) */}
          <button
            type="button"
            onClick={openCommandPalette}
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

          {/* Animated Interactive Theme Toggle Switch */}
          <button
            type="button"
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={isDarkMode}
            title={isDarkMode ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
            aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="relative inline-flex items-center h-8 w-16 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 select-none bg-slate-200/80 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 shadow-2xs group cursor-pointer"
          >
            <span className="flex-1 flex justify-center items-center pointer-events-none">
              <Sun
                className={`w-3.5 h-3.5 transition-all duration-300 ${
                  isDarkMode ? 'text-slate-400 opacity-40 scale-75' : 'text-amber-500 opacity-100 scale-100'
                }`}
              />
            </span>

            <span className="flex-1 flex justify-center items-center pointer-events-none">
              <Moon
                className={`w-3.5 h-3.5 transition-all duration-300 ${
                  isDarkMode ? 'text-teal-400 opacity-100 scale-100' : 'text-slate-400 opacity-40 scale-75'
                }`}
              />
            </span>

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
          {isFacturesRoute ? (
            <button
              type="button"
              onClick={handleHealthCheckClick}
              title="Tester la connexion au microservice Factures (:8084)"
              className={`inline-flex items-center space-x-2 h-8 px-2.5 text-xs font-medium rounded-lg border transition-all duration-150 active:scale-[0.97] ${
                isFacturesHealthy
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40'
                  : isFacturesHealthy === false
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100/70 dark:hover:bg-amber-900/40'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isFacturesHealthy ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="hidden sm:inline">API Factures connectée (:8084)</span>
                  <span className="sm:hidden text-[11px]">Factures OK</span>
                </>
              ) : isFacturesHealthy === false ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">Mode Démo Factures</span>
                  <span className="sm:hidden text-[11px]">Démo</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                  <span className="hidden sm:inline">Test :8084...</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={checkBackendHealth}
              title="Tester la connexion au serveur Spring Boot Fournisseurs (:8081)"
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
                  <span className="hidden sm:inline">Démo Fournisseurs</span>
                </>
              ) : isBackendHealthy ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="hidden sm:inline">API Fournisseurs connectée</span>
                  <span className="sm:hidden text-[11px]">Fournisseurs OK</span>
                </>
              ) : isBackendHealthy === false ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Fournisseurs déconnecté</span>
                  <span className="sm:hidden text-[11px]">Hors-ligne</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                  <span className="hidden sm:inline">Connexion...</span>
                </>
              )}
            </button>
          )}

          {/* Demo Mode Toggle (pour Fournisseurs) */}
          {!isFacturesRoute && (
            <button
              type="button"
              onClick={toggleDemoMode}
              title={demoMode ? 'Désactiver le mode démo Fournisseurs' : 'Activer le mode démo Fournisseurs'}
              className={`h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border transition-all duration-150 active:scale-[0.97] ${
                demoMode
                  ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {demoMode ? 'Mode Réel' : 'Démo Fournisseurs'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
