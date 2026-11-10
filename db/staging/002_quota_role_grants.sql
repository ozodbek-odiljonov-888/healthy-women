-- Healthy Women staging-only privilege grant (NOT for a production database).
-- The role already exists on the dedicated Neon Free staging branch.
-- The runtime does not need SQL DELETE; it only increments quota counters.
BEGIN;
GRANT USAGE ON SCHEMA hw_private TO hw_sync_staging_rw;
GRANT SELECT, INSERT, UPDATE
 ON TABLE hw_private.sync_request_quota TO hw_sync_staging_rw;
REVOKE DELETE ON TABLE hw_private.sync_request_quota FROM hw_sync_staging_rw;
COMMIT;
