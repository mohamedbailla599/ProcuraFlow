import axios from 'axios';
import env from '../config/env';
import ApiError from '../utils/ApiError';
import { ReceptionResponse } from '../types/facture.types';


export const STATUTS_CONFORMES = ['CONFORME'];


export async function getReceptionById(receptionId: number): Promise<ReceptionResponse> {
  try {
    const response = await axios.get<ReceptionResponse>(
      `${env.RECEPTIONS_SERVICE_URL}/api/receptions/${receptionId}`,
      { timeout: env.REQUEST_TIMEOUT }
    );
    return response.data;
  } catch (error: any) {
    handleClientError(error, 'Réceptions', receptionId);
  }
}

export async function verifierReception(
  receptionId: number,
  commandeId: number
): Promise<ReceptionResponse> {
  const reception = await getReceptionById(receptionId);

  const rawStatut =
    reception.statutReception ||
    reception.statut_reception ||
    reception.statut ||
    reception.status;

  const statut = (rawStatut ? String(rawStatut).toUpperCase() : '') as string;

  if (!STATUTS_CONFORMES.includes(statut)) {
    throw ApiError.badRequest(
      `La réception ${receptionId} a le statut "${statut || 'INCONNU'}" et ne permet pas la facturation. ` +
        `Statuts autorisés : ${STATUTS_CONFORMES.join(', ')}`
    );
  }

  const receptionCommandeId = reception.commande_id || reception.commandeId;

  if (receptionCommandeId && Number(receptionCommandeId) !== Number(commandeId)) {
    throw ApiError.badRequest(
      `La réception ${receptionId} est associée à la commande ${receptionCommandeId}, ` +
        `mais la facture référence la commande ${commandeId}`
    );
  }

  return reception;
}


function handleClientError(error: any, serviceName: string, resourceId: number): never {
  if (error?.response) {
    if (error.response.status === 404) {
      throw ApiError.badRequest(
        `La réception avec l'ID ${resourceId} n'existe pas dans le service ${serviceName}`
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
  getReceptionById,
  verifierReception,
  STATUTS_CONFORMES,
};

