-- V1 created integer IDs and timestamps without an offset on fresh installations.
ALTER TABLE schema_receptions.receptions
    ALTER COLUMN id TYPE bigint,
    ALTER COLUMN commande_id TYPE bigint,
    ADD COLUMN cle_creation uuid UNIQUE;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns
               WHERE table_schema = 'schema_receptions' AND table_name = 'receptions'
                 AND column_name = 'date_reception' AND data_type = 'timestamp without time zone') THEN
        ALTER TABLE schema_receptions.receptions ALTER COLUMN date_reception TYPE timestamptz
            USING date_reception AT TIME ZONE 'UTC';
    END IF;
END $$;

CREATE INDEX receptions_commande_idx ON schema_receptions.receptions (commande_id);
