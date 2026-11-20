/**
 * Utilitaires pour le module Commandes
 *
 * Exemples de fonctions à placer ici :
 * - formatCurrency(amount: number): string
 * - calculateOrderTotal(lines: Array<{ quantite: number; prix: number }>): number
 * - validateOrderPayload(order: unknown): boolean
 */

export const formatOrderCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
};

