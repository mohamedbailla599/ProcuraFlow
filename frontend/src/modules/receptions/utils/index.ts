/**
 * Utilitaires pour le module Réceptions
 *
 * Exemples de fonctions à placer ici :
 * - calculateConformiteRate(recues: number, conformes: number): number
 * - formatReceptionDate(dateStr: string): string
 * - getStatusColor(statut: string): string
 */

export const calculateConformiteRate = (recues: number, conformes: number): number => {
  if (recues <= 0) return 0;
  return Math.round((conformes / recues) * 100);
};

