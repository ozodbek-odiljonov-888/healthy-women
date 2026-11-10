# Healthy Women v1.29 — sayt, Android va Telegram uchun yagona AI (DRAFT)

**Holat:** sinov branch. Jonli sayt, bot webhook, Vercel/Neon billing va bemor ma'lumotlari o‘zgartirilmagan. Bu tibbiy tashxis vositasi emas.

## Ishlaydigan integratsiya yo‘llari

| Platforma | Jarayon | Gemini’ga yuboriladigan ma'lumot |
|---|---|---|
| HTTPS sayt/PWA | AI bo‘limi → offline savol → rozilik → AI umumiy javob | Faqat oldindan tanlangan umumiy tibbiy mavzu matni |
| Android (Capacitor 7) | Xuddi shu AI bo‘limi va endpoint | Xuddi shu anonim umumiy mavzu |
| Vercel Telegram bot | `/ai` → umumiy mavzu tugmasi orqali rozilik | Faqat mavzu; Telegram chat ID modelga yuborilmaydi |

Barcha platforma **bitta** Vercel bot endpointi va **bitta** Neon Postgres qattiq kvota tizimidan foydalanadi. Shaxsiy kundalik, hayz sanalari, parol, asl chat savoli, ism-familiya Gemini’ga yuborilmaydi. Telegram chat xabarlari esa odatdagidek Telegram tizimidan o‘tadi.

## Xavfsizlik va $0 cheklovlari

- Har bir anonim IP yoki Telegram ID xeshi uchun 3 so‘rov/kun, 1 so‘rov/daqiqa.
- Global 30 so‘rov/kun, 300 so‘rov/oy, jami 1000 so‘rov. Global limit hamma kanalda umumiy.
- 220 javob tokeni, 10 soniya timeout, retry va avtomatik pullik model fallback yo‘q.
- Har bir haqiqiy Gemini chaqiruvidan oldin DB kvotasi **atomik rezerv** qilinadi. DB mavjud bo‘lmasa, AI mutlaqo ishga tushmaydi.
- AI uchun Free Tier, **billing ulanmagan** alohida Google loyihasini operator tekshirishi kerak. Sayt kodi hech qanday pullik hisobni aktivlashtirmaydi.
- Google Free Tier’da umumiy yuborilgan matnlar xizmatlarini yaxshilash uchun ishlatilishi mumkin. Ilovada bu haqida rozilik matni mavjud.
- Rasmiy Free Tier ro‘yxatiga mos model: `gemini-3.1-flash-lite`. Hududiy va amaldagi kvotani AI Studio’da qo‘lda tekshiring.
- Maxfiy API kalit, DB ulanish satri, xavfsizlik pepper qiymati APK, sayt yoki GitHub’da saqlanmaydi.

## Server sozlash — faqat tekshirilgan sinov muhiti

`healthy-women-bot` Vercel loyihasida quyidagi **server-side** environment variables qo‘lda kiritiladi (chatga kalit/parol yubormang):

| Kalit nomi | Qiymat |
|---|---|
| `AI_MODE` | `free_preview` — faqat reviewdan keyin |
| `AI_FREE_TIER_NO_BILLING` | `CONFIRMED` — billing tekshirilgandan keyin |
| `GEMINI_API_KEY` | Billing ulanmagan Google Free Tier API loyiha kaliti |
| `AI_DATABASE_URL` | Migratsiya qilingan cheklovli Neon Postgres ma’lumotlari |
| `AI_IP_PEPPER` | Tasodifiy maxfiy 32+ belgili qiymat |
| `AI_ALLOWED_ORIGIN` | `https://healthy-women.vercel.app` |
| `AI_ALLOWED_HOSTNAME` | `healthy-women-bot.vercel.app` |
| `AI_ANDROID_ORIGIN` | `https://localhost` (Capacitor Android WebView uchun) |

Neon SQL: `db/migrations/003_ai_free_limits.sql` (faqat mustaqil ko‘rib chiqilgan staging DBda qo‘lda); bunda jami `lifetime` hisoblagich hech qachon o‘chirilmasin. Android WebView origin odatdagi Capacitor 7 versiyasida `https://localhost`; HTTPS vebga ham, Androidga ham alohida va qat’iy origin ruxsat berilgan. Wildcard CORS mavjud emas.

**Muhim:** Vercel’da mavjud server sozlamalarida AI uchun maxfiy kalitlar topilmagani sabab jonli AI hozir **o‘chirilgan**. Integratsiya kodi va avtomatik testlar bilan real provayder API muvaffaqiyatli ishlaganini bir xil deb ko‘rsatmang. Google AI Pro obunasi Gemini API Free Tier kafolati emas.

## Foydalanish

Sayt/Android: AI yordamchi → savol → offline javob → ixtiyoriy rozilik → AI tugmasi. AI o‘chiq bo‘lsa, server 503 bilan xavfsiz rad etadi, offline javob mavjud.

Telegram: `/start` menyusidan «Cheklangan AI» yoki `/ai` → tegishli umumiy mavzuni bosish. Bu alohida rozilik. `/ask hayz og‘rig‘i` esa avvalgidek mavjud, hech qanday AI xarajat sarflamaydi.

## Tekshiruv va cheklovlar

- `npm test` — Node.js 22, barcha eski va yangi unit testlar.
- `node tests/e2e-unified-v129.mjs` — Playwright Chromium bilan **mock** backend; haqiqiy Gemini va Telegram chaqirilmaydi.
- GitHub Actions orqali Android debug APK yig‘iladi. APK haqiqiy jismoniy qurilmada tarmoq, Android CORS, backup/restore, eski imzo va bildirishnomalar bo‘yicha qo‘lda sinovga muhtoj.
- `node scripts/release-preflight.mjs --strict` **BLOCKED** holatida qolishi kerak: 50 ta tibbiy mavzu uchun 0/50 klinik tasdiq, mustaqil maxfiylik ekspertizasi va jismoniy qurilmalar testi yo‘q.
- Jonli webhook, DB migratsiya, to‘lovlar va production deployment avtomatik yoqilmasin. Bu versiya har uch kanalda bir xil AI biznes qoidalarini o‘rnatadi, ammo real tibbiy foydalanuvchilarga tarqatish uchun tayyor deb da’vo qilmaydi.
