# Healthy Women — tibbiy savol-javobni tayyorlash, v1.14 (draft)

**BARCHASI BEPUL ($0). Jonli Telegram bot, Mini App va sayt o‘zgarmagan.**
Mavjud ishlayotgan webhook, BOT_TOKEN, WEBHOOK_SECRET, Neon Free staging bazasi va Vercel muhitida o‘zgarish yo‘q.

## 1. Bu "o‘qitish" nimani anglatadi?

Bu oddiy, tushunarli **qoida+bilimlar bazasi**; neyron tarmoqqa
model parametrlarini o‘rgatish yoki ChatGPT darajasidagi generativ AI
**emas**. Savol lotin/kirill yozuvidan standart ko‘rinishga o‘tkaziladi,
ehtimoliy mavzu baholanadi, mos tibbiy manba va oldindan tekshirilgan
qisqa javob tanlanadi. Xavfli alomatlar **har doim birinchi** tekshiriladi.
Noma’lum va dori dozasi so‘ralgan mavzularda tizim taxmin qilmaydi.

Manbalari ko‘rsatilganligi, noaniq joyda javob bermasligi va shaxsiy
tibbiy qaydlarni so‘ramasligi muhim. Google, OpenAI, Gemini yoki boshqa
AI API'ga savol jo‘natilmaydi. Hech qanday yangi pullik
hosting/ma'lumotlar bazasi kerak emas.

## 2. O‘quv to‘plami

| Toifa | Soni | Vazifasi |
|---|---:|---|
| Tekshiriladigan tibbiy mavzular | 20 | NHS/ACOG manbali umumiy tushuntirish |
| Mavzuga oid savol variantlari | 120 | Har mavzuga 6 tadan tabiiy o‘zbekcha savol |
| Xavfli alomatlar savollari | 14 | Oddiy FAQ o‘rniga yordamga yo‘naltirish |
| Javobi cheklanishi kerak savollar | 12 | Dori dozasi, tashxis, mavzudan tashqari so‘rov |
| **O‘quv/sinov materiallari** | **146** | **Haqiqiy bemor suhbatlari emas** |
| Mustaqil, avval ko‘rsatilmagan savollar | 24 | Iboralar umumlashishini tekshirish |
| Mustaqil xavfli holatlar | 4 | Xavfsizlik qoidalarini qayta tekshirish |
| **Jami sun’iy savol** | **174** | Testlar uchun xayoliy misollar |

### 20 mavzu
1. Hayz sikli
2. Hayz davomiyligi
3. Hayz og‘rig‘i
4. Ko‘p qon ketishi
5. Hayz kechikishi
6. Nomuntazam sikl
7. Homiladorlik testi
8. Ovulyatsiya
9. Hayz oldi sindromi (PMS)
10. Menopauza
11. Endometrioz
12. Birinchi hayz
13. Hayzlar orasida yoki aloqadan keyin qon kelishi
14. Vaginal ajralma
15. Qin qichishishi va vaginit
16. Siydik yo‘li infeksiyasi
17. Polikistoz tuxumdon sindromi (PCOS)
18. Bachadon miomasi
19. Shoshilinch kontratsepsiya
20. Hayz gigiyenasi

## 3. Xavfsizlik qoidalari

- Qoida bemor holatini aniq tashxislamaydi va xavfni 100% aniqlay olmaydi.
- Homiladorlik ehtimoli bilan og‘riq yoki qon ketishi, og‘ir chanoq og‘rig‘i,
  ko‘p qon ketishi bilan hushdan ketish/bosh aylanishi, menopauzadan keyin
  qon kelishi, tampon yoki menstrual kubok bilan tizimli isitma/toshma,
  va og‘ir siydik infeksiyasi belgilarida odatiy javob to‘xtatiladi.
- Shoshilinch holatni asossiz ravishda "muammo yo‘q" deb baholamaydi.
- Dori dozasini, antibiotik retseptini, homiladorlik tashxisini va
  individual tahlil talqinini bermaydi.
