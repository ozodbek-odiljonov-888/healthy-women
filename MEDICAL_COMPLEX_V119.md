# Healthy Women v1.19 — murakkab tibbiy savollar va $0 xavfsizlik sinovi

**Holat: GitHub draft. Jonli `@healthy_womens_bot` va PWA o‘zgarmadi.**
Pullik AI API, yangi server, Vercel deployment, Neon bazasi yoki obuna yo‘q.

## 1. Yangi ishlash qoidasi

50 mavzuli, 500 sun’iy savolli bepul qoidaviy yordamchi ikki **nomi
aniq ko‘rsatilgan mustaqil kasallik yoki yo‘nalish** bo‘yicha
bir savolga javobni tayyor emasligini aniqlasa, yagona tasodifiy
maqolani tanlamaydi. Buning o‘rniga **aniqlashtirish tavsiyasi** chiqaradi.

Masalan:
- `PCOS va mioma farqi nima?` — bitta kasallik haqidagi maqolani
  tasodifiy tanlash o‘rniga savollarni alohida berishni tavsiya etadi.
- `Endometrioz yoki adenomioz?` — bot individual differensial
  tashxis qo‘ymaydi.
- `Qon ketyapti, lekin qon ketmayapti` — qarama-qarshi ifodani
  aniqlashtirishni so‘raydi.
- `Homiladorman, qon ketmoqda va yelka uchim og‘riyapti, PCOS va mioma haqida`
  — **xavfli alomatlar doimo birinchi** tekshiriladi: oddiy
  mavzularni ajratishga berilib ketmaydi.

Bu yondashuv tabiiy tilni to‘liq tushunish degani **emas**:
faqat qo‘lda ko‘rsatilgan iboralar ro‘yxati doirasida ishlaydi.
Har qanday noma’lum klinik savol, alomatlarni inkor qilish yoki
boshqa shaxsning ahvoli noto‘g‘ri talqin qilinishi mumkin.

## 2. Xavfsizlik ustuvorligi

Tizim tartibi:
1. Mavjud v1.13–v1.17 qoidalar orqali qon ketishi, homiladorlik
   asoratlari, hushdan ketish va boshqa yuqori xavf alomatlarini tekshirish.
2. Faqat shoshilinch holat aniqlanmasa, `medical-complex-v119.js`
   bilan ikki aniq mavzu yoki o‘zaro zid alomatlarni aniqlash.
3. Aniq bir mavzu bo‘lsa, odatiy manbali ta’limiy javob.
4. Dori dozalari, tushunarsiz savollar va shaxsiy tashxisga
   bot javobni o‘ylab topmasdan cheklaydi.

“Savolni ajratish” yoki “javob topilmadi” **alomat xavfsiz
ekanining dalili emas**. Shoshilinch holatda chatbotga tayanmang.

## 3. Avtomatik tekshiruvlar

`tests/medical-complex-v119.test.mjs` sinovlari:
- 13 ta aniq ikki mavzuli savol;
- lotin/kirill aralashmasi;
- faol va inkor qilingan qon ketishi yoki nafas qisishi;
- shu savolda real xavf belgisi bo‘lsa ogohlantirish ustuvorligi;
- shoshilinch kontratsepsiya kabi bitta mavzuli savollarda
  noto‘g‘ri ikkita mavzuni sanamaslik;
- mavjud **500 sun’iy FAQ savolining** hammasi buzilmaganligini tekshirish;
- noma’lum dori/doza va mavzudan tashqari savollarni cheklash;
- savolning uzunligi chegarasi va tashqi AI/API, log, maxfiy baza yo‘qligi.

**Bu faqat sintetik test.** Klinik sezgirlik yoki differensial tashxis
to‘g‘riligini isbotlamaydi.

## 4. Klinik tasdiq va manbalar

`scripts/lib/clinical-review.mjs` xavfsizlik nazorat xeshiga
endi yangi `medical-complex-v119.js` ham qo‘shildi. Agar ushbu
qoida o‘zgarsa, avvalgi xavfsizlik kodiga berilgan klinik
tasdiq mos kelmaydi.

**Tasdiq: 0/50** — tibbiy matnlarni hech bir shifokor
rasman ma’qullagan deb ko‘rsatilmaydi. Jonli reliz uchun
mustaqil klinik, til va maxfiylik tekshiruvi talab etiladi.

Rasmiy ma’lumotnoma manbalari — NHS va ACOG; ularning
Britaniyaga xos skrining jadvali O‘zbekistonda bevosita
qo‘llanmaydi.

## 5. Qat’iy $0 qoida

- OpenAI, Gemini, GPU, embedding, vektor DB yoki pullik tibbiy
  javob API ishlatilmaydi.
- Bot xabar matnini bizning yangi bazada saqlamaydi;
  Telegram chat xabarlari Telegram infratuzilmasidan o‘tadi.
- Yangi Vercel yoki Neon resursi va billing funksiyasi yoqilmaydi.
- Bepul hosting kvotasi tugashi mumkin; pullik tarifga
  avtomatik o‘tish yo‘q.
- Kod jonli botga emas, faqat GitHub **draft PR** tarmog‘iga
  qo‘shilgan. Hozirgi ishchi botga hech qanday xavf tug‘dirmaydi.

**Keyingi qaror:** klinik mutaxassisning 50 javob va
murakkab xavfli savollarga bahosi bo‘lmasa, produksiya
deploymenti amalga oshirilmaydi.
