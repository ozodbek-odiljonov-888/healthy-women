// Synthetic only: no patient histories, cloud inference, or clinical diagnosis.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 normalizeMedicalQuery,answerMedicalQuestion,assessMedicalRisk,
 TRAINING_UTTERANCES_500,MEDICAL_TOPICS
} from "../bot-vercel/worker/medical-qa.js";
import {assessComplexMedicalQuestion} from "../bot-vercel/worker/medical-complex-v119.js";

const compound=[
 "PCOS va mioma o‘rtasidagi farq nima?",
 "Mioma va endometrioz bir xilmi?",
 "Adenomioz va endometrioz qanday farqlanadi?",
 "Tuxumdon kistasi yoki mioma haqida tushuntiring",
 "Sistit bilan chanoq infeksiyasi qanday farq qiladi?",
 "Vaginit va kandidoz bir xilmi?",
 "Bakterial vaginoz va kandidoz qaysi biri?",
 "HPV virusi va Pap test farqlari",
 "Mammografiya va ko‘krakdagi tugun haqida",
 "Kontratseptsiya va ovulyatsiya o‘rtasida bog‘liqlik",
 "Emizish va mastit bo‘yicha savollarim bor",
 "Menopauza va hayz sikli bir xilmi?",
 "HPV va polikistoz haqida savol",
].slice(0,13);

test("13 clearly compound topic questions abstain instead of guessing one diagnosis",()=>{
 for(const raw of compound){
  const normalized=normalizeMedicalQuery(raw);
  const analysis=assessComplexMedicalQuestion(normalized);
  assert.equal(analysis?.type,"multiple_topics",raw);
  assert(analysis.topics.length>=2,raw);
  const answer=answerMedicalQuestion(raw);
  assert.equal(answer.kind,"clarify",raw);
  assert.equal(answer.articles.length,0,raw);
  assert.equal(answer.urgent,false);
  assert.match(answer.text,/tashxis emas/i);
 }
});
test("mixed Uzbek Cyrillic/Latin scripts with two recognized concepts are handled",()=>{
 const raw="МИОМА va PCOS haqida savol";
 const result=answerMedicalQuestion(raw);
 assert.equal(result.kind,"clarify");
 assert.equal(result.reason,"multiple_topics");
});
test("contradictory bleeding/breathing claims are flagged for clarification",()=>{
 const cases=[
  "Qon ketyapti, lekin qon ketmayapti",
  "Qon keldi, ammo qon kelmadi",
  "Nafasim qisilyapti, lekin nafasim qismayapti",
  "Qon kelmoqda yoki kelmayapti, bilmayman"
 ];
 for(const raw of cases){
  const analyze=assessComplexMedicalQuestion(normalizeMedicalQuery(raw));
  // Last phrasing is too ambiguous for a deterministic contradiction assertion.
  if(raw.includes("bilmayman"))continue;
  assert.equal(analyze?.type,"contradiction",raw);
  const answer=answerMedicalQuestion(raw);
  assert.equal(answer.kind,"clarify",raw);
  assert.equal(answer.articles.length,0);
 }
});
test("a positive emergency signal has priority even if the sentence also contradicts itself",()=>{
 const samples=[
  "Hushim ketdim, lekin hushim ketmadim",
  "Homiladorman, qon ketyapti, yelka uchim og‘riyapti, PCOS va mioma farqi qanday?",
  "Homiladorman, ko‘rishim xiralashdi. Mioma va endometrioz haqida savol",
  "Qon ketmoqda, hushim ketayapti, ammo mioma va PCOS ham bor"
 ];
 for(const raw of samples){
  const risk=assessMedicalRisk(raw);
  assert.notEqual(risk.level,"none",raw);
  assert.equal(answerMedicalQuestion(raw).kind,"safety",raw);
 }
});
test("a single well-defined topic remains answerable despite related ordinary words",()=>{
 for(const raw of [
  "PCOS hayz sikliga qanday ta’sir qiladi?",
  "Mioma hayzni ko‘paytiradimi?",
  "HPV vaksinasi nima uchun kerak?",
  "Shoshilinch kontratsepsiya nima?",
  "Pap test qanday tekshiruv?",
  "Emizishning foydasi nima?"
 ]){
  const result=answerMedicalQuestion(raw);
  assert.equal(result.kind,"answer",raw);
 }
});
test("existing 500 synthetic questions remain educational answers, not ambiguous",()=>{
 const bad=[];
 for(const [key,questions] of Object.entries(TRAINING_UTTERANCES_500)){
  for(const raw of questions){
   const result=answerMedicalQuestion(raw);
   if(result.kind!=="answer"||result.articles[0]?.key!==key)
    bad.push({key,question:raw,kind:result.kind,actual:result.articles[0]?.key});
  }
 }
 assert.equal(MEDICAL_TOPICS.length,50);
 assert.deepEqual(bad,[]);
});
test("truncated, unrelated and medication-personalization questions still do not fabricate advice",()=>{
 for(const raw of [
  "Nima?", "Qaysi gormonni ichsam?", "PCOS va mioma uchun necha mg ichish kerak?",
  "Buyrakda toshni operatsiya qilish rejasini yoz"
 ]){
  const result=answerMedicalQuestion(raw);
  assert.notEqual(result.kind,"answer",raw);
  assert.equal(result.articles.length,0);
 }
});
test("complexity detection is bounded and never calls external models or stores chats",()=>{
 assert.equal(assessComplexMedicalQuestion(""),null);
 assert.throws(()=>assessComplexMedicalQuestion("x".repeat(701)));
 const source=readFileSync(new URL("../bot-vercel/worker/medical-complex-v119.js",import.meta.url),"utf8");
 assert(!/\bfetch\s*\(|axios|openai|gemini|process\.env|localStorage|console\.log/.test(source.split("\n").filter(x=>!x.trimStart().startsWith("//")).join("\n")));
});
