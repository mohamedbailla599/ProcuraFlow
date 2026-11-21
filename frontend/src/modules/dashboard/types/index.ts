import type { Fournisseur } from '../../fournisseurs/types/fournisseur';
import type { Commande } from '../../commandes/types';
import type { Reception } from '../../receptions/types';
import type { Facture } from '../../factures/types';

export interface DashboardStats {
  // Budget & Commandes
  budgetTotalEngage: number;
  totalCommandes: number;
  commandesValideesOuLivrees: number;
  
  // Facturation & Règlements
  montantTotalFacture: number;
  montantTotalPaye: number;
  montantEnAttentePaiement: number;
  totalFactures: number;
  facturesPayeesCount: number;
  tauxReglement: number; // en %

  // Réceptions & Conformité
  totalReceptions: number;
  totalUnitesRecues: number;
  receptionsConformesCount: number;
  tauxConformite: number; // en %

  // Fournisseurs
  totalFournisseurs: number;
  fournisseursActifs: number;
  tauxEligibilite: number; // en %

  // Rapprochement 3-voies
  tauxRapprochement3Voies: number; // en %
}

export interface CycleFunnelStep {
  id: string;
  label: string;
  count: number;
  montantMAD: number;
  percentageOfCommitted: number;
  color: string;
  iconName: string;
}

export interface StatusDistributionItem {
  statut: string;
  label: string;
  count: number;
  montantMAD: number;
  percentage: number;
  color: string;
  badgeClass: string;
}

export interface TopFournisseurStat {
  id: number;
  nom: string;
  ville: string;
  montantTotal: number;
  nombreCommandes: number;
  facturesPayees: number;
  pourcentageBudget: number;
}

export type ActivityType = 'COMMANDE' | 'RECEPTION' | 'FACTURE' | 'PAIEMENT';

export interface RecentActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  date: string;
  montant?: number;
  badgeText: string;
  badgeVariant: 'teal' | 'emerald' | 'blue' | 'purple' | 'amber';
  linkTo: string;
}
