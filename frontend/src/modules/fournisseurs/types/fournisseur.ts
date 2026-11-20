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
  search?: string;
  nom?: string;
  email?: string;
  ville?: string;
  includeInactive?: boolean;
  sort?: string;
}

export interface PaginatedFilterParams {
  page: number;
  size: number;
  sort?: string;
  search?: string;
  ville?: string;
  actif?: boolean;
  nom?: string;
  email?: string;
  includeInactive?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface FournisseurStats {
  total: number;
  actifs: number;
  inactifs: number;
  tauxEligibilite: number;
  villes: string[];
}

