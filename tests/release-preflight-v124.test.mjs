import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {buildReleasePreflight,PREFLIGHT_SCHEMA} from "../scripts/lib/release-preflight.mjs";
import {createMedicalReviewTemplate} from "../scripts/lib/clinical-review.mjs";

const repo=resolve(fileURLToPath(new URL("../",import.meta.url)));
const bin=fileURLToPath(new URL("../scripts/release-preflight.mjs",import.meta.url));
test("read-only readiness report describes exact release blockers",()=>{
 const report=buildReleasePreflight();
 assert.equal(report.schema,PREFLIGHT_SCHEMA);
 assert.equal(report.ready_for_public_release,false);
 assert.equal(report.status,"BLOCKED_PENDING_HUMAN_VERIFICATION");
 assert.equal(report.source_topics,50);
 assert.equal(report.clinical_total,50);
 assert.equal(report.clinical_structurally_approved,0);
 assert.equal(report.private_patient_records_accessed,false);
 assert.equal(report.cloud_or_paid_api_called,false);
 assert(report.checks.some(x=>x.id==="medical_source_inventory"&&x.result==="PASS"));
 assert(report.checks.some(x=>x.id==="code_sync_disabled"&&x.result==="PASS"));
 assert(report.checks.some(x=>x.id==="human_clinician_identity"&&x.result==="MANUAL_REQUIRED"));
 assert(report.checks.some(x=>x.id==="provider_free_plan_confirmation"&&x.result==="MANUAL_REQUIRED"));
 assert(report.blockers.includes("production_rollout"));
});
test("CLI refuses a public release in strict mode without human verification",()=>{
 const result=spawnSync(process.execPath,[bin,"--json","--strict"],{encoding:"utf8",timeout:30000,cwd:repo});
 assert.equal(result.status,2,result.stderr);
 const report=JSON.parse(result.stdout);
 assert.equal(report.ready_for_public_release,false);
 assert(report.blockers.includes("clinical_form_structure"));
 assert(report.blockers.includes("physical_devices_and_recovery"));
 assert(!result.stdout.includes("BOT_TOKEN"));
 assert(!result.stdout.includes("DATABASE_URL"));
});
test("even fictional 50/50 signoff rows cannot automatically certify human or device review",()=>{
 const root=mkdtempSync(join(tmpdir(),"hw-review-guard-"));
 const signed=join(root,"fictional-signoff.json");
 try{
  const draft=createMedicalReviewTemplate();
  for(const item of draft.entries){
   item.review_status="APPROVED_BY_CLINICIAN";
   item.reviewer_full_name="FICTIONAL TEST CLINICIAN";
   item.reviewer_credentials="NOT A REAL LICENSE";
   item.reviewed_on="2026-11-01";
   item.source_page_checked=true;
   item.uzbek_text_checked=true;
   item.safety_escalation_checked=true;
  }
  writeFileSync(signed,JSON.stringify(draft));
  const result=buildReleasePreflight({signoffPath:signed});
  assert.equal(result.clinical_structurally_approved,50);
  assert.equal(result.ready_for_public_release,false);
  assert(result.checks.some(x=>x.id==="human_clinician_identity"&&x.result==="MANUAL_REQUIRED"));
  assert(result.checks.some(x=>x.id==="physical_devices_and_recovery"&&x.result==="MANUAL_REQUIRED"));
  const cli=spawnSync(process.execPath,[bin,"--json","--strict","--signoff",signed],{encoding:"utf8",timeout:30000,cwd:repo});
  assert.equal(cli.status,2);
  const output=JSON.parse(cli.stdout);
  assert.equal(output.ready_for_public_release,false);
  assert(!cli.stdout.includes("FICTIONAL TEST CLINICIAN"));
  assert(!cli.stdout.includes("NOT A REAL LICENSE"));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test("changing the client sync configuration creates a preflight blocker",()=>{
 const root=mkdtempSync(join(tmpdir(),"hw-release-audit-"));
 try{
  mkdirSync(join(root,"site"),{recursive:true});
  mkdirSync(join(root,"bot-vercel","api"),{recursive:true});
  const files=["site/config.js","site/app.mjs","bot-vercel/api/sync.js"];
  for(const p of files)writeFileSync(join(root,p),readFileSync(join(repo,p),"utf8"));
  const baseline=buildReleasePreflight({root});
  assert(baseline.checks.some(x=>x.id==="code_sync_disabled"&&x.result==="PASS"));
  writeFileSync(join(root,"site/config.js"),'window.HEALTHY_WOMEN_API="https://example.invalid";');
  const unsafe=buildReleasePreflight({root});
  assert(unsafe.checks.some(x=>x.id==="code_sync_disabled"&&x.result==="BLOCKED"));
  assert.equal(unsafe.ready_for_public_release,false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test("malformed clinical signoff file cannot release",()=>{
 const root=mkdtempSync(join(tmpdir(),"hw-clinical-bad-"));
 const signoffPath=join(root,"invalid.json");
 try{
  writeFileSync(signoffPath,"{NOT-JSON");
  const report=buildReleasePreflight({signoffPath});
  assert.equal(report.clinical_structurally_approved,0);
  assert(report.blockers.includes("clinical_form_structure"));
  assert.equal(report.ready_for_public_release,false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test("unknown CLI flags are rejected",()=>{
 const r=spawnSync(process.execPath,[bin,"--upload"],{encoding:"utf8",cwd:repo});
 assert.notEqual(r.status,0);
 assert(!r.stdout.includes("ready_for_public_release"));
});
