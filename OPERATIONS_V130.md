# Healthy Women — AI server, Neon kvota va Vercel preview auditi (2026-11-11)

## Tasdiqlangan amaliy ishlar
- `healthy_women_staging` Neon bazasiga `db/migrations/003_ai_free_limits.sql` jadval va `hw_ai_reserve_free(text)` funksiyasi qo‘llandi.
- Migratsiya avval vaqtinchalik Neon branchda tekshirildi, so‘ng asosiy staging branchga qo‘llandi; vaqtinchalik branch o‘chirildi.
- Alohida `hw_ai_quota_rw` roli yaratildi, `public.hw_ai_free_usage` ga read/write va kvota funksiyasi EXECUTE ruxsati bor; `hw_private` sxemasiga USAGE yo‘q.
- Shu rol orqali takroriy so‘rov tekshirildi: birinchi ruxsat, ayni daqiqadagi ikkinchi so‘rov rad qilindi. Bitta sinov rezervi `lifetime=1` sifatida saqlangan. Real Gemini chaqirilmadi.
- Vercel `healthy-women-bot` Production sozlamalariga maxfiy `AI_DATABASE_URL`, `AI_IP_PEPPER` va qat’iy origin/hostname parametrlar qo‘shildi. `GEMINI_API_KEY`, `BOT_TOKEN`, `WEBHOOK_SECRET` mavjudligi kalit qiymatlarini ko‘rmasdan tasdiqlandi.
- AI o‘chirilgan: `AI_MODE=off`; `AI_FREE_TIER_NO_BILLING=UNVERIFIED`.
- Saytning 37, botning 25 ta v1.29 fayli Vercel’da **faqat preview** sifatida qurildi. Ikkalasi READY, build logida xato yo‘q; production domenlari o‘zgarmadi.
- Bot preview: `dpl_BWjc9Zcxxp58G2sv4dirusLwiGp2`, https://healthy-women-kfy8qizvd-odiljonnorkulov0-9690.vercel.app
- Sayt preview: `dpl_7q9rkXmnhks7nyVDAuxGpU6WCaN2`, https://healthy-women-fa6qet1y6-odiljonnorkulov0-9690.vercel.app
- GitHub Actions v1.29: 342/342 unit-testlar, 390px / 1280px Chromium mock AI, mobil/kalendar, Android debug build — SUCCESS; release-preflight BLOCKED.
- Mavjud debug APK ichida public `HEALTHY_WOMEN_AI_API=https://healthy-women-bot.vercel.app/api/ai` mavjud, API kalit/DB credential APK ichiga joylashtirilmagan.

## Qat’iy blokirovkalar
1. Google AI Studio loyihasida Free Tier va **billing ulanmaganini** operator akkauntida mustaqil tekshirish kerak. Kalit mavjudligi buni isbotlamaydi; AI_MODE ni o‘zgartirmang.
2. Klinik mavzular 0/50 mustaqil reviewer tasdig‘i; shaxsiy tibbiy ma’lumotlarni real sinovda ishlatmang.
3. Haqiqiy fizik Android qurilmada push, saqlash, CORS, API va eski APK signature yangilanishi tekshirilmagan.
4. Telegram webhookning jonli `/ai` xabarlari operator tomonidan tekshirilmagan; preview tokeni productiondan izolatsiyalangan.
5. Vercel preview endpointlarida tashqi HTTP smoke test deployment himoyasi sabab mustaqil tasdiqlanmadi (build READY — HTTP runtime tekshirildi degani emas).
6. Shifrlangan uch platformali cloud sync ataylab o‘chirilgan. Bepul tarifdagi maxsus ehtiyojlar va HIPAA darajasidagi ishlash tasdiqlanmagan.

## Kelgusi faollashtirish (faqat review va zarur ruxsatlardan so‘ng)
- Operator Google AI Studio’da billing yo‘qligini tekshiradi; kalitni hech kimga va GitHub'ga yubormaydi.
- Mustaqil klinik/maxfiylik tekshiruvlari o‘tgach, production chiqish rejasida kirish huquqlarini, rolni, limitlarni qayta ko‘rib chiqadi.
- So‘ng billing haqiqatan o‘chiq ekanini tekshirib `AI_FREE_TIER_NO_BILLING=CONFIRMED`, `AI_MODE=free_preview` qiymatlarini yangilaydi va yangi Vercel deployment chiqaradi.
- Avval faqat xayoliy savollar bilan 1 tadan PWA/Android/Telegram orqali sinab, Neon limitlarini kuzatadi.
- Har qanday xatoda `AI_MODE=off` bilan qayta deploy qilinadi; credentiallar public bo‘lmasin.
