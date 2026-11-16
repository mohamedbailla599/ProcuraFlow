// =============================================================
// tests/unit/facture.service.test.ts
// Tests unitaires typés de la couche métier (facture.service.ts).
// =============================================================

// Mocks
jest.mock('../../src/repositories/facture.repository');
jest.mock('../../src/clients/commande.client');
jest.mock('../../src/clients/reception.client');

import * as factureService from '../../src/services/facture.service';
import * as factureRepository from '../../src/repositories/facture.repository';
import * as commandeClient from '../../src/clients/commande.client';
import * as receptionClient from '../../src/clients/reception.client';
import ApiError from '../../src/utils/ApiError';
import { Facture } from '../../src/types/facture.types';

const mockedRepo = jest.mocked(factureRepository);
const mockedCommandeClient = jest.mocked(commandeClient);
const mockedReceptionClient = jest.mocked(receptionClient);

// ─── Données de test ───────────────────────────────────────

const MOCK_COMMANDE = {
  id: 1,
  fournisseur_id: 5,
  date_commande: '2026-01-15T10:30:00Z',
  statut: 'VALIDEE',
  montant_total: 1500.00,
};

const MOCK_RECEPTION = {
  id: 1,
  commande_id: 1,
  date_reception: '2026-01-20T14:00:00Z',
  remarques: 'Tout reçu',
  statut_reception: 'CONFORME',
};

