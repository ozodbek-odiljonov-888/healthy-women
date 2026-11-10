# 🌷 Healthy Women — Sog‘lom ayollar

Uzbek-language menstrual-cycle calendar, symptom diary, estimated future period dates, educational content, and an offline-capable PWA/Android prototype.

## Brand and anonymity
The public-facing app, documents, reports, and bot messages are branded **Healthy Women** only. Do not publish a personal name, surname, phone number, personal email, API key, or patient data in this repository. Repository hosting URLs and commit metadata may separately reveal the GitHub account identity; that is controlled by the account or by migrating to a dedicated brand organization.

## Status
- ✅ Responsive PWA prototype in `site/` with offline caching.
- ✅ Android **debug/test** APK builds through GitHub Actions; download build artifacts from the Actions tab.
- ✅ GitHub Pages publishing workflow succeeded on 2026-11-09. Confirm public accessibility on the intended device; a successful workflow does not replace real-device testing.
- ✅ Telegram FAQ bot @healthy_womens_bot responds to /start, and its Mini App has opened in Telegram Desktop (2026-11-10). ⏳ Server-side synchronization remains disabled. Do not collect real medical records until privacy/security controls have been reviewed.

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
The FAQ bot now has inline topic buttons and sourced answers. Source is in `worker/index.js`. The **manual-only** Cloudflare deployment workflow never deploys on ordinary commits and requires account-specific authorization. No BotFather token is in the repository; `scripts/register-telegram-webhook.mjs` registers a webhook only when run locally with private environment variables. The Telegram bot source **has been deployed as a separate Vercel service**, with the BotFather credentials and Telegram webhook now configured privately in Vercel (2026-11-10). It responds to /start. Cloud synchronization remains disabled. Vercel projects were created via direct deployments; automatic GitHub-to-Vercel deployment is not linked.

Vercel Hobby is limited to **personal, non-commercial use**. Do not host a commercial startup on its free tier. See `DEPLOYMENT.md` for platform-specific steps.

## Vercel bot endpoint
The independent `bot-vercel/` folder provides `/health` (no secrets) and `/webhook` (requires configured Telegram webhook secret). **The bot service is deployed on Vercel** at `https://healthy-women-bot.vercel.app/`. The `/health` endpoint returned HTTP 200 on 2026-11-09 and the webhook correctly rejected GET with 405. The deployment has `APP_URL=https://healthy-women.vercel.app/` configured. **Telegram message delivery is functioning** via privately configured `BOT_TOKEN` and `WEBHOOK_SECRET` and a registered webhook (confirmed 2026-11-10). The FAQ bot does not store patient information. An isolated v1.8 draft adds a read-only Telegram initData authentication endpoint; this code has **not** been deployed. Cloud sync is still disabled.

## Safer cycle entry and doctor-readable export (v0.6)
- Prevents duplicate or overlapping recorded period dates while allowing a new cycle after a previously unfinished entry.
- Labels forecasts as overdue or stale instead of displaying a past date as the next period. It still cannot predict ovulation, pregnancy, or future bleeding precisely.
- The Journal allows a deliberate **CSV export** of recorded periods and symptoms. CSV is **not encrypted**; treat it as sensitive medical data, and use the encrypted backup feature for private transfers.
- The CSV exporter neutralizes common spreadsheet formula injection prefixes in notes.

## Symptom trends and opt-in Android reminders (v0.7)
The Journal now displays an **offline, six-month symptom summary**: recorded average pain per month, number of logs and severe-pain observations. Missing diary days are not treated as pain-free days. This is descriptive statistics, **not a medical assessment**.

The **Android APK** (Capacitor 7 with `@capacitor/local-notifications`) can show a **generic daily reminder** after the user explicitly enables it and grants Android notification permission. The message contains no menstrual dates, symptoms or user identity. Reminders run **locally on the phone**, without a Telegram bot or internet service. Users can change the reminder time or switch off reminders in Settings; clearing app records also attempts to cancel the reminder. Delivery time may shift due to Android battery policies. The browser/PWA does not schedule background reminders. No exact-alarm permission was added.

