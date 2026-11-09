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
