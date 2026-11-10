// Healthy Women v1.18 — offline 50-topic editorial worklist.
// Every review is pending: URL provenance is NOT human clinical approval.
// This file is Node-only (not part of the public bot/PWA bundle).
import {MEDICAL_TOPICS,TRAINING_UTTERANCES_500} from "../../bot-vercel/worker/medical-qa.js";
import {auditMedicalSourceURLs} from "./medical-source-audit.mjs";

const HIGH=new Set([
 "qon","oraliq_qon","ektopik","homila_tushish","preeklampsiya",
 "tugruq_belgilari","tugruqdan_keyingi_tushkunlik",
 "tezkor_himoya","chanoq_infeksiyasi","siydik_yoli","vaginit",
 "hpv_vaksina","pap_test","folat","gestatsion_diabet"
]);
const LOCAL=new Set([
 "pap_test","mammografiya","hpv_vaksina","tezkor_himoya",
 "kontratseptsiya","folat","antenatal","birinchi_hayz"
]);
const PENDING="PENDING_REVIEW";
const HEADERS=Object.freeze([
 "topic_key","topic_title","review_priority","source_url",
 "source_url_status","example_questions","prepared_education_answer",
 "source_claim_alignment","clinical_accuracy","uzbek_language",
 "urgent_referral_safety","uzbekistan_applicability",
 "clinical_review_status","reviewer_name","review_date","reviewer_notes"
]);
const csvCell=value=>{
 let s=String(value??"");
 if(/^[\s]*[=+@-]/.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
};

export function buildMedicalEditorialWorklist(
 topics=MEDICAL_TOPICS,
 training=TRAINING_UTTERANCES_500,
 audit=auditMedicalSourceURLs(topics)
){
 if(topics.length!==50||new Set(topics.map(t=>t.key)).size!==50)
  throw Error("50 unique editorial topics required");
 const auditByKey=new Map(audit.rows.map(r=>[r.topic_key,r]));
 if(auditByKey.size!==50||audit.rows.length!==50)throw Error("Incomplete source URL inventory");
 return topics.map(topic=>{
  const source=auditByKey.get(topic.key);
  const questions=training[topic.key];
  if(!source||source.source_url!==topic.url||source.domain_allowed!==true
   ||!Array.isArray(questions)||questions.length!==10)
   throw Error("Source or training mismatched for "+topic.key);
  return {
   topic_key:topic.key,
   topic_title:topic.title,
   review_priority:HIGH.has(topic.key)?"HIGH":"STANDARD",
   source_url:topic.url,
   source_url_status:source.source_page_status,
   example_questions:questions.length,
   prepared_education_answer:topic.answer,
   source_claim_alignment:PENDING,
   clinical_accuracy:PENDING,
   uzbek_language:PENDING,
   urgent_referral_safety:PENDING,
   uzbekistan_applicability:LOCAL.has(topic.key)?"REQUIRES_LOCAL_PROTOCOL_CHECK":PENDING,
   clinical_review_status:"PENDING_CLINICAL_REVIEW",
   reviewer_name:"",
   review_date:"",
   reviewer_notes:""
  };
 });
}
export function exportMedicalEditorialCSV(){
 const all=buildMedicalEditorialWorklist();
 const lines=[HEADERS,...all.map(r=>HEADERS.map(col=>r[col]))];
 return "\uFEFF"+lines.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
export function getMedicalEditorialSummary(){
 const records=buildMedicalEditorialWorklist();
 return {
  topics:records.length,
  high_priority:records.filter(r=>r.review_priority==="HIGH").length,
  requires_local_protocol:records.filter(r=>r.uzbekistan_applicability==="REQUIRES_LOCAL_PROTOCOL_CHECK").length,
  source_link_opened:records.filter(r=>r.source_url_status==="PAGE_OPENED").length,
  clinical_approved:0
 };
}
