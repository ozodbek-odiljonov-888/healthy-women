# Healthy Women v1.23 — klinik tekshiruv uchun BEPUL paket

**Holat: DRAFT, 0/50 shifokor tasdig‘i. Jonli bot, sayt, APK va Neon o‘zgarmagan.**

## Maqsad

Ilovani tezroq xavfsiz relizga olib chiqish uchun 50 ta manbali tibbiy
javobni malakali shifokor ko‘rigiga bir xil andozada taqdim etish.
Manbalar NHS/ACOG, ammo ular O‘zbekiston uchun klinik xulosa o‘rnini
bosmaydi. Ularning bir marta ochilgani klinik tasdiq emas.

## GitHub orqali kod yozmasdan olish

1. GitHub'dagi **PR #18 (v1.23)** ichidan **Checks** bo‘limini oching.
2. **Verify Healthy Women preview** sinovi muvaffaqiyatli tugaganini
   tekshiring. Uning workflow run sahifasidagi **Artifacts** bo‘limida
   `Healthy-Women-50-Medical-Review-DRAFT` arxivini tanlang.
3. ZIP tarkibida *4 ta tahririy hujjat* bo‘ladi:
   - `01-50-mavzu-klinik-korik.html` — oflayn ko‘rish/chop etish mumkin;
     har bir mavzuning javobi, manbasi, 7 ta tekshiruv mezoni,
     izohlar uchun joy va ma’lumot fingerprinti;
   - `02-50-mavzu-tahririy-jadval.csv` — Excel’da ochiladigan,
     ustuvorlik bo‘yicha tartiblangan klinik ko‘rik jadvali;
   - `03-klinik-tasdiq-shabloni.json` — release gate uchun
     **barcha 50 ta PENDING_CLINICAL_REVIEW** holatidagi strukturaviy shakl;
   - `README-UZ.txt` — shifokor uchun birma-bir yo‘riqnoma.
4. Review fayllarini shifokorga yetkazing, manbalar va javoblarni
   mustaqil tekshirtiring. **Haqiqiy bemor qaydlari yoki aloqa
   ma’lumotlarini ochiq GitHub'ga yuklamang.**

Paket GitHub Actions’ning **mavjud quality job** ichida ishlab chiqiladi;
yangi server, cloud storage, AI modeli, pullik API yoki Vercel deploy yo‘q.
Artifact 7 kundan keyin avtomatik o‘chishi mumkin. So‘ng qayta
yaratish uchun yangi tekshiruvni boshlash kerak bo‘ladi.

## Lokal kompyuterda internetsiz paket yaratish

Loyiha papkasida, Node.js 22 bilan:

```bash
node scripts/build-clinical-review-package.mjs healthy-women-clinical-review
```

Fayllar faqat shu papkaga yaratiladi. Oldindan mavjud papkadan
qayta foydalanilmaydi — bu shifokor yozgan izohlarning ustidan
tasodifan yozilishining oldini oladi.

## Klinik reliz nazorati

Shifokor barcha 50 mavzuni, rasmiy manba sahifalarini, o‘zbekcha
matnni, xavfli belgilarni, homiladorlik/yosh muammolarini va mahalliy
tavsiyalarni tekshirmasdan `APPROVED_BY_CLINICIAN` qo‘ymang.

Relizga tayyorlangan JSON'ning nomini `medical-clinical-review.json`
qilib, kod bilan mos xeshlar saqlanganligini tekshirish:

```bash
node scripts/check-medical-release.mjs medical-clinical-review.json
```

**Muhim:** bu nazorat faqat hujjatning tuzilishi, qiymatlari va
safety/kontent xeshlarini tekshiradi. Shifokorning haqiqiy shaxsi,
malakasi va xulosasi loyiha mas’uli tomonidan mustaqil tasdiqlanishi
kerak. Tekshiruvdan o‘tganlik klinik xavfsizlik kafolati emas.

## Qamrov va sinovlar

- Har bir sahifa va CSV qatori haqiqiy `MEDICAL_TOPICS` dan olinadi.
- Tibbiy mavzular manbasini almashtirish, yuborilgan matndagi HTML
  belgilar, noto‘g‘ri URL va tasdiqlangan deb ko‘rsatish taqiqlanadi.
- 50 mavzu, 350 bo‘sh tekshiruv katagi, 4 fayl,
  0 ta dastlabki tasdiq, tasodifiy fayl almashtirib yozishni rad
  etish, clinical gate’ning tasdiq yo‘qligida bloklashi sinovdan o‘tadi.
- Barcha tekshiruvlar faqat sun’iy kod ma’lumotlari bilan o‘tkaziladi.

**Iqtisodiy qoida:** Vercel Hobby va Neon Free’dan chiqish, yangi
obuna, pullik API yoki hosting yaratish mumkin emas. Neon’da
o‘rnatilgan provider kvotalari o‘zgarmaydi.

**Reliz bloklovchilari:** shifokorlar tasdig‘i hozircha 0/50;
haqiqiy qurilmada tekshirish, maxfiylik va klinik xavfsizlik auditi
hanuz bajarilishi kerak. Ular hal bo‘lmaguncha v1.23 production’ga
chiqarilmaydi.
