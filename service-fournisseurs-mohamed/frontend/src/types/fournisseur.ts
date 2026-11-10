export interface Fournisseur {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  actif: boolean;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FournisseurRequest {
  nom: string;
  email: string;
  telephone?: string | null;
  adresse?: string | null;
  rating?: number;
}

export interface LigneCommandeSummary {
  id?: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface CommandeSummary {
  id: number;
  fournisseurId: number;
  dateCommande: string;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'RECEPTIONNEE' | 'FACTUREE' | 'ANNULEE' | string;
  montantTotal: number;
  lignes?: LigneCommandeSummary[];
}

export interface ApiErrorResponse {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  validationErrors?: Record<string, string>;
}

export interface FilterParams {
  actif?: boolean;
  nom?: string;
  email?: string;
  includeInactive?: boolean;
}

