import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MEDICAL_TOPICS,normalizeMedicalQuery,findMedicalTopics,assessMedicalRisk,answerMedicalQuestion} from "../bot-vercel/worker/medical-qa.js";

test("twenty health topics have a source-backed concise educational answer",()=>{
 assert.equal(MEDICAL_TOPICS.length,20);
 assert.equal(new Set(MEDICAL_TOPICS.map(x=>x.key)).size,11);
 for(const item of MEDICAL_TOPICS){
  assert(item.answer.length>60&&item.answer.length<750);
  assert(item.words.length>=2);
  assert(/^https:\/\/(www\.)?(nhs\.uk|acog\.org)\//.test(item.url));
 }
});
test("Uzbek Latin apostrophe and Cyrillic variants normalize consistently",()=>{
 assert.equal(normalizeMedicalQuery("Ҳайз оғриғи ва қон кетиши"),"hayz ogrigi va qon ketishi");
 assert.equal(normalizeMedicalQuery("Hayz og‘rig‘i va qon ketishi"),"hayz ogrigi va qon ketishi");
 assert.equal(normalizeMedicalQuery("HAYZ OG'RIG'I"),"hayz ogrigi");
});
test("simple free-text questions match the proper health topic",()=>{
 const examples=[
  ["Hayz sikli necha kun?","sikl"],
  ["Hayz qancha kun davom etadi?","davomiylik"],
  ["Hayz og‘rig‘i uchun nima qilish mumkin?","ogriq"],
  ["Ko‘p qon ketishi nimadan?","qon"],
  ["Hayzim kechikyapti, nima qilaman?","kechikish"],
  ["Siklim nomuntazam bo‘lsa nima qilay?","nomuntazam"],
  ["Homiladorlik testi qachon qilish kerak?","test"],
  ["Ovulyatsiya qachon bo‘ladi?","ovulyatsiya"],
  ["Hayz oldi kayfiyat o‘zgarishiga nima sabab?","pms"],
  ["Menopauza belgilari qanday?","menopauza"],
  ["Endometrioz nima degani?","endometrioz"]
 ];
 for(const [q,key] of examples){
  assert.equal(findMedicalTopics(q,1)[0]?.key,key,q);
  const answer=answerMedicalQuestion(q);
  assert.equal(answer.kind,"answer",q);
  assert(answer.text.includes("Manba:"),q);
 }
});
test("Cyrillic user questions work without an external ML/translation API",()=>{
 assert.equal(findMedicalTopics("Ҳайз оғриғи кучайди")[0]?.key,"ogriq");
 assert.equal(findMedicalTopics("Ҳайзим кечикяпти")[0]?.key,"kechikish");
});
test("unsupported, unrelated and treatment-dosing questions do not invent answers",()=>{
 for(const q of ["", "Qaysi antibiotikni 500 mg ichishim kerak?", "Bosh og‘riq uchun retsept yozib bering", "Qon bosimim 160, dori ayting"]){
  const result=answerMedicalQuestion(q);
  assert.equal(result.kind,"unknown",q);
  assert.equal(result.articles.length,0);
  assert.match(result.text,/ishonchli|shifokor/i);
 }
});
test("heavy bleeding with collapse or breathlessness is escalated, not answered as routine",()=>{
 for(const q of ["Qon ko‘p ketyapti va boshim aylanmoqda", "Hayz qoni kelmoqda, hushdan ketdim", "Qon ketishi va nafas qisilishi"]){
  const risk=assessMedicalRisk(q);
  assert.equal(risk.level,"emergency",q);
  const reply=answerMedicalQuestion(q);
  assert.equal(reply.kind,"safety");
  assert.equal(reply.articles.length,0);
 }
});
test("hourly soaked hygiene product requires urgent evaluation without automatically labeling collapse",()=>{
 const q="Har soat prokladka to‘lyapti, nima qilay?";
 assert.equal(assessMedicalRisk(q).level,"urgent");
 assert.equal(answerMedicalQuestion(q).kind,"safety");
});
test("pregnancy possibility with pelvic pain or bleeding is escalated",()=>{
 for(const q of ["Homiladorman va qornim og‘riyapti", "Homiladorlik ehtimoli bor, qon ketmoqda"]){
  assert.equal(assessMedicalRisk(q).level,"urgent",q);
 }
 assert.equal(assessMedicalRisk("Homiladorman, qorin juda kuchli og‘riyapti").level,"emergency");
});
test("explicitly negative test with ordinary non-severe pain does not claim pregnancy emergency",()=>{
 assert.equal(assessMedicalRisk("Homiladorlik test manfiy, qorin sal og‘riyapti").level,"none");
});
test("unknown health topics and medication questions never manufacture clinical claims",()=>{
 const a=answerMedicalQuestion("Menga tomoq yallig‘lanishi uchun ukol yozib bering");
 assert.equal(a.kind,"unknown");
 assert(!/antibiotik doza|kuniga ikki mahal/i.test(a.text));
});
test("all answers disclose sources and that they are not a diagnosis",()=>{
 for(const item of MEDICAL_TOPICS){
  const result=answerMedicalQuestion(item.words[0]);
  assert.equal(result.kind,"answer");
  assert(result.text.includes(item.url));
  assert(result.text.includes("tashxis emas"));
 }
});
test("the free QA module has no network, secret lookup, or persistent question storage",()=>{
 const src=readFileSync(new URL("../bot-vercel/worker/medical-qa.js",import.meta.url),"utf8");
 const executable=src.split("\n").filter(line=>!line.trimStart().startsWith("//")).join("\n");
 assert(!/fetch\s*\(|axios|openai|gemini|process\.env|localStorage|console\.(?:log|error)/i.test(executable));
 assert(!/apiKey|API_KEY|BOT_TOKEN/.test(src));
});
