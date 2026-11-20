import { Request, Response, NextFunction } from 'express';
import factureService from '../services/facture.service';

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const factures = await factureService.getAllFactures();
    res.status(200).json({
      success: true,
      count: factures.length,
      data: factures,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facture = await factureService.getFactureById(Number(req.params.id));
    res.status(200).json({
      success: true,
      data: facture,
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facture = await factureService.createFacture(req.body);
    res.status(201).json({
      success: true,
      message: `Facture ${facture.numero_facture} créée avec succès`,
      data: facture,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facture = await factureService.updateFacture(Number(req.params.id), req.body);
    res.status(200).json({
      success: true,
      message: `Facture ${facture.numero_facture} mise à jour avec succès`,
      data: facture,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePaiement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facture = await factureService.updatePaiement(
      Number(req.params.id),
      req.body.statut_paiement
    );
    res.status(200).json({
      success: true,
      message: `Statut de paiement mis à jour : ${facture.statut_paiement}`,
      data: facture,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await factureService.deleteFacture(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.facture,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  updatePaiement,
  remove,
};

