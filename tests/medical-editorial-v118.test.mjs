import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {buildMedicalEditorialWorklist,exportMedicalEditorialCSV,getMedicalEditorialSummary}
 from "../scripts/lib/medical-editorial-v118.mjs";
import {MEDICAL_TOPICS} from "../bot-vercel/worker/medical-qa.js";

test("all 50 topics have one traceable and UNAPPROVED clinical editorial record",()=>{
 const rows=buildMedicalEditorialWorklist();
 assert.equal(rows.length,50);
 assert.equal(new Set(rows.map(x=>x.topic_key)).size,50);
 const topics=new Map(MEDICAL_TOPICS.map(x=>[x.key,x]));
 for(const row of rows){
  assert.equal(row.source_url,topics.get(row.topic_key).url);
  assert.equal(row.prepared_education_answer,topics.get(row.topic_key).answer);
  assert.equal(row.example_questions,10);
  assert.equal(row.source_claim_alignment,"PENDING_REVIEW");
  assert.equal(row.clinical_accuracy,"PENDING_REVIEW");
  assert.equal(row.uzbek_language,"PENDING_REVIEW");
  assert.equal(row.urgent_referral_safety,"PENDING_REVIEW");
  assert.equal(row.clinical_review_status,"PENDING_CLINICAL_REVIEW");
  assert.equal(row.reviewer_name,"");
  assert.equal(row.review_date,"");
  assert.equal(row.reviewer_notes,"");
 }
});
test("high-priority editorial topics and Uzbekistan local-policy checks are explicit",()=>{
 const rows=buildMedicalEditorialWorklist();
 const indexed=new Map(rows.map(x=>[x.topic_key,x]));
 for(const k of ["ektopik","qon","preeklampsiya","tugruqdan_keyingi_tushkunlik"])
  assert.equal(indexed.get(k).review_priority,"HIGH");
 for(const k of ["pap_test","hpv_vaksina","mammografiya","kontratseptsiya"])
  assert.equal(indexed.get(k).uzbekistan_applicability,"REQUIRES_LOCAL_PROTOCOL_CHECK");
 const summary=getMedicalEditorialSummary();
 assert.equal(summary.topics,50);
 assert.equal(summary.clinical_approved,0);
 assert(summary.high_priority>=10);
 assert(summary.requires_local_protocol>=5);
 assert(summary.source_link_opened>=5);
});
test("an omitted, substituted, or unsafe source is rejected before CSV export",()=>{
 const topics=MEDICAL_TOPICS.map(t=>({...t}));
 const shifted=[...topics];
 shifted[0].url="https://attacker.invalid/other";
 assert.throws(()=>buildMedicalEditorialWorklist(shifted),/Source or training mismatched/);
 assert.throws(()=>buildMedicalEditorialWorklist(topics.slice(1)),/50 unique editorial topics/);
 const dup=topics.map((x,i)=>i===1?{...x,key:topics[0].key}:x);
 assert.throws(()=>buildMedicalEditorialWorklist(dup),/50 unique editorial topics/);
});
test("UTF-8 review CSV has exactly 50 unapproved records and can be read by spreadsheet software",()=>{
 const csv=exportMedicalEditorialCSV();
 assert(csv.startsWith("\uFEFF"));
 const lines=csv.slice(1).trimEnd().split("\r\n");
 assert.equal(lines.length,51);
 assert(lines[0].includes('"source_claim_alignment"'));
 assert(lines[0].includes('"uzbekistan_applicability"'));
 assert(lines[0].includes('"clinical_review_status"'));
 assert(lines.slice(1).every(x=>x.includes('"PENDING_CLINICAL_REVIEW"')));
 assert(lines.slice(1).every(x=>x.includes('"PENDING_REVIEW"')));
});
test("CSV CLI emits 50 topics offline without overwriting a clinician's notes",()=>{
 const tmp=mkdtempSync(join(tmpdir(),"hw-medical-editorial-"));
 const path=join(tmp,"editorial.csv");
 const script=fileURLToPath(new URL("../scripts/export-medical-editorial-v118.mjs",import.meta.url));
 try{
  const first=spawnSync(process.execPath,[script,path],{encoding:"utf8",timeout:30000});
  assert.equal(first.status,0,first.stderr);
  const raw=readFileSync(path,"utf8");
  assert(raw.startsWith("\uFEFF"));
  assert.equal(raw.split("\r\n").length,52);
  const second=spawnSync(process.execPath,[script,path],{encoding:"utf8",timeout:30000});
  assert.notEqual(second.status,0,"Should not overwrite previous independent editorial notes");
 }finally{rmSync(tmp,{force:true,recursive:true});}
});
test("editorial tool uses no medical chats, third-party APIs, or secrets",()=>{
 const src=readFileSync(new URL("../scripts/lib/medical-editorial-v118.mjs",import.meta.url),"utf8");
 assert(!/fetch\s*\(|process\.env|axios|BOT_TOKEN|DATABASE_URL|WEBHOOK_SECRET|localStorage/i.test(src));
});
