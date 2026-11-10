import test from "node:test";
import assert from "node:assert/strict";
import {createMedicalReviewTemplate,validateMedicalReviewSignoffs} from "../scripts/lib/clinical-review.mjs";
import {MEDICAL_TOPICS} from "../bot-vercel/worker/medical-qa.js";

const clone=x=>structuredClone(x);
const fictitiousSignoff=(template)=>{
 for(const x of template.entries){
  x.review_status="APPROVED_BY_CLINICIAN";
  x.reviewer_full_name="FICTIONAL TEST REVIEWER";
  x.reviewer_credentials="FICTIONAL TEST CREDENTIAL";
  x.reviewed_on="2026-11-01";
  x.source_page_checked=true;
  x.uzbek_text_checked=true;
  x.safety_escalation_checked=true;
 }
 return template;
};

test("default review template is unapproved for all 50 medical topics",()=>{
 const data=createMedicalReviewTemplate();
 const report=validateMedicalReviewSignoffs(data);
 assert.equal(data.entries.length,50);
 assert.equal(report.ready,false);
 assert.equal(report.approved,0);
 assert(report.issues.length>=50);
 assert(data.entries.every(x=>x.review_status==="PENDING_CLINICAL_REVIEW"));
 assert(data.entries.every(x=>x.reviewer_full_name===""&&x.source_page_checked===false));
});
test("missing review file, corrupt schema, absent topic, unknown topic, and duplicates fail closed",()=>{
 const empty=validateMedicalReviewSignoffs(null);
 assert.equal(empty.ready,false);
 assert.equal(empty.approved,0);
 const template=createMedicalReviewTemplate();
 assert.equal(validateMedicalReviewSignoffs({schema:"wrong",entries:template.entries}).ready,false);
 const missing=clone(template);missing.entries.pop();
 assert.equal(validateMedicalReviewSignoffs(missing).ready,false);
 const duplicate=clone(template);duplicate.entries[1]=clone(duplicate.entries[0]);
 assert.equal(validateMedicalReviewSignoffs(duplicate).ready,false);
 const unknown=clone(template);unknown.entries[0].topic_key="fictional_extra";
 assert.equal(validateMedicalReviewSignoffs(unknown).ready,false);
});
test("a source, answer, keyword or title change invalidates earlier signoff",()=>{
 const signed=fictitiousSignoff(createMedicalReviewTemplate());
 assert.equal(validateMedicalReviewSignoffs(signed).ready,true,"The hypothetical fixture only checks structure, NOT real credentials");
 const modified=MEDICAL_TOPICS.map(x=>({...x}));
 modified[0]={...modified[0],answer:modified[0].answer+" New change"};
 let result=validateMedicalReviewSignoffs(signed,modified);
 assert.equal(result.ready,false);
 assert(result.issues.some(x=>x.includes("changed")));
 modified[0]={...MEDICAL_TOPICS[0],words:[...MEDICAL_TOPICS[0].words,"extra synonym"]};
 result=validateMedicalReviewSignoffs(signed,modified);
 assert.equal(result.ready,false);
 modified[0]={...MEDICAL_TOPICS[0],url:"https://example.invalid/unrelated"};
 result=validateMedicalReviewSignoffs(signed,modified);
 assert.equal(result.ready,false);
});
test("all clinical checkboxes, valid dated review, human identifier and credentials are mandatory",()=>{
 const baseline=fictitiousSignoff(createMedicalReviewTemplate());
 for(const mutate of [
  x=>{x.source_page_checked=false;},
  x=>{x.uzbek_text_checked=false;},
  x=>{x.safety_escalation_checked=false;},
  x=>{x.reviewed_on="2099-01-01";},
  x=>{x.reviewed_on="2026-13-01";},
  x=>{x.reviewer_credentials="";},
  x=>{x.reviewer_full_name="";},
  x=>{x.review_status="REJECTED";}
 ]){
  const copy=clone(baseline);
  mutate(copy.entries[0]);
  assert.equal(validateMedicalReviewSignoffs(copy).ready,false);
 }
});
test("distinct source hashes and no live approvals are embedded in the code",()=>{
 const data=createMedicalReviewTemplate();
 assert.equal(new Set(data.entries.map(x=>x.content_sha256)).size,50);
 assert(data.entries.every(x=>/^[0-9a-f]{64}$/.test(x.content_sha256)));
 assert.equal(data.entries.filter(x=>x.review_status==="APPROVED_BY_CLINICIAN").length,0);
});
