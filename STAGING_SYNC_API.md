# Healthy Women v1.11 — staging-only encrypted synchronization API

**Status: DRAFT — NO LIVE API DEPLOYMENT.** This branch extends PR #4.
The existing Vercel FAQ bot, `healthy-women.vercel.app` PWA and Android
installations remain unchanged. No real medical records have been uploaded.

## Completed in the separate Neon staging project (2026-11-10)

- Project `withered-forest-05953681`, name `healthy-women-staging`, 
  branch `br-lingering-term-banzbugi`, PostgreSQL 17, Free, Frankfurt region.
- Created dedicated Postgres role `hw_sync_staging_rw` with Neon's
  scoped `read_write` option, database `healthy_women_staging` and schema
  `hw_private`; **suppressed password/connection details from all logs**.
- Revoked `DELETE` directly on `hw_private.opaque_snapshots`, as the
  application uses revisioned `deleted=true` tombstones instead of SQL DELETE.
- Verified the role can SELECT/INSERT/UPDATE but cannot DELETE, CREATE
  objects in either `public` or `hw_private`, create databases, create
  roles, bypass row security, or act as a Postgres superuser.
- Two near-simultaneous **independent SQL connector requests** inserting the
  same synthetic account: exactly one returned a revision, the other returned
  no row. Subsequent two updates starting with the *same* existing revision:
  exactly one returned a row. An authorized tombstone then removed ciphertext;
  a stale attempt to resurrect it failed.
- These parallel checks are **not a load/stress test or a proof of every
  transactional race**. A dedicated SQL client with multiple independent
  long-lived sessions under load is still required before production.
- Fictional records remain only as tombstones. Do not treat account metadata
  as anonymous or ignore retention/privacy obligations.

## Staging HTTP design

`bot-vercel/api/sync.js` exposes a **code-only**, disabled-by-default
`GET/PUT/DELETE /api/sync` handler. It does not run in the live bot because
this GitHub branch is not deployed.

Staging deployment must explicitly set ALL of:
- `SYNC_API_MODE=staging`
- `SYNC_ALLOWED_HOSTNAME=<exact staging API hostname>`; *never* the
  current `healthy-women-bot.vercel.app` hostname
- `SYNC_CLIENT_ORIGIN=<single HTTPS staging client origin>`
- `BOT_TOKEN` as a **Sensitive** backend-only variable, identical to the
  Telegram bot used to validate Mini App `initData`
- `DATABASE_URL` as a **Sensitive** backend-only variable, using the
  limited Postgres role; TLS required.

Missing configuration yields 503. Only signed Telegram `initData` in
`X-Telegram-Init-Data` is accepted as account identity. Browser `Origin`
is checked for CORS but is **never** an authentication credential.

| Method | Payload | Result |
|---|---|---|
| GET | No body; signed initData header | `empty`, `present` + encrypted envelope, or `erased` |
| PUT | JSON `{envelope,expectedRevision}`; signed initData | `stored`, `conflict`, or `erased` |
| DELETE | JSON `{expectedRevision,confirmation:"ERASE_REMOTE_ENCRYPTED_DATA"}`, and `X-Sync-Erase-Intent: erase-remote` | A revisioned tombstone or `conflict` |

DELETE also requires a signed launch from the past five minutes. The client
still needs an explicit, accessible confirmation UI and an independent
encrypted backup warning before exposing DELETE to real users.

Server response bodies **never** include a passphrase, username, decrypted
record, database password, raw initData, or SQL error. All responses are
`no-store`; request bodies have a strict 1.5-MB upper bound and accept
only a versioned, strictly validated encrypted envelope.

## Mandatory blockers before any public use

1. **No automatic client integration yet.** The app's old plaintext sync path
   remains disabled. No health records are sent from the PWA or Android APK.
2. Two-device staging flow, accessible opt-in/opt-out UI, encryption password
   recovery plan, and offline-first rollback must be implemented and verified
   only on **fictitious** records.
3. Webhook and API runtime MUST be separate if privileges/quotas need
   isolation. Add rate limiting, body-request logging suppression, replay
   protection, per-account abuse limits, DB outage handling, and monitoring.
4. Review encrypted snapshot retention and immutable tombstones under local
   data-protection obligations; test deletion from provider backups according
   to its retention policy. The tombstone retains the numeric Telegram ID.
5. Independent security review, real Neon multi-session concurrency tests,
   privacy review, and cost-plan verification must precede production.
6. `BOT_TOKEN`, `DATABASE_URL`, `WEBHOOK_SECRET`, the user's cloud passphrase,
   and signed `initData` must not be committed, printed, or pasted into chat.

**Current state:** staging PostgreSQL/role verified; code-only staging API
prepared. No staging Vercel project or runtime variables have been deployed.
No production features enabled.
