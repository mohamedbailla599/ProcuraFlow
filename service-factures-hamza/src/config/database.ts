import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import env from './env';
import * as schema from '../db/schema';

const isNeon =
  env.DATABASE_URL.includes('neon.tech') ||
  env.DATABASE_URL.includes('sslmode=require');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', (client: PoolClient) => {
  // Positionne le search_path pour supporter schema_factures et public
  client.query('SET search_path TO schema_factures, public');
});

pool.on('error', (err: Error) => {
  console.error('❌ Erreur inattendue du pool PostgreSQL :', err.message);
});

// Instance Drizzle ORM typée avec le schéma
export const db = drizzle(pool, { schema });

export default pool;
