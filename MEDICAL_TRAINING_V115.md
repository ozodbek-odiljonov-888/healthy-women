# Healthy Women v1.15 — 50 ta mavzu, 500 ta o‘quv savoli

**Holat: sinov/draft. Ishlayotgan Telegram bot va saytga chiqarilmagan. Xarajat: $0.**

## Ushbu bosqichda nima "o‘qitildi"?

Bu haqiqiy sun’iy neyron tarmoqni qayta o‘qitish emas. `medical-training-v115.js`
nomli ko‘rinadigan lug‘at 50 ta manbali mavzu bilan 500 ta **sun’iy**
savol variantini bog‘laydi. Savollar real bemor yoki Telegram yozishmalaridan
olinmagan. Internetdan ma’lumot generatsiya qilmaydi va pullik API ishlatmaydi.

- **50 ta klinik ma’lumot mavzusi**: avvalgi 20 ta + yangi 30 ta.
- **500 ta asosiy savol**: har mavzu bo‘yicha 10 tadan.
- 120 tasi avvalgi qo‘lda yozilgan savollar.
- 380 tasi qoidalarga ko‘ra yasalgan o‘zbekcha savol variantlari (80 tasi
  eski 20 mavzu, 300 tasi yangi 30 mavzu uchun). Bu qismning formulaviy
  ekanini yashirmaslik kerak: faqat ushbu 500 savoldagi moslik
  testidan o‘tish klinik aniqlikni isbotlamaydi.
- **30 ta avval berilmagan (holdout) savol**: har yangi mavzudan bittadan.
- Oldingi v1.14 bosqichining 146 ta savoli va 28 ta mustaqil sinovi ham
  saqlanadi.
- Shoshilinch belgilar bo‘yicha alohida sinovlar: homila harakati kamayishi,
  homiladorlikdagi preeklampsiya belgilari, homila suvi ketishi, homiladorlikda
  ko‘p qon ketishi, o‘ziga yoki bolaga zarar yetkazish xavfi.

## Yangi 30 mavzuning klinik yo‘nalishlari

| Soha | Mavzular |
|---|---|
| Ginekologik kasalliklar | Adenomioz, tuxumdon kistasi, chanoq a’zolari yallig‘lanishi |
| Infeksiyalar | Bakterial vaginoz, kandidoz, xlamidiya, jinsiy yo‘l infeksiyalari |
| Profilaktika | HPV, HPV vaksinasi, bachadon bo‘yni skriningi |
| Ko‘krak bezlari | Tugun, ko‘krak og‘rig‘i, mammografiya |
| Reproduktiv salomatlik | Bepushtlik, foliy kislotasi |
| Homiladorlik | Antenatal ko‘rik, ertalabki ko‘ngil aynishi, ektopik homiladorlik, homila tushishi, preeklampsiya, gestatsion diabet, tug‘ruq belgilari |
| Tug‘ruqdan keyingi davr | Emizish, mastit, tug‘ruqdan keyingi depressiya |
| Chanoq tubi | Kegel/chanoq tubi mushaklari, siydik tutolmaslik, prolaps |
| Boshqa | Temir tanqisligi, kontratsepsiya |

### Manbalar va tekshiruv

Har bir mavzu NHS rasmiy sahifasining URL manzilini o‘z ichiga oladi.
Mavjud 20 mavzuning ayrimlarida ACOG manbalari ham bor. Muhim tekshirilgan
manbalar:

- https://www.nhs.uk/conditions/adenomyosis/
- https://www.nhs.uk/conditions/ovarian-cyst/
- https://www.nhs.uk/conditions/pelvic-inflammatory-disease-pid/
- https://www.nhs.uk/conditions/human-papilloma-virus-hpv/
- https://www.nhs.uk/vaccinations/hpv-vaccine/
- https://www.nhs.uk/tests-and-treatments/cervical-screening/what-is-cervical-screening/
- https://www.nhs.uk/symptoms/breast-lump/
- https://www.nhs.uk/conditions/infertility/
- https://www.nhs.uk/pregnancy/keeping-well/pregnancy-vitamins-and-supplements/
- https://www.nhs.uk/conditions/ectopic-pregnancy/
- https://www.nhs.uk/conditions/pre-eclampsia/
- https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/
- https://www.nhs.uk/mental-health/conditions/postnatal-depression/
- https://www.nhs.uk/conditions/urinary-incontinence/
- https://www.nhs.uk/contraception/methods-of-contraception/

