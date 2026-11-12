/**
 * Client API pour le module Commandes (Yassine - Spring Boot :8082)
 *
 * Directives d'intégration ProcuraFlow :
 * 1. Endpoint de base : /api/commandes (redirigé par le proxy Vite vers :8082)
 * 2. Communication exclusivement via HTTP REST + JSON
 * 3. Ne jamais interroger directement la base ou le schéma d'un autre microservice
 *
 * Fonctions à implémenter par le propriétaire :
 * - getCommandes(filters?: Record<string, any>): Promise<Commande[]>
 * - getCommandeById(id: number | string): Promise<Commande>
 * - createCommande(data: Partial<Commande>): Promise<Commande>
 * - updateCommandeStatus(id: number | string, status: string): Promise<Commande>
 */

export const COMMANDES_API_BASE = '/api/commandes';

