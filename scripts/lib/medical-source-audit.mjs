// Offline inventory of medical source URL evidence. No network or patient data.
// PAGE_OPENED does NOT mean a medical doctor approved the explanation.
import {MEDICAL_TOPICS} from "../../bot-vercel/worker/medical-qa.js";

const REVIEW_DATE="2026-11-10";
const PAGE_OPENED=new Set([
 "https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods",
 "https://www.acog.org/womens-health/faqs/your-first-period",
 "https://www.nhs.uk/conditions/heavy-periods/",
 "https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/",
 "https://www.nhs.uk/tests-and-treatments/cervical-screening/what-is-cervical-screening/",
 "https://www.nhs.uk/conditions/ectopic-pregnancy/",
 "https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/",
 "https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/",
 "https://www.nhs.uk/pregnancy/keeping-well/your-babys-movements/",
 "https://www.nhs.uk/vaccinations/hpv-vaccine/"
]);
const ALLOWED_ORIGINS=new Set(["https://www.nhs.uk","https://www.acog.org"]);
export const auditMedicalSourceURLs=(topics=MEDICAL_TOPICS)=>{
 const rows=topics.map(topic=>{
  let allowed=false;
  try{
   const url=new URL(topic.url);
   allowed=url.protocol==="https:" && ALLOWED_ORIGINS.has(url.origin)
     &&!url.username&&!url.password&&!url.search&&!url.hash;
  }catch{}
  return {
   topic_key:topic.key,
   title:topic.title,
   source_url:topic.url,
   domain_allowed:allowed,
   source_page_status:allowed&&PAGE_OPENED.has(topic.url)?"PAGE_OPENED":"PENDING_SOURCE_REVIEW",
   page_checked_on:allowed&&PAGE_OPENED.has(topic.url)?REVIEW_DATE:"",
   clinical_content_approved:false
  };
 });
 const keys=new Set(rows.map(x=>x.topic_key));
 const totals={
  total:rows.length,
  page_opened:rows.filter(x=>x.source_page_status==="PAGE_OPENED").length,
  pending:rows.filter(x=>x.source_page_status==="PENDING_SOURCE_REVIEW").length,
  invalid_domains:rows.filter(x=>!x.domain_allowed).length,
  clinician_approved:0
 };
 if(keys.size!==topics.length)throw Error("Duplicate topic key in audit");
 return {rows,totals};
};
