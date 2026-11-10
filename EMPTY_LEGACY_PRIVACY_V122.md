# Healthy Women v1.22 — empty legacy journal privacy fix

**DRAFT only: no live bot, Mini App, PWA, APK or database deployment.**

## Security finding

In v1.21, first-use encryption was required only when both the encrypted
vault key and the old plaintext journal key were absent. An existing, **empty**
legacy key (for example `healthywomen.events.v1 = "[]"`) was treated as
historical content and allowed the first *new* medical entry to be written
without encryption. This is a first-use privacy bypass.

## Fix

- `needsEncryptedJournalSetup` treats both a missing legacy key and a
  **valid, empty legacy event array** as a first-use scenario.
- Encryption is required before saving the first new record, even if the
  user closes the setup dialog. The application can be browsed without
  storing personal health information.
- When a legacy journal has **actual entries**, or its JSON cannot safely
  be parsed, the original record is left in place. No automatic deletion,
  overwrite, migration or loss of an existing user's records.
- The original encryption process still creates and verifies an
  encrypted backup first; original legacy content is removed only after
  successful encrypted migration and user confirmation.
- Onboarding text now recognizes a valid empty legacy key as the
  new-journal encryption case.

## Verification

- New unit tests distinguish no key, empty `[]`, whitespace-only
  formatting, nonempty valid histories and invalid historical data.
- Chromium regression includes all v1.21 local encryption, migration,
  recovery, erasure, password rotation and cross-tab scenarios, plus
  a new independent browser test that dismisses the encryption setup
  and verifies an empty legacy diary cannot save a new note.
- CI must complete with **zero failures** before this branch is eligible
  for review. This patch does not deploy any changes to Vercel.

## Zero-cost and release policy

No payment method, new server, paid API, billing plan change, Neon
project, migration, or new Vercel deployment is needed. Existing
Vercel Hobby and Neon Free plan settings and Neon staging quotas
remain unchanged. Cloud synchronization is still disabled in production.

Human clinical approval for all 50 educational answers, real-device
testing and privacy/security review are still required before an
actual patient-facing release. Automatic tests are not proof of
clinical safety or universal bug-free operation.

## Verified CI report — 2026-11-10

Run: https://github.com/ozodbek-odiljonov-888/healthy-women/actions/runs/42864087986

- Node.js: **290 passed / 290 total**, **0 failures** (49 test files).
- Static/offline validation: **28 resources**, JS syntax and CSP: PASS.
- Chromium complete E2E: PASS for first-use encryption, existing-record
  migration, backups, restore, password rotation, wrong-password lock,
  cross-tab update, corrupted legacy recovery, erasure, and encrypted restart.
- Dedicated second Chromium E2E: PASS. A previously empty legacy key,
  even when the setup dialog is dismissed, **cannot save a new unencrypted
  entry**. No browser runtime error reported.
- This CI proof uses **synthetic/fictitious** data. Physical-device and
  independent security tests have not yet been performed.

This is **not a release approval**. PR #17 is still draft; production website,
Telegram bot and Android app are unchanged.
