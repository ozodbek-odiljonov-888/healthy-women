import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makeMedicalReviewRows,exportMedicalReviewCSV} from "../bot-vercel/worker/medical-review-export.js";
import {MEDICAL_TOPICS,TRAINING_UTTERANCES_500} from "../bot-vercel/worker/medical-qa.js";

test("medical review export contains 500 individual pending review records",()=>{
 const rows=makeMedicalReviewRows();
 assert.equal(rows.length,500);
 assert.equal(new Set(rows.map(row=>row.topic_key)).size,50);
 assert(rows.every(row=>row.clinical_review_status==="PENDING_CLINICAL_REVIEW"));
 assert(rows.every(row=>row.reviewer===""&&row.reviewed_on===""&&row.notes===""));
 assert(rows.every(row=>row.public_medical_source.startsWith("https://")));
});
test("every review row is traceable to one original education topic and prepared answer",()=>{
 const source=new Map(MEDICAL_TOPICS.map(x=>[x.key,x]));
 const data=makeMedicalReviewRows();
 const count=new Map();
 for(const row of data){
  const t=source.get(row.topic_key);
  assert(t,row.topic_key);
  assert.equal(row.topic_title,t.title);
  assert.equal(row.prepared_education_answer,t.answer);
  assert.equal(row.public_medical_source,t.url);
  assert(TRAINING_UTTERANCES_500[t.key].includes(row.synthetic_question));
  count.set(t.key,(count.get(t.key)||0)+1);
 }
 assert([...count.values()].every(n=>n===10));
});
test("CSV includes a UTF-8 BOM, fixed columns and properly quoted values",()=>{
 const csv=exportMedicalReviewCSV();
 assert(csv.startsWith("\uFEFF"));
 const lines=csv.slice(1).trimEnd().split("\r\n");
 assert.equal(lines.length,501);
 assert(lines[0].includes('"clinical_review_status"'));
 assert(lines[0].includes('"public_medical_source"'));
 assert(lines[0].includes('"notes"'));
 assert(lines.slice(1).every(line=>line.includes('"PENDING_CLINICAL_REVIEW"')));
 assert(csv.includes("https://www.nhs.uk/"));
});
test("export adds no API calls, no medication doses and no patient records",()=>{
 const source=readFileSync(new URL("../bot-vercel/worker/medical-review-export.js",import.meta.url),"utf8");
 const code=source.split("\n").filter(x=>!x.trimStart().startsWith("//")).join("\n");
 assert(!/fetch\s*\(|axios|process\.env|localStorage\.setItem|console\.log/i.test(code));
 assert(!/BOT_TOKEN|WEBHOOK_SECRET|DATABASE_URL/.test(source));
});
