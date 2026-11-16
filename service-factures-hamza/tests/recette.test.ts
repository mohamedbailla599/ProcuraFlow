// =============================================================
// tests/recette.test.ts
// Cahier de Recette : Les 9 Tests de Validation Spécifiés (TypeScript)
// 1. Validation des données.
// 2. Création d'une facture.
// 3. Calcul du montant total.
// 4. Consultation par identifiant.
// 5. Recherche de factures.
// 6. Modification d'une facture.
// 7. Suppression d'une facture.
// 8. Gestion des erreurs de base de données.
// 9. Gestion des erreurs de communication REST.
// =============================================================

// Mocks
jest.mock('../src/repositories/facture.repository');
jest.mock('../src/clients/commande.client');
jest.mock('../src/clients/reception.client');

import * as factureService from '../src/services/facture.service';
import * as factureRepository from '../src/repositories/facture.repository';
import * as commandeClient from '../src/clients/commande.client';
import * as receptionClient from '../src/clients/reception.client';
import { createFactureSchema } from '../src/validators/facture.validator';
import ApiError from '../src/utils/ApiError';
import { Facture } from '../src/types/facture.types';

const mockedRepo = jest.mocked(factureRepository);
const mockedCommandeClient = jest.mocked(commandeClient);
const mockedReceptionClient = jest.mocked(receptionClient);

