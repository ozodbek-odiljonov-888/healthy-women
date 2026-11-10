# Healthy Women v1.18 — 50 mavzu uchun tahririy nazorat va qiyin savollar

**DRAFT. QAT’IY $0.** Jonli `@healthy_womens_bot`, Mini App, PWA va APK
o‘zgartirilmagan. OpenAI/Gemini API, GPU, pullik hosting, qo‘shimcha baza
yoki yangi bulut resursi qo‘shilmagan.

## 1. Klinik-tahririy nazorat: 50 ta mavzu

`scripts/lib/medical-editorial-v118.mjs` 50 mavzuga bittadan
**tasdiqlanmagan** tahririy yozuv yaratadi. Har bir yozuvdagi 10 ta sun’iy
savol mavjud 500 savollik korpusga bog‘langan.

Jadvalda:
- mavzu identifikatori, nomi va klinik matn;
- rasmiy NHS/ACOG manba manzili va URL tekshiruv holati;
- tahririy tekshiruv ustuvorligi (`HIGH` yoki `STANDARD`);
- matnning manbaga mosligi (`source_claim_alignment`);
- klinik aniqlik (`clinical_accuracy`);
- o‘zbekcha matn tushunarliligi (`uzbek_language`);
- xavfli holatlarda yo‘naltirish (`urgent_referral_safety`);
- O‘zbekiston amaldagi qoidalariga moslashtirish
  (`uzbekistan_applicability`);
- mustaqil tibbiy mutaxassisning ismi, sanasi, izohlari va statusi.

**Barcha klinik maydonlar `PENDING_REVIEW` / `PENDING_CLINICAL_REVIEW`
holatida. 0/50 klinik tasdiq.** Tahririy ustuvorlik — bemorning klinik
shoshilinchlik darajasi emas, matnni birinchi tekshirish uchun ish tartibi.

### CSV'ni mutlaqo bepul yaratish

GitHub loyihasining bosh papkasida quyidagi buyruqni bajaring:

```bash
node scripts/export-medical-editorial-v118.mjs medical-editorial-v118.csv
```

Bu 50 satrli UTF-8 CSV yaratadi. Fayl oldindan mavjud bo‘lsa uni
avtomatik bosib yozmaydi — mutaxassisning qo‘lda kiritgan izohlarini
tasodifan yo‘qotmaslik uchun `wx` ishlatiladi.

CSV mazmuni sun’iy savollar va koddagi tayyor matnlardan tuziladi.
Unga real bemor ma’lumotlari, Telegram xabarlari yoki shaxsiy tibbiy
ma’lumotlar kiritilmaydi.

**Eslatma:** tahririy CSV va avvalgi `medical-clinical-review.json`
bir xil narsa emas. Haqiqiy klinik tasdiq uchun avvalgi
`scripts/check-medical-release.mjs` tekshiruvi, shifokorning mustaqil
identifikatsiyasi va `main` branch reliz nazorati talab etiladi.

## 2. Qiyin savollar uchun $0 qoida

`medical-boundaries-v118.js` quyidagi savollarni **individual tibbiy
tavsiyaga aylantirishdan tiyiladi**:

- “PCOS va mioma farqi nimada?” — ikki mavzuni tasodifan bir mavzu
  maqolasi bilan almashtirmaydi.
- “UTTda 5 sm mioma chiqdi, operatsiya kerakmi?” — chat orqali
  bemorning operatsiyaga muhtojligini baholamaydi.
- “Tahlilimni talqin qilib tashxis qo‘ying” — shaxsiy tashxis
  yoki dori retseptini tuzmaydi.

Bu bosh tortish xavfli alomatlarni e’tiborsiz qoldirish uchun emas:
`assessMedicalRisk` har doim birinchi ishlaydi. Foydalanuvchi hushdan
ketsa, homiladorlikda jiddiy qon ketishi yoki boshqa xavfli belgilar
bo‘lsa, chatbot odatiy FAQ o‘rniga tibbiy yordamga yo‘naltiradi.

Himoya `/ask`, oddiy Telegram savoli va `/api/knowledge` chiqishida
bir xil qo‘llanadi.

## 3. Rasmiy manbalar

NHS/ACOG sahifalari ko‘rib chiqildi, jumladan:

- ACOG hayz davomiyligi/sikl:
  https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods
- NHS ko‘p hayz:
  https://www.nhs.uk/conditions/periods/period-problems/
- NHS homiladorlikda qon ketishi:
  https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/
- NHS menopauza va qon ketishi:
  https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/
- NHS PCOSning yangi PMOS nomi:
  https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/

**Manba sahifasini ko‘rish ≠ klinik tasdiq.** Har bir tayyor tibbiy
jumla malakali mutaxassis tomonidan alohida tekshirilishi zarur.
Britaniya skrining yoshi yoki tartibini O‘zbekiston uchun to‘g‘ridan-
to‘g‘ri ko‘chirib ishlatmaslik kerak.

## 4. Sinovlar va ishlab chiqarish chegarasi

- `tests/medical-editorial-v118.test.mjs` — 50 mavzuni audit qilish,
  imzosiz tasdiqning yo‘qligi, CSV eksporti, mahalliy protokol maydonlari.
- `tests/medical-adversarial-v118.test.mjs` — murakkab, ko‘p mavzuli,
  individual davolash va shoshilinch alomatlar bilan test.
- Avvalgi 50 mavzu/500 sun’iy savol, krill/lotin, foydalanuvchi
  izolyatsiyasi, shifrlash va offline testlar saqlanadi.

**Reliz uchun hali ham 0/50 shifokor tasdig‘i mavjud.** GitHub testlar
o‘tgan bo‘lsa ham, bu klinik xavfsizlikning isboti emas.
Jonli botga merge/deploy qilish klinik tahrir va real qurilmada
maxfiy bo‘lmagan sinovlar tugamaguncha cheklangan.

**Xarajat: $0 qo‘shimcha pullik xizmat.** Bepul hosting limitlari
tugasa, avtomatik pullik tarifga o‘tilmaydi.
