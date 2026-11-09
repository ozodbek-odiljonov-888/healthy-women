# 🌷 Healthy Women — Sog‘lom ayollar

Uzbek-language menstrual-cycle calendar, symptom diary, estimated future period dates, educational content, and an offline-capable PWA/Android prototype.

## Brand and anonymity
The public-facing app, documents, reports, and bot messages are branded **Healthy Women** only. Do not publish a personal name, surname, phone number, personal email, API key, or patient data in this repository. Repository hosting URLs and commit metadata may separately reveal the GitHub account identity; that is controlled by the account or by migrating to a dedicated brand organization.

## Status
- ✅ Responsive PWA prototype in `site/` with offline caching.
- ✅ Android **debug/test** APK builds through GitHub Actions; download build artifacts from the Actions tab.
- ⏳ GitHub Pages publishing requires **Settings → Pages → Source → GitHub Actions** to be enabled by the repository owner.
- ⏳ Telegram bot and server-side synchronization are not live. Do not collect real medical records until privacy/security controls have been reviewed.

## On-device cycle questionnaires (v0.4)
A short questionnaire appears while the app is **open** near menstruation onset, after several days of ongoing bleeding, and near the recorded cycle midpoint. Users can disable these prompts in Settings. Answers become a local diary entry and appear in the text report. Symptoms include pain (0–10), bleeding amount, dizziness, mood and bleeding between periods; an end date can be confirmed.

**No scheduled background/push notifications are active.** Cycle midpoint is not an ovulation prediction or diagnosis. The app is not clinically validated. Medical guidance links: [ACOG](https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding) and [NHS](https://www.nhs.uk/symptoms/period-pain/).

## Website
The static app is in `site/index.html`. Once Pages is enabled, run **Actions → Publish Healthy Women website**.

To test without GitHub Pages, download the **Healthy-Women-PWA-preview** ZIP artifact from a successful **Verify Healthy Women preview** workflow and extract it. The real website still requires Pages publishing to be enabled.

## Private, encrypted local backup (v0.5)
Settings now provides **encrypted backup export and restore**. The exported `.hwbak` file uses browser-native PBKDF2-SHA256 (310,000 iterations, a fresh salt) and AES-256-GCM (fresh IV and authentication tag); no passwords or archives are sent to our servers. Passwords require at least 12 characters and are not recoverable.

**Critical:** Only the exported backup file is encrypted. The app's live data in localStorage remains **unencrypted**. Import replaces local records only after explicit user confirmation and disables any synchronization opt-in. Never share a decrypted archive or password; use fictitious data in this unreviewed preview.

## Android
Choose **Actions → Build Healthy Women Android debug APK**, open the successful run, download **Healthy-Women-Android-debug**, unzip and install the APK. Android can warn that a sideloaded debug build is from an unknown source. Do not distribute it as a clinically validated product.

## Health and privacy limits
- Browser test data currently lives in unencrypted browser `localStorage`. Use fictitious data only on shared devices.
- Historical dates produce estimates, not guaranteed forecasts. Do not use them as contraception or a pregnancy test.
- The offline helper searches a fixed knowledge library: it is **not** a generative medical AI and must not diagnose.
- Emergency symptoms require qualified medical care.
- For future data processing, obtain informed consent, allow export/deletion, protect secrets and assess applicable law.

See `PRIVACY.md` and `SECURITY.md` for operating rules.

## Cost
GitHub Pages and public-repository standard GitHub Actions runners can be free within provider terms and quotas. Ongoing unrestricted zero cost is not guaranteed.
