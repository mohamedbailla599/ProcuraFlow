import { CommandeSummary } from '../types/fournisseur';

export interface SupplierOrderStats {
  totalOrders: number;
  activeOrders: number; // Statut != 'ANNULEE'
  pendingOrders: number; // Statut == 'EN_ATTENTE' (en attente de validation interne)
  validatedOrders: number; // Statut == 'VALIDEE' (commandes fermes en attente de livraison)
  completedOrders: number; // Statut in ('RECEPTIONNEE', 'FACTUREE')
  cancelledOrders: number; // Statut == 'ANNULEE'

  /**
   * Total Commandé (MAD) :
   * Volume global de commandes initiées auprès du fournisseur, hors annulations.
   * Périmètre : EN_ATTENTE + VALIDEE + RECEPTIONNEE + FACTUREE.
   */
  totalOrderedAmount: number;

  /**
   * Total Engagé (MAD) :
   * Engagements fermes et validés par le service Achats.
   * Périmètre : VALIDEE + RECEPTIONNEE + FACTUREE.
   * EXCLUT STRICTEMENT : EN_ATTENTE (en cours d'approbation) et ANNULEE (caduque).
   */
  totalCommittedAmount: number;

  /**
   * Montant des commandes réceptionnées / facturées (MAD) :
   * Montant des commandes pour lesquelles les prestations ont été constatées ou facturées dans le workflow Commandes.
   * Périmètre : RECEPTIONNEE + FACTUREE.
   * AVERTISSEMENT : Ne constitue PAS le montant décaissé/payé (géré exclusivement par le microservice Factures).
   */
  receivedOrInvoicedAmount: number;

  /**
   * Alias de compatibilité ascendante pour receivedOrInvoicedAmount.
   */
  totalSpentAmount: number;

  /**
   * Total Payé (MAD) :
   * Strictement null car les informations de paiement appartiennent au microservice Factures.
   * Non inféré à partir de la commande.
   */
  paidAmount: null;

  latestOrderDate: string | null;
  currency: 'MAD';
}

/**
 * Calcule de façon déterministe les statistiques d'achat par fournisseur
 * en appliquant rigoureusement le cycle de vie des commandes :
 * EN_ATTENTE -> VALIDEE -> RECEPTIONNEE -> FACTUREE (et ANNULEE).
 *
 * Règles financières :
 * 1. Les commandes annulées ('ANNULEE') sont EXCLUES de tous les totaux financiers.
 * 2. Les commandes en attente ('EN_ATTENTE') sont comptabilisées dans le Total Commandé,
 *    mais EXCLUES du Total Engagé car non encore validées par la hiérarchie.
 * 3. Le Total Engagé regroupe les commandes fermes : VALIDEE, RECEPTIONNEE, FACTUREE.
 * 4. Le Montant Réceptionné / Facturé regroupe RECEPTIONNEE et FACTUREE (service fait).
 * 5. Aucun montant n'est qualifié de "Payé" sans confirmation du service Factures.
 */
export function computeOrderStats(commandes?: CommandeSummary[] | null): SupplierOrderStats {
  if (!commandes || commandes.length === 0) {
    return {
      totalOrders: 0,
      activeOrders: 0,
      pendingOrders: 0,
      validatedOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalOrderedAmount: 0,
      totalCommittedAmount: 0,
      receivedOrInvoicedAmount: 0,
      totalSpentAmount: 0,
      paidAmount: null,
      latestOrderDate: null,
      currency: 'MAD',
    };
  }

  let totalOrders = commandes.length;
  let activeOrders = 0;
  let pendingOrders = 0;
  let validatedOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  let totalOrderedAmount = 0;
  let totalCommittedAmount = 0;
  let receivedOrInvoicedAmount = 0;
  let latestTimestamp = 0;
  let latestOrderDate: string | null = null;

  for (const cmd of commandes) {
    const amount = typeof cmd.montantTotal === 'number'
      ? cmd.montantTotal
      : parseFloat(String(cmd.montantTotal)) || 0;

    const isCancelled = cmd.statut === 'ANNULEE';
    const isPending = cmd.statut === 'EN_ATTENTE';
    const isValidated = cmd.statut === 'VALIDEE';
    const isReceived = cmd.statut === 'RECEPTIONNEE';
    const isInvoiced = cmd.statut === 'FACTUREE';
    const isCompleted = isReceived || isInvoiced;

    if (isCancelled) {
      cancelledOrders++;
    } else {
      activeOrders++;
      // 1. Total Commandé (toutes commandes actives)
      totalOrderedAmount += amount;

      // 2. Décomptes par étape
      if (isPending) {
        pendingOrders++;
      } else {
        // Commandes ayant franchi la validation : VALIDEE, RECEPTIONNEE, FACTUREE
        totalCommittedAmount += amount;
        if (isValidated) {
          validatedOrders++;
        }
      }

      // 3. Montant Réceptionné / Facturé (service fait / facture reçue)
      if (isCompleted) {
        completedOrders++;
        receivedOrInvoicedAmount += amount;
      }
    }

    // Date de la dernière commande (y compris annulée pour traçabilité temporelle)
    if (cmd.dateCommande) {
      const ts = new Date(cmd.dateCommande).getTime();
      if (!isNaN(ts) && ts > latestTimestamp) {
        latestTimestamp = ts;
        latestOrderDate = cmd.dateCommande;
      }
    }
  }

  const roundedOrdered = Math.round(totalOrderedAmount * 100) / 100;
  const roundedCommitted = Math.round(totalCommittedAmount * 100) / 100;
  const roundedReceivedInvoiced = Math.round(receivedOrInvoicedAmount * 100) / 100;

  return {
    totalOrders,
    activeOrders,
    pendingOrders,
    validatedOrders,
    completedOrders,
    cancelledOrders,
    totalOrderedAmount: roundedOrdered,
    totalCommittedAmount: roundedCommitted,
    receivedOrInvoicedAmount: roundedReceivedInvoiced,
    totalSpentAmount: roundedReceivedInvoiced,
    paidAmount: null,
    latestOrderDate,
    currency: 'MAD',
  };
}

/**
 * Formate un montant en Dirhams Marocains (MAD) selon les conventions d'affichage
 * marocaines (espace comme séparateur de milliers, virgule pour les décimales).
 */
export function formatMAD(amount: number): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}
