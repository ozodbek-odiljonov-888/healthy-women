-- Healthy Women v1.10: PostgreSQL/Neon reference migration, NOT yet deployed.
-- Run manually in a dedicated TEST database after reviewing the target project.
-- Neither patient data nor decryption keys belong in this database.
BEGIN;

CREATE SCHEMA IF NOT EXISTS hw_private;
REVOKE ALL ON SCHEMA hw_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS hw_private.opaque_snapshots (
    telegram_user_id bigint PRIMARY KEY
        CHECK (telegram_user_id > 0),
    revision uuid NOT NULL,
    deleted boolean NOT NULL DEFAULT false,
    envelope jsonb,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hw_snapshot_encrypted_only CHECK (
        (deleted = true AND envelope IS NULL)
        OR
        (deleted = false AND envelope IS NOT NULL
         AND jsonb_typeof(envelope) = 'object'
         AND octet_length(envelope::text) <= 1500000)
    )
);
REVOKE ALL ON TABLE hw_private.opaque_snapshots FROM PUBLIC;

-- The application connection string must be accessible only to the server.
-- No browser/anon role or public API should have schema or table privileges.
-- Row ownership is enforced by the SERVER after verifying Telegram initData.
-- The one-statement UPSERT uses a row lock for atomic compare-and-swap.
-- Tombstones are retained to prevent stale devices resurrecting deleted data.
COMMENT ON TABLE hw_private.opaque_snapshots IS
  'PRIVATE. One opaque encrypted snapshot per Telegram ID; tombstones deny resurrection. No raw medical records.';

COMMIT;
