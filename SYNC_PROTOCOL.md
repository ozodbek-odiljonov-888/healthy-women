# Healthy Women — v1.9 client-encrypted synchronization contract (draft)

**Status: DEVELOPMENT ONLY, NOT DEPLOYED.** The live PWA, Telegram bot, and
Android app do **not** send patient records to this protocol. No remote database
is connected, no sync endpoint is mounted, and `site/config.js` remains blank.

## Threat model and security boundaries

1. **Device encryption.** The *client* validates up to 3,000 structured diary
   events and encrypts the snapshot using Web Crypto AES-256-GCM, a new 16-byte
   random salt and 12-byte IV per snapshot. A user-managed passphrase (16–256
   characters) derives a new key using PBKDF2-SHA256, 310,000 iterations.
   The passphrase and plaintext journal must never be sent to the server.
2. **Account binding.** The authenticated Telegram numeric user ID is included
   in the AES-GCM associated authenticated data (AAD), not used as a secret.
   A snapshot created for one Telegram identity cannot be decrypted under a
   different identity even if its passphrase is the same.
3. **Versioned ciphertext.** `site/sync-crypto.mjs` exposes
   `encryptSyncSnapshot(events,passphrase,verifiedUserId)` and
   `decryptSyncSnapshot(envelope,passphrase,verifiedUserId)`.
   Envelopes contain **only** format/version/algorithm/KDF/iterations/salt/IV/
   ciphertext. Event dates, symptoms, names and notes stay inside ciphertext.
   Envelopes have a 1 MiB maximum original plaintext payload.
4. **Telegram authentication.** The reference server contract first verifies
   signed `Telegram.WebApp.initData` using the privately configured bot token
   and a freshness check. Neither the browser's `initDataUnsafe` nor the
   HTTP Origin header grants account access.
5. **Server cannot decrypt.** `bot-vercel/worker/opaque-sync-contract.js`
   only validates the opaque envelope and provides `read/upload/erase`
   methods. The API is **not mounted**, and it has no database adapter.
   A future adapter must implement **atomic** `read(userId)` and
   `compareAndSwap(userId,expectedRevision,newRecord)`. Regular
   non-atomic get/set is not sufficient for concurrent clients.
6. **Concurrent updates.** Uploads require an expected revision and reject
   stale revisions. `site/sync-merge.mjs` conservatively halts on any
   divergent record with the same ID. It does not pick the newest timestamp
   or silently reintroduce deleted events. A future UI must collect explicit
   per-record decisions, showing clearly when deletion could be undone.
7. **Remote erasure.** The reference protocol creates a tombstone, removing
   the encrypted snapshot and permanently blocking a stale device from
   recreating the erased records. A deliberate account re-enrollment process
   would be needed to allow later remote sync; it does **not** exist yet.

## Important limitations

- This is **not an operational sync feature** and has not been deployed.
  The next phase requires a durable database, storage-level transactions,
  server quotas, retention windows, protection against abuse and replay,
  deletion verification, privacy notice and consent flows, file recovery
  and cross-device conflict UI.
- Telegram verifies *identity*, not device ownership. Account compromise,
  infected browsers, weak passphrases, screen captures, or insecure exports
  are outside this prototype's protection. PBKDF2 does not guarantee that
  every 16-character passphrase is resistant to offline guessing.
- The new sync envelope is **not** the same format as an offline `.hwbak`
  backup. Conversion must decrypt **locally** with the respective
  passphrase and re-encrypt; never upload plaintext.
- Existing locally encrypted data in `localStorage` remains subject to
  its existing key/session and cleanup semantics. Connecting it to cloud
  must wait for a reviewed migration and verified encrypted backup.
- Do not log raw initData, secret tokens, passphrases, usernames, medical
  events, decrypted JSON, or full payloads.
- A future Vercel implementation should ensure the bot's `BOT_TOKEN` is a
  server-side sensitive variable only. Cloud app hosting and its cost/terms
  must be reviewed before public commercial use. No new paid resources have
  been created for this work.
- **Do not use with real medical data before independent security/privacy
  and clinical review.**

## Release-gate checklist

- [x] Reuse the v1.8 server-side Telegram signature verification.
- [x] Versioned client-encrypted envelope with fresh salt and nonce.
- [x] Account-bound decryption, strict envelope parsing and size limits.
- [x] Client-only manual conflict resolution planner.
- [x] Reference server contract for atomic revisions and deletion tombstones.
- [ ] Encrypted blob persistence on a reviewed durable provider, scoped by
      the verified Telegram identity; atomically compared revisions.
- [ ] Signed session replay/rate-limit protection and abuse monitoring with
      no clinical content in logs.
- [ ] Key recovery policy, device enrollment, secure migration and backup
      verification for existing users.
- [ ] Accessible user consent and conflict review UI; complete remote data
      deletion and account reset flow.
- [ ] Independent security assessment and testing on two real devices
      with fictional records.
- [ ] Controlled staging deployment before any production release.

## Tests

`node --test tests/sync-crypto.test.mjs tests/sync-merge.test.mjs tests/sync-contract.test.mjs`

A GitHub Action runs these through the project's standard `npm test` suite.
No patient data or real Telegram credentials appear in test fixtures.
