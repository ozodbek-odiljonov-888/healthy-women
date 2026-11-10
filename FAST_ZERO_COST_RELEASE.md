# Healthy Women — fast $0 release route (2026-11-10)

**Current state:** Vercel Hobby website/bot deployments exist. The newer
v1.8–v1.20 security and medical changes live in a STACK of GitHub draft PRs,
not production. The final v1.20 CI passed 284/284 Node tests; this does not
prove clinical correctness or user-data security.

## Mandatory commercial and infrastructure freeze

1. **No paid upgrade** of Vercel Hobby or Neon Free; no payment method,
   paid marketplace application, SMS, LLM inference, hosted cache, paid
   monitoring, cron, or domain purchase for this project.
2. Keep existing Vercel production deployments in place; do not create new
   staging/production Vercel projects merely to test unreviewed code.
3. Neon Free staging has hard provider limits: 4 active hours, 1 CPU hour,
   64 MiB data written, 64 MiB transferred, 64 MiB branch size, 0.25 CU.
   App staging additionally limits 60 authenticated requests/day globally
   and 12/user/day. These are NOT live app production quotas.
4. Treat every exceeded budget/limit as **stop, do not upgrade**.
   Availability is secondary to privacy, safety and avoiding surprise fees.
5. Vercel's Hobby tier may suspend resources after exhaustion; Pro Spend
   Management is **not available** on Hobby. Do not claim a universal $0
   spending guarantee for every third-party service.

## Shortest safe path — prioritize a narrow product, not more features

| Order | Deliverable | Current fact | Release gate |
|---|---|---|---|
| 1 | Offline-first cycle calendar, diary, local encrypted backup | Prototype exists | Check usability, restore and warning UX on 2 real devices. The **live** localStorage records are not themselves encrypted; real patient use remains disallowed until privacy review |
| 2 | Source-linked medical FAQ | 50 draft topics + 500 fictional question variants | **0/50 clinician approvals**. Review EVERY topic and the red-flag responses; use only general educational information until approval |
| 3 | Telegram Mini App and bot | Server deployment READY; existing user-reported bot functionality | Test /start, Mini App launch, HTTPS, webhook and safe fallback on real devices without exposing personal health messages |
| 4 | Android | Debug APK build available | Test signed build, permissions, offline behavior, import/restore and device compatibility; do not market a debug APK as final |
| 5 | Cloud sync | v1.11/v1.12 staging-only API, real Neon SQL tests | **Leave off** in the first release. Need opt-in UI, multi-device conflict/recovery, abuse protection, retention and security/privacy review |

## Efficient workflow

- **Freeze feature development at v1.20.** Do not add more medical topics or
  deploy a public cloud database until the release blockers are resolved.
- Work through the already prepared clinical CSV and sign-off template:
  `node scripts/export-medical-editorial-v118.mjs healthy-women-review.csv`
  `node scripts/prepare-medical-clinical-review.mjs`
- A **qualified human clinician** checks each primary source, Uzbek wording,
  pregnancy/age caveats, emergency routing, local Uzbekistan recommendations
  and privacy. Do not manufacture the reviewer name, date, credentials or
  `APPROVED_BY_CLINICIAN` flags.
- Verify the release gate with `node scripts/check-medical-release.mjs
  medical-clinical-review.json`. The GitHub workflow
  `.github/workflows/medical-clinical-release.yml` is designed to BLOCK
  unreviewed medical code going to `main`.
- After human review and two-device QA, merge draft PRs in dependency order
  (PR #2 → #3 → #4 → #5 → #6 → #7 → #8 → #9 → #10 → #11 →
  PR #13 → PR #14 → PR #15). PR #12 is an **alternative v1.18 branch**;
  do not blindly merge both v1.18 variants. Check actual PR bases first.
- Re-run the complete CI and manually inspect the production build before
  any Vercel deployment. GitHub commits by themselves do not update the
  current Vercel deployment.
- Proceed with a user-approved, reversible production rollout only after
  all release gates pass. No user data migration should be automatic.

## How to decide whether to stop

**STOP (do not launch new health features)** if any of these is true:
- the billing plan is not Free/Hobby or a paid integration/upgrade is required;
- the source-backed medical content lacks clinician signoff;
- live medical data would be collected before adequate security/privacy review;
- the offline backup cannot be restored on a second device;
- there are unresolved critical security or data-loss bugs;
- the only route to functionality violates Vercel Hobby's noncommercial terms.

This plan contains no paid tools, schedule promises or invented clinical
approvals. A safe feature subset may be finished sooner than the entire
online health platform, but cannot waive its own privacy/safety review.
