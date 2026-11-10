// Healthy Women 50-topic rule-based QA benchmark (synthetic data only).
// Generated templates are *not* independent medical validation.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MEDICAL_TOPICS,TRAINING_UTTERANCES_500,answerMedicalQuestion,findMedicalTopics,assessMedicalRisk,normalizeMedicalQuery} from "../bot-vercel/worker/medical-qa.js";
import {NEW_MEDICAL_TOPICS} from "../bot-vercel/worker/medical-training-v115.js";

const HOLDOUT=[
 ["Adenomioz siklga ta’sir qiladimi?","adenomioz"],
 ["UTTda tuxumdon kistasi ko‘rinibdi","tuxumdon_kistasi"],
 ["PID qanday infeksiya?","chanoq_infeksiyasi"],
 ["Bakterial vaginozda hid bo‘ladimi?","bakterial_vaginoz"],
 ["Qin zamburug‘i infeksiyasi alomatlari","kandida"],
 ["Xlamidiya tekshiruvi haqida","xlamidiya"],
 ["STI belgilari qanday?","jyi"],
 ["HPV virusi xavflimi?","hpv"],
 ["Gardasil nimadan himoya qiladi?","hpv_vaksina"],
 ["Pap smear nima uchun olinadi?","pap_test"],
 ["Sut bezida tugun aniqlansa-chi?","kokrak_tugun"],
 ["Mastalgia hayz bilan bog‘liqmi?","kokrak_ogriq"],
 ["Mammogram orqali nima ko‘rishadi?","mammografiya"],
 ["Infertility tekshiruvlari qanday?","bepushtlik"],
 ["Foliy kislota nega kerak?","folat"],
 ["Prenatal ko‘riklar foydasi qanday?","antenatal"],
 ["Toksikoz alomatlari qanday?","ertalab_kongil"],
 ["Ektopik homiladorlik haqida ayting","ektopik"],
 ["Spontan abort nimani bildiradi?","homila_tushish"],
 ["Preeklampsiya qanday holat?","preeklampsiya"],
 ["Gestational diabetes sababi nima?","gestatsion_diabet"],
 ["Tug‘ruq boshlanishi nimadan bilinadi?","tugruq_belgilari"],
 ["Breastfeeding nimaga foydali?","emizish"],
 ["Mastitis sababini tushuntiring","mastit"],
 ["Postpartum depression haqida","tugruqdan_keyingi_tushkunlik"],
 ["Pelvic floor nima degani?","chanoq_mushaklari"],
 ["Incontinence nima?","siydik_tutolmaslik"],
 ["Pelvic organ prolapse tushunchasi","chanoq_prolaps"],
 ["Temir tanqisligi nimadan bo‘ladi?","temir_tanqisligi"],
 ["Contraception usullari qanday?","kontratseptsiya"]
];
const FLAGS=[
 ["O‘zimga zarar yetkazmoqchiman","emergency"],
 ["Tug‘ruqdan keyin bolamga zarar yetkazish fikri keldi","emergency"],
 ["Homiladorman, kuchli bosh og‘rig‘i va ko‘rishim xiralashdi","urgent"],
 ["Homila harakati kamayib ketdi","urgent"],
 ["Bolam qimirlamayapti, 30 haftalik homiladorman","urgent"],
 ["Homiladorman, homila suvi ketib qoldi","urgent"],
 ["Homiladorlikda qon ketmoqda, hushim ketayapti","emergency"]
];

