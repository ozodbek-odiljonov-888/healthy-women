# Healthy Women v1.25 — Advanced Preview (sinov, $0)

**Status: DRAFT, hali jonli foydalanuvchilarga tarqatilmagan.** Dizayn va real funksiyalar kengaytirildi; loyiha klinik tibbiy vosita emas.

## Yangi imkoniyatlar
- Bosh sahifada shaxsiy holat, faol sikl va 4 ta ishlaydigan tezkor o‘tish: kundalik, tahlil, manbali bilimlar, qoidaviy yordamchi.
- **Tahlillar** oynasi: 3, 6 yoki 12 oylik statistikani tanlash; qaydlar dinamikasi, o‘rtacha og‘riq, kayfiyat, qon ketishi, tarixiy sikl oralig‘i va qamrovni ko‘rish.
- Faqat kiritilgan haqiqiy sanalardagi kuzatuvlardan hisoblash. Kelajakdagi yozuvlar hisobga kiritilmaydi; ma’lumot bo‘lmasa sun’iy tibbiy xulosa chiqarilmaydi.
- 390 px mobil ekran uchun 5 ta asosiy navigatsiya tugmasi; 12 oylik grafiklar gorizontal suriladi; sahifa kengligidan chiqmaydi.
- Shifrlangan kundalik, parol, backup/restore, offline PWA va mavjud xavfsizlik himoyalari saqlangan.

## Sinash
1. Kod papkasida `node scripts/run-unit-tests.mjs` buyrug‘ini ishga tushiring (Node.js 22).
2. `site` papkasida `python -m http.server 8080` buyruqni bajaring.
3. Brauzerda `http://localhost:8080/index.html` ni oching.
4. Ilovani **faqat sun’iy test qaydlari** bilan sinang: dastlab kundalikni shifrlash va shifrlangan backupni tekshirish, so‘ng kalendarga davrlar hamda kundalikka alomatlar kiritish.
5. **Tahlillar** oynasida 3, 6 va 12 oy tugmalarini bosing. Telefon oynasida 12 oylik ustunlar yon tomonga surilishi kerak.
6. `node scripts/release-preflight.mjs --strict` hozircha xato kodi 2 bilan to‘xtashi **kutiladi**: reliz uchun insoniy tekshiruvlar tugamagan.

## Sinov Android ilovasi
GitHub Actions’dagi `Healthy-Women-v1.25-Android-Debug-Preview` — faqat debug APK. Uni avvaldan mavjud kundalik ma’lumotlari bor asosiy telefonda emas, test qurilmada sinang. APK Play Market relizi emas; mustaqil foydalanuvchilarga ommaviy tarqatilmasin.

## Tibbiy va maxfiylik cheklovlari
- 50 manbali tibbiy javoblar **0/50 klinik tasdiq** holatida.
- Ilova homiladorlikni aniqlash, ovulyatsiyani tasdiqlash, tashxis qo‘yish yoki kontratsepsiya uchun ishlatilmaydi.
- Neon staging va Vercel production bulutli sog‘liq ma’lumotlari sinxronlashiga ulanmagan; yangi statistik hisoblash qurilmada bajariladi.
- Ikki jismoniy qurilmada tiklash, Android ruxsatlari, klinik audit, maxfiylik tekshiruvi va mutaxassis roziligi relizgacha shart.

## $0 qoidasi
- Vercel Hobby va Neon Free tariflari saqlanadi; Neon staging o‘rnatilgan 0.25 CU / 4 faol soat / 1 CPU soat / har biri 64 MiB resurs limitlari o‘zgartirilmaydi.
- Qo‘shimcha bulut, pullik sun’iy intellekt modeli, domen yoki server yoqilmaydi.
- GitHub Actions’dagi tekshiruv va APK yig‘ish public repo’ning mavjud CI resurslaridan foydalanadi; pullik rejaga o‘tish avtomatik bajarilmaydi.

**Maqsad:** keyingi bosqichda tashxisga da’vo qilmasdan, alomatlarni to‘liqroq kiritish, qaydlarni tushunarli eksport qilish, foydalanuvchi xavfsizligi va haqiqiy ikki qurilma sinovlarini yakunlash.
