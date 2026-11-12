export type StatutPaiement = 'NON_PAYEE' | 'PAYEE' | 'ANNULEE';

export interface Facture {
  id: number;
  commande_id: number;
  reception_id: number;
  date_facture: string | Date;
  montant_facture?: number | string;
  montant_total?: number | string;
  statut_paiement: StatutPaiement;
  created_at: string | Date;
  updated_at: string | Date;
  numero_facture?: string;
  notes?: string | null;
}

export interface CreateFactureDTO {
  commande_id: number;
  reception_id: number;
  montant_facture?: number;
  montant_total?: number;
  date_facture?: string;
  notes?: string;
}

export interface UpdateFactureDTO {
  montant_facture?: number;
  montant_total?: number;
  date_facture?: string;
  notes?: string;
}

export interface UpdatePaiementDTO {
  statut_paiement: 'PAYEE' | 'ANNULEE';
}

export interface LigneArticle {
  quantite: number;
  prix_unitaire: number;
  description?: string;
}

export interface CommandeResponse {
  id: number;
  fournisseur_id?: number;
  date_commande?: string;
  statut?: string;
  status?: string;
  montant_total?: number;
  [key: string]: any;
}

export interface ReceptionResponse {
  id: number;
  commande_id?: number;
  commandeId?: number;
  date_reception?: string;
  statut_reception?: string;
  statut?: string;
  status?: string;
  remarques?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: Array<{ champ: string; message: string }>;
}