**Important:** Availability is implemented and build-tested, but notification delivery on a real Android device must still be verified. The locally stored diary remains unencrypted; only exported .hwbak archives are encrypted.

## Daily diary reliability (v0.8)
- Ordinary daily diary entries can be edited or removed from the Journal. Phase-specific questionnaires retain their specialized data and are not edited with the generic diary form.
- A second ordinary diary entry on the same day now opens the existing record for review instead of creating a duplicate.
- Validates dates, pain (0–10), flow, mood and note length before saving. Ordinary journal entries with notable symptoms also show a source-linked medical warning; this does not diagnose.
- The change is local-first and introduces no new cloud transfer. Existing records remain in localStorage, which is **not encrypted**.

## Screen privacy mode (v0.9)
- A **quick-hide screen button** covers the whole app interface with a branded neutral overlay.
- When leaving the app, the interface is masked by default; returning requires an explicit button press to reveal. The option can be disabled in Settings. There is **no password and no authentication**: it is a screen-privacy convenience feature only.
- The app listens for localStorage changes in other tabs and refreshes diary entries, including deletions, rather than continuing to show stale records.
- The Google Fonts network import was removed. Fonts now render locally without third-party font requests.
- **Screen hiding does not encrypt localStorage or reliably protect Android screenshot previews.** Real health data should not be used until security review and at-rest protection are complete.

## Optional encrypted on-device diary (v1.0)
- This version introduces **opt-in local at-rest encryption**. The default for existing unprotected installations is still unencrypted until the user explicitly chooses Settings → Mahalliy kundalikni shifrlash.
- Before migration, users enter a passphrase of 12–256 characters and download a separately encrypted `.hwbak` recovery file. The app then waits for the user to confirm that file was saved. Only after verified encrypted storage is written and decrypted successfully is the legacy plaintext localStorage record deleted.
- Uses native WebCrypto **PBKDF2-SHA256 (310,000 iterations) + AES-256-GCM**, with an independent salt and random IV. The session key remains in JavaScript memory only while unlocked; no password is written to localStorage or a remote server. On reload and when sent to the background, an encrypted journal must be unlocked with the passphrase again.
- Newly entered, edited or restored journal records are persisted as authenticated ciphertext rather than readable JSON. Other tabs updating the ciphertext force a new unlock, and revision checks prevent old tabs from silently overwriting new encrypted records.
- When encrypted local mode is enabled, remote Telegram/cloud synchronization is disabled. Users can still export a separately encrypted backup. CSV/plain-text report downloads remain **unencrypted** and should be handled carefully.
- The erase controls clear both encrypted and legacy local journal storage. **No recovery or password reset is available**, beyond a user-held encrypted backup with its passphrase.
- **Limitations:** this does not provide end-to-end encryption, hardware-backed keystores, protection from malicious browser extensions, snapshots, existing filesystem backups or prior unencrypted exports. Existing plaintext may persist in device backups and flash-memory remnants. This has not undergone independent security review. Use fictitious test data until reviewed.

## Stable Android release signing (prepared, not yet enabled)
A new manual-only GitHub Actions workflow **Build Healthy Women signed Android release** can sign repeatable APK updates with the same private keystore. Four encrypted repository secrets must first be configured by the owner; no signing key or password is included in source files. See `ANDROID_RELEASE.md`. The workflow has **not** yet produced a signed release APK; existing debug APKs remain incompatible with the first new release signature.

## Android debug APK upgrade warning
The GitHub-hosted Android debug APK is signed with a new, ephemeral debug keystore on each CI runner. We inspected v0.9 and v1.0 test APKs and confirmed different signing certificate containers. **Android cannot normally upgrade one in place over the other** under the same app ID (`org.healthywomen.cycle`). Do **not** uninstall a previous app with needed data until its backup is exported and verified. Uninstalling typically deletes the app's private localStorage data.

For a test-only migration: while the old APK is still installed, use **Settings → Parol bilan shifrlangan zaxira → Zaxira yaratish** to export a `.hwbak` file and retain its password. Verify the file exists in safe storage. Only then remove the old APK, install the new test APK, and import the backup from **Sozlamalar → Zaxiradan qayta tiklash**. Finally, enable the new optional local at-rest encryption. This process has not been validated across all Android device versions; ideally retain a second copy of the backup before upgrading.