describe('Cahier de Recette - Validation des 9 Tests', () => {

  const MOCK_COMMANDE = {
    id: 1,
    fournisseur_id: 10,
    statut: 'VALIDEE',
    montant_total: 1200.00,
  };

  const MOCK_RECEPTION = {
    id: 1,
    commande_id: 1,
    statut_reception: 'CONFORME',
  };

  const MOCK_FACTURE: Facture = {
    id: 1,
    numero_facture: 'FAC-2026-00001',
    commande_id: 1,
    reception_id: 1,
    date_facture: '2026-02-01',
    montant_total: 1200.00,
    statut_paiement: 'NON_PAYEE',
    notes: 'Facture conforme',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------
  // Test 1 : Validation des données
  // -------------------------------------------------------------
  test('1. Validation des données : doit rejeter les données invalides et valider les conformes', () => {
    // Cas invalide : montant négatif
    const invalidDataNegatif = {
      commande_id: 1,
      reception_id: 1,
      montant_total: -50,
    };
    const resultNegatif = createFactureSchema.safeParse(invalidDataNegatif);
    expect(resultNegatif.success).toBe(false);

    // Cas invalide : champs obligatoires manquants
    const invalidDataManquant = {
      notes: 'Sans IDs',
    };
    const resultManquant = createFactureSchema.safeParse(invalidDataManquant);
    expect(resultManquant.success).toBe(false);

    // Cas valide
    const validData = {
      commande_id: 1,
      reception_id: 1,
      montant_total: 500.00,
    };
    const resultValide = createFactureSchema.safeParse(validData);
    expect(resultValide.success).toBe(true);
  });

  // -------------------------------------------------------------
  // Test 2 : Création d'une facture
  // -------------------------------------------------------------
  test("2. Création d'une facture : doit enregistrer la facture avec statut initial NON_PAYEE et numéro unique", async () => {
    mockedCommandeClient.verifierCommande.mockResolvedValue(MOCK_COMMANDE);
    mockedReceptionClient.verifierReception.mockResolvedValue(MOCK_RECEPTION);
    mockedRepo.findByCommandeId.mockResolvedValue(null);
    mockedRepo.generateNumeroFacture.mockResolvedValue('FAC-2026-00001');
    mockedRepo.create.mockResolvedValue(MOCK_FACTURE);

    const facture = await factureService.createFacture({
      commande_id: 1,
      reception_id: 1,
      montant_total: 1200.00,
      notes: 'Facture conforme',
    });

    expect(facture).toBeDefined();
    expect(facture.numero_facture).toBe('FAC-2026-00001');
    expect(facture.statut_paiement).toBe('NON_PAYEE');
    expect(mockedRepo.create).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------
  // Test 3 : Calcul du montant total
  // -------------------------------------------------------------
  test("3. Calcul du montant total : doit calculer la somme des lignes d'articles avec TVA avec précision", () => {
    const lignes = [
      { quantite: 2, prix_unitaire: 100 },  // 200
      { quantite: 3, prix_unitaire: 50 },   // 150
      { quantite: 1, prix_unitaire: 50 },   // 50
    ];
    // Sous-total = 400. Avec TVA 20% = 480.00
    const totalAvecTva = factureService.calculerMontantTotal(lignes, 20);
    expect(totalAvecTva).toBe(480.00);

    // Sans TVA = 400.00
    const totalSansTva = factureService.calculerMontantTotal(lignes, 0);
    expect(totalSansTva).toBe(400.00);

    // Rejet en cas de quantité ou prix invalide
    expect(() => factureService.calculerMontantTotal([])).toThrow(ApiError);
  });

  // -------------------------------------------------------------
  // Test 4 : Consultation par identifiant
  // -------------------------------------------------------------
  test('4. Consultation par identifiant : doit retourner la facture existante ou 404 si introuvable', async () => {
    mockedRepo.findById.mockResolvedValueOnce(MOCK_FACTURE);

    // Cas trouvé
    const found = await factureService.getFactureById(1);
    expect(found.id).toBe(1);
    expect(found.numero_facture).toBe('FAC-2026-00001');

    // Cas non trouvé
    mockedRepo.findById.mockResolvedValueOnce(null);
    await expect(factureService.getFactureById(999)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  // -------------------------------------------------------------
  // Test 5 : Recherche de factures
  // -------------------------------------------------------------
  test('5. Recherche de factures : doit retourner la liste de toutes les factures existantes', async () => {
    mockedRepo.findAll.mockResolvedValue([MOCK_FACTURE, { ...MOCK_FACTURE, id: 2 }]);

    const factures = await factureService.getAllFactures();
    expect(Array.isArray(factures)).toBe(true);
    expect(factures).toHaveLength(2);
    expect(mockedRepo.findAll).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------
  // Test 6 : Modification d'une facture
  // -------------------------------------------------------------
  test("6. Modification d'une facture : doit modifier une facture NON_PAYEE et interdire la modification d'une facture PAYEE", async () => {
    // Cas autorisé : NON_PAYEE
    mockedRepo.findById.mockResolvedValueOnce(MOCK_FACTURE);
    mockedRepo.update.mockResolvedValueOnce({
      ...MOCK_FACTURE,
      montant_total: 1300.00,
    });

    const updated = await factureService.updateFacture(1, { montant_total: 1300.00 });
    expect(updated.montant_total).toBe(1300.00);

    // Cas interdit : PAYEE
    mockedRepo.findById.mockResolvedValueOnce({
      ...MOCK_FACTURE,
      statut_paiement: 'PAYEE',
    });

    await expect(
      factureService.updateFacture(1, { montant_total: 1400.00 })
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  // -------------------------------------------------------------
  // Test 7 : Suppression d'une facture
  // -------------------------------------------------------------
  test("7. Suppression d'une facture : suppression physique si NON_PAYEE et annulation comptable si PAYEE", async () => {
    // Cas NON_PAYEE -> Suppression physique
    mockedRepo.findById.mockResolvedValueOnce(MOCK_FACTURE);
    mockedRepo.remove.mockResolvedValueOnce(MOCK_FACTURE);

    const resSuppression = await factureService.deleteFacture(1);
    expect(resSuppression.action).toBe('SUPPRIMEE');
    expect(mockedRepo.remove).toHaveBeenCalledWith(1);

    // Cas PAYEE -> Annulation logique (sécurité comptable)
    mockedRepo.findById.mockResolvedValueOnce({
      ...MOCK_FACTURE,
      statut_paiement: 'PAYEE',
    });
    mockedRepo.updateStatutPaiement.mockResolvedValueOnce({
      ...MOCK_FACTURE,
      statut_paiement: 'ANNULEE',
    });

    const resAnnulation = await factureService.deleteFacture(1);
    expect(resAnnulation.action).toBe('ANNULEE');
    expect(mockedRepo.updateStatutPaiement).toHaveBeenCalledWith(1, 'ANNULEE');
  });

  // -------------------------------------------------------------
  // Test 8 : Gestion des erreurs de base de données
  // -------------------------------------------------------------
  test('8. Gestion des erreurs de base de données : doit capturer et propager les erreurs PostgreSQL', async () => {
    const dbError = new Error('Connection lost to PostgreSQL');
    mockedRepo.findById.mockRejectedValue(dbError);

    await expect(factureService.getFactureById(1)).rejects.toThrow('Connection lost to PostgreSQL');
  });

  // -------------------------------------------------------------
  // Test 9 : Gestion des erreurs de communication REST
  // -------------------------------------------------------------
  test("9. Gestion des erreurs de communication REST : doit lever un HTTP 503 en cas de panne d'un service tiers", async () => {
    mockedCommandeClient.verifierCommande.mockRejectedValue(
      ApiError.serviceUnavailable('service-commandes')
    );

    await expect(
      factureService.createFacture({
        commande_id: 1,
        reception_id: 1,
        montant_total: 1000.00,
      })
    ).rejects.toMatchObject({
      statusCode: 503,
      message: expect.stringContaining('indisponible'),
    });
  });

});
