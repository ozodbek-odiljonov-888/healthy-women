# Healthy Women v1.18 — 50 javob uchun klinik tahririy tekshiruv

**Bepul ($0), GitHub draft, jonli botga chiqarilmagan.** Oldingi 50 mavzu,
500 sun’iy savol, xavfli alomatlar qoidalari va maxfiylik himoyasi saqlanadi.

## Nima qo‘shildi?

`scripts/lib/medical-editorial-matrix.mjs` jami 50 ta mavjud tibbiy
javobga manbasi, asl matni, kontent SHA-256 xeshi, xavfsizlik kodi xeshi,
havola tekshiruvi holati va klinik ko‘rib chiqish ustunlarini bog‘laydi.

Tahririy navbat uch darajali:
- `REVIEW_FIRST`: homiladorlik bilan bog‘liq asoratlar, qon ketish,
  shoshilinch kontratsepsiya, reproduktiv xavflar va boshqa xavfli
  klinik mavzulardan **birinchi bo‘lib tekshiriladigan** bo‘limlar.
- `REVIEW_SECOND`: skrining, profilaktika, emizish, ayrim yoshga oid
  yoki O‘zbekistonga moslashtirish talab qiladigan javoblar.
- `REVIEW_STANDARD`: qolgan umumiy ta’lim mavzulari.

**Bu guruhlar bemor xavfini yoki kasallik og‘irligini baholamaydi.**
Ular faqat tahririy tekshirish navbatini bildiradi.

Har bir javob shifokor tomonidan alohida ko‘rib chiqilishi kerak:
1. Rasmiy NHS/ACOG manbasi matndagi da’volarni qo‘llashi;
2. O‘zbekcha tarjima, yosh va homiladorlik konteksti;
3. Shoshilinch holatlarda to‘g‘ri yo‘naltirish va noaniqlikni ko‘rsatish;
4. O‘zbekistondagi milliy skrining/klinik tavsiyalarga moslik;
5. Individual tashxis, antibiotik, doza yoki retsept bermaslik;
6. Maxfiylik va foydalanish imkoniyatlari.

## Excel/LibreOffice uchun bepul CSV

Loyihaning bosh papkasida:

```bash
node scripts/export-medical-editorial-v118.mjs healthy-women-medical-editorial-v118.csv
```

Bu buyruq **50 qatorli UTF-8 CSV** yaratadi. Oldindan mavjud
faylning ustidan yozmaydi: mutaxassis izohlarini yo‘qotmaydi.
Ustunlarga `topic_key`, `topic_title`, `review_priority`,
`source_url`, `source_page_status`, `content_sha256`,
`safety_rules_sha256`, `clinical_review_status`,
`review_criteria`, `reviewer_full_name`, `reviewer_qualification`,
`reviewed_on`, `reviewer_decision`, `editor_notes`,
`prepared_education_answer` kiradi.

**Barcha 50 mavzu `PENDING_CLINICAL_REVIEW` holatida.** CSVni
to‘ldirish jonli kodni tasdiqlamaydi. Yakuniy klinik reliz uchun
avval yaratilgan alohida JSON imzolash nazorati mavjud; shifokor
shaxsini va malakasini reliz mas’uli tashqarida tekshirishi kerak.

## Manbalarning tekshiruv holati

`PAGE_OPENED` faqat manba sahifasi oldin ko‘rib chiqilganligini
anglatadi. `PENDING_SOURCE_REVIEW` — hali qo‘lda tekshirish kerak.
Hech biri shifokor tasdig‘i emas. URL formatining yaxshi bo‘lishi
uning ichidagi ilmiy ma’lumot to‘g‘riligini isbotlamaydi.

Har bir mavzu manbasining mahalliy protokollarga mosligini va
sahifa oxirgi marta qachon o‘zgarganini alohida klinik tekshirish
kerak. O‘zbekistondagi tartiblar NHS britan protokolidan farq qilishi mumkin.

## Sinovlar va ishga tushirish chegarasi

`tests/medical-editorial-v118.test.mjs`:
50 ta qator, asl manba, javob va SHA-256 xesh bog‘liqligi,
tasdiqlanmagan default holat, CSV ustunlari va ustidan
yozishdan himoyani tekshiradi. Sinovda haqiqiy bemor yozuvi yo‘q.

**Mavjud bot va sayt o‘zgarmagan.** Pullik AI API, hosting, Neon,
SMS, domen, monitoring, cron yoki boshqa qo‘shimcha xizmat yo‘q.
$0 shart ustuvor; bepul kvota tugasa avtomatik pullik rejaga
o‘tilmaydi.

Keyingi texnik ish: turli lahja, ko‘p tilli aralashmalar va ikki
muammoli savollar bo‘yicha shifokor belgilagan xavfsizlik sinovi.
**Tibbiy tasdiq: 0/50.**