Before any public release, configure a **private, stable release signing key** with appropriate access controls. Do not commit the key or use a public fixed debug signing key. The current APK is for development/testing only, not a release-ready app.

## Android privacy-hardened builds and stable signing preparation
- Every newly generated Android debug build now disables system Auto Backup and cleartext traffic, explicitly excludes app data from cloud/device-transfer rules, and enables native `FLAG_SECURE`. This generally prevents screenshots and sensitive recent-app thumbnails on Android, but varies by device and does not replace local encryption.
- An independent **signed-test** workflow is available from GitHub Actions, **manual only**, using a **separate test-only keystore** kept in an `android-signing` GitHub Environment with protected secrets. This workflow is not activated until the owner sets up the environment and keystore; it has produced **no signed-test APK** from this chat.
- A separate future **release** workflow uses the `android-release` environment and a distinct signing key. Do not activate it as a clinical product until real-device and privacy/security review are complete. See [ANDROID_RELEASE.md](ANDROID_RELEASE.md).
- Previous debug APK certificates are not compatible with new signed-test or release APKs. Back up any desired diary data as a verified `.hwbak` archive **before uninstalling** the previous test APK. App uninstallation can destroy its private storage.

## Strict web script policy and static-only offline cache (v1.1)
- The web app's JavaScript and CSS are in separate same-origin files. Both public pages include a Content Security Policy with `script-src 'self'`; Vercel also supplies this policy as an HTTP response header. Inline scripts and third-party script injection are blocked.
- The offline service worker allows **only a fixed audited list of static resources**. API routes, URL query strings, health reports, private downloads and arbitrary GET resources are excluded.
- Privacy statements distinguish the default plaintext journal from the **optional** local encrypted journal. Stronger web headers do not encrypt localStorage, downloads or old device backups.
- The CSS currently uses `style-src 'unsafe-inline'` for inline style attributes and runtime styling. This reduces the strength of style injection defenses; independent security auditing remains necessary.

## Cross-tab journal integrity and backup checks (v1.2)
- All journal mutations are serialized with the Web Locks API **where the platform supports it**, alongside optimistic storage-revision checks. The app rejects a stale browser tab overwriting newer local journal content.
- Malformed legacy JSON is **preserved rather than replaced by an empty journal**. The app blocks writes, displays a persistent warning, and offers a manual **unencrypted rescue copy** for technical recovery. Treat this rescue file as sensitive.
- Encrypted saves check the record revision both before and after cryptographic processing; migration checks for legacy changes before cleanup.
- A separately encrypted `.hwbak` export is decrypted and checked in memory before it is offered for download, and pending app writes are awaited before backup.
- Some browsers do not implement Web Locks. Revision checks still reduce conflicts, but simultaneous writes outside the app or across devices are not fully preventable.

### Backup export integrity and migration locking
The v1.2 backup export checks the normalized journal contents after decrypting its newly generated encrypted archive. Browser tabs supporting Web Locks also serialize the critical plaintext-to-encrypted migration. This reduces data loss from conflicting local writes; it does **not** replace independent security testing or guarantee recovery from damaged device storage.

## Old-tab plaintext recovery (v1.3)
- If an older browser tab writes an **unencrypted** diary copy after at-rest encryption was enabled, the encrypted app now **stops instead of silently deleting that copy**. Users see a recovery panel on unlock and can first download the unencrypted original locally.
- Nonconflicting new diary records can be added to the encrypted journal with an explicit checkbox and a deliberate merge action. Encryption and successful decryption are checked **before** the old plaintext key is removed.
- If the same record ID differs across plaintext and ciphertext, automatic merging is blocked. After making an independent backup, the user may explicitly choose to keep only the encrypted version. No duplicate or corrupted legacy copy is silently discarded.
- An unencrypted rescue JSON is sensitive; keep it out of shared folders and remove it securely when no longer required. Previously made exports or device backups are **not** cleaned up by this feature.
- This is a local recovery aid, **not** device-wide encryption, an automatic conflict resolver, or independent security certification.

