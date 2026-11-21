import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ShoppingBag,
  Truck,
  Receipt,
  Layers,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Tableau de Bord',
    icon: LayoutDashboard,
  },
  {
    to: '/fournisseurs',
    label: 'Fournisseurs',
    icon: Building2,
  },
  {
    to: '/commandes',
    label: 'Commandes',
    icon: ShoppingBag,
  },
  {
    to: '/receptions',
    label: 'Réceptions',
    icon: Truck,
  },
  {
    to: '/factures',
    label: 'Factures',
    icon: Receipt,
  },
];

export const Sidebar: React.FC = () => {
  const {
    mobileSidebarOpen,
    setMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useApp();

  const handleNavClick = () => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors duration-200 select-none">
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}
      >
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className="flex items-center space-x-3 group relative cursor-pointer"
          title={isCollapsed ? 'ProcuraFlow v1.0 — Plateforme Achats' : undefined}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Layers className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-200">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Procura<span className="text-teal-600 dark:text-teal-400">Flow</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                Plateforme Achats Intégrée
              </p>
            </div>
          )}
        </NavLink>

        {/* Close button on mobile */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Fermer le menu de navigation"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Modules Section */}
      <div className={`flex-1 overflow-y-auto py-5 space-y-6 ${isCollapsed ? 'px-2' : 'px-3.5'}`}>
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Modules Métier
              </span>
            </div>
          )}

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isCollapsed
                        ? 'justify-center p-2.5'
                        : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-semibold shadow-xs border border-teal-200/80 dark:border-teal-800/80'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-teal-100/60 dark:group-hover:bg-teal-950/50 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {!isCollapsed && (
                          <span className="truncate text-sm font-semibold tracking-tight">{item.label}</span>
                        )}
                      </div>

                      {/* Tooltip for Collapsed Sidebar Mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-xl border border-slate-700 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                          <span className="font-semibold">{item.label}</span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer & Collapse Toggle */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          title={isCollapsed ? 'Agrandir la barre latérale (Ctrl + B)' : 'Réduire la barre latérale (Ctrl + B)'}
          aria-label={isCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
          className={`hidden lg:flex items-center rounded-xl py-2 text-xs font-semibold transition-all duration-150 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 shadow-2xs ${
            isCollapsed ? 'justify-center px-2 w-full' : 'justify-between px-3 w-full'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                <span>Réduire la barre</span>
              </>
            )}
          </div>
          {!isCollapsed && (
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 shadow-2xs">
              Ctrl B
            </kbd>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with Width Transition */}
      <aside
        className={`hidden lg:block shrink-0 h-full z-20 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>

      {/* Mobile Drawer Overlay (Always Full Width) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 w-64 max-w-[85vw] shadow-2xl z-50 animate-fade-in-right">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
