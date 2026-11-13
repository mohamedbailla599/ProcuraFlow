import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import ApiError from '../utils/ApiError';

export type ValidationSource = 'body' | 'params' | 'query';

/**
 * Crée un middleware de validation Express typé.
 *
 * @param schema - Schéma Zod à appliquer
 * @param source - Source des données à valider ('body' | 'params' | 'query')
 * @returns Middleware Express
 */
export function validate(schema: ZodSchema, source: ValidationSource = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        champ: issue.path.join('.'),
        message: issue.message,
      }));

      throw ApiError.badRequest('Données invalides', errors);
    }

    // Remplacer les données par les données validées/transformées
    (req as any)[source] = result.data;
    next();
  };
}

export default validate;