test("50 clinical topics include 30 new sources and 500 synthetic educational questions",()=>{
 assert.equal(MEDICAL_TOPICS.length,50);
 assert.equal(NEW_MEDICAL_TOPICS.length,30);
 assert.equal(Object.keys(TRAINING_UTTERANCES_500).length,50);
 assert.equal(Object.values(TRAINING_UTTERANCES_500).reduce((n,list)=>n+list.length,0),500);
 assert.equal(new Set(MEDICAL_TOPICS.map(t=>t.key)).size,50);
 for(const topic of MEDICAL_TOPICS){
  assert.equal(TRAINING_UTTERANCES_500[topic.key].length,10,topic.key);
  assert(/^https:\/\/(?:www\.)?(?:nhs\.uk|acog\.org)\//i.test(topic.url),topic.key);
 }
});
test("500 question variants have distinct normalized text and consistent topic labels",()=>{
 const seen=new Map();
 const errors=[];
 for(const [key,questions] of Object.entries(TRAINING_UTTERANCES_500)){
  for(const question of questions){
   const normalized=normalizeMedicalQuery(question);
   if(normalized.length<6)errors.push({key,reason:"too short",question});
   if(seen.has(normalized))errors.push({key,reason:"duplicate",other:seen.get(normalized),question});
   seen.set(normalized,key);
   const risk=assessMedicalRisk(question);
   const matched=findMedicalTopics(question,1)[0]?.key;
   const reply=answerMedicalQuestion(question);
   if(risk.level!=="none"||matched!==key||reply.kind!=="answer"||reply.articles[0]?.key!==key){
    errors.push({key,question,risk:risk.level,matched,kind:reply.kind});
   }
  }
 }
 assert.deepEqual(errors,[]);
 assert.equal(seen.size,500);
});
test("30 held-out paraphrases do not appear in the stored templates",()=>{
 const set=new Set(Object.values(TRAINING_UTTERANCES_500).flat().map(normalizeMedicalQuery));
 for(const [question] of HOLDOUT)assert(!set.has(normalizeMedicalQuery(question)),question);
});
test("30 previously unseen topic questions are classified with source-backed answers",()=>{
 const problems=[];
 for(const [question,key] of HOLDOUT){
  const r=answerMedicalQuestion(question);
  if(r.kind!=="answer"||r.articles[0]?.key!==key||!r.text.includes("Manba:"))
   problems.push({question,expected:key,kind:r.kind,actual:r.articles[0]?.key});
 }
 assert.deepEqual(problems,[]);
});
test("7 new risk phrases override any apparently relevant FAQ topic",()=>{
 const misses=[];
 for(const [question,level] of FLAGS){
  const risk=assessMedicalRisk(question),answer=answerMedicalQuestion(question);
  if(risk.level!==level||answer.kind!=="safety"||answer.articles.length!==0)
   misses.push({question,expected:level,level:risk.level,kind:answer.kind});
 }
 assert.deepEqual(misses,[]);
});
test("personal medication choices and unrelated problems do not gain a fabricated answer after expansion",()=>{
 for(const question of ["Menga qanday antibiotik ichishimni ayting","Ko‘krak yallig‘langanda qaysi dori ichsam?","Noma’lum retseptni menga yozib ber","Jigar fermentlari qanday hisoblanadi"]){
  const r=answerMedicalQuestion(question);
  assert.equal(r.kind,"unknown",question);
 }
});
test("new sourced topics contain educational claims but no prescriptions or UK-specific screening deadlines",()=>{
 for(const t of NEW_MEDICAL_TOPICS){
  assert(t.answer.length>=90&&t.answer.length<650,t.key);
  assert(t.words.length>=5,t.key);
  assert(!/\d+ ?mg|\d+ ?tabletka|kuniga \d+ mahal/i.test(t.answer),t.key);
 }
 assert(!MEDICAL_TOPICS.find(t=>t.key==="pap_test").answer.includes("25 yoshdan"));
});
test("new corpus is fully local with no paid model or personal health datastore",()=>{
 for(const filename of ["medical-training-v115.js","medical-topics-v115-a.js","medical-topics-v115-b.js"]){
  const source=readFileSync(new URL("../bot-vercel/worker/"+filename,import.meta.url),"utf8");
  const executable=source.split("\n").filter(x=>!x.trimStart().startsWith("//")).join("\n");
  assert(!/fetch\s*\(|axios|process\.env|openai\.com|gemini|localStorage\.setItem|console\.log\(/i.test(executable),filename);
  assert(!/WEBHOOK_SECRET|DATABASE_URL|BOT_TOKEN/.test(source),filename);
 }
});
