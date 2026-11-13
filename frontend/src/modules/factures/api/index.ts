import { Facture, FactureFormData } from '../types';

export const FACTURES_API_BASE = '/api/factures';

/**
 * Données simulées par défaut pour le mode démo ou hors-ligne.
 */
export const INITIAL_MOCK_FACTURES: Facture[] = [
  {
    id: 1,
    numero_facture: 'FAC-2026-00001',
    commande_id: 101,
    reception_id: 201,
    date_facture: '2026-10-29T14:30:00Z',
    montant_facture: 15400.0,
    statut_paiement: 'PAYEE',
    created_at: '2026-10-29T14:30:00Z',
    updated_at: '2026-11-01T10:15:00Z',
  },
  {
    id: 2,
    numero_facture: 'FAC-2026-00002',
    commande_id: 201,
    reception_id: 301,
    date_facture: '2026-11-02T09:15:00Z',
    montant_facture: 48500.0,
    statut_paiement: 'NON_PAYEE',
    created_at: '2026-11-02T09:15:00Z',
    updated_at: '2026-11-02T09:15:00Z',
  },
  {
    id: 3,
    numero_facture: 'FAC-2026-00003',
    commande_id: 202,
    reception_id: 302,
    date_facture: '2026-11-05T11:45:00Z',
    montant_facture: 12200.0,
    statut_paiement: 'PAYEE',
    created_at: '2026-11-05T11:45:00Z',
    updated_at: '2026-11-08T16:00:00Z',
  },
  {
    id: 4,
    numero_facture: 'FAC-2026-00004',
    commande_id: 401,
    reception_id: 401,
    date_facture: '2026-11-08T10:00:00Z',
    montant_facture: 19400.0,
    statut_paiement: 'NON_PAYEE',
    created_at: '2026-11-08T10:00:00Z',
    updated_at: '2026-11-08T10:00:00Z',
  },
  {
    id: 5,
    numero_facture: 'FAC-2026-00005',
    commande_id: 501,
    reception_id: 501,
    date_facture: '2026-11-10T16:20:00Z',
    montant_facture: 8750.0,
    statut_paiement: 'NON_PAYEE',
    created_at: '2026-11-10T16:20:00Z',
    updated_at: '2026-11-10T16:20:00Z',
  },
  {
    id: 6,
    numero_facture: 'FAC-2026-00006',
    commande_id: 601,
    reception_id: 601,
    date_facture: '2026-11-11T13:00:00Z',
    montant_facture: 32600.0,
    statut_paiement: 'PAYEE',
    created_at: '2026-11-11T13:00:00Z',
    updated_at: '2026-11-12T09:30:00Z',
  },
  {
    id: 7,
    numero_facture: 'FAC-2026-00007',
    commande_id: 701,
    reception_id: 701,
    date_facture: '2026-11-12T15:00:00Z',
    montant_facture: 5400.0,
    statut_paiement: 'ANNULEE',
    created_at: '2026-11-12T15:00:00Z',
    updated_at: '2026-11-13T09:00:00Z',
  },
];

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg =
      json?.message ||
      json?.errors?.[0]?.message ||
      `Erreur serveur HTTP ${res.status}`;
    throw new Error(errorMsg);
  }
  return (json?.data !== undefined ? json.data : json) as T;
}

export const factureApi = {
  /**
   * Vérifie la santé du microservice Factures (:8084).
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health', { method: 'GET' });
      const data = await res.json().catch(() => null);
      return res.ok && data?.status === 'UP' && data?.service === 'service-factures';
    } catch {
      return false;
    }
  },

  /**
   * Récupère la liste de toutes les factures.
   */
  async getFactures(signal?: AbortSignal): Promise<Facture[]> {
    const res = await fetch(FACTURES_API_BASE, {
      headers: { Accept: 'application/json' },
      signal,
    });
    return parseResponse<Facture[]>(res);
  },

  /**
   * Récupère une facture par son ID.
   */
  async getFactureById(id: number, signal?: AbortSignal): Promise<Facture> {
    const res = await fetch(`${FACTURES_API_BASE}/${id}`, {
      headers: { Accept: 'application/json' },
      signal,
    });
    return parseResponse<Facture>(res);
  },

  /**
   * Crée une nouvelle facture.
   */
  async createFacture(payload: FactureFormData): Promise<Facture> {
    const body: Record<string, any> = {
      commande_id: Number(payload.commande_id),
      reception_id: Number(payload.reception_id),
      montant_facture: Number(payload.montant_facture),
    };
    if (payload.date_facture) {
      body.date_facture = payload.date_facture;
    }

    const res = await fetch(FACTURES_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    return parseResponse<Facture>(res);
  },

  /**
   * Modifie une facture existante (champs montant & date).
   */
  async updateFacture(id: number, payload: Partial<FactureFormData>): Promise<Facture> {
    const body: Record<string, any> = {};
    if (payload.montant_facture !== undefined && !isNaN(Number(payload.montant_facture))) {
      body.montant_facture = Number(payload.montant_facture);
    }
    if (payload.date_facture) {
      body.date_facture = payload.date_facture;
    }

    const res = await fetch(`${FACTURES_API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    return parseResponse<Facture>(res);
  },

  /**
   * Met à jour le statut de paiement d'une facture.
   */
  async updatePaiement(id: number, statut: 'PAYEE' | 'NON_PAYEE' | string): Promise<Facture> {
    const res = await fetch(`${FACTURES_API_BASE}/${id}/paiement`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ statut_paiement: statut }),
    });
    return parseResponse<Facture>(res);
  },

  /**
   * Supprime une facture.
   */
  async deleteFacture(id: number): Promise<void> {
    const res = await fetch(`${FACTURES_API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    await parseResponse(res);
  },
};

export const facturesApi = factureApi;

