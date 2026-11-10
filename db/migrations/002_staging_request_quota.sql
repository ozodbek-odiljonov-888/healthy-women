-- Healthy Women v1.12: no-cost, limited staging request budget.
-- Never expose this schema through a public database API.
-- Only one global row plus one pseudonymous row per authorized test user.
-- No IPs, passwords, raw Telegram ID, or health content in this table.
BEGIN;
CREATE TABLE IF NOT EXISTS hw_private.sync_request_quota (
  scope_key varchar(66) PRIMARY KEY
    CHECK (scope_key = 'global' OR scope_key ~ '^u:[0-9a-f]{64}$'),
  window_day integer NOT NULL CHECK (window_day >= 0),
  used integer NOT NULL CHECK (used > 0 AND used <= 1000),
  touched_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
REVOKE ALL ON TABLE hw_private.sync_request_quota FROM PUBLIC;
COMMENT ON TABLE hw_private.sync_request_quota IS
  'Staging-only atomic day quotas; no IP, plaintext diary or Telegram token.';
COMMIT;
