# 🌷 Healthy Women — Sog‘lom ayollar

**Version 0.2 — web-first MVP prototype**. Free Uzbek menstrual-cycle calendar, symptom diary, estimated future cycle dates, summaries, and a small offline medical knowledge search. No diagnosis or contraception claims.

## Website
`site/index.html` is the self-contained prototype. GitHub Actions publishes the `site/` directory via GitHub Pages:

https://ozodbek-odiljonov-888.github.io/healthy-women/

If the Pages job is blocked, go to **Settings → Pages → Source → GitHub Actions** and rerun the workflow.

## APK
GitHub **Actions → Build Healthy Women Android debug APK**. After a successful build, download the `Healthy-Women-Android-debug` workflow artifact; extract `app-debug.apk`. This is a **debug/test build**, not yet security-audited or ready for public clinical use. Play Store is not required.

## Telegram & backend
Telegram bot, Cloudflare Worker, D1 and optional synchronization are *not deployed* in this repository version. The comprehensive offline MVP ZIP from our working session includes a separate preliminary Worker implementation; do not set up patient synchronization for public users until a security/privacy review is finished.

## Important limitations
- This browser edition stores dates and symptoms in **unencrypted device localStorage**. This is intended for testing with fictitious data, not production or shared devices. Clearing browser storage can delete all records.
- Next-period predictions are uncertain and must not be used as contraception.
- The "AI assistant" is **local keyword search**, not a generative medical model, and does not diagnose illnesses.
- Urgent symptoms require qualified medical care, not an algorithmic prediction.
- No tokens or private patient data may be committed to a public repository.

## Cost
Uses GitHub Pages (public repository) and GitHub Actions free-eligible standard runners, subject to provider conditions and quotas. We cannot guarantee unlimited permanent $0 infrastructure.

## Planned next steps
1. Verify Pages deployment and Android artifact.
2. Deploy Telegram bot + Cloudflare Worker with server secrets (never in GitHub).
3. Medical content review and informed opt-in for secure synchronization; privacy policy and legal review.
4. Add a clinician-reviewed symptom questionnaire and reminder schedule.
