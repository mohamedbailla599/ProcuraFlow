import pool from './config/database';

async function check() {
  const client = await pool.connect();

  // Remplir la facture #1 si elle avait numero_facture à null
  await client.query(`
    UPDATE schema_factures.factures
    SET numero_facture = 'FAC-' || EXTRACT(YEAR FROM created_at)::text || '-' || LPAD(id::text, 5, '0')
    WHERE numero_facture IS NULL;
  `);

  const sample = await client.query('SELECT * FROM schema_factures.factures ORDER BY id DESC LIMIT 1;');
  console.log('\nDernière facture enregistrée sur Neon DB :');
  console.log(sample.rows[0]);

  client.release();
  await pool.end();
}

check();
