# Healthy Women v1.26 — kalendar va kundalikning ish jarayoni (DRAFT)

**Holat:** alohida sinov tarmog‘i; jonli sayt, Telegram webhook yoki real foydalanuvchi ma’lumotlari o‘zgarmaydi. Bu klinik sertifikatlangan mahsulot emas.

## Yangi imkoniyatlar
1. **Kalendar tafsilotlari:** kalendardagi kunni bosganda endi hayz qaydini kiritish oynasi avtomatik ochilmaydi. Shu kunning alohida tafsilotlari ochiladi.
2. **Tasdiqlangan va taxminiy kunlarni ajratish:** hayz tugash sanasi kiritilmagan bo‘lsa, keyingi kunlar tasdiqlangan qon ketishi sifatida belgilanmaydi.
3. **Kalendar orqali tahrirlash:** hayz boshlanishini belgilash, tugashni to‘ldirish va tarixdagi qaydni tahrirlash mumkin.
4. **Kundalikka tezkor o‘tish:** tanlangan sana kundalik shakliga o‘tadi; mavjud oddiy kundalik yozuvi bo‘lsa, tahrirlash rejimi ochiladi.
5. **Kunlik alomatlar:** shu kunning og‘riq, qon miqdori, kayfiyat va eslatmalari bir joyda ko‘rinadi; kiritilgan matn HTML sifatida bajarilmaydi.
6. **Qulaylik:** ekran o‘lchamiga mos panel, ko‘rinadigan klaviatura fokusi va tanlangan sanaga mos ARIA atributlari.
7. **Offline rejim:** yangi calendar-day.mjs moduli v26 PWA keshiga kiritildi.

## Qanday tekshiriladi
1. Faqat **xayoliy sinov ma’lumotlari** bilan saytdagi PWA-ni HTTPS yoki localhost orqali oching.
2. Kalendarda bugungi/o‘tgan sanani bosing: tafsilotlar ochilishi, kiritish oynasi esa ochilmasligi kerak.
3. «Hayz boshlanishini belgilash» tugmasini bosing, sanani tasdiqlab saqlang; tugash kuni bo‘sh bo‘lsa ertangi kun qayd qilingan deb belgilanmasligi kerak.
4. «Hayz qaydini tahrirlash» orqali tugash sanasini to‘ldiring; faqat shu oraliq tasdiqlanishi kerak.
5. «Kundalikni ochish» orqali tanlangan sanani tekshiring, qayd kiriting va kalendarga qaytib kun tafsilotlarini ko‘ring.
6. Kelajak sanasini tanlang: alomat/hayz kiritish tugmalari ko‘rsatilmasligi kerak.
7. 390 px telefon va 1280 px kompyuter ekranlarida funksiyalarni qayta tekshiring.

## Tekshiruv
- npm test: barcha Node.js regressiya, sana, HTML xavfsizligi va offline cache testlari.
- node tests/e2e-calendar-v126.mjs: Playwright o‘rnatilgan muhitda haqiqiy bosish/saqlash/tahrirlash marshruti.
- GitHub Actions muvaffaqiyatli bo‘lsa PWA, v1.26 source, Android debug APK va skrinshotlarni artefaktlar sifatida beradi.
- node scripts/release-preflight.mjs --strict: mustaqil tekshiruvlar yakunlanmagani uchun hozir BLOCKED holatida qolishi shart.

## Xavfsizlik va tibbiy chegaralar
- Sog‘liq ma’lumotlari serverga yuborilmaydi; cloud sync o‘chirilgan. Yangi foydalanuvchi birinchi qayddan oldin mahalliy shifrlashni yoqishi kerak.
- Sikl sanalari homiladorlik, ovulyatsiya, kontrasepsiya yoki tashxis uchun emas.
- 50 ta tibbiy mavzu bo‘yicha mustaqil klinik ko‘rik hali 0/50.
- Androidning haqiqiy qurilmada sinovi, xabarnomalar, migratsiya, backup/restore hamda mustaqil maxfiylik auditi hali kerak.
- Mavjud jonli sayt, bot, webhook, Vercel/Neon konfiguratsiyasi va pullik xizmatlarga tegilmaydi.

**Reliz cheklovi:** CI sinovlari va mustaqil klinik/maxfiylik tekshiruvlari tugamaguncha productionga avtomatik chiqarmang.
