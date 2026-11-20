import axios from 'axios';
import env from '../config/env';
import ApiError from '../utils/ApiError';
import { CommandeResponse } from '../types/facture.types';


export const STATUTS_FACTURABLES = ['VALIDEE', 'LIVREE'];

export async function getCommandeById(commandeId: number): Promise<CommandeResponse> {
  try {
    const response = await axios.get<CommandeResponse>(
      `${env.COMMANDES_SERVICE_URL}/api/commandes/${commandeId}`,
      { timeout: env.REQUEST_TIMEOUT }
    );
    return response.data;
  } catch (error: any) {
    handleClientError(error, 'Commandes', commandeId);
  }
}


export async function verifierCommande(commandeId: number): Promise<CommandeResponse> {
  const commande = await getCommandeById(commandeId);

  const statut = (commande.statut || commande.status) as string;

  if (!STATUTS_FACTURABLES.includes(statut)) {
    throw ApiError.badRequest(
      `La commande ${commandeId} a le statut "${statut}" et ne peut pas être facturée. ` +
        `Statuts autorisés : ${STATUTS_FACTURABLES.join(', ')}`
    );
  }

  return commande;
}

/**
 * Gestion centralisée des erreurs du client HTTP.
 */
function handleClientError(error: any, serviceName: string, resourceId: number): never {
  if (error?.response) {
    if (error.response.status === 404) {
      throw ApiError.badRequest(
        `La commande avec l'ID ${resourceId} n'existe pas dans le service ${serviceName}`
      );
    }
    throw ApiError.badRequest(
      `Erreur du service ${serviceName} : ${error.response.status} - ${error.response.data?.message || 'Erreur inconnue'}`
    );
  }

  if (error?.request) {
    throw ApiError.serviceUnavailable(serviceName);
  }

  throw ApiError.internal(
    `Erreur de configuration lors de l'appel au service ${serviceName}`
  );
}

export default {
  getCommandeById,
  verifierCommande,
  STATUTS_FACTURABLES,
};

