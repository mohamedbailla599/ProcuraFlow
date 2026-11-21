import { fournisseurApi } from '../../fournisseurs/api/fournisseurApi';
import { getAllCommandes } from '../../commandes/api';
import { getAll as getAllReceptions } from '../../receptions/api';
import { factureApi } from '../../factures/api';
import { parseAddressAndCity } from '../../fournisseurs/utils/addressParser';
import type { Fournisseur } from '../../fournisseurs/types/fournisseur';
import type { Commande } from '../../commandes/types';
import type { Reception } from '../../receptions/types';
import type { Facture } from '../../factures/types';
import type {
  DashboardStats,
  CycleFunnelStep,
  StatusDistributionItem,
  TopFournisseurStat,
  RecentActivityItem,
} from '../types';

export interface DashboardData {
  stats: DashboardStats;
  funnel: CycleFunnelStep[];
  statusDistribution: StatusDistributionItem[];
  topFournisseurs: TopFournisseurStat[];
  recentActivities: RecentActivityItem[];
  fournisseurs: Fournisseur[];
  commandes: Commande[];
  receptions: Reception[];
  factures: Facture[];
  servicesHealth: {
    fournisseurs: boolean;
    commandes: boolean;
    receptions: boolean;
    factures: boolean;
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  // Appel concurrent vers les 4 microservices
  const [fRes, cRes, rRes, factRes] = await Promise.allSettled([
    fournisseurApi.getFournisseurs(),
    getAllCommandes(),
    getAllReceptions(),
    factureApi.getFactures(),
  ]);

  const fournisseurs: Fournisseur[] = fRes.status === 'fulfilled' && Array.isArray(fRes.value) ? fRes.value : [];
  const commandes: Commande[] = cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value : [];
  const receptions: Reception[] = rRes.status === 'fulfilled' && Array.isArray(rRes.value) ? rRes.value : [];
  const factures: Facture[] = factRes.status === 'fulfilled' && Array.isArray(factRes.value) ? factRes.value : [];

  const servicesHealth = {
    fournisseurs: fRes.status === 'fulfilled',
    commandes: cRes.status === 'fulfilled',
    receptions: rRes.status === 'fulfilled',
    factures: factRes.status === 'fulfilled',
  };

  // --- Calculs Fournisseurs ---
  const totalFournisseurs = fournisseurs.length;
  const fournisseursActifs = fournisseurs.filter((f) => f.actif).length;
  const tauxEligibilite = totalFournisseurs > 0 ? Math.round((fournisseursActifs / totalFournisseurs) * 100) : 0;

  // --- Calculs Commandes ---
  const totalCommandes = commandes.length;
  const commandesActives = commandes.filter((c) => c.statut !== 'ANNULEE');
  const budgetTotalEngage = commandesActives.reduce((sum, c) => sum + Number(c.montantTotal || 0), 0);
  const commandesValideesOuLivrees = commandes.filter((c) =>
    ['VALIDEE', 'EN_COURS', 'LIVREE'].includes(c.statut)
  ).length;

  // --- Calculs Réceptions ---
  const totalReceptions = receptions.length;
  const receptionsConformesCount = receptions.filter(
    (r) => (r.statutReception || 'CONFORME').toUpperCase() === 'CONFORME'
  ).length;
  const tauxConformite = totalReceptions > 0 ? Math.round((receptionsConformesCount / totalReceptions) * 100) : 100;
  const totalUnitesRecues = receptions.reduce((sum, r) => {
    const lignes = r.lignes || [];
    return sum + lignes.reduce((sL, l) => sL + Number(l.quantiteRecue || 0), 0);
  }, 0);

  // --- Calculs Factures & Règlements ---
  const totalFactures = factures.length;
  const montantTotalFacture = factures.reduce((sum, f) => sum + Number(f.montant_total || f.montant_facture || 0), 0);
  const facturesPayees = factures.filter((f) => (f.statut_paiement || '').toUpperCase() === 'PAYEE');
  const facturesPayeesCount = facturesPayees.length;
  const montantTotalPaye = facturesPayees.reduce(
    (sum, f) => sum + Number(f.montant_total || f.montant_facture || 0),
    0
  );
  const montantEnAttentePaiement = Math.max(0, montantTotalFacture - montantTotalPaye);
  const tauxReglement = montantTotalFacture > 0 ? Math.round((montantTotalPaye / montantTotalFacture) * 100) : 0;

  // --- Rapprochement 3-Voies ---
  // Factures ayant à la fois une commande ET une réception valides
  const facturesRapprochees = factures.filter((f) => f.commande_id && f.reception_id).length;
  const tauxRapprochement3Voies = totalFactures > 0 ? Math.round((facturesRapprochees / totalFactures) * 100) : 100;

  const stats: DashboardStats = {
    budgetTotalEngage,
    totalCommandes,
    commandesValideesOuLivrees,
    montantTotalFacture,
    montantTotalPaye,
    montantEnAttentePaiement,
    totalFactures,
    facturesPayeesCount,
    tauxReglement,
    totalReceptions,
    totalUnitesRecues,
    receptionsConformesCount,
    tauxConformite,
    totalFournisseurs,
    fournisseursActifs,
    tauxEligibilite,
    tauxRapprochement3Voies,
  };

  // --- Pipeline / Funnel du cycle d'achat ---
  const montantLivree = commandes
    .filter((c) => c.statut === 'LIVREE')
    .reduce((sum, c) => sum + Number(c.montantTotal || 0), 0);

  const funnel: CycleFunnelStep[] = [
    {
      id: 'step-commandes',
      label: 'Bons de Commande Émis',
      count: totalCommandes,
      montantMAD: budgetTotalEngage,
      percentageOfCommitted: 100,
      color: '#0d9488', // Teal 600
      iconName: 'ShoppingBag',
    },
    {
      id: 'step-receptions',
      label: 'Livraisons Réceptionnées',
      count: totalReceptions,
      montantMAD: montantLivree > 0 ? montantLivree : Math.round(budgetTotalEngage * 0.85),
      percentageOfCommitted: budgetTotalEngage > 0 ? Math.min(100, Math.round(((montantLivree > 0 ? montantLivree : budgetTotalEngage * 0.85) / budgetTotalEngage) * 100)) : 100,
      color: '#059669', // Emerald 600
      iconName: 'Truck',
    },
    {
      id: 'step-factures',
      label: 'Factures Contrôlées & Rapprochées',
      count: totalFactures,
      montantMAD: montantTotalFacture,
      percentageOfCommitted: budgetTotalEngage > 0 ? Math.min(100, Math.round((montantTotalFacture / budgetTotalEngage) * 100)) : 0,
      color: '#8b5cf6', // Purple 500
      iconName: 'Receipt',
    },
    {
      id: 'step-reglements',
      label: 'Règlements & Décaissements',
      count: facturesPayeesCount,
      montantMAD: montantTotalPaye,
      percentageOfCommitted: budgetTotalEngage > 0 ? Math.min(100, Math.round((montantTotalPaye / budgetTotalEngage) * 100)) : 0,
      color: '#10b981', // Green 500
      iconName: 'CheckCircle2',
    },
  ];

  // --- Répartition par statut de commande ---
  const statusCounts: Record<string, { count: number; montant: number }> = {};
  commandes.forEach((c) => {
    const st = c.statut || 'EN_ATTENTE';
    if (!statusCounts[st]) {
      statusCounts[st] = { count: 0, montant: 0 };
    }
    statusCounts[st].count += 1;
    statusCounts[st].montant += Number(c.montantTotal || 0);
  });

  const STATUT_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
    LIVREE: { label: 'Livrées', color: '#10b981', badge: 'bg-emerald-500' },
    EN_COURS: { label: 'En Cours', color: '#3b82f6', badge: 'bg-blue-500' },
    VALIDEE: { label: 'Validées', color: '#0d9488', badge: 'bg-teal-500' },
    EN_ATTENTE: { label: 'En Attente', color: '#f59e0b', badge: 'bg-amber-500' },
    ANNULEE: { label: 'Annulées', color: '#ef4444', badge: 'bg-rose-500' },
  };

