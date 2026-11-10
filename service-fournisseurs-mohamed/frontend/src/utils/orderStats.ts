import { CommandeSummary } from '../types/fournisseur';

export interface SupplierOrderStats {
  totalOrders: number;
  activeOrders: number; // excluding ANNULEE
  completedOrders: number; // RECEPTIONNEE + FACTUREE
  cancelledOrders: number; // ANNULEE
  pendingOrders: number; // EN_ATTENTE + VALIDEE
  totalOrderedAmount: number; // Sum of active orders (MAD)
  totalSpentAmount: number; // Sum of completed/invoiced orders (MAD)
  latestOrderDate: string | null;
  currency: 'MAD';
}

/**
 * Computes purchasing statistics for a supplier strictly based on the
 * contract provided by the Commandes microservice.
 *
 * Rules:
 * - Cancelled orders ('ANNULEE') are strictly excluded from totalOrderedAmount and totalSpentAmount.
 * - Total Ordered Amount represents committed orders (EN_ATTENTE, VALIDEE, RECEPTIONNEE, FACTUREE).
 * - Total Spent Amount represents finalized/delivered goods (RECEPTIONNEE, FACTUREE).
 * - Currency is fixed to MAD (Dirham marocain) as per system specification.
 */
export function computeOrderStats(commandes?: CommandeSummary[] | null): SupplierOrderStats {
  if (!commandes || commandes.length === 0) {
    return {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingOrders: 0,
      totalOrderedAmount: 0,
      totalSpentAmount: 0,
      latestOrderDate: null,
      currency: 'MAD',
    };
  }

  let totalOrders = commandes.length;
  let activeOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let pendingOrders = 0;
  let totalOrderedAmount = 0;
  let totalSpentAmount = 0;
  let latestTimestamp = 0;
  let latestOrderDate: string | null = null;

  for (const cmd of commandes) {
    const amount = typeof cmd.montantTotal === 'number' ? cmd.montantTotal : parseFloat(String(cmd.montantTotal)) || 0;
    const isCancelled = cmd.statut === 'ANNULEE';
    const isCompleted = cmd.statut === 'RECEPTIONNEE' || cmd.statut === 'FACTUREE';
    const isPending = cmd.statut === 'EN_ATTENTE' || cmd.statut === 'VALIDEE';

    if (isCancelled) {
      cancelledOrders++;
    } else {
      activeOrders++;
      totalOrderedAmount += amount;
      if (isCompleted) {
        completedOrders++;
        totalSpentAmount += amount;
      }
      if (isPending) {
        pendingOrders++;
      }
    }

    if (cmd.dateCommande) {
      const ts = new Date(cmd.dateCommande).getTime();
      if (!isNaN(ts) && ts > latestTimestamp) {
        latestTimestamp = ts;
        latestOrderDate = cmd.dateCommande;
      }
    }
  }

  return {
    totalOrders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    pendingOrders,
    totalOrderedAmount: Math.round(totalOrderedAmount * 100) / 100,
    totalSpentAmount: Math.round(totalSpentAmount * 100) / 100,
    latestOrderDate,
    currency: 'MAD',
  };
}

/**
 * Formats a currency amount in MAD with Moroccan standard spacing.
 */
export function formatMAD(amount: number): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}
