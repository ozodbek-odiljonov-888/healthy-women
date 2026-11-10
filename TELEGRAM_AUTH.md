# Healthy Women — Telegram Mini App authentication foundation (v1.8 candidate)

> **Development only.** This code is on an isolated GitHub branch. The working
> Telegram bot, live PWA, Vercel production deployment, and Android APK are
> **unchanged**. The Vercel bot was deployed independently, not by a Git push.

## What was implemented

- `bot-vercel/worker/telegram-auth.js`: verify raw Telegram Mini App
  `initData` with the official HMAC-SHA256 procedure using the server-side
  `BOT_TOKEN`. Only the server sees this token.
- Reject a missing/malformed 64-hex hash, duplicate query fields, modified
  data, missing/invalid Telegram user ID, dates >60 seconds in the future,
  or data older than 3,600 seconds by default.
- `bot-vercel/api/auth.js`: future **POST /api/auth** read-only check; accepts
  raw initData only in `X-Telegram-Init-Data`, never as URL query or request
  body. It returns `{"authenticated":true,"features":{"cloudSync":false}}`
  and does not return a user profile or medical records.
- Browser CORS is restricted to `https://healthy-women.vercel.app` (no
  wildcard, cookies or cross-origin identity leaks). An Origin header is
  **not** treated as authentication; the signed initData is.
- Added isolated tests for positive fixtures, tampering, replay expiry,
  duplicates, user parsing, origin checks and absence of medical data.
- The server does not log, store, or forward any initData, token, user
  identifier, daily diary, password, or backup.

Official verification algorithm:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

## Deployment precautions

**Do not deploy this yet as a user-facing synchronization service.**
The endpoint is a stateless authentication proof, **not cloud synchronization**.
There is no remote database, encrypted user storage, merge/conflict resolution,
user-specific wipe, retention policy, or security assessment yet.

The current bot is hosted independently at `healthy-women-bot.vercel.app`.
A Git commit does **not** update this bot automatically. Deployment would
require a separately reviewed release containing the complete
`bot-vercel` source, after tests and correct environment assignment.
Do not disclose or place BOT_TOKEN / WEBHOOK_SECRET in source, GitHub,
chat messages, scripts, browser assets, screenshots, CI logs or test fixtures.

Do not turn on the PWA's dormant legacy plaintext sync path:
`site/config.js` currently points to an empty API URL, and the existing
bot handler correctly rejects `/api/sync`. A safe future sync protocol
must send **only client-encrypted blobs** with an independent passphrase
or recovery secret, support per-account deletion, prevent cross-user access,
handle replay and conflicting edits, and require explicit consent.

## Next-stage readiness criteria

1. Verify a real Telegram Mini App launch on a test account using a
   dedicated read-only server check; never paste raw initData into chat.
2. Design encryption and key recovery so the server cannot decrypt health
   content. Do not reuse BOT_TOKEN or WEBHOOK_SECRET as an encryption key.
3. Establish encrypted storage, upload/download limits, retention, deletion,
   anti-replay controls and origin/CSRF review before any patient-like data.
4. Pass a security review and real Android/Telegram device tests with
   **fictional** health records before production activation.
