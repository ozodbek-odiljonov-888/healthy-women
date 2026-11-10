# Healthy Women v1.24 — relizga tayyorlik bo‘yicha qat’iy hisobot

**Holat: DRAFT. Jonli Vercel sayt/bot, Telegram webhook, Android va Neon staging o‘zgarmagan.**

## Nima uchun kerak?

GitHub Actions’da test muvaffaqiyatli o‘tgani loyihani haqiqiy
foydalanuvchilar uchun klinik xavfsiz deb ko‘rsatmasligi kerak.
Bu nazorat mavjud kod va ekspertiza talablarini bir varaqda ko‘rsatadi.

## Bepul va internetsiz tekshirish

Loyiha papkasida:

```bash
node scripts/release-preflight.mjs
node scripts/release-preflight.mjs --json
node scripts/release-preflight.mjs --strict
```

- Birinchi buyruq qisqa holatni chop etadi.
- `--json` versiyasi mashinada o‘qiladigan hisobot.
- `--strict` relizga insoniy tasdiqlar yetishmasa **exit code 2**
  bilan tugaydi. Ushbu tekshiruv NO-DEPLOY, NO-PAID-API.
- Shifokorning to‘ldirilgan faylini mahalliy tekshirish:
  `--signoff /maxfiy/joy/medical-clinical-review.json`.
  Reviewerning F.I.Sh., litsenziyasi yoki maxfiy izohlar chatga,
  GitHub’ga yoki konsol hisobotiga ko‘chirib chiqarilmaydi.

## Hisobotdagi nazoratlar

| Band | Avtomatik tekshiriladi | Release uchun qanday natija kerak |
|---|---|---|
| 50 manbaning HTTPS manzili va ruxsat etilgan domen | Ha | 50/50 domen mos |
| 50 klinik xulosa uchun JSON shakl va kontent/safety xeshi | Ha | 50/50 tuzilish bo‘yicha mos |
| Shifokorning haqiqiy shaxsi va malakasi | Yo‘q | **Mustaqil real tasdiq** |
| Ikki alohida jismoniy qurilmada qayta tiklash va o‘chirish | Yo‘q | **Amaliy QA dalili** |
| Maxfiylik va axborot xavfsizligi | Yo‘q | **Mustaqil audit** |
| Vercel Hobby / Neon Free va limitlar | Faqat ulangan akkaunt orqali | **Boshqaruv paneli bilan tasdiq** |
| Jonli cloud sync o‘chirilganligi | Statik kod orqali | **PASS**, alohida deploy tekshiruvi ham kerak |
| Jonli relizga chiqarish/ortga qaytarish | Yo‘q | **Foydalanuvchi roziligi, reja va tekshiruv** |

**Muhim:** dasturga o‘ylab topilgan 50/50 shifokor tasdiq
yozilsa ham, bu hisobot `ready_for_public_release=false`
bo‘lib qoladi. Chunki shifokorning kimligi, qurilma va
privacy audit natijasini fayl shaklining o‘zi isbotlamaydi.
Bu texnik nazorat **jonli Vercel deploymentni to‘xtatuvchi
maxsus firewall emas**. Uni deploymentdan oldingi majburiy
inson tekshiruviga qo‘shish lozim.

## v1.23 bilan birga foydalanish

1. PR #18 dagi `Healthy-Women-50-Medical-Review-DRAFT`
   ZIP paketi: 50 tibbiy mavzuning o‘zbekcha manbali ko‘rigi.
2. Malakali mutaxassis barcha javob va xavf belgilarini
   manbalar bilan solishtirib chiqadi.
3. Oflayn reliz hisobotida klinik va jismoniy qurilma
   talablarini alohida bajaradi.
4. Yakuniy tekshiruvdan so‘ng kod ketma-ketlik bilan
   ko‘rib chiqiladi; tasdiqsiz production deployment yo‘q.

## Muhim terminologiya eslatmasi

NHS sahifasida avval **polycystic ovary syndrome (PCOS)**
deb atalgan holat hozir **polyendocrine metabolic ovarian
syndrome (PMOS)** deb berilmoqda. Havola mavjud;
matndagi nom, o‘zbekcha sinonimlar va klinik kontekst
haqiqiy mutaxassis tomonidan ko‘rib chiqilishi kerak.
Faqat havolaning ochilishi tasdiq emas.

## $0 nazorati

- Vercel: mavjud Hobby (bepul), Neon: mavjud Free.
- Neon staging kvotasi: 0.25 CU; 4 faol soat, 1 CPU soat,
  64 MiB yozilgan/uzatilgan/saqlangan ma’lumot.
- Hech qanday pullik AI, hosting, cron, monitoring,
  yangi baza yoki marketing xizmati qo‘shilmaydi.
- Bu skript **server API orqali tarifni so‘ramaydi**:
  u faqat mahalliy kodni tekshiradi; hisob tarifi
  alohida Neon/Vercel akkauntidan tekshirilishi shart.

## Qolgan to‘siqlar

- Hali 0/50 klinik ko‘rik tasdiqlangan.
- Ikki jismoniy qurilmada sinov dalili yo‘q.
- Mustaqil klinik/maxfiylik auditi yakunlanmagan.
- Birorta draft PR avtomatik main’ga birlashtirilmagan.
- Jonli bot va saytga v1.24 chiqarilmagan.

**Shifokor tasdiqlari va manual QA mavjud bo‘lmaguncha
reliz “tayyor” deb e’lon qilinmaydi.**
