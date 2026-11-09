# Healthy Women — Maxfiylik (sinov versiyasi)

**Bu MVP prototip, ommaviy tibbiy xizmat emas.** Haqiqiy sog‘liq ma’lumotlarini sinov ilovasiga kiritmang.

- Saytda qaydlar hozir qurilmaning **shifrlanmagan** brauzer localStorage xotirasida saqlanadi; umumiy qurilmada boshqa foydalanuvchi ko‘rishi mumkin.
- Telegram bot manbali qisqa bilimlarni qaytaradi; bot serveri hayz tarixi yoki foydalanuvchi savollari jurnalini saqlamaydi. Telegram chatiga yuborilgan matnlar Telegram tizimi orqali o‘tadi.
- Cloud sync hamda real hayz sanalariga asoslangan avtomatik bot eslatmalari **yoqilmagan**.
- Sayt sozlamalari orqali mahalliy sinov ma’lumotlarini o‘chirish mumkin. Telegram xabarlarini Telegram ilovasi orqali o‘chiring.
- Bu xizmat tashxis, homiladorlik testi yoki kontratsepsiya o‘rnini bosmaydi.
- Sinov ilovasida tashqi shrift xizmatlari ulanishi mumkin.

## Ommaviy ishga tushirishdan oldin
Mustaqil xavfsizlik va tibbiy kontent tekshiruvi, shifrlash, xavfsiz autentifikatsiya, foydalanuvchi roziligi, ma’lumotni eksport/o‘chirish va tegishli qonunchilik talablarini yakunlash kerak.

## Android mahalliy eslatmalari (v0.7)
Android APK foydalanuvchi tanlagan vaqtda umumiy (shaxsiy salomatlik sanalarisiz) eslatmani qurilmaning o‘zida rejalashtirishi mumkin. Eslatma faqat foydalanuvchi yoqsa va tizim ruxsat bersa ishlaydi. Ma’lumotlar serverga yuborilmaydi. Oddiy brauzer veb-sayti push/bildirishnoma jo‘natmaydi. Qurilmadagi ma’lumotlarni o‘chirganda eslatma bekor qilinadi; bekor qilish muvaffaqiyatsiz bo‘lsa, foydalanuvchiga ogohlantirish ko‘rsatiladi.

## Mahalliy shifrlash (v1.0)
Mahalliy qaydlarni parol orqali AES-256-GCM bilan shifrlash **foydalanuvchi ixtiyoriga ko‘ra yoqiladi**. Eski qaydlar shifrlangan nusxa tekshirilgandan keyingina o‘chiriladi, lekin oldingi fayllar yoki telefonning zaxira nusxalari tozalanmaydi. Parol unutilsa, serverda tiklash yo‘q. Shifrlangan xotira yoqilganda bulut sinxronlash o‘chiriladi. Ma’lumotlarni eksport qilish (CSV va matn) shifrlanmagan fayl yaratadi. Xavfsizlik auditi hali tugallanmagan.
