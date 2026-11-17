/**
 * Client API pour le module Factures (Hamza - Node.js Express :8084)
 *
 * Directives d'intégration ProcuraFlow :
 * 1. Endpoint de base : /api/factures (redirigé par le proxy Vite vers :8084)
 * 2. Communication exclusivement via HTTP REST + JSON
 * 3. Ne jamais interroger directement la base ou le schéma d'un autre microservice
 *
 * Fonctions à implémenter par le propriétaire :
 * - getFactures(filters?: Record<string, any>): Promise<Facture[]>
 * - getFactureById(id: number | string): Promise<Facture>
 * - createFacture(data: Partial<Facture>): Promise<Facture>
 * - triggerRapprochement(id: number | string): Promise<any>
 * - updateFactureStatus(id: number | string, status: string): Promise<Facture>
 */

export const FACTURES_API_BASE = '/api/factures';

