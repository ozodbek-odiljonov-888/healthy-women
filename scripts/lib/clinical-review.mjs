// Healthy Women v1.16 — OFFLINE clinician-review checklist validation.
// A completed JSON file is evidence for human review, NOT proof of credentials.
// This module is Node.js tooling only and is not part of the Telegram runtime.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {MEDICAL_TOPICS} from "../../bot-vercel/worker/medical-qa.js";

const SCHEMA="healthy-women-medical-review-v1";
const PENDING="PENDING_CLINICAL_REVIEW";
const APPROVED="APPROVED_BY_CLINICIAN";
const REQUIRED=["source_page_checked","uzbek_text_checked","safety_escalation_checked"];

// Source-bound safety fingerprint covers BOTH triage code and normalization:
 // changing urgent warnings must invalidate old review regardless of FAQ text.
function hashSafetyRules(){
 const paths=[
  "../../bot-vercel/worker/medical-qa.js",
  "../../bot-vercel/worker/medical-language-v116.js",
  "../../bot-vercel/worker/medical-triage-v117.js",
  "../../bot-vercel/worker/medical-boundaries-v118.js"
 ];
 const digest=createHash("sha256");
 for(const path of paths){
  const content=readFileSync(new URL(path,import.meta.url));
  digest.update(path).update(content);
 }
 return digest.digest("hex");
}
function hashTopic(topic){
 return createHash("sha256").update(JSON.stringify([
  topic.key,topic.title,topic.answer,topic.url,topic.words
 ])).digest("hex");
}

export function createMedicalReviewTemplate(topics=MEDICAL_TOPICS){
 if(topics.length!==50||new Set(topics.map(x=>x.key)).size!==50)
  throw Error("Expected 50 unique medical topics");
 return {
  schema:SCHEMA,
  safety_rules_sha256:hashSafetyRules(),
  disclaimer:"Draft sign-off checklist only. Must be reviewed by a qualified human clinician; no automated review or bot activation.",
  entries:topics.map(topic=>({
   topic_key:topic.key,topic_title:topic.title,
   source_url:topic.url,content_sha256:hashTopic(topic),
   review_status:PENDING,
   reviewer_full_name:"",reviewer_credentials:"",
   reviewed_on:"",source_page_checked:false,
   uzbek_text_checked:false,safety_escalation_checked:false,
   reviewer_notes:""
  }))
 };
}

function validDate(d){
 if(typeof d!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const parsed=new Date(d+"T00:00:00Z");
 return !Number.isNaN(parsed.valueOf())&&parsed.toISOString().slice(0,10)===d
   &&parsed.getTime()<=Date.now();
}
export function validateMedicalReviewSignoffs(file,topics=MEDICAL_TOPICS){
 const issues=[];
 if(!file||typeof file!=="object"||file.schema!==SCHEMA||!Array.isArray(file.entries)){
  return {ready:false,approved:0,total:topics.length,issues:["Invalid or missing medical review file"]};
 }
 if(file.safety_rules_sha256!==hashSafetyRules())
  issues.push("Safety triage or normalization changed since clinical review");
 const accepted=new Map();
 for(const item of file.entries){
  const key=item?.topic_key;
  if(typeof key!=="string"||!key.trim()){
   issues.push("Review row has no topic key");continue;
  }
  if(accepted.has(key)){issues.push("Duplicate review record for "+key);continue;}
  accepted.set(key,item);
 }
 for(const topic of topics){
  const item=accepted.get(topic.key);
  if(!item){issues.push("Missing review: "+topic.key);continue;}
  if(item.content_sha256!==hashTopic(topic)){
   issues.push("Source or answer changed since review: "+topic.key);continue;
  }
  if(item.source_url!==topic.url||item.topic_title!==topic.title){
   issues.push("Review metadata mismatch: "+topic.key);continue;
  }
  if(item.review_status!==APPROVED){
   issues.push("Topic not clinically approved: "+topic.key);continue;
  }
  if(typeof item.reviewer_full_name!=="string"||item.reviewer_full_name.trim().length<5
    ||typeof item.reviewer_credentials!=="string"||item.reviewer_credentials.trim().length<4
    ||!validDate(item.reviewed_on)||REQUIRED.some(k=>item[k]!==true)){
   issues.push("Incomplete clinical verification: "+topic.key);
  }
 }
 for(const key of accepted.keys()){
  if(!topics.some(t=>t.key===key))issues.push("Unknown review topic: "+key);
 }
 if(file.entries.length!==topics.length)issues.push("Review record count is not 50");
 const approved=topics.filter(topic=>{
  const x=accepted.get(topic.key);
  return x&&x.review_status===APPROVED&&x.content_sha256===hashTopic(topic)
   &&x.source_url===topic.url&&x.topic_title===topic.title
   &&typeof x.reviewer_full_name==="string"&&x.reviewer_full_name.trim().length>=5
   &&typeof x.reviewer_credentials==="string"&&x.reviewer_credentials.trim().length>=4
   &&validDate(x.reviewed_on)&&REQUIRED.every(k=>x[k]===true);
 }).length;
 return {ready:issues.length===0&&approved===topics.length,
  approved,total:topics.length,issues};
}
