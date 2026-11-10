# Healthy Women — v1.17: manba va shoshilinchlik auditi (DRAFT, $0)

**Bepul foydalanish sharti o‘zgarmagan.** Pullik AI API, GPU, yangi server,
Vercel/Neon resursi, bildirishnoma yoki domen yaratilmadi. Hozirgi bot, PWA
va Android APK o‘zgartirilmagan; tibbiy savol-javob kodi faqat GitHub draft.

## 1. Rasmiy manbalar holati

`scripts/lib/medical-source-audit.mjs` mavjud 50 mavzu uchun bitta
manbalar inventarini hisoblaydi. Holatlar:

- **PAGE_OPENED:** NHS yoki ACOG sahifasi 2026-11-10 kuni
  ko‘rib chiqildi; sayt va sahifa mazmunining tegishli mavzuga
  mosligi tekshirildi. **Bu klinik tasdiq emas.**
- **PENDING_SOURCE_REVIEW:** havola faqat oldingi bilimlar bazasida
  keltirilgan; ushbu bosqichda alohida ochib tekshirilmagan.
- **clinical_content_approved=false** — ikkala holatda ham
  shifokorning mustaqil tibbiy tasdig‘i berilmagan.

Jadval barcha 50 URL faqat aniq `https://www.nhs.uk` yoki
`https://www.acog.org` domeniga tegishli bo‘lishini talab qiladi.
Shubhali domen, noaniq subdomen, URL ichidagi yashirin parol
yoki HTTP manzil qabul qilinmaydi. Bu URL uchun offline sintaktik
nazoratdir; **barcha havolalarning real vaqt HTTP holatini kafolatlamaydi**.

Tekshirilgan manbalardan ayrimlari:
- ACOG — hayz sikli va amenoreya:
  https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods
- NHS — homiladorlikda vaginal qon ketishi:
  https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/
- NHS — bachadondan tashqari homiladorlik alomatlari:
  https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/
- NHS — homila harakatlari:
  https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/
- NHS — menopauzadan keyingi qon ketishi:
  https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/
- NHS — ko‘p hayz:
  https://www.nhs.uk/conditions/heavy-periods/
- NHS — servikal skrining:
  https://www.nhs.uk/tests-and-treatments/cervical-screening/what-is-cervical-screening/
- NHS — PCOS sobiq nomi bilan PMOS sahifasi:
  https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/

Britaniya NHS skrining yoshi va murojaat tartibi O‘zbekistonda
avtomatik qo‘llanmasligi kerak. Mahalliy amaldagi klinik tavsiyalarni
tasdiqlash keyingi alohida vazifa.

## 2. Shoshilinch holatlarni tekshirish

`bot-vercel/worker/medical-triage-v117.js` mavjud xavfsizlik
mexanizmiga ehtiyotkor qo‘shimcha:
- Homiladorlik ehtimoli, qon ketishi va yelka uchi og‘rig‘i:
  shoshilinch yordamga yo‘naltirish.
- Homiladorlik ehtimoli, qon ketishi va har soatda
  prokladkaning to‘lib qolishi: shoshilinch yordam.
- Homiladorlik ehtimoli va yelka uchidagi og‘riq
  (qon ko‘rsatilmasa ham): tez tibbiy baholash.
- Menopauzadan keyin pushti/jigarrang ajralma,
  hatto oz miqdorda bo‘lsa ham: tibbiy ko‘rik.
- Hayzda har soatda prokladka to‘lib qolishi:
  tibbiy ko‘rik; boshqa xavf belgilar bo‘lsa shoshilinch yordam.
- Ataylab o‘quv savoli shaklida yozilgan so‘zlar
  bilan shaxsiy alomatlar orasida cheklangan ajratish.

Bu qoidalar tibbiy xulosa beruvchi algoritm sifatida emas,
**xavfni e’tiborsiz qoldirmaslik** uchun mo‘ljallangan.
Inkor, sheva, yozish xatosi va noaniq gaplar bo‘yicha
noto‘g‘ri musbat va manfiy natijalar mumkin.

## 3. Klinik tasdiqning eskirishi

`scripts/lib/clinical-review.mjs` endi nafaqat har bir
javob va manba URLini SHA-256 bilan bog‘laydi, balki
**barcha shoshilinch yordam va yozuvni normalizatsiya
qilish qoidalari** uchun alohida fingerprintni ham yozadi.

Agar mazkur qoidalar o‘zgarsa, eski klinik tasdiq fayli
reliz tekshiruvidan o‘tmaydi: shifokor yangi xavfsizlik
mexanizmini qayta ko‘rib chiqishi kerak.

**Klinik tasdiqlangan mavzular: 0/50.** Klinik
mutaxassisning mustaqil bahosi talab qilinadi.
GitHub testdan o‘tganligi klinik tasdiq emas.

## 4. Sinovlar va ishlab chiqarish cheklovi

- `tests/medical-triage-v117.test.mjs` — NHS xavfli
  alomatlarning sintetik o‘zbekcha shakllari.
- `tests/medical-source-audit-v117.test.mjs` — manba
  domenlari, sahifa tekshiruv holati va klinik tasdiqni ajratish,
  xavfsizlik kodi SHA-256 nomuvofiqligi.
- Mavjud 50 mavzu, 500 savol, oldingi klinik
  va xavfsizlik testlari ham saqlanadi.
- Hali hech qanday bemor bilan pilot sinov, haqiqiy klinik
  tasdiq yoki bot deployment amalga oshirilmagan.

**$0 himoya:** yangi pullik integratsiya, avtomatik
yuqori tarifga o‘tish yoki xarajatli monitoring mavjud emas.
Bepul hostingning cheklovlari tugasa, xizmat vaqtincha
to‘xtashi mumkin.
