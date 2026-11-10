// Export the entire clinical review package locally; never upload patient data.
// No npm install, paid API, external fetch, or automatic signoff.
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {buildEditorialMatrix,exportEditorialMatrixCSV} from "./lib/medical-editorial-matrix.mjs";
import {createMedicalReviewTemplate} from "./lib/clinical-review.mjs";
import {renderClinicalReviewHTML,assertBundleUnapproved} from "./lib/clinical-review-package.mjs";

const target=resolve(process.argv[2]||"healthy-women-clinical-review");
const matrix=buildEditorialMatrix();
const draft=createMedicalReviewTemplate();
assertBundleUnapproved(matrix,draft);
const files={
 "01-50-mavzu-klinik-korik.html":renderClinicalReviewHTML(matrix),
 "02-50-mavzu-tahririy-jadval.csv":exportEditorialMatrixCSV(),
 "03-klinik-tasdiq-shabloni.json":JSON.stringify(draft,null,2)+"\n",
 "README-UZ.txt":`HEALTHY WOMEN — 50 MAVZU UCHUN MUSTAQIL KLINIK TEKSHIRUV
Sana: 2026-11-10. Holat: 0 / 50 shifokor tomonidan tasdiqlangan.

01-50-mavzu-klinik-korik.html
  Brauzerda oching va chop eting. 50 mavzu, javob matni, NHS/ACOG
  manbasi va xavfsizlik tekshiruv mezonlari joylashtirilgan.
  HTML oflayn ishlaydi; havolalarni tekshirish internet talab qiladi.

02-50-mavzu-tahririy-jadval.csv
  Excel yoki boshqa jadval dasturida tahrirlang. Qaysi mavzu
  avval tekshirilishini, manba sahifasining ochilish holatini,
  javob matnini va izohlarni ko'ring. CSV reliz tasdig'i emas.

03-klinik-tasdiq-shabloni.json
  Dastlab hammasi PENDING_CLINICAL_REVIEW. Tibbiy mazmun,
  manbalar va xavfsizlik qoidalarini malakali shifokor haqiqatdan
  tekshirmaguncha APPROVED_BY_CLINICIAN holatiga o'tkazmang.
  reviewer_full_name, reviewer_credentials, reviewed_on va uch
  tekshiruv belgisi har bir mavzu uchun haqiqatga mos bo'lishi shart.

ISH TARTIBI:
  1. Rasmiy manbani birma-bir tekshiring, zarur bo'lsa javobni tuzating.
  2. O'zbekcha til, yosh, homiladorlik, favqulodda yordam,
     O'zbekiston uchun muvofiqlik va shaxsiy ma'lumotlarni baholang.
  3. CSVga izoh yozing, haqiqatda ko'rib chiqilgan mavzular uchun
     JSON shabloniga tasdiqni kiriting.
  4. Koddagi javob yoki triage qoidasi o'zgarsa, eski SHA-256
     tasdiq avtomatik yaroqsiz bo'ladi; yangi shablon tayyorlang.
  5. Repoda: node scripts/check-medical-release.mjs <tasdiqlangan.json>
     buyrug'i yordamida strukturaviy tekshiruvni o'tkazing.
  6. Tekshiruvdan o'tishi klinik guvohnomani tasdiqlamaydi;
     shifokorning kimligi va malakasini alohida tekshirish kerak.

HECH QACHON:
  - bemorlarning haqiqiy yozuvlarini review paketiga kiritmang;
  - shifokor tasdig'ini avtomatik yaratmang yoki o'ylab topmang;
  - manba ochilganini klinik tasdiq deb qabul qilmang;
  - shaxsiy tibbiy ma'lumotni GitHub yoki ommaviy chatga chiqarmang.

Ushbu paket ma'lumotlarni internetga yubormaydi.
`
};
// Validate fully BEFORE creating the output folder. Never overwrite an
// existing set of clinician's notes or approval forms.
mkdirSync(target,{recursive:false});
for(const [name,data] of Object.entries(files)){
 writeFileSync(join(target,name),data,{encoding:"utf8",flag:"wx"});
}
console.log("Clinical review bundle created: "+target);
console.log("50 topics; PENDING_CLINICAL_REVIEW: 50; clinician approvals: 0.");
console.log("No paid or cloud API used; existing reviewer files are never overwritten.");
