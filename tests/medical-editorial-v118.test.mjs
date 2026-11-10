import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {MEDICAL_TOPICS} from "../bot-vercel/worker/medical-qa.js";
import {buildEditorialMatrix,exportEditorialMatrixCSV,EDITORIAL_CRITERIA} from "../scripts/lib/medical-editorial-matrix.mjs";
import {createMedicalReviewTemplate} from "../scripts/lib/clinical-review.mjs";

test("all 50 educational responses have a traceable clinical audit row, unapproved by default",()=>{
 const {rows,counts}=buildEditorialMatrix();
 assert.equal(rows.length,50);
 assert.equal(counts.total,50);
 assert.equal(counts.clinical_approved,0);
 assert.equal(counts.first+counts.second+counts.standard,50);
 assert(counts.first>=10);
 assert(counts.second>=10);
 assert.equal(counts.page_opened+counts.pending_source,50);
 assert.equal(new Set(rows.map(x=>x.topic_key)).size,50);
 assert(rows.every(x=>x.clinical_review_status==="PENDING_CLINICAL_REVIEW"));
 assert(rows.every(x=>!x.reviewer_full_name&&!x.reviewer_qualification&&!x.reviewed_on&&!x.reviewer_decision));
});
test("human audit never claims that an opened source proves a clinical answer correct",()=>{
 const {rows}=buildEditorialMatrix();
 assert(rows.some(x=>x.source_page_status==="PAGE_OPENED"));
 assert(rows.some(x=>x.source_page_status==="PENDING_SOURCE_REVIEW"));
 assert(rows.every(x=>x.source_origin_valid));
 assert(rows.every(x=>x.clinical_review_status==="PENDING_CLINICAL_REVIEW"));
 assert(rows.some(x=>x.source_page_status==="PAGE_OPENED"&&x.clinical_review_status==="PENDING_CLINICAL_REVIEW"));
});
test("clinical audit preserves correct source, answer and content hashes for every topic",()=>{
 const {rows}=buildEditorialMatrix();
 const topics=new Map(MEDICAL_TOPICS.map(x=>[x.key,x]));
 const clinical=new Map(createMedicalReviewTemplate().entries.map(x=>[x.topic_key,x]));
 for(const row of rows){
  const topic=topics.get(row.topic_key);
  assert(topic);
  assert.equal(row.topic_title,topic.title);
  assert.equal(row.source_url,topic.url);
  assert.equal(row.prepared_education_answer,topic.answer);
  assert.equal(row.content_sha256,clinical.get(row.topic_key).content_sha256);
  assert.match(row.safety_rules_sha256,/^[a-f0-9]{64}$/);
 }
});
test("review rubric explicitly covers source, urgent safety, local rules, privacy and prohibited prescriptions",()=>{
 assert.equal(EDITORIAL_CRITERIA.length,7);
 assert(EDITORIAL_CRITERIA.includes("emergency_escalation_and_uncertainty"));
 assert(EDITORIAL_CRITERIA.includes("local_uzbekistan_applicability"));
 assert(EDITORIAL_CRITERIA.includes("no_medication_dose_or_diagnosis"));
 assert(EDITORIAL_CRITERIA.includes("privacy_and_accessibility"));
 const priorities=buildEditorialMatrix().rows;
 for(const key of ["ektopik","preeklampsiya","tugruqdan_keyingi_tushkunlik","qon"]){
  assert.equal(priorities.find(x=>x.topic_key===key)?.review_priority,"REVIEW_FIRST");
 }
});
test("CSV output is 50 records plus header, UTF-8 BOM, text quoted to prevent formula injection",()=>{
 const result=exportEditorialMatrixCSV();
 assert(result.startsWith("\uFEFF"));
 const rows=result.slice(1).trimEnd().split("\r\n");
 assert.equal(rows.length,51);
 assert(rows[0].includes('"review_priority"'));
 assert(rows[0].includes('"reviewer_qualification"'));
 assert(rows.every(line=>line.startsWith('"')&&line.endsWith('"')));
 assert.equal((result.match(/"PENDING_CLINICAL_REVIEW"/g)||[]).length,50);
});
test("CLI produces a local unapproved CSV, and refuses overwrite to preserve reviewer notes",()=>{
 const dir=mkdtempSync(join(tmpdir(),"healthy-women-editorial-"));
 const path=join(dir,"review.csv");
 const executable=fileURLToPath(new URL("../scripts/export-medical-editorial-v118.mjs",import.meta.url));
 try{
  const first=spawnSync(process.execPath,[executable,path],{encoding:"utf8",timeout:30000});
  assert.equal(first.status,0,first.stderr);
  assert.match(first.stdout,/50-row PENDING_CLINICAL_REVIEW/);
  const content=readFileSync(path,"utf8");
  assert(content.startsWith("\uFEFF"));
  const second=spawnSync(process.execPath,[executable,path],{encoding:"utf8",timeout:30000});
  assert.notEqual(second.status,0);
  assert.equal(readFileSync(path,"utf8"),content);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
