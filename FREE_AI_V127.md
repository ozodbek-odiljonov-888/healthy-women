# Healthy Women v1.27 — ixtiyoriy bepul AI va qat'iy kvotalar (DRAFT)

**Holat: kod va testlar tayyor; serverda AI o‘chirilgan, hech qanday kalit, tashqi AI, webhook, Neon migratsiya yoki yangi pullik xizmat faollashtirilmagan.** Jonli PWA, bot va klinik materiallar hozirgicha qoladi.

## Foydalanuvchiga ko‘rinadigan funksiyalar
- `AI yordamchi` bo‘limida oddiy oflayn, manbali javoblar avvalgidek 24/7 ishlaydi.
- `Limitlangan bepul AI`: ixtiyoriy checkbox orqali rozilik beriladi. Faqat **oldindan belgilangan 10 umumiy mavzu** (sikl, qon ketishi, og‘riq, kechikish, PCOS va boshqalar) bo‘yicha Gemini orqali qisqa o‘zbekcha javob olinadi.
- Foydalanuvchi erkin yozgan matn ilova ichida mavzuga xaritalanadi, **Gemini va oraliq serverga asl savol yuborilmaydi**. Shifrlangan kundalik, sikl tarixi, parol, telefon, shaxsiy ma'lumot va avvalgi chat serverga uzatilmaydi. AI javobidan tibbiy tashxis yoki kontrasepsiya uchun foydalanilmaydi.
- AI o‘chirilgan, server ishlamayotgan yoki kvota tugagan paytda offline javoblar mavjud; hech qanday avtomatik qayta so‘rov yo‘q.

## Qattiq server limitlari
| Chegara | Qiymat |
| --- | ---: |
| Anonim IP xesh bo‘yicha | 3 so‘rov / UTC kun |
| Bir IP xesh bo‘yicha | 1 so‘rov / UTC daqiqa |
| Butun loyiha | 30 so‘rov / UTC kun |
| Butun loyiha | 300 so‘rov / UTC oy |
| Butun loyiha — to‘liq hayot davri | **1000 ta so‘rov, qayta tiklanmaydi** |
| Har javob | 220 chiqish tokeni, 1600 belgigacha ko‘rinadi |
| Bitta chaqiruv | Bitta provider so‘rovi, 10 soniya timeout, retry yo‘q |

Barcha limitlar **Neon Postgres funksiyasida atomik** tekshiriladi va rezerv qilinadi. Har bir muvaffaqiyatsiz provayder chaqiruvi ham kvotani sarflaydi — haddan tashqari ishlatilishning oldini oladi. DB o‘chsa, kvota yetmasa, server sozlanmasa yoki abonent limiti tugasa — AI ishlamaydi. IP xeshlar soni va texnik metadata saqlanadi; savollar, IP manzilning o‘zi va kundalik saqlanmaydi. Bir xil NAT/IP ishlatadigan odamlarda kunlik limit umumiy bo‘lishi mumkin. Jami limitni “aylanib o‘tmaslik” uchun AI bazasini ko‘chirishda `lifetime/total` soni ko‘chirilishi kerak.

## Operator uchun yoqish (faqat tasdiqlangan test muhiti)
1. [Google AI Studio](https://aistudio.google.com/app/apikey) hisobida yangi, **hech qanday to‘lov hisobi ulanmagan Free Tier loyihasi** ochilsin. Free Tier ni tekshirib, pullik tarifga *o‘tmaslik* kerak. **Bepul tarifda Google umumiy yuborilgan matnlarni mahsulotlarini yaxshilash uchun ishlatishi mumkin**. Shuning uchun faqat umumiy mavzularni yuboramiz.
2. `gemini-3.1-flash-lite` modelining o‘sha hudud/loyiha uchun **hozirgi bepul mavjudligi va kvotalari** AI Studio orqali tasdiqlansin. Model/o‘sha bepul rejim mavjud bo‘lmasa, `AI_MODE=off` qolsin.
3. Neon **Free** ma'lumotlar bazasini ko‘zdan kechirib, mavjud kvotalar va tarifni tasdiqlang. `db/migrations/003_ai_free_limits.sql` migratsiyasini test DBda *qo‘lda* ishlating; production yoki mavjud klinik bazaga avtomatik kiritmang.
4. Serveringizdagi Vercel preview loyihasi bepul rejimdaligini tekshiring. `bot-vercel/api/ai.js` funksiyasiga **maxfiy environment variables** kiriting: `AI_MODE=free_preview`, `AI_FREE_TIER_NO_BILLING=CONFIRMED`, `GEMINI_API_KEY=<secret>`, `AI_DATABASE_URL=<Neon Postgres url>`, `AI_IP_PEPPER=<tasodifiy 32+ belgi>`, `AI_ALLOWED_ORIGIN=https://healthy-women.vercel.app`, `AI_ALLOWED_HOSTNAME=healthy-women-bot.vercel.app` (host haqiqiy deploy qilingan serverga teng bo‘lsin). Hech qachon kalitni GitHub, PWA, JavaScript yoki chatga yubormang.
5. **Faqat alohida sinov deploy bilan** PWA `site/config.js` ichidagi `window.HEALTHY_WOMEN_AI_API` ni `https://healthy-women-bot.vercel.app/api/ai` ga sozlang. Ushbu konfiguratsiya productiondagi maxfiylik va reliz-gate preflightini `BLOCKED` qiladi, bu kutilgan.
6. Test ko‘rsatmalarini bajaring. Klinika va xavfsizlik ekspertizasisiz foydalanuvchilarga tarqatmang. Vercel Hobby shaxsiy, notijorat foydalanishga mo‘ljallangan; tijorat loyihasi uchun boshqa mos hosting kerak bo‘lishi mumkin.

**$0 kafolatining chegarasi:** ilova ichidagi so‘rovlar limiti *provayderning billingini bevosita to‘xtatmaydi*. 0 dollarga yaqinlashishning zarur sharti **billing ulanmagan Free Tier API loyihasidan** foydalanish, bepul hosting va DB limitini tekshirish. Faqat hisobning o‘z billing holati aniq tekshirilgandagina “mutlaqo to‘lov chiqmaydi” deyish mumkin. Hech qanday avtomatik pullik upgrade, karta bog‘lash, auto-retry, qidiruv grounding, tool calling yoki qo‘shimcha model yo‘q.

## Sinov va xavfsizlik
`npm test` uchun Node.js 22; Playwright bilan `node tests/e2e-ai-v127.mjs` (mock javob, haqiqiy Gemini chaqirilmaydi). `node scripts/release-preflight.mjs --strict` mustaqil klinik va maxfiylik ko‘rigigacha BLOCKED bo‘lib qolishi kerak. Tarixiy tibbiy ma'lumot yoki haqiqiy bemorlarni sinovga kiritmang.

> v1.29: All three clients and Telegram share a quota; see UNIFIED_AI_V129.md.
