import { z } from 'zod';

// --- Schéma de création d'une facture ---
export const createFactureSchema = z
  .object({
    commande_id: z
      .number({
        message: 'Le champ commande_id est obligatoire',
      })
      .int('commande_id doit être un nombre entier')
      .positive('commande_id doit être un nombre positif'),

    reception_id: z
      .number({
        message: 'Le champ reception_id est obligatoire',
      })
      .int('reception_id doit être un nombre entier')
      .positive('reception_id doit être un nombre positif'),

    montant_facture: z
      .number({
        message: 'montant_facture doit être un nombre',
      })
      .positive('Le montant de la facture doit être strictement positif')
      .optional(),

    montant_total: z
      .number({
        message: 'montant_total doit être un nombre',
      })
      .positive('Le montant total doit être strictement positif')
      .optional(),

    date_facture: z
      .string()
      .optional(),
  })
  .refine(
    (data) => data.montant_facture !== undefined || data.montant_total !== undefined,
    {
      message: 'Le champ montant_facture (ou montant_total) est obligatoire',
      path: ['montant_facture'],
    }
  );

// --- Schéma de modification d'une facture ---
export const updateFactureSchema = z.object({
  montant_facture: z
    .number({
      message: 'montant_facture doit être un nombre',
    })
    .positive('Le montant de la facture doit être strictement positif')
    .optional(),

  montant_total: z
    .number({
      message: 'montant_total doit être un nombre',
    })
    .positive('Le montant total doit être strictement positif')
    .optional(),

  date_facture: z
    .string()
    .optional(),
});

// --- Schéma de mise à jour du paiement ---
export const updatePaiementSchema = z.object({
  statut_paiement: z.enum(['PAYEE', 'ANNULEE'], {
    message: 'statut_paiement doit être "PAYEE" ou "ANNULEE"',
  }),
});

// --- Schéma de validation de l'ID (paramètre URL) ---
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "L'identifiant doit être un nombre entier positif")
    .transform(Number),
});

export type CreateFactureInput = z.infer<typeof createFactureSchema>;
export type UpdateFactureInput = z.infer<typeof updateFactureSchema>;
export type UpdatePaiementInput = z.infer<typeof updatePaiementSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
