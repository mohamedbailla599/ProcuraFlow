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

export function list(page: number, commandeId: string, signal: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), size: '10' });
  if (commandeId) query.set('commandeId', commandeId);
  return json<{ contenu: Reception[]; nombrePages: number }>(`${base}?${query}`, { signal });
}
export const soldes = (id: number, signal: AbortSignal) =>
  json<Solde[]>(`${base}/commandes/${id}/soldes`, { signal });
export const creer = (body: Creation) => json<Reception>(base, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});
