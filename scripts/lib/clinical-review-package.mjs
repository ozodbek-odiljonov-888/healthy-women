// Healthy Women — printable clinical-review bundle (entirely OFFLINE).
// A reviewer must make their own independent clinical decisions. No signoff
// is inferred or generated from source links or synthetic test results.
import {buildEditorialMatrix,EDITORIAL_CRITERIA} from "./medical-editorial-matrix.mjs";
import {createMedicalReviewTemplate} from "./clinical-review.mjs";

const PAGE_TITLE="Healthy Women — 50 tibbiy mavzu klinik ko‘rigi";
const CRITERIA_UZ=[
 "Rasmiy manbadagi ma’lumot javobdagi har bir da’voni qo‘llaydimi?",
 "O‘zbekcha matn, terminlar va tarjima tushunarlimi?",
 "Yosh, homiladorlik va emizishdagi kontekst to‘g‘rimi?",
 "Shoshilinch holat va noaniqlik bo‘yicha ogohlantirishlar yetarlimi?",
 "O‘zbekiston uchun qo‘llanilishi va mahalliy yo‘riqnomalar tekshirildimi?",
 "Individual tashxis, dori dozasi yoki retsept bermaslik qoidasi bajarildimi?",
 "Maxfiylik, kirish imkoniyati va foydalanuvchi xavfsizligi tekshirildimi?"
];
const PRIORITIES={
 REVIEW_FIRST:"Birinchi navbatdagi tahririy ko‘rik",
 REVIEW_SECOND:"Ikkinchi navbatdagi tahririy ko‘rik",
 REVIEW_STANDARD:"Oddiy tahririy ko‘rik"
};
function escapeHTML(value){
 return String(value??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 })[ch]);
}
function sourceLink(value){
 const url=new URL(value);
 const host=url.hostname.toLowerCase();
 if(url.protocol!=="https:"||url.username||url.password
    ||!["www.nhs.uk","nhs.uk","www.acog.org","acog.org"].includes(host))
  throw Error("Non-approved medical source URL in audit package");
 return escapeHTML(url.toString());
}
const REVIEW_CSS=`
  :root{font-family:Arial,system-ui,sans-serif;color:#171717;background:#f7f7f7}
  body{max-width:980px;margin:auto;padding:25px}
  h1{font-size:26px}h2{font-size:19px;margin-bottom:9px}
  .intro,.topic{background:white;border:1px solid #bbb;padding:20px;margin:16px 0}
  .warning{border-left:5px solid #444;padding:10px 13px;background:#f0f0f0}
  .meta{font-size:12px;color:#505050;line-height:1.6}
  .prepared{white-space:pre-wrap;line-height:1.65;font-size:14px}
  .checks{padding-left:20px;line-height:1.7;font-size:13px}
  .empty{display:inline-block;border:1px solid #555;width:11px;height:11px;margin-right:7px}
  .lines{border-bottom:1px dotted #777;height:30px;margin-bottom:8px}
  a{color:#104ba4;overflow-wrap:anywhere}
  @media print{body{padding:0;background:white}.intro,.topic{border:1px solid #aaa;break-inside:avoid}
    .topic{break-inside:avoid-page}a{color:inherit}h1{font-size:22px}}
`;
export function renderClinicalReviewHTML(matrix=buildEditorialMatrix()){
 if(!matrix||!Array.isArray(matrix.rows)||matrix.rows.length!==50)
  throw Error("Exactly 50 independent clinical audit topics are required");
 if(EDITORIAL_CRITERIA.length!==CRITERIA_UZ.length)throw Error("Review rubric drift");
 if(matrix.rows.some(r=>r.clinical_review_status!=="PENDING_CLINICAL_REVIEW"))
  throw Error("No preapproved medical content may enter a review package");
 const keys=new Set(matrix.rows.map(r=>r.topic_key));
 if(keys.size!==50)throw Error("Duplicate clinical audit topic");
 const sections=matrix.rows.map((row,i)=>`
 <section class="topic" id="topic-${i+1}">
  <h2>${i+1}. ${escapeHTML(row.topic_title)}</h2>
  <p class="meta"><strong>Kalit:</strong> ${escapeHTML(row.topic_key)}
   · <strong>Navbat:</strong> ${escapeHTML(PRIORITIES[row.review_priority]||"Noma’lum")}
   · <strong>Manba holati:</strong> ${escapeHTML(row.source_page_status)}
   · <strong>Holat:</strong> TEKSHIRUV KUTILMOQDA</p>
  <p><strong>Tayyorlangan javob (klinik tasdiqlanmagan):</strong></p>
  <p class="prepared">${escapeHTML(row.prepared_education_answer)}</p>
  <p><strong>Rasmiy manba:</strong>
   <a href="${sourceLink(row.source_url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${escapeHTML(row.source_url)}</a></p>
  <p class="meta"><strong>Kontent SHA-256:</strong> ${escapeHTML(row.content_sha256)}
   <br><strong>Xavfsizlik qoidalari SHA-256:</strong> ${escapeHTML(row.safety_rules_sha256)}</p>
  <p><strong>Shifokorning mustaqil tekshiruv mezonlari (qog‘ozda belgilash uchun):</strong></p>
  <ol class="checks">${CRITERIA_UZ.map(label=>`<li><span class="empty" aria-hidden="true"></span>${escapeHTML(label)}</li>`).join("")}</ol>
  <p><strong>Izohlar va zarur tuzatishlar:</strong></p>
  <div class="lines"></div><div class="lines"></div>
  <p class="meta">Shifokor F.I.Sh.: ____________________ Malaka: ____________________ Sana: __________</p>
 </section>`).join("\n");
 return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; connect-src 'none'; img-src 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${PAGE_TITLE}</title><style>${REVIEW_CSS}</style></head><body>
<header class="intro">
<h1>${PAGE_TITLE}</h1>
<p class="warning"><strong>0/50 klinik tasdiq.</strong> Ushbu material faqat
 shifokor tomonidan mustaqil tekshirilishi uchun yaratilgan. Bu nashrga yoki
 bemorga maslahat berishga ruxsat emas. Avtomatik tasdiq mavjud emas.</p>
<p>50 ta mavzu · birinchi navbat: ${matrix.counts.first} · ikkinchi navbat:
 ${matrix.counts.second} · oddiy navbat: ${matrix.counts.standard}.</p>
<p><strong>Qo‘llanma:</strong> barcha manbalarni mustaqil oching, har bir da’voni,
 o‘zbekcha matnni, favqulodda vaziyatlarni va O‘zbekiston kontekstini tekshiring.
 Izohlarni CSV yoki qog‘ozda yozing. Faqat haqiqiy shifokor ko‘rigidan so‘ng
 JSON hujjatidagi belgilarning mazmunini to‘ldiring.</p>
<p>Bu HTML fayl oflayn ochiladi, skript yoki analytics yo‘q. Rasmiy manba
 havolalarini ochish internet talab qiladi. Manba ochilgani uning
 tibbiy to‘g‘riligiga tasdiq emas.</p>
</header>
<main>${sections}</main>
<footer><p>Healthy Women · ma’lumotnomalar mustaqil tibbiy ko‘rikni talab qiladi.</p></footer>
</body></html>`;
}
export function assertBundleUnapproved(matrix=buildEditorialMatrix(),template=createMedicalReviewTemplate()){
 if(matrix.rows.length!==50||template.entries.length!==50)throw Error("Expected 50 rows");
 if(matrix.rows.some(r=>r.clinical_review_status!=="PENDING_CLINICAL_REVIEW")
   ||template.entries.some(r=>r.review_status!=="PENDING_CLINICAL_REVIEW"))
  throw Error("Preapproved data is forbidden");
 if(matrix.rows.some(r=>!r.source_url||!r.prepared_education_answer))throw Error("Missing source or answer");
 return true;
}
