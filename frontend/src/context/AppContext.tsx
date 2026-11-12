import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fournisseurApi } from '../modules/fournisseurs/api/fournisseurApi';

export interface PaletteCommand {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClass?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface AppContextType {
  /** État de connectivité du microservice Fournisseurs (:8081) */
  isBackendHealthy: boolean | null;
  /** Teste la santé du microservice Fournisseurs via /actuator/health */
  checkBackendHealth: () => Promise<void>;
  /** Mode démo avec données simulées (spécifique au module Fournisseurs) */
  demoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (val: boolean) => void;
  /** État d'ouverture de la palette de commandes globale (Ctrl + K) */
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  /** État du tiroir latéral mobile */
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (val: boolean) => void;
  toggleMobileSidebar: () => void;
  /** État de réduction de la sidebar desktop (mode mini-sidebar compact w-20) */
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  toggleSidebarCollapsed: () => void;
  /** Liste des commandes enregistrées par les modules actifs */
  registeredCommands: PaletteCommand[];
  /** Permet aux modules d'enregistrer dynamiquement leurs commandes */
  registerCommands: (sourceId: string, commands: PaletteCommand[]) => () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('procuraflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [commandRegistry, setCommandRegistry] = useState<Record<string, PaletteCommand[]>>({});

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('procuraflow_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((val: boolean) => {
    setIsSidebarCollapsed(val);
    try {
      localStorage.setItem('procuraflow_sidebar_collapsed', String(val));
    } catch {}
  }, []);

  // Global Ctrl + B shortcut to collapse/expand desktop sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapsed]);

  // Fournisseurs service health check
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await fournisseurApi.checkHealth();
      setIsBackendHealthy(res?.status === 'UP');
    } catch {
      setIsBackendHealthy(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const toggleDemoMode = useCallback(() => {
    setDemoMode((prev) => !prev);
  }, []);

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev);
  }, []);

  // Dynamic command registration for modules
  const registerCommands = useCallback((sourceId: string, commands: PaletteCommand[]) => {
    setCommandRegistry((prev) => ({
      ...prev,
      [sourceId]: commands,
    }));

    return () => {
      setCommandRegistry((prev) => {
        const next = { ...prev };
        delete next[sourceId];
        return next;
      });
    };
  }, []);

  const registeredCommands = useMemo(() => {
    return Object.values(commandRegistry).flat();
  }, [commandRegistry]);

  return (
    <AppContext.Provider
      value={{
        isBackendHealthy,
        checkBackendHealth,
        demoMode,
        toggleDemoMode,
        setDemoMode,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar,
        isSidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
        registeredCommands,
        registerCommands,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

/**
 * Hook pour enregistrer des commandes modulaires dans la palette globale (Ctrl + K)
 * Se désinscrit automatiquement au démontage du composant.
 */
export const useRegisterCommands = (sourceId: string, commands: PaletteCommand[]): void => {
  const { registerCommands } = useApp();

  useEffect(() => {
    return registerCommands(sourceId, commands);
  }, [registerCommands, sourceId, commands]);
};
