# Healthy Women v1.13 — BEPUL tibbiy savol-javob (AI-ga o‘xshash)

**Holat: GitHub sinov tarmog‘i. Jonli Telegram botga hali chiqarilmagan.**

## Nima qilindi?
Telegram botida foydalanuvchi savolni `/ask Hayz og‘rig‘i nima?` tarzida
yoki bevosita `Hayz og‘rig‘i nima?` shaklida yuborishi mumkin.

`bot-vercel/worker/medical-qa.js` savolni o‘zbek lotin yoki kirill
yozuvidan standart shaklga keltiradi, mavzuga aloqador so‘z va iboralar
uchun ball hisoblaydi, **eng mos bitta** mavzuni tanlaydi va uning
tibbiy manbasini ko‘rsatadi. Ochiq manbali 11 ta kichik mavzu mavjud:
hayz sikli, davomiyligi, og‘riq, ko‘p qon ketishi, kechikish,
nomuntazam sikl, homiladorlik testi, ovulyatsiya, PMS, menopauza, endometrioz.

**Bu generativ AI emas.** Til modeliga so‘rov yubormaydi, yangi tibbiy
faktlarni ishlab chiqarmaydi, erkin klinik tashxis yoki retsept yozmaydi.
Savol berish uchun internetdagi uchinchi tomon API’si, pullik obuna,
OpenAI/Gemini kaliti, GPU, vektor baza, embedding, Redis, AI gateway
kerak emas.

## Namunalar

- `/ask Hayz sikli necha kun?`
- `Hayz og‘rig‘i qanday yengillashadi?`
- `Ҳайзим кечикяпти, нима қилишим керак?`
- `Homiladorlik testi qachon qilinadi?`
- `Ovulyatsiya qachon bo‘ladi?`

Tizim ishonchli mavzu topmasa **taxminiy javob bermaydi**, balki
ma’lumot yetarli emasligini bildiradi.

## Tibbiy xavfsizlik

Javoblar umumiy ma’lumot, **tashxis emas**. Avvalgi kelishuvga
muvofiq bot faqat 1:1 Telegram chatida yozishadi; guruh xabarlariga
javob bermaydi. Savollar o‘z serverimizda saqlanmaydi, lekin **Telegram
chatiga yuborilgan yozuvlar Telegram platformasidan o‘tadi**.
Iltimos, bemorning ismi, telefon raqami, pasporti yoki maxfiy klinik
hujjatlarni chatbotga yubormang.

Savolda ko‘p qon ketishi va hushdan ketish/nafas qisishi, homiladorlik
ehtimoli bilan qorin og‘rig‘i yoki qon ketishi, juda kuchli chanoq
og‘rig‘i kabi xavf belgilar bo‘lsa, **oddiy FAQ javobi o‘rniga
shoshilinch yoki tez tibbiy ko‘rik tavsiyasi** ko‘rsatiladi. Biroq
bunday oddiy qoidalar alomatlarni 100% aniqlay olmaydi. Bemorlar
uchun shoshilinch aloqa kanalining o‘rnini bosmaydi.

Tibbiy manbalar:
- ACOG, menstruatsiya va qon ketish haqida:
  https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods
  https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding
- NHS, hayz va sikl:
  https://www.nhs.uk/conditions/periods/
  https://www.nhs.uk/conditions/heavy-periods/
  https://www.nhs.uk/symptoms/period-pain/
  https://www.nhs.uk/symptoms/missed-or-late-periods/
- NHS, homiladorlik testi va ogohlantirishlar:
  https://www.nhs.uk/pregnancy/trying-for-a-baby/doing-a-pregnancy-test/
  https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/
  https://www.nhs.uk/symptoms/pelvic-pain/
- NHS, ovulyatsiya, PMS va ginekologik mavzular:
  https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/
  https://www.nhs.uk/conditions/pre-menstrual-syndrome/
  https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/
  https://www.nhs.uk/conditions/endometriosis/

**Tibbiy matn va xavfga yo‘naltirish qoidalari relizdan oldin
malakali klinik mutaxassis tomonidan ko‘rib chiqilishi zarur.**

## Maxfiylik va $0 qoidasi

- `BOT_TOKEN` va `WEBHOOK_SECRET` faqat hozirgi botda qoladi.
- Yangi pullik servis, model, API, baza, server, cron yoki xizmat yo‘q.
- Har bir savol uchun ma’lumotlar Neon’ga uzatilmaydi, tibbiy suhbat
  tarixi va profil tuzilmaydi.
- Savol-javob mavjud bot kodi ichida lokal qoidalar yordamida ishlaydi.
- Vercel Hobby va Neon Free cheklovlari saqlanadi. **Bepul limiti
  tugasa xizmat vaqtincha to‘xtashi mumkin**, pullik xizmatga avtomatik
  o‘tilmaydi.
- Pullik/tijoriy foydalanishga o‘tish Vercel Hobby shartlariga
  zid kelishi mumkin; bu bosqich faqat shaxsiy, notijoriy prototip.

## Test va reliz talablari

- `tests/medical-qa.test.mjs`: 11 ta mavzu, lotin/kirill, xavfli
  holatlar, mavzudan tashqari savollar va tibbiy ma’lumotni o‘ylab
  topmaslik.
- `tests/medical-bot-flow.test.mjs`: Telegram webhook orqali
  manbali javob, shoshilinch holat, guruhni bloklash, tokenni tekshirish.
- GitHub Actions muvaffaqiyatli tugamaguncha va klinik xavfsizlik
  ko‘rib chiqilmaguncha draft PR’ni jonli botga deploy qilmaymiz.
- Bitta moderator tomonidan savollarning real namunalari **shaxsiy
  ma’lumotlarsiz** sinab ko‘riladi.

Yangi savollar soni ko‘payganida xavfsiz yo‘l: manbasi tasdiqlangan
FAQ bazasiga yangi mavzu qo‘shish; avtomatik ravishda noma’lum dori
dozasi va tashxisni generatsiya qilmaslik.
