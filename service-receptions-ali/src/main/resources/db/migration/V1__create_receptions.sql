CREATE TABLE IF NOT EXISTS schema_receptions.receptions (
    id SERIAL PRIMARY KEY,
    commande_id INT NOT NULL,
    date_reception TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarques TEXT,
    statut_reception VARCHAR(30) DEFAULT 'CONFORME'
);