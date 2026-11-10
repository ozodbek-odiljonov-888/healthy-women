# Healthy Women v1.10 — Neon PostgreSQL storage adapter (draft)

**NOT DEPLOYED. NO DATABASE HAS BEEN CREATED. NO PATIENT DATA IS STORED REMOTELY.**

The existing Telegram FAQ bot and static PWA remain unaffected. This is a
**stacked draft** based on the v1.9 account-bound, end-to-end encrypted
synchronization contract. It contains a private SQL schema and a server-only
Neon adapter; it does NOT expose a new public HTTP sync endpoint.

## Provider choice — verified 2026-11-10

**Selected for future staging:** Neon PostgreSQL Free. According to Neon's
current free-tier documentation: up to **1 GB per project**, **100 CU-hours
per month per project**, **5 GB network transfer per month per project**, and
automatic scale-to-zero after 5 minutes of inactivity. Limits do not
automatically incur overage charges on Free; a quota exhaustion can suspend
compute or block writes. Therefore the app must continue working **offline**,
display a clear failure and support independent encrypted backups.
Official links:
- https://neon.com/docs/introduction/plans
- https://neon.com/docs/introduction/free-plan
- https://neon.com/pricing

Alternatives:
- Supabase Free has 500 MB/project and can pause after a low-activity week.
- Cloudflare D1 has 500 MB/database and 5 GB/account on Free, but would
  introduce a distinct Worker/D1 deployment pathway.

These services have different privacy contracts and operational trade-offs.
No provider has been connected in this change.

## What the candidate implements

- `db/migrations/001_opaque_snapshots.sql` creates a private schema
  `hw_private` and one table `opaque_snapshots`. Only a numeric Telegram
  identity, opaque encrypted JSON, UUID revision, deletion flag and write
  timestamp are stored.
- The table never accepts an open-text column. Schema constraints demand
  an encrypted JSON envelope for live rows, *no envelope* for deleted rows,
  and a size cap. The table/schema are not granted to `PUBLIC`.
- `bot-vercel/worker/neon-storage.js` implements the already-reviewed
  `read(accountId)` and `compareAndSwap(accountId,expectedRevision,next)`
  interface. Both queries use Neon's **parameterized** `sql.query()`.
- Compare-and-swap is ONE PostgreSQL UPSERT with a revision comparison and
  `existing.deleted = false`. A concurrently deleted record cannot be
  recreated by an old client. No multi-query read-then-write race is used
  to commit the record.
- `bot-vercel/worker/neon-provider.js` checks the server-side
  `DATABASE_URL`, loads the official Neon serverless driver lazily and
  supplies the adapter. **Neither file is imported by the current webhook.**
- `tests/neon-storage.test.mjs` tests the adapter's read, write, user
  separation, stale revision, tombstone, validation and parameterization
  using an in-memory SQL-result simulator and *fictional* data.
- No DNS, cloud project, database connection, Vercel environment variable,
  payment profile, deployment or Telegram webhook has been changed.

## IMPORTANT: not a complete clinical-grade security boundary

The server must verify Telegram `initData` before creating an account ID.
**Do not trust account IDs sent directly by a browser**, including the
Telegram Mini App `initDataUnsafe`. The v1.8 verifier is the required
precondition.

The private schema + secret database credentials prevent direct public
access, but **per-account authorization is enforced by server code**, not by
a client-accessible PostgreSQL RLS policy. The database owner and credential
holder can see account IDs, ciphertext sizes and timestamps, but should be
unable to decrypt encrypted journal contents without the independent
client-held passphrase. A compromised client, weak passphrase, stolen Telegram
account or breached server remains risky. Independent review is mandatory.

A deletion keeps a minimal `telegram_user_id` tombstone indefinitely to
block account resurrection. This identity is still personal metadata. A
privacy/legal retention and re-enrollment policy is needed before launch.
Deleting the record's ciphertext is not equivalent to guaranteed purge of
database backups, logs, or exports.

The available tests **do not connect to Neon**. The atomic SQL semantics,
database permissions, connection timeouts, data retention and failure
conditions still need integration testing in a dedicated staging project.
The `sql.query` interface follows Neon's official serverless driver
documentation: https://github.com/neondatabase/serverless/blob/main/CONFIG.md

## Future setup: DO NOT RUN ON PRODUCTION YET

1. Create a **separate Neon Free test project** at https://console.neon.tech/
   in a reviewed region appropriate for the deployment and privacy rules.
   Verify it is explicitly on the Free plan, with no paid upgrade/add-ons.
2. Back up any existing test database before schema changes. In the **Neon SQL
   Editor** of that staging project, review and run
   `db/migrations/001_opaque_snapshots.sql`.
3. Later, once deployment is separately authorized, place the Neon connection
   string only in the server project's protected Vercel environment variable
   `DATABASE_URL`. NEVER send it in chat or commit it to GitHub; do not add
   it to the public PWA build or service worker.
4. Use a database account with only the reviewed private schema privileges;
   avoid using a broad owner credential in a production runtime. Apply a
   dedicated least-privilege role configuration, tested against the private
   schema, before activation.
5. In staging, verify two simultaneous writes using the same revision:
   exactly one succeeds. Verify encrypted-only payload validation and
   deletion-vs-update concurrency across different server instances.
6. Add and independently review a rate-limited, consent-based, authenticated
   HTTP API and reconciliation UI. Test encrypted backup recovery on two real
   devices with *fictional* records. Ensure no sensitive data in logs.
7. Only then consider production deployment with budget, backup, retention
   and security compliance controls reviewed.

## What remains disabled

- The main site's cloud synchronization toggle.
- Upload/download/delete endpoints for encrypted cloud blobs.
- Any real database connection or database creation.
- Automatic journal uploads from Telegram Mini App, Android or Chrome.
- Account recovery, conflict resolution UI, remote erasure UI, rate limiting.

**No passwords, Telegram tokens or real health data should be put into
this draft PR or test output.**