const MOCK_FACTURE: Facture = {
  id: 1,
  numero_facture: 'FAC-2026-00001',
  commande_id: 1,
  reception_id: 1,
  date_facture: '2026-01-25',
  montant_total: '1500.00',
  statut_paiement: 'NON_PAYEE',
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const VALID_INPUT = {
  commande_id: 1,
  reception_id: 1,
  montant_total: 1500.00,
};

// =============================================================
// Tests : Création d'une facture
// =============================================================

describe('FactureService - createFacture', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit créer une facture valide avec le statut NON_PAYEE', async () => {
    mockedCommandeClient.verifierCommande.mockResolvedValue(MOCK_COMMANDE);
    mockedReceptionClient.verifierReception.mockResolvedValue(MOCK_RECEPTION);
    mockedRepo.findByCommandeId.mockResolvedValue(null);
    mockedRepo.generateNumeroFacture.mockResolvedValue('FAC-2026-00001');
    mockedRepo.create.mockResolvedValue(MOCK_FACTURE);

    const result = await factureService.createFacture(VALID_INPUT);

    expect(result).toEqual(MOCK_FACTURE);
    expect(result.statut_paiement).toBe('NON_PAYEE');
    expect(mockedCommandeClient.verifierCommande).toHaveBeenCalledWith(1);
    expect(mockedReceptionClient.verifierReception).toHaveBeenCalledWith(1, 1);
    expect(mockedRepo.findByCommandeId).toHaveBeenCalledWith(1);
    expect(mockedRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commande_id: 1,
        reception_id: 1,
        montant_total: 1500.00,
        statut_paiement: 'NON_PAYEE',
      })
    );
  });

  test('doit échouer si la commande n\'existe pas', async () => {
    mockedCommandeClient.verifierCommande.mockRejectedValue(
      ApiError.badRequest("La commande avec l'ID 999 n'existe pas dans le service Commandes")
    );

    await expect(
      factureService.createFacture({ ...VALID_INPUT, commande_id: 999 })
    ).rejects.toThrow(ApiError);

    await expect(
      factureService.createFacture({ ...VALID_INPUT, commande_id: 999 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('doit échouer si la commande n\'est pas en statut VALIDEE', async () => {
    mockedCommandeClient.verifierCommande.mockRejectedValue(
      ApiError.badRequest('La commande 1 a le statut "EN_ATTENTE" et ne peut pas être facturée')
    );

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toThrow(ApiError);

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('doit échouer si la réception n\'est pas conforme', async () => {
    mockedCommandeClient.verifierCommande.mockResolvedValue(MOCK_COMMANDE);
    mockedReceptionClient.verifierReception.mockRejectedValue(
      ApiError.badRequest('La réception 1 a le statut "NON_CONFORME" et ne permet pas la facturation')
    );

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toThrow(ApiError);

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('doit retourner 503 si le service Commandes est indisponible', async () => {
    mockedCommandeClient.verifierCommande.mockRejectedValue(
      ApiError.serviceUnavailable('Commandes')
    );

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toMatchObject({ statusCode: 503 });
  });

  test('doit retourner 503 si le service Réceptions est indisponible', async () => {
    mockedCommandeClient.verifierCommande.mockResolvedValue(MOCK_COMMANDE);
    mockedReceptionClient.verifierReception.mockRejectedValue(
      ApiError.serviceUnavailable('Réceptions')
    );

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toMatchObject({ statusCode: 503 });
  });

  test('doit échouer si une facture active existe déjà pour la commande', async () => {
    mockedCommandeClient.verifierCommande.mockResolvedValue(MOCK_COMMANDE);
    mockedReceptionClient.verifierReception.mockResolvedValue(MOCK_RECEPTION);
    mockedRepo.findByCommandeId.mockResolvedValue(MOCK_FACTURE);

    await expect(
      factureService.createFacture(VALID_INPUT)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// =============================================================
// Tests : Consultation d'une facture
// =============================================================

describe('FactureService - getFactureById', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit retourner une facture existante', async () => {
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);

    const result = await factureService.getFactureById(1);

    expect(result).toEqual(MOCK_FACTURE);
    expect(mockedRepo.findById).toHaveBeenCalledWith(1);
  });

  test('doit échouer si la facture n\'existe pas', async () => {
    mockedRepo.findById.mockResolvedValue(null);

    await expect(
      factureService.getFactureById(999)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// =============================================================
// Tests : Liste de toutes les factures
// =============================================================

describe('FactureService - getAllFactures', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit retourner la liste des factures', async () => {
    mockedRepo.findAll.mockResolvedValue([MOCK_FACTURE]);

    const result = await factureService.getAllFactures();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(MOCK_FACTURE);
  });

  test('doit retourner un tableau vide s\'il n\'y a pas de factures', async () => {
    mockedRepo.findAll.mockResolvedValue([]);

    const result = await factureService.getAllFactures();

    expect(result).toEqual([]);
  });
});

// =============================================================
// Tests : Mise à jour du statut de paiement
// =============================================================

describe('FactureService - updatePaiement', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit passer de NON_PAYEE à PAYEE', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.updateStatutPaiement.mockResolvedValue(facturePaye);

    const result = await factureService.updatePaiement(1, 'PAYEE');

    expect(result.statut_paiement).toBe('PAYEE');
  });

  test('doit passer de NON_PAYEE à ANNULEE', async () => {
    const factureAnnulee: Facture = { ...MOCK_FACTURE, statut_paiement: 'ANNULEE' };
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.updateStatutPaiement.mockResolvedValue(factureAnnulee);

    const result = await factureService.updatePaiement(1, 'ANNULEE');

    expect(result.statut_paiement).toBe('ANNULEE');
  });

  test('doit refuser la transition PAYEE → NON_PAYEE', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    mockedRepo.findById.mockResolvedValue(facturePaye);

    await expect(
      factureService.updatePaiement(1, 'NON_PAYEE' as any)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('doit refuser la transition ANNULEE → PAYEE', async () => {
    const factureAnnulee: Facture = { ...MOCK_FACTURE, statut_paiement: 'ANNULEE' };
    mockedRepo.findById.mockResolvedValue(factureAnnulee);

    await expect(
      factureService.updatePaiement(1, 'PAYEE')
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('doit échouer si la facture n\'existe pas', async () => {
    mockedRepo.findById.mockResolvedValue(null);

    await expect(
      factureService.updatePaiement(999, 'PAYEE')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// =============================================================
// Tests : Modification d'une facture
// =============================================================

describe('FactureService - updateFacture', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit modifier une facture NON_PAYEE', async () => {
    const updated: Facture = { ...MOCK_FACTURE, montant_total: '2000.00' };
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.update.mockResolvedValue(updated);

    const result = await factureService.updateFacture(1, { montant_total: 2000 });

    expect(result.montant_total).toBe('2000.00');
  });

  test('doit refuser la modification d\'une facture PAYEE', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    mockedRepo.findById.mockResolvedValue(facturePaye);

    await expect(
      factureService.updateFacture(1, { montant_total: 2000 })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// =============================================================
// Tests : Suppression d'une facture
// =============================================================

describe('FactureService - deleteFacture', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doit supprimer physiquement une facture NON_PAYEE', async () => {
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.remove.mockResolvedValue(MOCK_FACTURE);

    const result = await factureService.deleteFacture(1);

    expect(result.action).toBe('SUPPRIMEE');
    expect(mockedRepo.remove).toHaveBeenCalledWith(1);
  });

  test('doit annuler (au lieu de supprimer) une facture PAYEE', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    const factureAnnulee: Facture = { ...MOCK_FACTURE, statut_paiement: 'ANNULEE' };
    mockedRepo.findById.mockResolvedValue(facturePaye);
    mockedRepo.updateStatutPaiement.mockResolvedValue(factureAnnulee);

    const result = await factureService.deleteFacture(1);

    expect(result.action).toBe('ANNULEE');
    expect(mockedRepo.remove).not.toHaveBeenCalled();
    expect(mockedRepo.updateStatutPaiement).toHaveBeenCalledWith(1, 'ANNULEE');
  });

  test('doit échouer si la facture n\'existe pas', async () => {
    mockedRepo.findById.mockResolvedValue(null);

    await expect(
      factureService.deleteFacture(999)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
