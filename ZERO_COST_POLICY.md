# Healthy Women v1.12 — QAT’IY $0 XARAJAT QOIDASI

**Status: dasturiy staging tayyorgarligi; jonli bot, sayt va APK o‘zgartirilmagan.**

## 1. Ishlash chegaralari

- **Faqat Neon Free**: mavjud `healthy-women-staging` loyihasi, PostgreSQL 17, 0.25 CU.
- **Yangi pullik xizmat YO‘Q**: Upstash/Redis, Cron, pullik monitoring, SMS, object storage, AI API, qo‘shimcha kredit, pullik domain yoki server rejasi qo‘shilmaydi.
- **Vercel deploy hozir yo‘q.** Joriy Vercel jamoasining haqiqiy billing rejasi chatda tasdiqlanmaguncha yangi loyiha yoki staging deployment yaratmaymiz.
- Vercel Hobby Free xizmati **shaxsiy/notijorat** loyiha uchun mo‘ljallangan. Kelajakda tijoriy foydalanish bo‘lsa, hosting shartlarini qayta ko‘rib chiqish kerak. Shartlarga zid holatda $0 va tijoriy foydalanishni birga va’da qilib bo‘lmaydi.
- Barcha oldingi v1.8–v1.12 kodlar **draft GitHub PR** ichida; hech biri mavjud Telegram webhook yoki jonli PWA'ni yangilamaydi.
- Har bir bosqichda bepul limit tugasa sinxronlash to‘xtaydi, lekin offline kundalikni o‘qish va lokal shifrlangan backupni tiklash xizmatlari saqlanadi. Foydalanuvchi qaydini yo‘qotish yoki ochiq yuborish evaziga xizmatni davom ettirish mumkin emas.

## 2. Staging API himoyasi

- `SYNC_API_MODE=staging`, `SYNC_ALLOWED_HOSTNAME`, `SYNC_CLIENT_ORIGIN` va `SYNC_STAGING_USER_IDS` qiymatlari bo‘lmasa API **503**.
- **`SYNC_STAGING_USER_IDS` = 1–5 ta oldindan ruxsat etilgan Telegram raqamli ID.** Ushbu test ro‘yxatida bo‘lmagan foydalanuvchi **403**, bazaga birorta so‘rov yuborilmaydi.
- Client Origin ham test muhitiga tegishli bo‘lishi shart. Hozirgi `healthy-women.vercel.app` va `healthy-women-bot.vercel.app` manzillari staging Origin sifatida **taqiqlangan**.
- Telegram Mini App `initData` imzosi serverda tekshiriladi. Hech qachon `initDataUnsafe`, Telegram username yoki HTTP Origin orqali akkauntga kirish mumkin emas.
- **Kunlik global API budjeti: 60 ta so‘rov**; **bir test akkaunti: 12 ta so‘rov**. Bular staging kodida qattiq cheklangan. Chegara oshsa **429 + Retry-After**, bazadagi kundalikka tegilmaydi.
- So‘rov hisoblagichi `hw_private.sync_request_quota` jadvalidagi bitta `global` va har tester uchun **bitta HMAC-psevdonim kalit** bilan saqlanadi. IP, shaxsiy sog‘liq qaydlari, BOT_TOKEN, `initData` va parol saqlanmaydi.
- Atomik SQL `INSERT ... ON CONFLICT DO UPDATE ... WHERE` bilan bir xil soniya ichida ko‘p so‘rov kelganda ham limitni oshirib yubormaydi. Hisoblagich UTC kuni almashganda shu satrning o‘zida yangilanadi; **cron ishlatilmaydi**.
- Global hisoblagich avval sarflanadi: ayrim per-user rad etilgan so‘rovlar ham global kvotadan kamayadi. Bu ataylab konservativ xarajat nazorati.
- Neon/kvota jadvali ishlamasa **503**; limit yengil chetlab o‘tilmaydi.
- **Muhim:** bu himoya autentifikatsiyadan o‘tgan, ruxsat etilgan staging foydalanuvchilari uchun. Begona odamlarning qayta-qayta noto‘g‘ri token yuborishi yoki tarmoqqa DDoS hujumining hammasini ushbu cheklov to‘xtata olmaydi. Production uchun alohida infratuzilma darajasidagi himoya shart.

## 3. Staging SQL o‘zgarishi

