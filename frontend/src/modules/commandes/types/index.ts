/**
 * Types pour le module Commandes (Yassine - Spring Boot :8082)
 *
 * Définissez ici les interfaces TypeScript pour :
 * - Commande (id, numeroCommande, dateCommande, statut, montantTotal, fournisseurId, etc.)
 * - LigneCommande (id, reference, designation, quantite, prixUnitaireHT, etc.)
 * - Filtres et statistiques de commandes
 */

export interface Commande {
  id?: number | string;
  numero?: string;
  fournisseurId?: number;
  dateCommande?: string;
  statut?: 'BROUILLON' | 'VALIDEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
  montantTotal?: number;
}

