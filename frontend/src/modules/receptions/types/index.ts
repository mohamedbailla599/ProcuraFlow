/**
 * Types pour le module Réceptions (Ali - Spring Boot :8083)
 *
 * Définissez ici les interfaces TypeScript pour :
 * - Reception / BonDeReception (id, numeroReception, commandeId, dateReception, statutConformite, agentReception, etc.)
 * - LigneReception (id, ligneCommandeId, quantiteRecue, quantiteConforme, quantiteRejetee, motifRejet, etc.)
 * - Filtres et statistiques de réceptions
 */

export interface Reception {
  id?: number | string;
  numeroReception?: string;
  commandeId?: number | string;
  dateReception?: string;
  statutConformite?: 'CONFORME' | 'NON_CONFORME' | 'PARTIELLE' | 'EN_ATTENTE';
  agentReception?: string;
  remarques?: string;
}