- Hamma foydalanuvchilarga bir xil manbali, umumiy ma’lumot beriladi;
  Telegram orqali olingan savollar bizning ilovada jurnal sifatida
  saqlanmaydi, biroq xabarlar Telegram infratuzilmasidan o‘tadi.
- Hech qachon bemorning ismi, pasporti, telefon raqami,
  tashxis hujjatlari yoki shaxsiy hayz tarixini botga yuborishni so‘ramang.

## 4. Tasdiqlangan dastlabki manbalar

- NHS: https://www.nhs.uk/conditions/periods/
- ACOG: https://www.acog.org/womens-health/faqs/your-first-period
- ACOG: https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding
- NHS: https://www.nhs.uk/symptoms/period-pain/
- NHS: https://www.nhs.uk/symptoms/irregular-periods/
- NHS: https://www.nhs.uk/symptoms/missed-or-late-periods/
- NHS: https://www.nhs.uk/symptoms/vaginal-discharge/
- NHS: https://www.nhs.uk/conditions/vaginitis/
- NHS: https://www.nhs.uk/conditions/urinary-tract-infections-utis/
- NHS: https://www.nhs.uk/conditions/Fibroids/
- NHS: https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/
- NHS: https://www.nhs.uk/contraception/emergency-contraception/
- NHS: https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/
- NHS: https://www.nhs.uk/conditions/toxic-shock-syndrome/

Manbalarni tanlash **yetarli klinik recenziya degani emas**.
Dori qo‘llash, shoshilinchlik mezonlari va har bir matn
malakali klinik mutaxassis tomonidan ko‘rib chiqilishi kerak.

## 5. Davom ettirish uchun 4 bosqichli tartib

1. **Bilimlarni tahrirlash:** har mavzuning klinik matni, rasmiy manbasi,
   amal qilish sanasi, tibbiy xavf va yosh chegarasini belgilash.
2. **Savollar sinovi:** har yangi mavzu uchun avval 6 ta oddiy variant,
   keyin yangi, avval ko‘rsatilmagan 3 ta variant va xavfli holat.
   Natijalarda qaysi savol xato mavzuga tushganini yozish.
3. **Klinik tasdiq:** ginekolog/umumiy amaliyot shifokori javoblarni,
   tez tibbiy ko‘rikka yo‘naltirish va "bilmayman" holatlarini tekshiradi.
4. **Staging → jonli:** faqat GitHub CI, klinik tekshiruv va real
   Telegram qurilmasida sun’iy savollar sinovidan so‘ng,
   hisobning bepul/notijorat hosting shartlariga mosligi tasdiqlansa.

**Reliz darvozasi:** barcha tayanch testlar PASS, klinik xavfsizlik
tekshirilgan, yangi pullik xarajat 0, haqiqiy bemor ma'lumotlari
ishlatilmagan. Aks holda kod draftda qoladi.

## 6. Dastur fayllari

- `bot-vercel/worker/medical-curriculum.js` — manbali yangi
  mavzular, 146 sun’iy o‘quv savoli.
- `bot-vercel/worker/medical-qa.js` — klassifikator,
  shoshilinchlik va ma'lumot chegaralari.
- `tests/medical-curriculum.test.mjs` — o‘quv va xavfsizlik
  korpusi nazorati.
- `tests/medical-holdout.test.mjs` — mustaqil savollar sinovi.
- `bot-vercel/worker/index.js` — botning amaldagi /ask hamda
  oddiy matn oqimi, faqat ushbu draftdagi kodda.

**Eslatma:** testlar barchasi muvaffaqiyatli bo‘lsa ham, u faqat
sinovdagi misollarni to‘g‘ri ishlaganini anglatadi. Haqiqiy
klinika savollariga 100% aniqlikni kafolatlamaydi.
