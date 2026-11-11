# Healthy Women v1.31 — real AI smoke and production enablement (2026-11-11)
 
## Proof obtained
- Google AI Studio screenshot: "Gemini Project womens", Free tier, "Set up billing", 1 key, created 2026-11-11; screenshots alone do not cryptographically prove which project owns the Vercel key.
- Official Gemini developer pricing lists `gemini-3.1-flash-lite` with Free Tier no-charge text requests, but Free Tier prompts may be used to improve Google products.
- Vercel production site `https://healthy-women.vercel.app/`: HTTP 200 after deploying v1.30.
- Vercel production bot API `https://healthy-women-bot.vercel.app/api/ai-status`: HTTP 200, `enabled:true`, `topics:10`, `freeTierVerified:true`. API mode `free_preview`.
- One synthetic public-educational topic (cycle) was sent by GitHub Actions to the production `POST /api/ai`; response `HTTP 200`, valid CORS, nonempty Gemini answer, `ACOG` source and `model=gemini-3.1-flash-lite`. Response text and API key were **not logged**.
- One-shot CI run: https://github.com/ozodbek-odiljonov-888/healthy-women/actions/runs/42969614181 .
- Last observed Neon `hw_ai_free_usage` lifetime counter = 2, including an earlier staging-only reservation. Usernames, diary entries, actual prompts and health history are not sent to Gemini.
- Vercel runtime errors: none found in the recent checked window.

## Remaining checks / strict limitations
- Confirm that the **specific** Vercel `GEMINI_API_KEY` belongs to `Gemini Project womens` on the Google AI Studio **API Keys** page; do not share or paste raw keys. This must be done by the owner. Do **not** enable billing or upgrade the plan.
- The production Telegram bot's real `/ai` callback must still be tested by a person in Telegram. The same server-side `runTelegramTopicAi` code and quota are deployed and unit-tested, but direct external bot interaction has not been verified.
- Android real-device network and permission testing is still required. The v1.30 debug APK uses the same `https://healthy-women-bot.vercel.app/api/ai` endpoint and the `https://localhost` origin allowlist; browser mock E2E has passed.
- Medical-review signoff 0/50, independent privacy/security review and real-device QA remain release blockers; restrict use to fictional testing and general medical education. No diagnosis.
- Atomic database quota 3/client/day, 1/client/min, 30/global/day, 300/global/month, 1000/global/lifetime; no pay fallback, 1 candidate, max 220 output tokens, timeout 10s.
- If billing/project ownership is uncertain, set `AI_MODE=off` via Vercel and redeploy the bot. Disabling on the web UI alone is insufficient to block generation. No paid plan was intentionally configured by this workflow.
