import factureRepository from '../repositories/facture.repository';
import commandeClient from '../clients/commande.client';
import receptionClient from '../clients/reception.client';
import ApiError from '../utils/ApiError';
import {
  Facture,
  StatutPaiement,
  CreateFactureDTO,
  UpdateFactureDTO,
  LigneArticle,
} from '../types/facture.types';


export const TRANSITIONS_AUTORISEES: Record<StatutPaiement, StatutPaiement[]> = {
  NON_PAYEE: ['PAYEE', 'ANNULEE'],
  PAYEE: [],       // Un paiement effectué ne peut pas être annulé via ce service
  ANNULEE: [],     // Une facture annulée ne peut pas changer de statut
};


export async function getAllFactures(): Promise<Facture[]> {
  return factureRepository.findAll();
}

export async function getFactureById(id: number): Promise<Facture> {
  const facture = await factureRepository.findById(id);
  if (!facture) {
    throw ApiError.notFound(`Facture avec l'ID ${id} non trouvée`);
  }
  return facture;
}

export async function createFacture(data: CreateFactureDTO): Promise<Facture> {
  // 1. Vérifier la commande auprès du microservice Commandes
  await commandeClient.verifierCommande(data.commande_id);

  // 2. Vérifier la réception auprès du microservice Réceptions
  await receptionClient.verifierReception(data.reception_id, data.commande_id);

  // 3. Vérifier les doublons (une seule facture active par commande)
  const existante = await factureRepository.findByCommandeId(data.commande_id);
  if (existante) {
    throw ApiError.conflict(
      `Une facture active existe déjà pour la commande ${data.commande_id} : ` +
        `${existante.numero_facture} (ID: ${existante.id})`
    );
  }

  // 4. Générer le numéro de facture
  const numeroFacture = await factureRepository.generateNumeroFacture();

  const montant = data.montant_facture ?? data.montant_total ?? 0;

  // 5. Créer la facture
  const facture = await factureRepository.create({
    numero_facture: numeroFacture,
    commande_id: data.commande_id,
    reception_id: data.reception_id,
    date_facture: data.date_facture,
    montant_facture: montant,
    montant_total: montant,
    statut_paiement: 'NON_PAYEE',
  });

  return facture;
}


export async function updateFacture(id: number, data: UpdateFactureDTO): Promise<Facture> {
  const facture = await getFactureById(id);

  // Seules les factures NON_PAYEE peuvent être modifiées
  if (facture.statut_paiement !== 'NON_PAYEE') {
    throw ApiError.conflict(
      `La facture ${facture.numero_facture} a le statut "${facture.statut_paiement}" ` +
        'et ne peut pas être modifiée. Seules les factures NON_PAYEE sont modifiables.'
    );
  }

  const montant = data.montant_facture ?? data.montant_total;
  const updated = await factureRepository.update(id, {
    ...data,
    montant_facture: montant,
    montant_total: montant,
  });
  if (!updated) {
    throw ApiError.notFound(`Facture avec l'ID ${id} non trouvée`);
  }
  return updated;
}

export async function updatePaiement(id: number, nouveauStatut: StatutPaiement): Promise<Facture> {
  const facture = await getFactureById(id);

  const statutActuel = facture.statut_paiement;
  const transitionsPermises = TRANSITIONS_AUTORISEES[statutActuel] || [];

  if (!transitionsPermises.includes(nouveauStatut)) {
    throw ApiError.conflict(
      `Transition de statut non autorisée : "${statutActuel}" → "${nouveauStatut}". ` +
        `Transitions possibles depuis "${statutActuel}" : ${
          transitionsPermises.length > 0
            ? transitionsPermises.join(', ')
            : 'aucune'
        }`
    );
  }

  const updated = await factureRepository.updateStatutPaiement(id, nouveauStatut);
  if (!updated) {
    throw ApiError.notFound(`Facture avec l'ID ${id} non trouvée`);
  }
  return updated;
}

export interface DeleteFactureResult {
  action: 'ANNULEE' | 'SUPPRIMEE';
  message: string;
  facture: Facture | null;
}

export async function deleteFacture(id: number): Promise<DeleteFactureResult> {
  const facture = await getFactureById(id);

  // Facture déjà payée : on annule au lieu de supprimer
  if (facture.statut_paiement === 'PAYEE') {
    const annulee = await factureRepository.updateStatutPaiement(id, 'ANNULEE');
    return {
      action: 'ANNULEE',
      message: `La facture ${facture.numero_facture} a été annulée (une facture payée ne peut pas être supprimée)`,
      facture: annulee,
    };
  }

  // Facture NON_PAYEE ou ANNULEE : suppression physique
  const supprimee = await factureRepository.remove(id);
  return {
    action: 'SUPPRIMEE',
    message: `La facture ${facture.numero_facture} a été supprimée définitivement`,
    facture: supprimee,
  };
}

export function calculerMontantTotal(lignes: LigneArticle[], tauxTva = 0): number {
  if (!Array.isArray(lignes) || lignes.length === 0) {
    throw ApiError.badRequest('La liste des lignes est requise pour calculer le montant total');
  }
  const sousTotal = lignes.reduce((total, ligne) => {
    if (typeof ligne.quantite !== 'number' || typeof ligne.prix_unitaire !== 'number') {
      throw ApiError.badRequest('La quantité et le prix unitaire doivent être des nombres');
    }
    if (ligne.quantite <= 0 || ligne.prix_unitaire <= 0) {
      throw ApiError.badRequest('La quantité et le prix unitaire doivent être strictement positifs');
    }
    return total + (ligne.quantite * ligne.prix_unitaire);
  }, 0);

  const total = sousTotal * (1 + (tauxTva || 0) / 100);
  return Number(total.toFixed(2));
}

export default {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  updatePaiement,
  deleteFacture,
  calculerMontantTotal,
  TRANSITIONS_AUTORISEES,
};