**Muhim:** NHS Britaniya tibbiy tizimining protokollarini tavsiflaydi.
Uning skrining yoshi, murojaat kanallari va davolash huquqiy tartibi
O‘zbekistonda avtomatik amal qilmaydi. Dastlabki javoblarda shu sabab
mahalliy skrining yoshiga oid qat’iy sonlar berilmagan.

## Javob mexanizmi

1. Xavf belgilarini birinchi tekshirish (tibbiy shoshilinchlik).
2. Savol matnini o‘zbek lotin/kirill shakllaridan normallashtirish.
3. To‘liq mos keladigan sun’iy ibora bo‘lsa tekshirilgan mavzuni tanlash.
4. Aks holda iboradagi mavzu belgilari uchun ball hisoblash.
5. Aniqlanmagan savolda javobni o‘ylab topmasdan to‘xtash.
6. Bir umumiy tibbiy tushuntirish + asosiy manba + «tashxis emas»
   ogohlantirishini ko‘rsatish.

Bu mexanizm shifokor emas va klinik tashxis, dori tanlash yoki
individual retsept yozish vazifasini bajarmaydi.

## Maxfiylik va mutlaqo bepul foydalanish

- OpenAI/Gemini API, pullik inferens, tashqi chatbot, vektor ma’lumotlar
  bazasi, GPU, qo‘shimcha server, abonent to‘lovi, pullik monitoring yoki
  uchinchi tomon log servisi qo‘shilmadi.
- Botning bu kod bo‘yicha savol-javoblari bizga tegishli bazada saqlanmaydi;
  ammo foydalanuvchining chatga yuborgan xabarlari Telegram orqali o‘tadi.
- Real bemorlarning shaxsiy ma’lumotlarini o‘quv to‘plamiga qo‘shish
  **taqiqlanadi**. Faqat muallif tuzgan xayoliy savollar ishlatiladi.
- Free hosting limiti tugasa bot vaqtincha cheklanishi mumkin;
  **pullik rejaga avtomatik o‘tmaydi**.
- Vercel Hobby faqat shaxsiy/notijorat maqsadlar uchun ruxsat etiladi.
  Kelajakdagi tijoriy foydalanish bu shart bilan alohida moslashtirilishi kerak.

## Sinovlar va relizga qo‘yiladigan to‘siqlar

- `tests/medical-training-v115.test.mjs`: barcha 500 savolning
  mavzusi, takroriy yozuvlar, 30 mustaqil savol, tibbiy ogohlantirish va
  dori retseptlaridan tiyilish.
- GitHub Actions barcha eski bot, maxfiylik, xavfsizlik va offline testlarni
  ham qayta ishga tushiradi.
- Natijalar qanchalik yaxshi bo‘lmasin, yangi 30 javobning **klinika
  mutaxassisi tomonidan tahrirlanishi va tasdiqlanishi shart**.
- Har qanday ishlab chiqarish deploymenti oldidan alohida stagingda
  Telegram va Android qurilmasi bilan xayoliy savollar sinovi o'tkaziladi.
- Klinika tahriri, shaxsiy ma’lumotlar xavfsizligi yoki hosting
  cheklovlari bajarilmaguncha jonli botga ulash mumkin emas.

## Dastur fayllari

- `bot-vercel/worker/medical-topics-v115-a.js` — yangi 15 mavzu.
- `bot-vercel/worker/medical-topics-v115-b.js` — yangi 15 mavzu.
- `bot-vercel/worker/medical-training-v115.js` — 500 sintetik savol.
- `bot-vercel/worker/medical-qa.js` — javob va xavf mexanizmi.
- `tests/medical-training-v115.test.mjs` — testlar.
- `bot-vercel/worker/index.js` — `/ask` va oddiy matn savollarining mavjud oqimi.

**Hozirgi versiya faqat GitHub draft: hech kimning haqiqiy ma’lumoti
sinovga olinmadi, jonli webhook va Mini App hali yangilanmadi.**
