import { desc, eq, and, ne, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { factures, FactureSelect } from '../db/schema';
import { Facture, StatutPaiement } from '../types/facture.types';

export interface CreateFactureEntity {
  commande_id: number;
  reception_id: number;
  montant_facture?: number;
  montant_total?: number;
  date_facture?: string | Date;
  statut_paiement?: StatutPaiement;
  numero_facture?: string;
}

export interface UpdateFactureEntity {
  montant_facture?: number;
  montant_total?: number;
  date_facture?: string | Date;
}


function mapRecordToFacture(record: FactureSelect): Facture {
  const montant = Number(record.montantFacture);
  const year = record.dateFacture
    ? new Date(record.dateFacture).getFullYear()
    : new Date().getFullYear();

  return {
    id: record.id,
    commande_id: record.commandeId,
    reception_id: record.receptionId,
    date_facture: record.dateFacture,
    montant_facture: montant,
    montant_total: montant,
    statut_paiement: record.statutPaiement as StatutPaiement,
    numero_facture:
      record.numeroFacture || `FAC-${year}-${String(record.id).padStart(5, '0')}`,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}


export async function findAll(): Promise<Facture[]> {
  const records = await db
    .select()
    .from(factures)
    .orderBy(desc(factures.createdAt));

  return records.map(mapRecordToFacture);
}


export async function findById(id: number): Promise<Facture | null> {
  const records = await db
    .select()
    .from(factures)
    .where(eq(factures.id, id));

  return records[0] ? mapRecordToFacture(records[0]) : null;
}


export async function findByCommandeId(commandeId: number): Promise<Facture | null> {
  const records = await db
    .select()
    .from(factures)
    .where(
      and(
        eq(factures.commandeId, commandeId),
        ne(factures.statutPaiement, 'ANNULEE')
      )
    );

  return records[0] ? mapRecordToFacture(records[0]) : null;
}

export async function findByReceptionId(receptionId: number): Promise<Facture | null> {
  const records = await db
    .select()
    .from(factures)
    .where(
      and(
        eq(factures.receptionId, receptionId),
        ne(factures.statutPaiement, 'ANNULEE')
      )
    );

  return records[0] ? mapRecordToFacture(records[0]) : null;
}

export async function findAllByCommandeId(commandeId: number): Promise<Facture[]> {
  const records = await db
    .select()
    .from(factures)
    .where(
      and(
        eq(factures.commandeId, commandeId),
        ne(factures.statutPaiement, 'ANNULEE')
      )
    );

  return records.map(mapRecordToFacture);
}


export async function generateNumeroFacture(): Promise<string> {
  try {
    const result = await db.execute<{ seq: string | number }>(
      sql`SELECT nextval('schema_factures.facture_numero_seq') AS seq`
    );
    const rows = (result as any).rows || result;
    const seq = rows[0]?.seq ?? 1;
    const year = new Date().getFullYear();
    return `FAC-${year}-${String(seq).padStart(5, '0')}`;
  } catch {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `FAC-${year}-${random}`;
  }
}


export async function create(facture: CreateFactureEntity): Promise<Facture> {
  const montant = Number(facture.montant_facture ?? facture.montant_total ?? 0);
  const dateFacture = facture.date_facture ? new Date(facture.date_facture) : new Date();

  const [record] = await db
    .insert(factures)
    .values({
      numeroFacture: facture.numero_facture,
      commandeId: facture.commande_id,
      receptionId: facture.reception_id,
      dateFacture: dateFacture,
      montantFacture: montant.toFixed(2),
      statutPaiement: facture.statut_paiement || 'NON_PAYEE',
    })
    .returning();

  return mapRecordToFacture(record);
}


export async function update(
  id: number,
  updates: UpdateFactureEntity
): Promise<Facture | null> {
  const toSet: Record<string, any> = {};
  const montant = updates.montant_facture ?? updates.montant_total;

  if (montant !== undefined) {
    toSet.montantFacture = Number(montant).toFixed(2);
  }
  if (updates.date_facture !== undefined) {
    toSet.dateFacture = new Date(updates.date_facture);
  }

  if (Object.keys(toSet).length === 0) {
    return findById(id);
  }

  toSet.updatedAt = new Date();

  const [record] = await db
    .update(factures)
    .set(toSet)
    .where(eq(factures.id, id))
    .returning();

  return record ? mapRecordToFacture(record) : null;
}


export async function updateStatutPaiement(
  id: number,
  statutPaiement: StatutPaiement
): Promise<Facture | null> {
  const [record] = await db
    .update(factures)
    .set({
      statutPaiement,
      updatedAt: new Date(),
    })
    .where(eq(factures.id, id))
    .returning();

  return record ? mapRecordToFacture(record) : null;
}


export async function remove(id: number): Promise<Facture | null> {
  const [record] = await db
    .delete(factures)
    .where(eq(factures.id, id))
    .returning();

  return record ? mapRecordToFacture(record) : null;
}

export default {
  findAll,
  findById,
  findByCommandeId,
  findByReceptionId,
  findAllByCommandeId,
  generateNumeroFacture,
  create,
  update,
  updateStatutPaiement,
  remove,
};
