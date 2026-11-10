# Healthy Women v1.28 — sifat, qulaylik va xavfsizlik tekshiruvlari
**Holat: DRAFT.** Jonli PWA, Telegram webhook, Vercel/Neon, billing va foydalanuvchi ma’lumotlariga tegilmagan.
## Amalda qo‘shildi
- ☰ mobil menyusi endi barcha 7 bo‘limni ochadi; fonni bosib, × yoki Escape bilan yopish mumkin, klaviatura fokusi saqlanadi.
- Offline savoldan keyin shaxsiy matnni serverga yubormay, faqat umumiy mavzuni ixtiyoriy bepul AIga (qo‘lda yoqilgandan keyin) jo‘natish mumkin.
- AI manba URLlari NHS/ACOG/WHO/CDC domenlarigagina ruxsat etadi; XSSga qarshi link xavfsizligi kuchaytirildi.
- PWA’ni qo‘llab-quvvatlaydigan brauzerlarda qo‘lda o‘rnatish tugmasi, boshqalarda Android/iOS yo‘riqnomasi ko‘rsatiladi.
- Offline kesh versiyasi, Sozlamadagi ko‘rinadigan versiya yangilandi.
## Tekshirish
- Node.js 22, `npm test` — 330 avtomatik test.
- GitHub Actions PR uchun maxfiy backup/restore, Android, kalendar, analytics, offline AI va mobil/PWA Chromium sinovlari.
- Android debug APKni faqat sinov qurilmaga o‘rnating. Oldingi runner bilan imzo farq qilishi mumkin.
## Haqiqiy chegaralar
- Gemini tashqi AI **o‘chirilgan**, bepul billing ulanmagan API loyiha + kalit + alohida kvota DB va xavfsizlik tekshiruvidan so‘nggina ishlaydi.
- Telegram bot xizmati kodi mavjud, lekin BotFather token va webhook ulangan emas.
- Avtomatik cloud sync **xavfsizlik sabab o‘chirilgan**. Shifrlangan lokal .hwbak eksport/tiklash mavjud.
- 50 tibbiy mavzu **0/50** mustaqil klinik ko‘rik; maxfiylik auditi va ikki jismoniy qurilmadagi sinov o‘tmagan.
- Zero-cost qoida: yangi pullik xizmat, server, DB yoki tarif faollashtirilmagan.

- AI asinxron javoblari faqat o‘zining kutish xabarini yangilaydi: keyingi offline javobga tegmaydi; kundalik o‘chirilganda yoki qulflanganda javob qayta paydo bo‘lmaydi.