## Local verification without GitHub Actions
Run `npm test` with Node.js 22+ to execute all Node unit tests and static-site integrity checks **without installing packages**. The runner discovers every `tests/*.test.mjs` file, so new tests are not silently omitted. Use `npm run test:site` for the static/offline cache and JavaScript checks only.

For real Chromium integration checks, install Playwright in your own development environment and run `npm run test:browser`. Browsers require local loopback access. The simulated test records are fictional. If GitHub Actions fails before creating any jobs, check provider status and repository Actions settings rather than assuming tests failed; `npm test` remains usable independently. See `BROWSER_TESTING.md`.

## Safer encrypted backup restoration (v1.4)
Restoring an encrypted `.hwbak` file replaces the current local diary. **If the current diary contains any records, v1.4 requires an extra recovery step** before allowing replacement:
1. The user supplies the imported archive and its passphrase. The app encrypts a fresh backup of the **current** diary with that same passphrase, decrypts it in memory to verify its contents, and offers the archive for download.
2. The user checks that the file was saved, acknowledges the recovery step, and separately confirms the destructive replacement.
3. Immediately before replacement, the app compares the current diary against the backup snapshot inside its serialized write operation. If records changed in another tab, it rejects the replacement and requires a new backup.

For empty diaries, restoration works as before after explicit confirmation. The recovery file is encrypted, but its passphrase is the password entered for the **incoming** backup; do not lose it. The browser cannot guarantee the downloaded file is saved, so explicit user verification remains necessary. This reduces accidental data loss but is not a substitute for physical-device validation or independently audited storage.

## Coordinated cross-tab erasure (v1.5)
- Both the in-app **Delete all local records** action and the public Privacy page use the same `eraseLocalJournal` routine and, where supported, the Web Locks API to serialize deletion with diary mutations.
- A new **local erasure epoch** is written before clearing encrypted/plaintext journal keys. Any already-open app tab with an older epoch rejects future writes, preventing stale records from silently reappearing.
- Other open tabs receive the erasure notification through the browser storage event and reload, clearing their visible journal and transient interface state. A new session can intentionally start an empty diary after deletion.
- Local sync preferences are cleared. **Previously downloaded exports, independent device backups, Telegram messages, or data stored in third-party systems are not erased.** Browser vendors differ in storage-event timing; the epoch guard adds a second defense.
- This is not secure erasure of flash memory and is not a substitute for a formal privacy/security review.

## Encrypted on-device password rotation (v1.6)
- **Settings → Kundalik parolini almashtirish** appears only when the user has opted into local AES-256-GCM encryption. It does not alter standalone `.hwbak` passwords or server credentials.
- Requires the current passphrase and a different new passphrase (12–256 characters). Before rotation, the app downloads and decrypts to verify an encrypted recovery archive made with the *old* passphrase and requires an explicit user acknowledgement.
- It then derives a fresh PBKDF2-SHA256 key with a new random salt, encrypts the same validated journal entries under AES-256-GCM with a random nonce, verifies the ciphertext, checks that the original storage revision is unchanged, persists it, and verifies unlock with the **new** passphrase.
- The app immediately locks after rotation. The old passphrase no longer unlocks the newly encrypted local diary, but remains necessary to open **older recovery backups**. Losing the new passphrase can permanently prevent local journal access.
- Browser or OS downloaded files, extensions, screen captures, compromised devices, and key material in transient JavaScript memory are outside this protection. Avoid real medical data until independent security testing.

## Health and privacy limits
- By default, legacy journal records are unencrypted in browser `localStorage`. When the user opts into v1.0 local encryption, new saved journal records are encrypted. Shared-device use remains risky; use fictitious test data until an independent security review.
- Historical dates produce estimates, not guaranteed forecasts. Do not use them as contraception or a pregnancy test.
- The offline helper searches a fixed knowledge library: it is **not** a generative medical AI and must not diagnose.
- Emergency symptoms require qualified medical care.
- For future data processing, obtain informed consent, allow export/deletion, protect secrets and assess applicable law.

See `PRIVACY.md` and `SECURITY.md` for operating rules.

## Cost
GitHub Pages and public-repository standard GitHub Actions runners can be free within provider terms and quotas. Ongoing unrestricted zero cost is not guaranteed.
