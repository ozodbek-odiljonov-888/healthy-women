// Healthy Women v1.20: all prompts are fictional; no health user data.
// Speaker attribution is deliberately bounded, not clinical natural-language AI.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 normalizeMedicalQuery,answerMedicalQuestion,assessMedicalRisk,
 MEDICAL_TOPICS,TRAINING_UTTERANCES_500
} from "../bot-vercel/worker/medical-qa.js";
import {assessMedicalSpeaker} from "../bot-vercel/worker/medical-context-v120.js";

const scope=raw=>assessMedicalSpeaker(raw,normalizeMedicalQuery(raw));

test("explicit first, third and mixed-person statements have distinct contexts",()=>{
 const cases=[
  ["Menda hayz kechikmoqda","self"],
  ["Men hayz haqida savol bermoqchiman","self"],
  ["Opamda hayz og‘rig‘i bor","other"],
  ["Onamning hayzi kechikyapti","other"],
  ["Singlimda qorin og‘riyapti","other"],
  ["Dugonamda ajralma bor","other"],
  ["Menda hayz kechikdi. Opamda esa mioma bor.","mixed"],
  ["Opam homilador, men esa qornim og‘riyapti","mixed"],
  ["Hayz sikli nima?","unspecified"]
 ];
 for(const [raw,want] of cases)assert.equal(scope(raw).scope,want,raw);
});
test("third-party personalized questions abstain from inventing a diagnosis",()=>{
 const cases=[
  "Opamda hayz og‘rig‘i bor, nima qilsin?",
  "Onamning hayzi kechikyapti, qaysi dori yordam beradi?",
  "Singlimda oq ajralma kelmoqda, nimadan?",
  "Dugonamda PCOS bor, aniq tashxis ayt"
 ];
 for(const raw of cases){
  const reply=answerMedicalQuestion(raw);
  assert.equal(reply.kind,"clarify",raw);
  assert.equal(reply.reason,"third_party",raw);
  assert.equal(reply.articles.length,0,raw);
  assert.match(reply.text,/shaxsiy ma’lumotlarsiz/i,raw);
 }
});
test("general educational explanation about a relative is still allowed",()=>{
 for(const raw of [
  "Onamga menopauza nima ekanini tushuntirib bering",
  "Opamga PCOS haqida umumiy ma’lumot bering",
  "Men opamga HPV nima deganini tushuntirmoqchiman"
 ]){
  const reply=answerMedicalQuestion(raw);
  assert.equal(reply.kind,"answer",raw);
  assert.match(reply.text,/Manba:/,raw);
 }
});
test("two-speaker queries without urgent markers ask to separate people",()=>{
 const samples=[
  "Men hayzim haqida, opam esa PCOS haqida so‘ramoqchi",
  "Onamda mioma bor. Menda hayz kechikyapti.",
  "Opamning sikli nomuntazam, men esa PMS haqida bilmoqchiman"
 ];
 for(const raw of samples){
  const reply=answerMedicalQuestion(raw);
  assert.equal(reply.kind,"clarify",raw);
  assert.equal(reply.reason,"speaker_ambiguous",raw);
  assert.equal(reply.articles.length,0,raw);
 }
});
test("reported danger in a third-party question takes priority over clarification",()=>{
 const cases=[
  ["Opam homilador. Uning yelka uchi og‘riyapti va qon ketyapti.","emergency"],
  ["Onamda menopauzadan keyin jigarrang ajralma chiqdi.","urgent"],
  ["Dugonamda qon ketmoqda, hushdan ketdi.","emergency"]
 ];
 for(const [raw,level] of cases){
  const risk=assessMedicalRisk(raw),reply=answerMedicalQuestion(raw);
  assert.equal(risk.level,level,raw);
  assert.equal(reply.kind,"safety",raw);
  assert.equal(reply.urgent,true,raw);
  assert(reply.text.startsWith("⚠️ Savol boshqa odam haqida bo‘lsa"),raw);
  assert.match(reply.text,/Manba:/);
 }
});
test("mixed-speaker emergency does not claim which person has both symptoms",()=>{
 const raw="Opam homilador. Men qornim juda kuchli og‘riyapti.";
 const result=answerMedicalQuestion(raw);
 assert.equal(scope(raw).scope,"mixed");
 assert.equal(result.kind,"safety");
 assert.match(result.text,/Kimda aynan qaysi belgi borligi noma’lum/);
 assert.equal(result.articles.length,0);
});
test("multi-sentence, temporal and spelling variations retain serious warnings",()=>{
 const cases=[
  "Xomiladorman. Ko‘rishim xiralashdi. Boshim og‘riyapti.",
  "Homiladorman. Qon kelmoqda. Yelka uchim og‘riyapti.",
  "Kecha hushim ketdim. Bugun yaxshiman."
 ];
 for(const raw of cases){
  const reply=answerMedicalQuestion(raw);
  assert.equal(scope(raw).multipleSentences,true,raw);
  assert.equal(reply.kind,"safety",raw);
  assert.equal(reply.urgent,true);
 }
});
test("negated symptoms and brief generic questions do not generate severe diagnoses",()=>{
 const noRisk=[
  "Qon ketmayapti, nafasim qismayapti. Hayz sikli nima?",
  "Opamda qon ketmayapti. Menopauza haqida umumiy ma’lumot kerak."
 ];
 for(const raw of noRisk)assert.equal(assessMedicalRisk(raw).level,"none",raw);
 assert.equal(answerMedicalQuestion("Hayz sikli nima?").kind,"answer");
 assert.equal(answerMedicalQuestion("Jigar fermenti nima?").kind,"unknown");
});
test("speaker-context guard preserves all 500 existing fictional FAQ responses",()=>{
 const mistakes=[];
 for(const [key,questions] of Object.entries(TRAINING_UTTERANCES_500)){
  for(const raw of questions){
   const answer=answerMedicalQuestion(raw);
   if(answer.kind!=="answer"||answer.articles[0]?.key!==key)
    mistakes.push({key,raw,kind:answer.kind,matched:answer.articles[0]?.key});
  }
 }
 assert.equal(MEDICAL_TOPICS.length,50);
 assert.deepEqual(mistakes,[]);
});
test("speaker-context analyzer is bounded and does not call paid models, write logs or store profiles",()=>{
 assert.throws(()=>assessMedicalSpeaker("x".repeat(3001),"test"));
 assert.throws(()=>assessMedicalSpeaker("test","x".repeat(701)));
 const src=readFileSync(new URL("../bot-vercel/worker/medical-context-v120.js",import.meta.url),"utf8");
 const code=src.split("\n").filter(x=>!x.trimStart().startsWith("//")).join("\n");
 assert(!/\bfetch\s*\(|axios|openai|gemini|process\.env|localStorage|console\.(?:log|error)/i.test(code));
 assert(!/BOT_TOKEN|DATABASE_URL|WEBHOOK_SECRET/.test(src));
});
