import test from "node:test";
import assert from "node:assert/strict";
import {auditMedicalSourceURLs} from "../scripts/lib/medical-source-audit.mjs";
import {MEDICAL_TOPICS} from "../bot-vercel/worker/medical-qa.js";
import {createMedicalReviewTemplate,validateMedicalReviewSignoffs} from "../scripts/lib/clinical-review.mjs";

test("inventory lists all 50 medical sources without granting any clinical approvals",()=>{
 const result=auditMedicalSourceURLs();
 assert.equal(result.totals.total,50);
 assert.equal(result.rows.length,50);
 assert.equal(result.totals.clinician_approved,0);
 assert.equal(result.rows.filter(x=>x.clinical_content_approved).length,0);
 assert.equal(result.totals.page_opened+result.totals.pending,50);
 assert(result.totals.page_opened>=5);
 assert(result.rows.every(x=>x.source_page_status==="PAGE_OPENED"||x.source_page_status==="PENDING_SOURCE_REVIEW"));
});
test("the source audit distinguishes opened links from topic/clinical approval",()=>{
 const audit=auditMedicalSourceURLs();
 const p=audit.rows.find(x=>x.topic_key==="pcos");
 assert(p);
 assert.equal(p.source_page_status,"PAGE_OPENED");
 assert.equal(p.clinical_content_approved,false);
 assert.equal(p.page_checked_on,"2026-11-10");
 const unreviewed=audit.rows.find(x=>x.source_page_status==="PENDING_SOURCE_REVIEW");
 assert(unreviewed);
 assert.equal(unreviewed.page_checked_on,"");
});
test("all cited health sources use only an approved exact HTTPS origin",()=>{
 const audit=auditMedicalSourceURLs();
 assert.equal(audit.totals.invalid_domains,0);
 assert(audit.rows.every(x=>x.domain_allowed));
 const example=MEDICAL_TOPICS[0];
 for(const bad of ["https://nhs.uk.attacker.invalid/a","http://www.nhs.uk/x","https://www.nhs.uk@evil.invalid/x","javascript:alert(1)"]){
  const input=[{...example,url:bad}];
  const out=auditMedicalSourceURLs(input);
  assert.equal(out.totals.invalid_domains,1,bad);
  assert.equal(out.totals.clinician_approved,0);
 }
});
test("a manually signed source review cannot survive modified triage rules fingerprint",()=>{
 const form=createMedicalReviewTemplate();
 assert.match(form.safety_rules_sha256,/^[a-f0-9]{64}$/);
 assert.equal(validateMedicalReviewSignoffs(form).ready,false);
 const changed=structuredClone(form);
 changed.safety_rules_sha256="0".repeat(64);
 const report=validateMedicalReviewSignoffs(changed);
 assert.equal(report.ready,false);
 assert(report.issues.some(x=>x.includes("Safety triage")));
});