`db/migrations/002_staging_request_quota.sql` quyidagilarni yaratadi:
- `hw_private.sync_request_quota` — `scope_key`, `window_day`, `used`, `touched_at`;
- `PUBLIC` uchun barcha bevosita huquqlar bekor qilinadi;
- Vercel’dagi kelajakdagi ulanish uchun alohida `hw_sync_staging_rw` faqat SELECT/INSERT/UPDATE huquqlariga ega bo‘ladi;
- DROP, DELETE, trigger, cron, materialized view yoki pullik kengaytma yo‘q.

Kichik staging jadvali o‘zi 5 tester + 1 global satrdan oshmasligi kerak, agar yangi API faqat oldindan belgilangan testerlar uchun ochilsa. Rejalashtirilgan testlar har qanday takroriy qo‘shilishni rad etishi kerak.

## 4. Sinovlar

- Node.js: `tests/staging-quota.test.mjs` — satr o‘lchami, maskalangan ID, kunlik global va per-user limit, kun almashishi, nojoiz ID va soxta tokenlar, DB nosozligi.
- `tests/sync-http.test.mjs` — test ro‘yxati, production Origin taqiqi, status 429, no-quota failure 503.
- Staging PostgreSQL’da haqiqiy ko‘p so‘rov va SQL huquqlari alohida tekshiriladi.
- Jonli Telegram bot, haqiqiy hayz va simptom qaydlari **ishlatilmaydi**.

## 5. Ishga chiqarishdan oldingi to‘siqlar

1. Rasmiy Vercel jamoasi haqiqatan **Hobby Free** ekanini billing panelida tekshirish. Pro yoki har qanday pullik holatda yangi deployment **taqiqlangan**.
2. Hobby'ning notijorat foydalanish qoidalari va keyingi monetizatsiya rejasi mosligini tekshirish.
3. Test uchun **alohida** Vercel staging hostname va alohida sahifa; prod bot tokeni va webhookiga tegmaslik.
4. Maxfiy `DATABASE_URL`, `BOT_TOKEN` faqat serverda, maxfiy env sifatida; `WEBHOOK_SECRET` o‘zgarmaydi.
5. So‘rovlar soni, Neon compute va storage limitlarini vaqti-vaqti bilan bepul boshqaruv panelidan nazorat qilish; pullik upgrade qilmaslik.
6. Qurilmalar o‘rtasida opt-in, tiklash va o‘chirish UX, xavfsizlik va tibbiy maxfiylik auditi tugamaguncha haqiqiy foydalanuvchilarga yoqmaslik.

**Natija:** $0 bo‘yicha kod va ishlash chegaralari tayyor. Internet servislarining kelajakdagi narx/limit o‘zgarishlarini dasturiy kod mutlaq kafolatlay olmaydi: faqat bepul tarifda qolish va limit tugaganda xizmatni to‘xtatish orqali qo‘shimcha xarajatdan qochamiz.

Manbalar:
- https://neon.com/pricing
- https://neon.com/docs/introduction/plans
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits/fair-use-guidelines

## 2026-11-10: Neon Free bazasida haqiqiy staging tekshiruvi

- Yangi loyiha, yangi compute, pullik dastur yoki Vercel deployment yaratilmagan. **Oldindan mavjud** `healthy-women-staging` Free loyihasidan foydalanildi.
- Mavjud `healthy_women_staging` bazasiga `hw_private.sync_request_quota` qo‘shildi; staging rolga faqat SELECT/INSERT/UPDATE berildi, DELETE olib tashlandi.
- Haqiqiy PostgreSQL’da bir xil **sun’iy, HMAC ko‘rinishidagi** kalitga bir vaqtda 3 ta `INSERT ... ON CONFLICT` sinov so‘rovi yuborildi, limit 2:
  - 1-so‘rov: qabul qilindi;
  - 2-so‘rov: qabul qilindi;
  - 3-so‘rov: rad etildi;
  - yakuniy `used=2`.
- Sinov bazasida shu bitta sun’iy quota satri saqlanib qolgan. Unga hech qanday haqiqiy Telegram ID, IP, tibbiy qayd yoki kalit yozilmagan.
- Ikkita deployment yaratilmadi, jonli botga yangi `DATABASE_URL` ulanmagan.
- GitHub CI o‘tgan bo‘lsa ham **hosting darajasidagi billing rejasi aniq ko‘rinmadi**. Vercel billing xizmatidan xarajat ma'lumotini olish so‘rovi natija bermadi; uni $0 xarajatning qat’iy isboti deb qabul qilmang.
- Bazadagi simulyatsiyalangan parallel sinov haqiqiy yuqori yuklama yoki DDoS sinovi emas; limitlar faqat avtorizatsiyalangan staging so‘rovlari uchun.
