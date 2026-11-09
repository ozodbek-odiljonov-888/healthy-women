# 🌷 Healthy Women — sinov saytini nashr qilish

## Vercel (faqat notijorat sinov)

1. Vercel Dashboard → Add New → Project bo‘limiga kiring.
2. GitHub’dagi **Healthy Women** repositorysini import qiling.
3. **Project Name**: healthy-women (faqat brend nomi).
4. **Root Directory**: `site`. Bu juda muhim: sayt bilan bog‘liq bo‘lmagan fayllar veb-ildizga kiritilmaydi.
5. **Framework Preset**: Other; **Build Command**: bo‘sh; **Output Directory**: `.`.
6. Deploy tugmasini bosing, so‘ng `/` va `/privacy.html` sahifalarini sinang.
7. PWAni telefonga o‘rnatishdan avval faqat sinov ma’lumotlari bilan tekshiring.

`site/vercel.json` xavfsizlik sarlavhalarini va qidiruv indekslash cheklovlarini belgilaydi. Sayt hali foydalanuvchining haqiqiy tibbiy ma’lumotlarini saqlash uchun xavfsizlik auditidan o‘tmagan.

**E’tibor:** Vercel Hobby rejasi shaxsiy, notijorat foydalanish uchungina. Tijoriy Healthy Women xizmatini ushbu bepul rejada ishlatmang; pullik tarifga ruxsatsiz o‘tmang.

## Telegram bot va Cloudflare

Telegram bot kodi `worker/index.js` faylida. Cloudflare’da mustaqil Worker kerak. Uning `BOT_TOKEN` va `WEBHOOK_SECRET` sirlari faqat Cloudflare secrets boshqaruviga kiritiladi — GitHub yoki chatga emas.

Serverga saqlash va Telegram orqali shaxsiy salomatlik eslatmalari hali yoqilmagan. Tibbiy ma’lumotlarni real foydalanuvchilardan to‘plamang.

## Anonimlik

Sayt va bot matnlarida faqat Healthy Women brendi mavjud. Lekin GitHub repository egasi nomi va commit muallifi GitHub interfeysida ko‘rinishi mumkin. Jamoatga chiqishdan oldin loyiha uchun alohida brendga tegishli hosting hisobini ishlatish tavsiya etiladi.

## Telegram botni ulash

Cloudflare Worker'ni faqat Cloudflare hisobingiz orqali va bepul limitlarni nazorat qilgan holda ishga tushiring. `wrangler.toml` ichidagi `APP_URL` va `ALLOWED_ORIGINS` qiymatlarini haqiqiy sayt domeniga moslang.

Mahalliy kompyuterda `npx wrangler@4 login`, so‘ng `npx wrangler@4 deploy --config wrangler.toml` ni bajaring. Maxfiy tokenlarni `npx wrangler@4 secret put BOT_TOKEN` va `npx wrangler@4 secret put WEBHOOK_SECRET` orqali kiriting.

`WEBHOOK_SECRET` uchun `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` buyrug‘i bilan tasodifiy qiymat yarating.

BotFather tokeni, webhook siri va haqiqiy Cloudflare Worker URL ni o‘z kompyuteringizdagi **muhit o‘zgaruvchilari** orqali `BOT_TOKEN`, `WEBHOOK_SECRET`, `WORKER_URL` sifatida belgilang va `node scripts/register-telegram-webhook.mjs` ni bajaring. Ular GitHubga yoki chatga yuborilmaydi.

GitHub Actions’da ixtiyoriy `Deploy Healthy Women bot preview` workflow mavjud. U **faqat qo‘lda ishga tushadi**, `CLOUDFLARE_API_TOKEN` va `CLOUDFLARE_ACCOUNT_ID` repository secrets bo‘lmaguncha ishlamaydi. Bot tokeni va webhook sozlashni bu workflow bajarmaydi.

Bot salomatlik ma’lumotlarini o‘z bazasida saqlamaydi; sinxronlash va shaxsiy eslatmalar yoqilmagan.

## Vercel’da alohida bot prototipi

Yangi `bot-vercel/` papkasi Vercel Node.js webhook uchun tayyorlandi. Bot loyihasini faqat sinov maqsadida `healthy-women-bot` nomi bilan nashr qilish mumkin. Vercel project root: `bot-vercel`, Framework: Other. `/health` ochiq diagnostika; `/webhook` Telegramning maxfiy sarlavhasisiz `403` qaytaradi.

Bot ishlashi uchun platformaning **Environment Variables** bo‘limida `BOT_TOKEN`, `WEBHOOK_SECRET` (faqat secret/encrypted) va `APP_URL=https://healthy-women.vercel.app/` sozlanadi. Tokenlar chat yoki GitHub’ga yozilmasin. Tokenlar kiritilmaguncha bot ulanmagan hisoblanadi. Tokenlar o‘zgargach loyiha qayta deploy qilinadi, keyin BotFather webhook ro‘yxatdan o‘tkaziladi.

Bot Cloudflare’ga bog‘liq emas. Klinik tashxis va bemor kundaligi serverga saqlanmaydi. Hobby hosting **faqat notijorat shaxsiy prototip** uchun.

## Hozirgi Vercel nashri (2026-11-09)

- Sayt: https://healthy-women.vercel.app/ — bosh sahifa va `/privacy.html` HTTP 200 bilan tekshirildi.
- Telegram bot serveri: https://healthy-women-bot.vercel.app/health — HTTP 200; `/webhook` ga GET so‘rov HTTP 405 qaytaradi.
- Bot loyihasida `APP_URL=https://healthy-women.vercel.app/` muhit sozlamasi yozilgan.
- BotFather tokeni va webhook siri hozircha **sozlanmagan**. `/health` ishlashi Telegram bot ishga tushganini anglatmaydi.
- Vercel himoyasi production uchun ochiq, preview nashrlariga login talab etiladi.
- GitHub va Vercel o‘rtasidagi avtomatik bog‘lanish yoqilmagan. Yangi kodlar Vercel’ga alohida nashr qilinishi kerak.
- Sog‘liq qaydlarining bulutli saqlanishi va shaxsiy bildirishnomalar o‘chirilgan.
- Saytning brend domeni ishlatiladi, lekin Vercel tizimidagi avtomatik deployment va GitHub egalik identifikatorlari xususiy maydonlarda ko‘rinishi mumkin.
