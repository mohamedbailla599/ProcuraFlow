import { Fournisseur, FournisseurRequest, CommandeSummary, ApiErrorResponse, FilterParams } from '../types/fournisseur';

const API_BASE = '/api/fournisseurs';

// Default initial mock data for demo mode or offline fallback
export const INITIAL_MOCK_FOURNISSEURS: Fournisseur[] = [
  {
    id: 1,
    nom: 'Atlas Fournitures Industrielles',
    email: 'contact@atlas-fournitures.example',
    telephone: '+212 528 84 00 00',
    adresse: 'Zone Industrielle Tassila, Agadir, Maroc',
    actif: true,
    rating: 4.8,
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 2,
    nom: 'TechnoLab Équipements Scientifiques',
    email: 'ventes@technolab-univ.fr',
    telephone: '+33 1 42 68 55 10',
    adresse: '14 Rue des Sciences, 75005 Paris, France',
    actif: true,
    rating: 4.9,
    createdAt: '2026-10-18T11:20:00Z',
    updatedAt: '2026-10-18T11:20:00Z',
  },
  {
    id: 3,
    nom: 'BuroTech Maroc',
    email: 'support@burotech.ma',
    telephone: '+212 522 30 11 22',
    adresse: 'Bd Mohammed V, Casablanca, Maroc',
    actif: false,
    rating: 3.2,
    createdAt: '2026-10-20T14:45:00Z',
    updatedAt: '2026-10-25T16:30:00Z',
  },
  {
    id: 4,
    nom: 'Campus Clean Services',
    email: 'service.client@campusclean.ma',
    telephone: '+212 661 23 45 67',
    adresse: 'Avenue des FAR, Rabat, Maroc',
    actif: true,
    rating: 4.5,
    createdAt: '2026-10-22T08:15:00Z',
    updatedAt: '2026-10-22T08:15:00Z',
  },
];

export const MOCK_COMMANDES: Record<number, CommandeSummary[]> = {
  1: [
    {
      id: 101,
      fournisseurId: 1,
      dateCommande: '2026-10-28T10:30:00Z',
      statut: 'VALIDEE',
      montantTotal: 15400.0,
      lignes: [
        { designation: 'Lots de rames de papier A4 80g', quantite: 200, prixUnitaire: 42.0 },
        { designation: 'Cartouches d’encre noire laser', quantite: 20, prixUnitaire: 350.0 },
      ],
    },
    {
      id: 102,
      fournisseurId: 1,
      dateCommande: '2026-11-04T14:10:00Z',
      statut: 'EN_ATTENTE',
      montantTotal: 8200.0,
      lignes: [
        { designation: 'Classeurs à levier dos 80mm', quantite: 150, prixUnitaire: 28.0 },
        { designation: 'Boîtes d’archivage carton renforcé', quantite: 100, prixUnitaire: 40.0 },
      ],
    },
  ],
  2: [
    {
      id: 201,
      fournisseurId: 2,
      dateCommande: '2026-10-19T16:00:00Z',
      statut: 'RECEPTIONNEE',
      montantTotal: 48500.0,
      lignes: [
        { designation: 'Microscope optique binoculaire 1000x', quantite: 5, prixUnitaire: 8500.0 },
        { designation: 'Kits de lames et lamelles préparées', quantite: 30, prixUnitaire: 200.0 },
      ],
    },
    {
      id: 202,
      fournisseurId: 2,
      dateCommande: '2026-11-02T09:15:00Z',
      statut: 'FACTUREE',
      montantTotal: 12200.0,
      lignes: [
        { designation: 'Agitateurs magnétiques chauffants', quantite: 4, prixUnitaire: 3050.0 },
      ],
    },
  ],
  3: [
    {
      id: 301,
      fournisseurId: 3,
      dateCommande: '2026-09-12T11:00:00Z',
      statut: 'ANNULEE',
      montantTotal: 6500.0,
      lignes: [
        { designation: 'Chaises de bureau ergonomiques', quantite: 10, prixUnitaire: 650.0 },
      ],
    },
  ],
  4: [
    {
      id: 401,
      fournisseurId: 4,
      dateCommande: '2026-10-25T08:30:00Z',
      statut: 'FACTUREE',
      montantTotal: 19400.0,
      lignes: [
        { designation: 'Nettoyage & assainissement périodique des locaux', quantite: 1, prixUnitaire: 19400.0 },
      ],
    },
  ],
};

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorPayload: ApiErrorResponse;
    try {
      errorPayload = await res.json();
    } catch {
      errorPayload = {
        status: res.status,
        error: res.statusText || 'Erreur HTTP',
        message: `Erreur du serveur (code ${res.status})`,
      };
    }
    throw errorPayload;
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const fournisseurApi = {
  async getFournisseurs(params: FilterParams = {}): Promise<Fournisseur[]> {
    const query = new URLSearchParams();
    if (params.actif !== undefined) {
      query.append('actif', String(params.actif));
    } else if (params.includeInactive) {
      query.append('includeInactive', 'true');
    }
    if (params.nom?.trim()) {
      query.append('nom', params.nom.trim());
    }
    if (params.email?.trim()) {
      query.append('email', params.email.trim());
    }

    const url = `${API_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    return parseResponse<Fournisseur[]>(res);
  },

  async getFournisseurById(id: number): Promise<Fournisseur> {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: { Accept: 'application/json' },
    });
    return parseResponse<Fournisseur>(res);
  },

  async createFournisseur(payload: FournisseurRequest): Promise<Fournisseur> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return parseResponse<Fournisseur>(res);
  },

  async updateFournisseur(id: number, payload: FournisseurRequest): Promise<Fournisseur> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return parseResponse<Fournisseur>(res);
  },

  async desactiverFournisseur(id: number): Promise<Fournisseur> {
    const res = await fetch(`${API_BASE}/${id}/desactiver`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });
    return parseResponse<Fournisseur>(res);
  },

  async reactiverFournisseur(id: number): Promise<Fournisseur> {
    const res = await fetch(`${API_BASE}/${id}/reactiver`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });
    return parseResponse<Fournisseur>(res);
  },

  async getCommandes(id: number): Promise<CommandeSummary[]> {
    const res = await fetch(`${API_BASE}/${id}/commandes`, {
      headers: { Accept: 'application/json' },
    });
    return parseResponse<CommandeSummary[]>(res);
  },

  async checkHealth(): Promise<{ status: string }> {
    const res = await fetch('/actuator/health');
    if (!res.ok) throw new Error('Service down');
    return res.json();
  },
};

