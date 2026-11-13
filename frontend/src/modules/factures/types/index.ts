export type StatutPaiement = 'NON_PAYEE' | 'PAYEE' | 'ANNULEE';

export interface Facture {
  id: number;
  numero_facture: string;
  commande_id: number;
  reception_id: number;
  date_facture: string;
  montant_facture: number;
  statut_paiement: StatutPaiement;
  created_at: string;
  updated_at: string;
  montant_total?: number;
}

export interface FactureFormData {
  commande_id: number;
  reception_id: number;
  montant_facture: number;
  date_facture?: string;
  numero_facture?: string;
  statut_paiement?: StatutPaiement;
}

export interface FactureStats {
  totalCount: number;
  nonPayeesCount: number;
  payeesCount: number;
  annuleesCount: number;
  montantTotal: number;
  montantNonPaye: number;
  montantPaye: number;
  montantAnnule: number;
  tauxReglement: number;
}

export type FactureStatusFilter = 'all' | 'NON_PAYEE' | 'PAYEE' | 'ANNULEE';
export type FactureSortOption =
  | 'date_desc'
  | 'date_asc'
  | 'montant_desc'
  | 'montant_asc'
  | 'id_desc';
export type FactureViewMode = 'table' | 'cards';