  const statusDistribution: StatusDistributionItem[] = Object.entries(statusCounts).map(([st, val]) => {
    const config = STATUT_CONFIG[st] || { label: st, color: '#64748b', badge: 'bg-slate-500' };
    const pct = budgetTotalEngage > 0 ? Math.round((val.montant / budgetTotalEngage) * 100) : 0;
    return {
      statut: st,
      label: config.label,
      count: val.count,
      montantMAD: val.montant,
      percentage: pct,
      color: config.color,
      badgeClass: config.badge,
    };
  });

  // Trier par montant décroissant
  statusDistribution.sort((a, b) => b.montantMAD - a.montantMAD);

  // --- Top Fournisseurs par volume d'achats ---
  const fournisseurSpendMap: Record<number, { montant: number; count: number; paidCount: number }> = {};
  commandes.forEach((c) => {
    const fId = Number(c.fournisseurId);
    if (!fId) return;
    if (!fournisseurSpendMap[fId]) {
      fournisseurSpendMap[fId] = { montant: 0, count: 0, paidCount: 0 };
    }
    fournisseurSpendMap[fId].montant += Number(c.montantTotal || 0);
    fournisseurSpendMap[fId].count += 1;
    // Vérifier si facture payée
    const hasPaid = factures.some((f) => Number(f.commande_id) === Number(c.id) && f.statut_paiement === 'PAYEE');
    if (hasPaid) {
      fournisseurSpendMap[fId].paidCount += 1;
    }
  });

