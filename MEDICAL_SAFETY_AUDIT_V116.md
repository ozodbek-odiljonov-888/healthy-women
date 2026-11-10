# Healthy Women v1.16 — klinik xavfsizlik auditi ($0)

**Holat: GitHub draft. JONLI BOTGA CHIQARILMAGAN.** 50 ta mavzu, 500 ta
sun’iy savol va oldingi shifrlash/Neon staging kodi saqlanadi.
Yangi pullik AI API, bazalar yoki hosting yaratilmagan.

## 1. Lotin, kirill, imlo va inkor

`medical-language-v116.js` tarkibida kichik, qo‘lda tekshiriladigan
lug‘at bor. Masalan: `xayz → hayz`, `xomilador → homilador`,
`ovulatsiya → ovulyatsiya`, `proklatka → prokladka`,
`kechikvotti → kechikyapti`.

Bu **fuzzy AI** emas: barcha o‘xshash so‘zlarni avtomatik
bir xil ma’noda qabul qilmaydi. Tibbiyotda xato harf
dori nomini yoki tashxisni o‘zgartirishi mumkin.

`qon ketmayapti`, `hushdan ketmadim` kabi aniq inkor
birikmalarini xavf belgisi sifatida avtomatik qabul qilmaslik
uchun ehtiyotkor qoidalar qo‘shildi. Biroq aralash
gapdagi haqiqiy xavf: `Qon ketmayapti, lekin hushim ketayapti`
shoshilinch yordamga yo‘naltirilishi kerak. Inkor
shakllarining hammasi qamrab olingan deb hisoblamang.

## 2. Klinika mutaxassisi tasdig‘i

**Hozir 50 mavzudan 0 tasi klinik tarzda tasdiqlangan.**
Avtomatik sinovlar tibbiy mualliflik tasdig‘i emas.

50 mavzuning har biri uchun alohida ko‘rib chiqish shakli:
- mavzu kaliti, javob va manbaga bog‘langan SHA-256 fingerprint;
- haqiqiy shifokorning ismi va klinik malakasi (foydalanuvchi
  tomonidan kiritiladi, dastur mustaqil tekshira olmaydi);
- tekshiruv sanasi, manba tekshirilganligi, o‘zbekcha matn
  hamda shoshilinch holatlar ko‘rib chiqilganligi;
- `PENDING_CLINICAL_REVIEW` holati (boshlang‘ich, tasdiqlanmagan).

**Klinik fikrni faqat vakolatli haqiqiy shifokor bera oladi.**
JSON faylni texnik jihatdan “approved”ga almashtirishning o‘zi
shu shaxsning haqiqiyligini isbotlamaydi. Reliz egasi
mutaxassis vakolatini alohida, mustaqil tekshirishi kerak.

### Offline buyruqlar

Loyihaning bosh katalogidan:

```bash
node scripts/prepare-medical-clinical-review.mjs medical-clinical-review-draft.json
```

Bu 50 ta **PENDING** qatorli shakl yaratadi. Shakl
to‘ldirilgandan va shifokor hamda manbalar haqiqatan
tekshirilgandan so‘ng reliz oldidan:

```bash
node scripts/check-medical-release.mjs medical-clinical-review.json
```

Tekshiruv barcha 50 mavzu uchun to‘liq va o‘zgarmagan
manba/javobga bog‘langan tasdiq bo‘lmasa **exit 1** qaytaradi.

Klinik matn yoki manba URL’i keyinchalik o‘zgartirilsa,
hash nomuvofiq bo‘lib, qayta ko‘rib chiqish talab qilinadi.
`medical-clinical-release.yml` GitHub Actions ham
`main` ga yuborilgan tibbiy kodli PR uchun ushbu
shaklni tekshiradi. Status-check’ni GitHub branch
protection qoidalarida majburiy qilish alohida ma’muriy
sozlashi talab qiladi; bu bosqichda filial himoyasi o‘zgarmadi.

## 3. Sinovlar

- `tests/medical-language-v116.test.mjs`: lotin/kirill,
  oddiy xatolar, inkor, faollashgan ogohlantirish;
- `tests/clinical-review-gate-v116.test.mjs`: 50 mavzu
  bo‘yicha notekshirilgan matn, eskirgan manba, yo‘q
  imzo, soxta sana va tayinlanmagan shifokor maydonlari;
- `tests/medical-clinical-cli-v116.test.mjs`: tayyor
  bo‘lmagan yoki umuman mavjud bo‘lmagan hujjatda
  tekshiruvning avtomatik to‘xtashini tekshiradi.

## 4. Qat’iy xavfsizlik cheklovlari

- Tibbiy javob **tashxis, retsept yoki dori dozasi emas**.
- Klinik sinovlar faqat xayoliy savollar bilan ishlangan.
  Real bemor matnlari, tarix, tahlil yoki ID qo‘shilmaydi.
- Xavfli holatlarni aniqlovchi qoida shoshilinch vaziyatlarni
  **100% ajrata olmaydi**, ayniqsa kinoya, negatsiya,
  so‘zlashuv shevalari va aralash alomatlarda.
- NHS’dagi Buyuk Britaniya skrining tartiblari
  O‘zbekistonga avtomatik ko‘chirib qo‘yilmaydi.
- Sifatni tekshirish uchun keyingi zarur ish —
  haqiqiy klinik mutaxassisning 50 ta javob
  va xavfli holatlarni baholashi, *so‘ng* sinov
  foydalanuvchilarda maxfiy bo‘lmagan matnlar bilan test.
- Bot hali `@healthy_womens_bot`ga chiqarilmagan.
- **$0 xarajat** saqlanadi: pullik AI, API, server,
  baza, domen, SMS yoki kreditga o‘tish yo‘q.
  Free hosting limitlari tugasa xizmat vaqtincha
  ishlamasligi mumkin.

NHS manbalaridan muhimlar:
- https://www.nhs.uk/conditions/pre-eclampsia/
- https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/
- https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/
- https://www.nhs.uk/mental-health/conditions/postnatal-depression/
