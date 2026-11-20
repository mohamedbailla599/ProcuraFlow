export interface LigneReception {
  id: number;
  ligneCommandeId: number;
  quantiteRecue: number;
  remarques: string | null;
}

export interface Reception {
  id: number;
  commandeId: number;
  dateReception: string | null;
  statutReception: string | null;
  remarques: string | null;
  lignes: LigneReception[];
}

export interface Solde {
  ligneCommandeId: number;
  designation: string;
  quantiteCommandee: number;
  restante: number;
}

export interface Creation {
  commandeId: number;
  cleCreation: string;
  remarques: string;
  lignes: { ligneCommandeId: number; quantiteRecue: number }[];
}