  const topFournisseurs: TopFournisseurStat[] = Object.entries(fournisseurSpendMap)
    .map(([idStr, val]) => {
      const id = Number(idStr);
      const f = fournisseurs.find((item) => Number(item.id) === id);
      const nom = f ? f.nom : `Fournisseur #${id}`;
      const ville = f?.adresse ? parseAddressAndCity(f.adresse).ville || 'Maroc' : 'Maroc';
      const pct = budgetTotalEngage > 0 ? Math.round((val.montant / budgetTotalEngage) * 100) : 0;
      return {
        id,
        nom,
        ville,
        montantTotal: val.montant,
        nombreCommandes: val.count,
        facturesPayees: val.paidCount,
        pourcentageBudget: pct,
      };
    })
    .sort((a, b) => b.montantTotal - a.montantTotal)
    .slice(0, 5);

  // --- Flux d'activités récentes consolidé ---
  const activities: RecentActivityItem[] = [];

  // Commandes
  commandes.slice(0, 5).forEach((c) => {
    const f = fournisseurs.find((item) => Number(item.id) === Number(c.fournisseurId));
    activities.push({
      id: `cmd-${c.id}`,
      type: 'COMMANDE',
      title: `Commande #${c.id} (${c.statut})`,
      subtitle: `${f?.nom || 'Fournisseur #' + c.fournisseurId} · ${c.lignesCommande?.length || 0} article(s)`,
      date: c.dateCommande || new Date().toISOString(),
      montant: c.montantTotal,
      badgeText: c.statut,
      badgeVariant: c.statut === 'LIVREE' ? 'emerald' : c.statut === 'EN_COURS' ? 'blue' : 'teal',
      linkTo: '/commandes',
    });
  });

  // Factures
  factures.slice(0, 5).forEach((f) => {
    activities.push({
      id: `fac-${f.id}`,
      type: f.statut_paiement === 'PAYEE' ? 'PAIEMENT' : 'FACTURE',
      title: `Facture ${f.numero_facture || '#' + f.id} (${f.statut_paiement || 'NON_PAYEE'})`,
      subtitle: `Rattachée à Commande #${f.commande_id} & BL #${f.reception_id}`,
      date: f.date_facture || f.created_at || new Date().toISOString(),
      montant: f.montant_total || f.montant_facture,
      badgeText: f.statut_paiement === 'PAYEE' ? 'PAYÉE' : 'NON PAYÉE',
      badgeVariant: f.statut_paiement === 'PAYEE' ? 'emerald' : 'purple',
      linkTo: '/factures',
    });
  });

  // Réceptions
  receptions.slice(0, 4).forEach((r) => {
    const unites = (r.lignes || []).reduce((sum, l) => sum + Number(l.quantiteRecue || 0), 0);
    activities.push({
      id: `rec-${r.id}`,
      type: 'RECEPTION',
      title: `Réception BL-${String(r.id).padStart(4, '0')}`,
      subtitle: `Commande #${r.commandeId} · ${unites} unité(s) contrôlée(s)`,
      date: r.dateReception || new Date().toISOString(),
      badgeText: r.statutReception || 'CONFORME',
      badgeVariant: 'teal',
      linkTo: '/receptions',
    });
  });

  // Trier les activités par date décroissante
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentActivities = activities.slice(0, 8);

  return {
    stats,
    funnel,
    statusDistribution,
    topFournisseurs,
    recentActivities,
    fournisseurs,
    commandes,
    receptions,
    factures,
    servicesHealth,
  };
}
