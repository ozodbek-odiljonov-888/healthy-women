# 🌷 Healthy Women — Sog‘lom ayollar

Uzbek-language menstrual-cycle calendar, symptom diary, estimated future period dates, educational content, and an offline-capable PWA/Android prototype.

## Brand and anonymity
The public-facing app, documents, reports, and bot messages are branded **Healthy Women** only. Do not publish a personal name, surname, phone number, personal email, API key, or patient data in this repository. Repository hosting URLs and commit metadata may separately reveal the GitHub account identity; that is controlled by the account or by migrating to a dedicated brand organization.

## Status
- ✅ Responsive PWA prototype in `site/` with offline caching.
- ✅ Android **debug/test** APK builds through GitHub Actions; download build artifacts from the Actions tab.
- ✅ GitHub Pages publishing workflow succeeded on 2026-11-09. Confirm public accessibility on the intended device; a successful workflow does not replace real-device testing.
- ⏳ Telegram bot and server-side synchronization are not live. Do not collect real medical records until privacy/security controls have been reviewed.

## On-device cycle questionnaires (v0.4)
A short questionnaire appears while the app is **open** near menstruation onset, after several days of ongoing bleeding, and near the recorded cycle midpoint. Users can disable these prompts in Settings. Answers become a local diary entry and appear in the text report. Symptoms include pain (0–10), bleeding amount, dizziness, mood and bleeding between periods; an end date can be confirmed.

**No scheduled background/push notifications are active.** Cycle midpoint is not an ovulation prediction or diagnosis. The app is not clinically validated. Medical guidance links: [ACOG](https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding) and [NHS](https://www.nhs.uk/symptoms/period-pain/).

## Website
The static app is in `site/index.html`. **Actions → Publish Healthy Women website** has a successful deployment. Alternatively, Vercel can import this repo using **Root Directory: `site`**, Framework **Other**, and an empty Build Command. See `DEPLOYMENT.md`.

To test offline, download the **Healthy-Women-PWA-preview** ZIP artifact from a successful **Verify Healthy Women preview** workflow and extract it. Static files require serving over HTTPS or localhost for full service-worker behavior.

## Private, encrypted local backup (v0.5)
Settings now provides **encrypted backup export and restore**. The exported `.hwbak` file uses browser-native PBKDF2-SHA256 (310,000 iterations, a fresh salt) and AES-256-GCM (fresh IV and authentication tag); no passwords or archives are sent to our servers. Passwords require at least 12 characters and are not recoverable.

**Critical:** Only the exported backup file is encrypted. The app's live data in localStorage remains **unencrypted**. Import replaces local records only after explicit user confirmation and disables any synchronization opt-in. Never share a decrypted archive or password; use fictitious data in this unreviewed preview.

## Android
Choose **Actions → Build Healthy Women Android debug APK**, open the successful run, download **Healthy-Women-Android-debug**, unzip and install the APK. Android can warn that a sideloaded debug build is from an unknown source. Do not distribute it as a clinically validated product.

## Telegram preview and deployment
The FAQ bot now has inline topic buttons and sourced answers. Source is in `worker/index.js`. The **manual-only** Cloudflare deployment workflow never deploys on ordinary commits and requires account-specific authorization. No BotFather token is in the repository; `scripts/register-telegram-webhook.mjs` registers a webhook only when run locally with private environment variables. The Telegram bot source **has been deployed as a separate Vercel service**, but BotFather credentials and the webhook are not configured, so it is not yet live inside Telegram. Cloud synchronization is disabled. Vercel projects were created via direct deployments; automatic GitHub-to-Vercel deployment is not linked.

Vercel Hobby is limited to **personal, non-commercial use**. Do not host a commercial startup on its free tier. See `DEPLOYMENT.md` for platform-specific steps.

## Vercel bot endpoint
The independent `bot-vercel/` folder provides `/health` (no secrets) and `/webhook` (requires configured Telegram webhook secret). **The bot service is deployed on Vercel** at `https://healthy-women-bot.vercel.app/`. The `/health` endpoint returned HTTP 200 on 2026-11-09 and the webhook correctly rejected GET with 405. The deployment has `APP_URL=https://healthy-women.vercel.app/` configured. **Telegram message delivery is not yet enabled**: the account owner must configure `BOT_TOKEN` and `WEBHOOK_SECRET` privately, redeploy, and register Telegram's webhook. It does not store patient information.

## Safer cycle entry and doctor-readable export (v0.6)
- Prevents duplicate or overlapping recorded period dates while allowing a new cycle after a previously unfinished entry.
- Labels forecasts as overdue or stale instead of displaying a past date as the next period. It still cannot predict ovulation, pregnancy, or future bleeding precisely.
- The Journal allows a deliberate **CSV export** of recorded periods and symptoms. CSV is **not encrypted**; treat it as sensitive medical data, and use the encrypted backup feature for private transfers.
- The CSV exporter neutralizes common spreadsheet formula injection prefixes in notes.

## Symptom trends and opt-in Android reminders (v0.7)
The Journal now displays an **offline, six-month symptom summary**: recorded average pain per month, number of logs and severe-pain observations. Missing diary days are not treated as pain-free days. This is descriptive statistics, **not a medical assessment**.

The **Android APK** (Capacitor 7 with `@capacitor/local-notifications`) can show a **generic daily reminder** after the user explicitly enables it and grants Android notification permission. The message contains no menstrual dates, symptoms or user identity. Reminders run **locally on the phone**, without a Telegram bot or internet service. Users can change the reminder time or switch off reminders in Settings; clearing app records also attempts to cancel the reminder. Delivery time may shift due to Android battery policies. The browser/PWA does not schedule background reminders. No exact-alarm permission was added.

**Important:** Availability is implemented and build-tested, but notification delivery on a real Android device must still be verified. The locally stored diary remains unencrypted; only exported .hwbak archives are encrypted.

## Health and privacy limits
- Browser test data currently lives in unencrypted browser `localStorage`. Use fictitious data only on shared devices.
- Historical dates produce estimates, not guaranteed forecasts. Do not use them as contraception or a pregnancy test.
- The offline helper searches a fixed knowledge library: it is **not** a generative medical AI and must not diagnose.
- Emergency symptoms require qualified medical care.
- For future data processing, obtain informed consent, allow export/deletion, protect secrets and assess applicable law.

See `PRIVACY.md` and `SECURITY.md` for operating rules.

## Cost
GitHub Pages and public-repository standard GitHub Actions runners can be free within provider terms and quotas. Ongoing unrestricted zero cost is not guaranteed.
