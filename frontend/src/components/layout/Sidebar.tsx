import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  ShoppingBag,
  Truck,
  Receipt,
  Layers,
  X,
  Server,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  to: string;
  label: string;
  subtitle: string;
  port: string;
  tech: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'operational' | 'in_preparation';
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/fournisseurs',
    label: 'Fournisseurs',
    subtitle: 'Référentiel & Éligibilité',
    port: ':8081',
    tech: 'Spring Boot',
    icon: Building2,
    status: 'operational',
  },
  {
    to: '/commandes',
    label: 'Commandes',
    subtitle: "Bons & Lignes d'achat",
    port: ':8082',
    tech: 'Spring Boot',
    icon: ShoppingBag,
    status: 'in_preparation',
  },
  {
    to: '/receptions',
    label: 'Réceptions',
    subtitle: 'Suivi des livraisons',
    port: ':8083',
    tech: 'Spring Boot',
    icon: Truck,
    status: 'in_preparation',
  },
  {
    to: '/factures',
    label: 'Factures',
    subtitle: 'Rapprochement 3-voies',
    port: ':8084',
    tech: 'Node.js',
    icon: Receipt,
    status: 'in_preparation',
  },
];

export const Sidebar: React.FC = () => {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useApp();

  const handleNavClick = () => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800">
        <NavLink
          to="/fournisseurs"
          onClick={handleNavClick}
          className="flex items-center space-x-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Procura<span className="text-teal-600 dark:text-teal-400">Flow</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Plateforme Achats Intégrée
            </p>
          </div>
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
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Modules Métier
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              4 microservices
            </span>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
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
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <span className="truncate text-sm font-semibold">{item.label}</span>
                            {item.status === 'operational' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                Opérationnel
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
                                En préparation
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right pl-2">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.port}
                        </span>
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Integration Architecture Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Server className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Architecture Microservices</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300">
              1/4 Opérationnel
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Module Fournisseurs (<span className="font-mono text-teal-600 dark:text-teal-400">:8081</span>) opérationnel avec Neon PostgreSQL. Commandes, Réceptions et Factures sont en cours de préparation.
          </p>
          <div className="pt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
            <span className="inline-flex items-center space-x-1">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>Neon PostgreSQL 17</span>
            </span>
            <span className="text-teal-600 dark:text-teal-400 font-mono">REST API</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Passerelle ProcuraFlow</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">:5173</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-full z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-fade-in-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

