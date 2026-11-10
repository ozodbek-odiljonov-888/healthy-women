// Offline educational-corpus regression suite: all examples are synthetic.
// No user health messages or secrets are stored, and no paid AI APIs are called.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ADDITIONAL_MEDICAL_TOPICS,TRAINING_UTTERANCES,SAFETY_TRAINING_UTTERANCES,UNSUPPORTED_TRAINING_UTTERANCES,TRAINING_FIXTURE_COUNT} from "../bot-vercel/worker/medical-curriculum.js";
import {MEDICAL_TOPICS,normalizeMedicalQuery,findMedicalTopics,assessMedicalRisk,answerMedicalQuestion} from "../bot-vercel/worker/medical-qa.js";

test("curriculum contains exactly 20 sourced topics and 146 entirely synthetic questions",()=>{
 assert.equal(MEDICAL_TOPICS.length,20);
 assert.equal(ADDITIONAL_MEDICAL_TOPICS.length,9);
 assert.equal(Object.keys(TRAINING_UTTERANCES).length,20);
 assert.equal(Object.values(TRAINING_UTTERANCES).reduce((n,list)=>n+list.length,0),120);
 assert.equal(SAFETY_TRAINING_UTTERANCES.length,14);
 assert.equal(UNSUPPORTED_TRAINING_UTTERANCES.length,12);
 assert.equal(TRAINING_FIXTURE_COUNT,146);
 assert.deepEqual(new Set(Object.keys(TRAINING_UTTERANCES)),new Set(MEDICAL_TOPICS.map(x=>x.key)));
});
test("all example medical questions retrieve their independently annotated topic",()=>{
 const failures=[];
 for(const [key,examples] of Object.entries(TRAINING_UTTERANCES)){
  for(const question of examples){
   const found=findMedicalTopics(question,1)[0]?.key??"none";
   const result=answerMedicalQuestion(question);
   if(found!==key||result.kind!=="answer"||result.articles[0]?.key!==key)failures.push({question,expected:key,found,kind:result.kind});
  }
 }
 assert.deepEqual(failures,[]);
});
test("training examples do not contradict another answer label or duplicate a phrase",()=>{
 const seen=new Map();
 for(const [key,examples] of Object.entries(TRAINING_UTTERANCES)){
  assert(examples.length>=5);
  for(const raw of examples){
   const normalized=normalizeMedicalQuery(raw);
   assert(normalized.length>=6,raw);
   assert(!seen.has(normalized),"Duplicate question: "+raw+" ("+seen.get(normalized)+"/"+key+")");
   seen.set(normalized,key);
  }
 }
});
test("14 synthetic red-flag questions must not be converted into benign routine advice",()=>{
 const failures=[];
 for(const {question,level} of SAFETY_TRAINING_UTTERANCES){
  const risk=assessMedicalRisk(question);
  const result=answerMedicalQuestion(question);
  if(risk.level!==level||result.kind!=="safety"||!result.urgent||result.articles.length)failures.push({question,expected:level,actual:risk.level,kind:result.kind});
 }
 assert.deepEqual(failures,[]);
});
test("12 unsupported, dosing and unrelated questions must abstain",()=>{
 const failures=[];
 for(const question of UNSUPPORTED_TRAINING_UTTERANCES){
  const result=answerMedicalQuestion(question);
  if(result.kind!=="unknown"||result.articles.length)failures.push({question,kind:result.kind});
 }
 assert.deepEqual(failures,[]);
});
test("new clinical answers cite only specific NHS or ACOG URLs",()=>{
 for(const item of ADDITIONAL_MEDICAL_TOPICS){
  assert(item.title.length>6);
  assert(item.answer.length>=90&&item.answer.length<700,item.key);
  assert(item.words.length>=3,item.key);
  assert(/^https:\/\/(?:www\.)?(?:nhs\.uk|acog\.org)\//.test(item.url),item.key);
  assert(!/(men sizga tashxis qo|antibiotikni iching|mg iching|100%)/i.test(item.answer),item.key);
 }
});
test("dictionary lookup and answer generation happen locally, without a model/API or user data store",()=>{
 const source=readFileSync(new URL("../bot-vercel/worker/medical-curriculum.js",import.meta.url),"utf8");
 const code=source.split("\n").filter(x=>!x.trimStart().startsWith("//")).join("\n");
 assert(!/fetch\s*\(|process\.env|console\.log\(|openai\.com|generativ model|localStorage\.setItem/i.test(code));
 assert(!/BOT_TOKEN|WEBHOOK_SECRET|DATABASE_URL/.test(source));
});
