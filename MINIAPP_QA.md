# Healthy Women — Telegram Mini App qo‘lda tekshirish rejasi

**Muhit:** Telegram Desktop (Windows), Telegram Android, Chrome PWA.  
**Ma'lumotlar:** faqat to‘qima (sinov) qaydlar; haqiqiy shaxsiy/sog‘liq ma’lumotlarini ishlatmang.

## 1. Ishga tushirish
- [ ] Telegram’da `@healthy_womens_bot` → `/start` javobi keladi.
- [ ] `🌷 Ilovani ochish` tugmasi Mini App’ni ochadi; ichki brauzer qulamaydi.
- [ ] Bosh sahifa ko‘rinadi; kalendar, kundalik, bilimlar va sozlamalar mobil ekran ichida ishlaydi.
- [ ] To‘liq qayta ochilgandan so‘ng sahifa JavaScript xatosiz ko‘rinadi.

## 2. Sikl va kundalik (faqat sinov ma'lumotlari)
- [ ] O‘tgan sanada bitta hayz davri qo‘shing; saqlangan davr kalendarda va tarixda ko‘rinadi.
- [ ] Kelajakdagi boshlanish sanasi rad etiladi va hech narsa saqlanmaydi.
- [ ] Davrni tahrirlang; bitta davr saqlanib qoladi, dublikat paydo bo‘lmaydi.
- [ ] Kundalikka sinov qaydini kiriting; qaydlar tarixida ko‘rinadi.
- [ ] Mini App’ni yoping va **shu Telegram qurilmasida** qayta oching; davr va kundalik saqlanib qolganini tekshiring.
- [ ] Kundalikni tahrirlang; bir sanada takroriy dublikat paydo bo‘lmaydi.
- [ ] Sinov qaydlarini o‘chirib, qayta oching; o‘chirilganlari ko‘rinmaydi.

## 3. Maxfiylik va tiklash
- [ ] Sozlamalarda mahalliy xotira va shifrlash holati to‘g‘ri yozilgan.
- [ ] Shifrlangan `.hwbak` zaxira fayli yaratiladi va faqat to‘qima ma’lumotlar bilan qayta tiklash sinab ko‘riladi.
- [ ] TXT va CSV fayllari **shifrlanmagan**ligi haqida ogohlantirish chiqadi (v1.7 draft uchun).
- [ ] Boshqa telefon/Chrome’da oldingi qurilma qaydlari avtomatik paydo bo‘lmaydi; bu **hozirgi prototip uchun kutilgan holat**.
- [ ] Telegramga yuboriladigan savollar shaxsiy klinik ma'lumotlarni o‘z ichiga olmaydi.

## 4. Reliz oldidan cheklovlar
- Telegram Desktop’da ochilishi muvaffaqiyatli bo‘lgani Android yoki iOS Telegram WebView’da aynan shunday ishlashini isbotlamaydi.
- Chromium’da 390 px mobil-o‘lchamli test haqiqiy Telegram WebView va qurilmadagi fayl saqlash mexanizmini to‘liq almashtirmaydi.
- Telegram Bot webhooki ishlashi = mahalliy qaydlar serverga sinxronlangan degani **emas**.
- `window.Telegram.WebApp.initData` serverda ishonchli tekshirilmaguncha Telegram identifikatoridan avtorizatsiya sifatida foydalanilmasin.
- Android debug APK o‘rnatish/yangilash va lokal bildirishnomalarni haqiqiy qurilmada alohida test qiling.
- Klinika uchun foydalanishdan oldin mustaqil axborot xavfsizligi va tibbiy ekspertiza talab etiladi.

**Avtomatik sinov:** `tests/e2e-browser.mjs` Chromium’da sahifani kichik o‘lchamda ochib, kalendar/kundalikni saqlash va qayta yuklashni sun’iy ma’lumotlar bilan tekshiradi.

**Holat:** Bu fayl qo‘lda bajarish chek-listidir, testlar o‘tkazilgani to‘g‘risida avtomatik tasdiq emas.
