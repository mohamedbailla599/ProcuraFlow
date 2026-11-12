import { Router } from 'express';
import controller from '../controllers/facture.controller';
import validate from '../middlewares/validation.middleware';
import {
  createFactureSchema,
  updateFactureSchema,
  updatePaiementSchema,
  idParamSchema,
} from '../validators/facture.validator';

const router: Router = Router();

// GET /api/factures
router.get('/', controller.getAll);

// GET /api/factures/:id
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);

// POST /api/factures
router.post('/', validate(createFactureSchema, 'body'), controller.create);

// PUT /api/factures/:id
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateFactureSchema, 'body'),
  controller.update
);

// PATCH /api/factures/:id/paiement
router.patch(
  '/:id/paiement',
  validate(idParamSchema, 'params'),
  validate(updatePaiementSchema, 'body'),
  controller.updatePaiement
);

// DELETE /api/factures/:id
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove);

export default router;

