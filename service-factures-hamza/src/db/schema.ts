// =============================================================
// src/db/schema.ts
// Schéma Drizzle ORM aligné sur PostgreSQL / Neon DB.
// =============================================================

import { pgSchema, bigint, numeric, varchar, timestamp } from 'drizzle-orm/pg-core';

// Schéma dédié : schema_factures
export const schemaFactures = pgSchema('schema_factures');

// Table factures dans schema_factures
export const factures = schemaFactures.table('factures', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  numeroFacture: varchar('numero_facture', { length: 50 }).unique(),
  commandeId: bigint('commande_id', { mode: 'number' }).notNull(),
  receptionId: bigint('reception_id', { mode: 'number' }).notNull(),
  dateFacture: timestamp('date_facture', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  montantFacture: numeric('montant_facture', { precision: 12, scale: 2 }).notNull(),
  statutPaiement: varchar('statut_paiement', { length: 30 }).notNull().default('NON_PAYEE'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export type FactureSelect = typeof factures.$inferSelect;
export type FactureInsert = typeof factures.$inferInsert;
