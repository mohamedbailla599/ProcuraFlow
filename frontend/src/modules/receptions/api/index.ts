/**
 * Client API pour le module Réceptions (Ali - Spring Boot :8083)
 *
 * Directives d'intégration ProcuraFlow :
 * 1. Endpoint de base : /api/receptions (redirigé par le proxy Vite vers :8083)
 * 2. Communication exclusivement via HTTP REST + JSON
 * 3. Ne jamais interroger directement la base ou le schéma d'un autre microservice
 *
 * Fonctions à implémenter par le propriétaire :
 * - getReceptions(filters?: Record<string, any>): Promise<Reception[]>
 * - getReceptionById(id: number | string): Promise<Reception>
 * - createReception(data: Partial<Reception>): Promise<Reception>
 * - validateConformite(id: number | string, conformite: boolean, motif?: string): Promise<Reception>
 */

export const RECEPTIONS_API_BASE = '/api/receptions';

