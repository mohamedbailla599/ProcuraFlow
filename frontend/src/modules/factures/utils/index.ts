/**
 * Utilitaires pour le module Factures
 *
 * Exemples de fonctions à placer ici :
 * - calculateTTC(montantHT: number, tauxTVA: number): number
 * - formatFactureNumber(seq: number, year: number): string
 * - isEcheanceDepassee(dateEcheanceStr: string): boolean
 */

export const calculateTTC = (montantHT: number, tauxTVA = 0.2): number => {
  return Number((montantHT * (1 + tauxTVA)).toFixed(2));
};

