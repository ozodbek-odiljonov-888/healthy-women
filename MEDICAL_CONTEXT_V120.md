# Healthy Women v1.20 — kim haqida savol berilganini ehtiyotkorlik bilan ajratish

**Holat: DRAFT. Jonli bot, Mini App, PWA va APK o‘zgarmagan. Qo‘shimcha xarajat: $0.**

## Vazifa

Foydalanuvchi `Opamda hayz og‘rig‘i bor, nima qilsin?`,
`Onam homilador, qon ketmoqda` yoki `Men va opamning alomatlari
farq qiladi` kabi savollarni yozganda, oddiy 50-mavzuli FAQ
yordamchisi alomatlar kimga tegishli ekanini o‘ylab topmasligi kerak.

v1.20 yangi tibbiy kasallik tashxislamaydi. U faqat **cheklangan,
qo‘lda yozilgan o‘zbekcha belgilardan** foydalanadi. U yerda
`men`, `menda`, `opam`, `onam`, `singlim`, `dugonam`,
`qizim` kabi so‘zlar orqali 4 ta ehtiyotkor kontekst tanlanadi:

- `self`: foydalanuvchi o‘zi haqidagi savol;
- `other`: boshqa kishi haqida;
- `mixed`: foydalanuvchi va boshqa kishi / kimga
  tegishlilik noaniq;
- `unspecified`: aniq subyekt ko‘rsatilmagan.

Bu barcha shevalarni, olmoshlarni, kinoya va murakkab
shaxs referensiyasini to‘g‘ri tushunishi kafolatlanmaydi.

## Qaror tartibi

1. Avval mavjud **shoshilinch va tez yordam xavf belgilari**
   tekshiriladi. Xabar bir nechta odamni tilga olsa ham bu
   tibbiy ogohlantirish to‘xtatilmaydi.
2. Xavf bor bo‘lsa, `safety` javobiga shaxs noaniqligi
   haqida izoh qo‘shiladi. **Qaysi odamda aniq qaysi
   belgi borligi taxmin qilinmaydi.**
3. Xavf aniqlanmagan va bir nechta odamning **shaxsiy
   alomatlari** aralashgan bo‘lsa, `clarify`:
   savollarni alohida va shaxsiy ma’lumotlarsiz yozish.
4. Boshqa odamning aynan holati haqida individual tibbiy
   maslahat so‘ralsa, tashxis taxmini o‘rniga
   umumiy savol so‘raladi.
5. `Onamga menopauza nima ekanini tushuntirib bering`
   kabi umumiy, alomat haqida bo‘lmagan savolda
   manbali ta’limiy javobga ruxsat bor.
6. Xavf va noaniqlik bo‘lmasa, avvalgi 50 mavzu va 500
   test savollari uchun o‘sha manbali javob qaytariladi.

**Muhim:** qoida hech qanday xavf topilmagani bemor
xavfsiz ekanini isbotlamaydi. Tibbiy shubha yoki ahvol
yomonlashsa, tibbiy ko‘rik talab etiladi.

## Telegram va sayt API izchilligi

`bot-vercel/worker/index.js` dagi `/api/knowledge`
endi Telegramning `/ask` va oddiy xabarlari bilan
**bir xil `answerMedicalQuestion` xavfsizlik qaroridan**
foydalanadi. API `articles`ni faqat haqiqiy
`kind="answer"` bo‘lsa qaytaradi; xavfda `warning`,
aniqlashtirishda `clarification`, noma’lum savolda
`message` qaytaradi.

Bu HTTP API hali jonli botga chiqarilmagan. Uning `GET?q=`
usuli texnik jihatdan savolni URL qismiga joylashtiradi:
web-server/CDN kirish jurnallari bunday URLni qayd
etishi mumkin. **Maxfiy bemor ma’lumotlarini URLga yoki
Telegram chatiga yubormang.** Haqiqiy tibbiy tarixni
yuborish uchun maxfiylikka mos alohida yechim kerak.

## Testlar

- `tests/medical-context-v120.test.mjs`: 10 ta yangi guruh,
  ayniqsa uchinchi shaxs, ikki shaxs, kirill-lotin, bir
  necha jumla, xavfning ustuvorligi va 500 ta FAQ regressiyasi.
- `tests/medical-context-http-v120.test.mjs`: 5 ta yangi
  guruh, Telegram webhook + API izchil ishlashi,
  shoshilinch ogohlantirish va noma’lum savollar.
- `scripts/lib/clinical-review.mjs`: yangi
  `medical-context-v120.js` hamda `index.js`
  klinik xavfsizlik kodi xeshiga qo‘shiladi.
- Yangi testlarda faqat **sun’iy, shaxsiy ma’lumot bo‘lmagan**
  o‘zbekcha savollar ishlatiladi.

## Klinik va iqtisodiy chegaralar

- 50 ta tibbiy javobning **0 tasi** klinik shifokor
  tomonidan mustaqil tasdiqlangan. Sinovdan o‘tishi
  shifokor bahosi emas.
- Bu neyron tarmoq emas va barcha alomatlarni
  tushunmaydi; dori dozasini, individual tashxis
  yoki operatsiya tavsiyasini bermaydi.
- Hech qanday yangi pullik AI API, model, GPU, Redis,
  xizmat, domen, Neondagi loyiha yoki Vercel deployment
  yaratilmadi. Yangi xabar jurnali yoki tibbiy
  ma’lumotlar bazasi ham yo‘q.
- **$0 qoida** ustuvor: bepul hosting limitlari
  tugaganda xizmat vaqtincha ishlamasligi mumkin.
- Klinik tasdiq va bepul hosting shartlari
  tekshirilmaguncha ishlab chiqarish muhitiga
  chiqarish taqiqlanadi.
