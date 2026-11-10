// Healthy Women v1.18 — editorial planning data, NOT a clinical risk score.
// Static audit queue for 50 prewritten educational answers. No network or AI.
// Priority indicates REVIEW ORDER ONLY, never medical triage, diagnosis or clearance.
import {MEDICAL_TOPICS} from "../../bot-vercel/worker/medical-qa.js";
import {auditMedicalSourceURLs} from "./medical-source-audit.mjs";
import {createMedicalReviewTemplate} from "./clinical-review.mjs";

const FIRST_REVIEW=new Set([
 "qon","oraliq_qon","kechikish","test","tezkor_himoya",
 "tuxumdon_kistasi","chanoq_infeksiyasi","ektopik","homila_tushish",
 "preeklampsiya","tugruq_belgilari","tugruqdan_keyingi_tushkunlik",
 "ertalab_kongil","gestatsion_diabet","siydik_yoli"
]);
const SECOND_REVIEW=new Set([
 "birinchi_hayz","menopauza","pap_test","hpv","hpv_vaksina",
 "kokrak_tugun","mammografiya","kontratseptsiya","folat",
 "mastit","emizish","temir_tanqisligi","siydik_tutolmaslik"
]);
export const EDITORIAL_CRITERIA=Object.freeze([
 "official_source_matches_claims",
 "uzbek_language_clarity",
 "age_and_pregnancy_context",
 "emergency_escalation_and_uncertainty",
 "local_uzbekistan_applicability",
 "no_medication_dose_or_diagnosis",
 "privacy_and_accessibility"
]);
export const EDITORIAL_STATUS="PENDING_CLINICAL_REVIEW";

function priority(key){
 return FIRST_REVIEW.has(key)?"REVIEW_FIRST":
  SECOND_REVIEW.has(key)?"REVIEW_SECOND":"REVIEW_STANDARD";
}
export function buildEditorialMatrix(topics=MEDICAL_TOPICS){
 if(!Array.isArray(topics)||topics.length!==50||
    new Set(topics.map(t=>t.key)).size!==50)
  throw Error("Expected 50 distinct educational topics");
 const sources=auditMedicalSourceURLs(topics).rows;
 const sourceByKey=new Map(sources.map(s=>[s.topic_key,s]));
 const approvals=createMedicalReviewTemplate(topics);
 const approvalsByKey=new Map(approvals.entries.map(x=>[x.topic_key,x]));
 const rows=topics.map(topic=>{
  const source=sourceByKey.get(topic.key);
  const approval=approvalsByKey.get(topic.key);
  if(!source||!approval)throw Error("Source or signoff missing: "+topic.key);
  return {
   topic_key:topic.key,
   topic_title:topic.title,
   review_priority:priority(topic.key),
   source_url:topic.url,
   source_page_status:source.source_page_status,
   source_page_checked_on:source.page_checked_on,
   source_origin_valid:source.domain_allowed,
   content_sha256:approval.content_sha256,
   safety_rules_sha256:approvals.safety_rules_sha256,
   clinical_review_status:EDITORIAL_STATUS,
   review_criteria:EDITORIAL_CRITERIA.join("; "),
   reviewer_full_name:"",
   reviewer_qualification:"",
   reviewed_on:"",
   reviewer_decision:"",
   editor_notes:"",
   // Preserve the actual text for human reading without assuming it is correct.
   prepared_education_answer:topic.answer
  };
 }).sort((a,b)=>{
  const rank={REVIEW_FIRST:0,REVIEW_SECOND:1,REVIEW_STANDARD:2};
  return rank[a.review_priority]-rank[b.review_priority]||
   a.topic_key.localeCompare(b.topic_key);
 });
 const counts={
  total:rows.length,
  first:rows.filter(x=>x.review_priority==="REVIEW_FIRST").length,
  second:rows.filter(x=>x.review_priority==="REVIEW_SECOND").length,
  standard:rows.filter(x=>x.review_priority==="REVIEW_STANDARD").length,
  page_opened:rows.filter(x=>x.source_page_status==="PAGE_OPENED").length,
  pending_source:rows.filter(x=>x.source_page_status==="PENDING_SOURCE_REVIEW").length,
  clinical_approved:0
 };
 if(counts.first+counts.second+counts.standard!==50)throw Error("Invalid review queue");
 return {rows,counts,disclaimer:
  "Review order is editorial only, not patient urgency. All topics require real clinician review. Source-page opening does not mean clinical approval."};
}
const HEADERS=[
 "topic_key","topic_title","review_priority","source_url",
 "source_page_status","source_page_checked_on","source_origin_valid",
 "content_sha256","safety_rules_sha256","clinical_review_status",
 "review_criteria","reviewer_full_name","reviewer_qualification",
 "reviewed_on","reviewer_decision","editor_notes","prepared_education_answer"
];
const csvCell=value=>{
 let s=String(value??"");
 // CSV formula neutralization, including Unicode whitespace before operators.
 if(/^[\s\uFEFF]*[=+@-]/u.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
};
export function exportEditorialMatrixCSV(topics=MEDICAL_TOPICS){
 const {rows}=buildEditorialMatrix(topics);
 return "\uFEFF"+[HEADERS,...rows.map(r=>HEADERS.map(k=>r[k]))]
  .map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
