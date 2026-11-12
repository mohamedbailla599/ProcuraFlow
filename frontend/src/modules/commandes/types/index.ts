export interface LigneCommande {
  id?: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export type StatutCommande = 'EN_ATTENTE' | 'VALIDEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE' | string;

export interface Commande {
  id: number;
  fournisseurId: number;
  dateCommande: string;
  statut: StatutCommande;
  montantTotal: number;
  lignesCommande: LigneCommande[];
}

export interface CreateCommandePayload {
  fournisseurId: number;
  statut?: StatutCommande;
  lignesCommande: Omit<LigneCommande, 'id'>[];
}