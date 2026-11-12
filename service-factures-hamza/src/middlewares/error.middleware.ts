import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import ApiError from '../utils/ApiError';

export const errorMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`❌ [${req.method} ${req.originalUrl}]`, err?.message || err);
    if (err?.statusCode >= 500 || !err?.statusCode) {
      console.error(err?.stack);
    }
  }

  // Erreur métier connue (ApiError)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { errors: err.details }),
    });
    return;
  }

  // Erreur de syntaxe JSON (body mal formé)
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      message: 'Le corps de la requête contient du JSON invalide',
    });
    return;
  }

  // Erreur PostgreSQL : violation de contrainte unique
  if (err?.code === '23505') {
    res.status(409).json({
      success: false,
      message: 'Un enregistrement avec ces données existe déjà',
    });
    return;
  }

  // Erreur inattendue
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
  });
};

export default errorMiddleware;

