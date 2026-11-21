import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  ShoppingBag,
  Receipt,
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

          {/* Section 4 : Journal d'Activité en Temps Réel (Pleine Largeur) */}
          <RecentActivityFeed activities={data.recentActivities} />
        </div>
      ) : null}
    </div>
  );
};
