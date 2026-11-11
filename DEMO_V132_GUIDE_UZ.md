# Healthy Women — 3–4 kishilik demo (v1.32)

## Ayni paytdagi haqiqiy holat
- Sayt: `https://healthy-women.vercel.app` (production)
- AI endpoint: `https://healthy-women-bot.vercel.app/api/ai`; faqat 10 ta oldindan belgilangan umumiy mavzu, rozilik bilan.
- Android APK: ayni PWA frontendini ishlatadigan Capacitor debug sinov versiyasi; Google Play uchun imzolangan rasmiy reliz emas.
- Telegram: `/start`, `/ask` (manbali offline), `/ai` (umumiy mavzular) va `/privacy`.
- **Barcha foydalanuvchilarning ma’lumotlari avtomatik sinxronlanmaydi.** Kalendar/kundalik shu qurilmada saqlanadi, faqat alohida shifrlangan zaxirani eksport/import qilish mumkin. Telegram chatiga qaydlar yubormang.

## Uch-to‘rt kishining sinovi
1. Har kishi alohida telefon/profil ishlatsin, faqat **xayoliy sikl sanalari va simptomlar** bilan sinang.
2. Saytni ochib, parol o‘rnating va qayd kiriting; kalendar, kundalik, hisobot, zaxira/tiklashni tekshiring.
3. AI yordamchi → savol → offline javob → AI holatini tekshirish → rozilik → AI javob. Umumiy 10 mavzudan birini tanlang.
4. Har bir o‘rnatma uchun tasodifiy 128-bit identifikator yaratiladi, Google’ga yuborilmaydi; bitta Wi-Fi foydalanuvchilarida kuniga 3 tadan, tarmoq bo‘yicha 12/kun va 2/minut limit. Barcha platforma bo‘yicha 30/kun, 300/oy, jami 1000 ta.
5. Telegram botda /ai → umumiy mavzu tugmasini sinang. Faqat Telegram foydalanuvchi tomonidan real sinov bilan tekshiriladi.
6. Eslatmalar/bildirishnomalar brauzerga emas, Android’ning mahalliy funksiyasiga bog‘liq; qurilmada ruxsat berishni tekshiring.

## Muhim
- Barcha yakuniy testlar odamning jismoniy telefonidagi ishlashini, mustaqil klinik review yoki mustaqil xavfsizlik ekspertizasini almashtirmaydi. Tashxis qo‘yish uchun ishlatmang.
- Google Free Tierʼda serverga yuborilgan umumiy taʼlimiy mavzular Google mahsulotlarini yaxshilash uchun ishlatilishi mumkin. Shaxsiy qayd matnlari AIʼga yuborilmaydi.
- AI kaliti haqiqatan Free Tierʼdagi Gemini Project womens loyihasiga tegishli ekanini Vercelʼda keyinroq inson tasdiqlashi kerak; Vercel sensitive secret qiymatini API orqali o‘qib bo‘lmaydi. Agar shubha bo‘lsa AI_MODE=off qiling.
- O‘zgarishlar eski v1.30 production kodiga kirguncha yangi demo APK va manbalardan foydalaning.

## AI kechikishi
Gemini Free Tier javobi baʼzan 10 soniyadan uzoq davom etadi. Bitta sinov soʻrovi serverda 20 soniyadan, brauzerda 26 soniyadan soʻng bekor qilinadi; avtomatik qayta urinish va pullik tarifga oʻtish yoʻq. Gemini javob bermasa kvota rezervi ishlatilgan boʻlishi mumkin; foydalanuvchi offline maʼlumotlardan foydalanadi. Google 429 limitini 503 tarmoq xatosidan ajratish qoʻshildi.
