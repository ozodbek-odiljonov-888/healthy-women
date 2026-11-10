# Healthy Women v1.21 — private-first local diary (draft)

**STATUS: NOT DEPLOYED.** This branch is stacked on v1.20; no live
Vercel, Telegram webhook, database, or paid service has been modified.

## Exact privacy change

- A **new installation** (neither `healthywomen.events.v1` legacy key nor
  `healthywomen.encrypted-local.v1` vault key) is shown the existing
  local encryption setup dialog before a first medical journal entry.
- The diary write path independently refuses unencrypted first writes,
  including after the user dismisses the setup. The app can still be
  browsed without creating a health record.
- Setup reuses the existing **PBKDF2-SHA256 310,000 rounds and
  AES-256-GCM** code, explicit password confirmation, verified encrypted
  backup download, and user confirmation. It does not transmit the
  password, ciphertext or diary to Neon, Telegram or Vercel APIs.
- After deleting the local journal, a **new** journal again requires
  encrypted setup. No plaintext fallback is permitted for new writes.
- The legacy key's **presence** is the compatibility signal, even if it
  contains corrupt data. Existing users keep their records and previously
  available guided migration; corrupted legacy records remain preserved
  and writing is blocked rather than overwritten.
- Offline service worker cache revision is advanced to v21 to prevent
  old cached JavaScript and new first-use UI from mixing after a release.

## Tests and verification

- `tests/private-first-journal.test.mjs`: new installation, legacy
  compatibility, fresh vault crypto round-trip, and source wiring checks.
- `tests/e2e-browser.mjs`: fictional new-install first-use setup, local
  encryption, legacy migration, backup, restore, password rotation,
  multi-tab locking, deletion/re-encryption and corrupt legacy handling.
- All regression tests must pass before any PR merge.
- An automated test success does not prove protection against malware,
  a compromised browser/device, memory forensics or copies already
  exported/downloaded. The original backup can still exist elsewhere.

## Next release gates

1. Complete browser E2E and local-data migration/restore regression.
2. Human review of all 50 medical educational responses and urgent
   escalation rules (currently 0/50 signed off).
3. Confirm no hidden plaintext fallback in PWA, Android or Telegram.
4. Test on actual low-end Android phones and desktop; confirm
   passphrase recovery UX and offline backup safety.
5. Keep cloud sync disabled, no new Vercel deployment, no paid upgrades;
   **Neon staging quotas** set in `ZERO_COST_POLICY.md` remain intact.

The user should be clearly informed that forgetting the local password
without an independent working backup can permanently lose local data.
The new-onboarding backup is of the **empty journal**, so it does not
protect entries recorded *after* setup. A fresh backup after adding
records remains essential.
