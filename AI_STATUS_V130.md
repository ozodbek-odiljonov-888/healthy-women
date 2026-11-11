# Healthy Women v1.30 — AI xizmatini haqiqiy ulashni tekshirish (DRAFT)

Website/PWA, Android va Telegram bot dasturlari bitta Vercel AI backendiga mo‘ljallangan, ammo haqiqiy Gemini so‘rovlari faqat Google Free Tier (billing *ulanmagan*) tasdiqlangach yoqiladi.

**Yangi:** barcha kanallar kvotasi Neon orqali saqlanadi; GET `/api/ai-status` bepul read-only ishlash holatini bildiradi, bemor ma’lumoti yubormaydi, Gemini’ga so‘rov qilmaydi. Sayt va Android foydalanuvchi alohida bosgandagina statusni tekshiradi. Model 3.1 Flash-Lite’da `thinkingLevel=minimal`, bitta kandidat va 220 token chiqish limiti saqlandi.

**Muhim:** AI kalitining o‘zi mavjudligi billing ulanmaganligini isbotlamaydi. `AI_MODE=off`, `AI_FREE_TIER_NO_BILLING=UNVERIFIED` qiymatlarini o‘zgartirmang. Medical review 0/50, Android fizik qurilma testi va mustaqil audit hali tugallanmagan.

Faollashtirish tartibi: AI Studio → Projects → aynan kalit ishlatayotgan loyiha → Billing Tier `Free` yoki `Set up billing` ekanini tekshiring. So‘ng ishlab chiqarishdan oldin mustaqil ko‘rik, bitta umumiy (xayoliy) mavzu bilan sinov, qayta deploy va xatolik bo‘lsa `AI_MODE=off` bilan qayta deploy qiling.

**Cheklovlar:** 3/IP/kun, 1/IP/min, 30/jami/kun, 300/jami/oy, 1000/jami/umrbod. Vaqtincha buzilgan DB bo‘lsa Gemini hech qachon chaqirilmaydi. Real qaydlar va shaxsiy savol matni Gemini’ga yuborilmaydi.
