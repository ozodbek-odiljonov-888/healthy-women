import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,existsSync,writeFileSync,rmSync,readdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {buildEditorialMatrix,exportEditorialMatrixCSV} from "../scripts/lib/medical-editorial-matrix.mjs";
import {createMedicalReviewTemplate,validateMedicalReviewSignoffs} from "../scripts/lib/clinical-review.mjs";
import {renderClinicalReviewHTML,assertBundleUnapproved} from "../scripts/lib/clinical-review-package.mjs";

const matrix=()=>buildEditorialMatrix();
test("offline reviewer booklet contains exactly 50 distinct real educational topics and 350 rubric items",()=>{
 const page=renderClinicalReviewHTML();
 const rows=matrix().rows;
 assert.equal(rows.length,50);
 assert.equal(new Set(rows.map(x=>x.topic_key)).size,50);
 assert.equal((page.match(/<section class="topic"/g)||[]).length,50);
 assert.equal((page.match(/<span class="empty"/g)||[]).length,350);
 assert.equal((page.match(/href="https:\/\//g)||[]).length,50);
 assert(page.includes("0/50 klinik tasdiq"));
 assert(page.includes("PENDING")===false);
 assert.match(page,/Content-Security-Policy/);
 assert(!/<script\b/i.test(page));
});
test("all HTML titles, answers, values and source URLs originate from the audit matrix and are escaped",()=>{
 const source=matrix();
 for(const row of source.rows){
  assert(row.source_origin_valid);
  assert(row.prepared_education_answer);
  assert(row.content_sha256);
  assert(row.safety_rules_sha256);
 }
 const dirty=structuredClone(source);
 dirty.rows[0].topic_title="<img src=x onerror=alert(1)>";
 dirty.rows[0].prepared_education_answer="<script>alert('oops')</script>";
 dirty.rows[0].topic_key='x" onclick="bad()';
 const html=renderClinicalReviewHTML(dirty);
 assert(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
 assert(html.includes("&lt;script&gt;"));
 assert(!html.includes("<img src=x"));
 assert(!html.includes("<script>alert"));
 assert(html.includes("&#39;"));
});
test("untrusted source host and preapproved or missing review entries fail closed",()=>{
 const bad=matrix();
 bad.rows[0].source_url="https://www.nhs.uk.evil.invalid/a";
 assert.throws(()=>renderClinicalReviewHTML(bad),/Non-approved/);
 const bad2=matrix();
 bad2.rows[0].source_url="javascript:alert(1)";
 assert.throws(()=>renderClinicalReviewHTML(bad2));
 const approved=matrix();
 approved.rows[0].clinical_review_status="APPROVED_BY_CLINICIAN";
 assert.throws(()=>renderClinicalReviewHTML(approved),/preapproved/);
 assert.throws(()=>assertBundleUnapproved(approved,createMedicalReviewTemplate()),/Preapproved/);
});
test("a generated signoff draft cannot pass the existing clinical release gate",()=>{
 const json=createMedicalReviewTemplate();
 assertBundleUnapproved(matrix(),json);
 assert.equal(json.entries.length,50);
 assert.equal(json.entries.filter(x=>x.review_status==="APPROVED_BY_CLINICIAN").length,0);
 const check=validateMedicalReviewSignoffs(json);
 assert.equal(check.ready,false);
 assert.equal(check.approved,0);
 assert.equal(check.total,50);
});
test("CLI safely creates four useful files and does not overwrite a reviewer's notes",()=>{
 const dir=mkdtempSync(join(tmpdir(),"healthy-women-review-bundle-"));
 const output=join(dir,"human-clinical-review");
 const executable=fileURLToPath(new URL("../scripts/build-clinical-review-package.mjs",import.meta.url));
 try{
  const run=()=>spawnSync(process.execPath,[executable,output],{encoding:"utf8",timeout:30000});
  const first=run();assert.equal(first.status,0,first.stderr);
  assert.match(first.stdout,/clinician approvals: 0/);
  assert.deepEqual(readdirSync(output).sort(),[
   "01-50-mavzu-klinik-korik.html",
   "02-50-mavzu-tahririy-jadval.csv",
   "03-klinik-tasdiq-shabloni.json",
   "README-UZ.txt"
  ]);
  const html=readFileSync(join(output,"01-50-mavzu-klinik-korik.html"),"utf8");
  assert.equal((html.match(/<section class="topic"/g)||[]).length,50);
  assert.equal(readFileSync(join(output,"02-50-mavzu-tahririy-jadval.csv"),"utf8"),exportEditorialMatrixCSV());
  const draft=JSON.parse(readFileSync(join(output,"03-klinik-tasdiq-shabloni.json"),"utf8"));
  assert.equal(validateMedicalReviewSignoffs(draft).ready,false);
  assert.equal(draft.entries.filter(x=>x.review_status==="PENDING_CLINICAL_REVIEW").length,50);
  const reviewerNotes=join(output,"README-UZ.txt");
  const original=readFileSync(reviewerNotes,"utf8");
  const second=run();
  assert.notEqual(second.status,0);
  assert.equal(readFileSync(reviewerNotes,"utf8"),original);
  assert(existsSync(reviewerNotes));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test("CLI-generated JSON cannot be mistaken for a clinical signoff",()=>{
 const dir=mkdtempSync(join(tmpdir(),"healthy-women-review-blocked-"));
 const output=join(dir,"bundle");
 const build=fileURLToPath(new URL("../scripts/build-clinical-review-package.mjs",import.meta.url));
 const gate=fileURLToPath(new URL("../scripts/check-medical-release.mjs",import.meta.url));
 try{
  assert.equal(spawnSync(process.execPath,[build,output],{encoding:"utf8"}).status,0);
  const result=spawnSync(process.execPath,[gate,join(output,"03-klinik-tasdiq-shabloni.json")],{encoding:"utf8"});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/BLOCKED: only 0\/50 topics/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
