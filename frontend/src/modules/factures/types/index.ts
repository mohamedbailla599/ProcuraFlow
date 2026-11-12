/**
 * Types pour le module Factures (Hamza - Node.js Express :8084)
 *
 * Définissez ici les interfaces TypeScript pour :
 * - Facture (id, numeroFacture, fournisseurId, commandeId, receptionId, montantHT, montantTTC, statut, etc.)
 * - RapprochementTroisVoies (commandeValide, receptionConforme, montantEgal, statut)
 * - Filtres et statistiques de facturation
 */

export interface Facture {
  id?: number | string;
  numeroFacture?: string;
  fournisseurId?: number | string;
  commandeId?: number | string;
  receptionId?: number | string;
  dateEmission?: string;
  dateEcheance?: string;
  montantHT?: number;
  tauxTVA?: number;
  montantTTC?: number;
  statut?: 'A_VALIDER' | 'RAPPROCHEE' | 'EN_LITIGE' | 'PAYEE' | 'REJETEE';
}

