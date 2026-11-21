import type { Creation, Reception, Solde } from '../types';

const base = '/api/receptions';

async function json<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.detail || `Service indisponible ou requête refusée (HTTP ${response.status}).`);
  }
  return response.json();
}

/**
 * Récupère les réceptions avec pagination et filtre optionnel par commande
 */
export function list(page: number, commandeId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), size: '10' });
  if (commandeId) query.set('commandeId', commandeId);
  return json<{ contenu: Reception[]; nombrePages: number }>(`${base}?${query}`, { signal });
}

/**
 * Récupère l'ensemble des réceptions (non paginé) pour le calcul des KPI globaux
 */
export function getAll(commandeId?: string, signal?: AbortSignal): Promise<Reception[]> {
  const url = commandeId ? `${base}?commandeId=${encodeURIComponent(commandeId)}` : base;
  return json<Reception[]>(url, { signal });
}

/**
 * Récupère le détail complet d'une réception par son ID
 */
export function getById(id: number, signal?: AbortSignal): Promise<Reception> {
  return json<Reception>(`${base}/${id}`, { signal });
}

/**
 * Récupère les soldes restants à réceptionner pour une commande
 */
export const soldes = (id: number, signal?: AbortSignal) =>
  json<Solde[]>(`${base}/commandes/${id}/soldes`, { signal });

/**
 * Enregistre une nouvelle réception de commande (idempotent via cleCreation)
 */
export const creer = (body: Creation) =>
  json<Reception>(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
