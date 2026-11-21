import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  ShoppingBag,
  Truck,
  Receipt,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  LoadingState,
  ErrorState,
} from '../../../components/ui';
import { fetchDashboardData, DashboardData } from '../api';
import { DashboardKpis } from '../components/DashboardKpis';
import { CycleFunnelChart } from '../components/CycleFunnelChart';
import { StatusDonutChart } from '../components/StatusDonutChart';
import { TopFournisseursBarChart } from '../components/TopFournisseursBarChart';
import { RecentActivityFeed } from '../components/RecentActivityFeed';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetchDashboardData();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la récupération des indicateurs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-12 space-y-6">
      {/* En-tête du Dashboard avec microservices connectés */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          badge={
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="teal" dot size="sm">
                Multi-Services Connectés (8081 - 8084)
              </Badge>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                Vue Décisionnelle Centralisée
              </span>
            </div>
          }
          title="Tableau de Bord Décisionnel"
          description="Supervision 360° du cycle d'achat universitaire : fournisseurs, engagements, réceptions et rapprochement financier."
        />

        {/* Boutons d'actions rapides et actualisation */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`}
              />
            }
          >
            Actualiser
          </Button>

          <NavLink to="/commandes">
            <Button
              variant="outline"
              size="sm"
              icon={<ShoppingBag className="w-3.5 h-3.5 text-teal-600" />}
            >
              Commandes
            </Button>
          </NavLink>

          <NavLink to="/factures">
            <Button
              variant="outline"
              size="sm"
              icon={<Receipt className="w-3.5 h-3.5 text-purple-600" />}
            >
              Factures 3-voies
            </Button>
          </NavLink>

          <NavLink to="/commandes">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Nouveau Bon
            </Button>
          </NavLink>
        </div>
      </div>

      {loading ? (
        <div className="py-24">
          <LoadingState message="Consolidation des données des 4 microservices en direct..." />
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState message={error} onRetry={() => loadData()} />
        </div>
      ) : data ? (
        <div className="space-y-6 animate-fade-in">
          {/* Section 1 : Indicateurs KPI Exécutifs */}
          <DashboardKpis stats={data.stats} />

          {/* Section 2 : Pipeline du Cycle d'Achat & 3-Way Match */}
          <CycleFunnelChart funnel={data.funnel} />

          {/* Section 3 : Deux graphiques analytiques (Donut & Bar chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDonutChart
              items={data.statusDistribution}
              totalBudget={data.stats.budgetTotalEngage}
            />
            <TopFournisseursBarChart topFournisseurs={data.topFournisseurs} />
          </div>

          {/* Section 4 : Flux d'Activité Récent & Synthèse Opérationnelle */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivityFeed activities={data.recentActivities} />
            </div>

            {/* Carte Récapitulative Santé du Système */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>État des Services & Conformité</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Surveillance de l'interconnexion entre microservices Spring Boot et Node.js.
                </p>

                <div className="space-y-3 mt-5">
                  {/* Service Fournisseurs */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          data.servicesHealth.fournisseurs ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Fournisseurs (:8081)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {data.servicesHealth.fournisseurs ? 'Opérationnel' : 'Déconnecté'}
                    </span>
                  </div>

                  {/* Service Commandes */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          data.servicesHealth.commandes ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Commandes (:8082)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {data.servicesHealth.commandes ? 'Opérationnel' : 'Déconnecté'}
                    </span>
                  </div>

                  {/* Service Réceptions */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          data.servicesHealth.receptions ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Réceptions (:8083)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {data.servicesHealth.receptions ? 'Opérationnel' : 'Déconnecté'}
                    </span>
                  </div>

                  {/* Service Factures */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          data.servicesHealth.factures ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Factures (:8084)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {data.servicesHealth.factures ? 'Opérationnel' : 'Déconnecté'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raccourci vers le module Factures */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <NavLink
                  to="/factures"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100/70 dark:hover:bg-teal-900/50 transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Lancer un Rapprochement 3-voies</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
