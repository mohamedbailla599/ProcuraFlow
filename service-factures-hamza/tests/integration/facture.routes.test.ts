// =============================================================
// tests/integration/facture.routes.test.ts
// Tests d'intégration typés des endpoints REST avec Supertest.
// =============================================================

import request from 'supertest';

// ─── Mocks (doivent être déclarés AVANT l'import de app) ───

// Mock du repository Factures
jest.mock('../../src/repositories/facture.repository');

// Mock de la configuration (pour éviter le fail-fast de env.ts)
jest.mock('../../src/config/env', () => ({
  PORT: 8084,
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  COMMANDES_SERVICE_URL: 'http://localhost:8082',
  RECEPTIONS_SERVICE_URL: 'http://localhost:8083',
  REQUEST_TIMEOUT: 3000,
}));

// Mock des clients REST
jest.mock('../../src/clients/commande.client');
jest.mock('../../src/clients/reception.client');

import app from '../../src/app';
import * as factureRepository from '../../src/repositories/facture.repository';
import * as commandeClient from '../../src/clients/commande.client';
import * as receptionClient from '../../src/clients/reception.client';
import ApiError from '../../src/utils/ApiError';
import { Facture } from '../../src/types/facture.types';

const mockedRepo = jest.mocked(factureRepository);
const mockedCommandeClient = jest.mocked(commandeClient);
const mockedReceptionClient = jest.mocked(receptionClient);

// ─── Données de test ───────────────────────────────────────

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

const MOCK_COMMANDE = {
  id: 1,
  fournisseur_id: 5,
  statut: 'VALIDEE',
  montant_total: 1500.00,
};

const MOCK_RECEPTION = {
  id: 1,
  commande_id: 1,
  statut_reception: 'CONFORME',
};

// =============================================================
// Tests : Health Check
// =============================================================

describe('GET /api/health', () => {
  test('doit retourner le statut UP du service', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('service-factures');
    expect(res.body.status).toBe('UP');
  });
});

// =============================================================
// Tests : Lister les factures
// =============================================================

describe('GET /api/factures', () => {
  test('doit retourner la liste des factures', async () => {
    mockedRepo.findAll.mockResolvedValue([MOCK_FACTURE]);

    const res = await request(app).get('/api/factures');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.count).toBe(1);
  });

  test('doit retourner un tableau vide', async () => {
    mockedRepo.findAll.mockResolvedValue([]);

    const res = await request(app).get('/api/factures');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// =============================================================
// Tests : Consulter une facture
// =============================================================

describe('GET /api/factures/:id', () => {
  test('doit retourner une facture existante', async () => {
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);

    const res = await request(app).get('/api/factures/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.numero_facture).toBe('FAC-2026-00001');
  });

  test('doit retourner 404 si la facture n\'existe pas', async () => {
    mockedRepo.findById.mockResolvedValue(null);

    const res = await request(app).get('/api/factures/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('doit retourner 400 si l\'ID est invalide', async () => {
    const res = await request(app).get('/api/factures/abc');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================
// Tests : Créer une facture
// =============================================================

describe('POST /api/factures', () => {
  test('doit créer une facture valide', async () => {
    mockedCommandeClient.verifierCommande.mockResolvedValue(MOCK_COMMANDE);
    mockedReceptionClient.verifierReception.mockResolvedValue(MOCK_RECEPTION);
    mockedRepo.findByCommandeId.mockResolvedValue(null);
    mockedRepo.generateNumeroFacture.mockResolvedValue('FAC-2026-00001');
    mockedRepo.create.mockResolvedValue(MOCK_FACTURE);

    const res = await request(app)
      .post('/api/factures')
      .send({
        commande_id: 1,
        reception_id: 1,
        montant_total: 1500.00,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statut_paiement).toBe('NON_PAYEE');
  });

  test('doit retourner 400 si les champs obligatoires sont manquants', async () => {
    const res = await request(app)
      .post('/api/factures')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('doit retourner 400 si le montant est négatif', async () => {
    const res = await request(app)
      .post('/api/factures')
      .send({
        commande_id: 1,
        reception_id: 1,
        montant_total: -100,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('doit retourner 503 si le service Commandes est indisponible', async () => {
    mockedCommandeClient.verifierCommande.mockRejectedValue(
      ApiError.serviceUnavailable('Commandes')
    );

    const res = await request(app)
      .post('/api/factures')
      .send({
        commande_id: 1,
        reception_id: 1,
        montant_total: 1500.00,
      });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================
// Tests : Mise à jour du paiement
// =============================================================

describe('PATCH /api/factures/:id/paiement', () => {
  test('doit mettre à jour le statut de paiement', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.updateStatutPaiement.mockResolvedValue(facturePaye);

    const res = await request(app)
      .patch('/api/factures/1/paiement')
      .send({ statut_paiement: 'PAYEE' });

    expect(res.status).toBe(200);
    expect(res.body.data.statut_paiement).toBe('PAYEE');
  });

  test('doit retourner 400 si le statut est invalide', async () => {
    const res = await request(app)
      .patch('/api/factures/1/paiement')
      .send({ statut_paiement: 'INVALIDE' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================
// Tests : Modifier une facture
// =============================================================

describe('PUT /api/factures/:id', () => {
  test('doit modifier une facture NON_PAYEE existante', async () => {
    const updatedFacture: Facture = { ...MOCK_FACTURE, montant_total: '2000.00' };
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.update.mockResolvedValue(updatedFacture);

    const res = await request(app)
      .put('/api/factures/1')
      .send({ montant_total: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.montant_total).toBe('2000.00');
  });

  test('doit retourner 409 si la facture est déjà PAYEE', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    mockedRepo.findById.mockResolvedValue(facturePaye);

    const res = await request(app)
      .put('/api/factures/1')
      .send({ montant_total: 2000 });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('doit retourner 400 si le montant est négatif', async () => {
    const res = await request(app)
      .put('/api/factures/1')
      .send({ montant_total: -500 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('doit retourner 404 si la facture n\'existe pas', async () => {
    mockedRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/factures/999')
      .send({ montant_total: 2000 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================
// Tests : Supprimer ou annuler une facture
// =============================================================

describe('DELETE /api/factures/:id', () => {
  test('doit supprimer physiquement une facture NON_PAYEE', async () => {
    mockedRepo.findById.mockResolvedValue(MOCK_FACTURE);
    mockedRepo.remove.mockResolvedValue(MOCK_FACTURE);

    const res = await request(app).delete('/api/factures/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockedRepo.remove).toHaveBeenCalledWith(1);
  });

  test('doit annuler comptablement une facture PAYEE', async () => {
    const facturePaye: Facture = { ...MOCK_FACTURE, statut_paiement: 'PAYEE' };
    const factureAnnulee: Facture = { ...MOCK_FACTURE, statut_paiement: 'ANNULEE' };
    mockedRepo.findById.mockResolvedValue(facturePaye);
    mockedRepo.updateStatutPaiement.mockResolvedValue(factureAnnulee);

    const res = await request(app).delete('/api/factures/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockedRepo.updateStatutPaiement).toHaveBeenCalledWith(1, 'ANNULEE');
  });

  test('doit retourner 404 si la facture n\'existe pas', async () => {
    mockedRepo.findById.mockResolvedValue(null);

    const res = await request(app).delete('/api/factures/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// =============================================================
// Tests : Routes inexistantes
// =============================================================

describe('Routes inexistantes', () => {
  test('doit retourner 404 pour une route inconnue', async () => {
    const res = await request(app).get('/api/inconnu');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
