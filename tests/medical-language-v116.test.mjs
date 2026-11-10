import test from "node:test";
import assert from "node:assert/strict";
import {normalizeMedicalQuery,answerMedicalQuestion,assessMedicalRisk,findMedicalTopics} from "../bot-vercel/worker/medical-qa.js";
import {fixConservativeMedicalTypos,removeExplicitNegatedSymptoms} from "../bot-vercel/worker/medical-language-v116.js";

test("common Uzbek Latin/Cyrillic spelling mistakes normalize conservatively",()=>{
 const cases=[
  ["Xayz sikli","hayz sikli"],
  ["Хайз сикли","hayz sikli"],
  ["Xomiladorlik","homiladorlik"],
  ["proklatka","prokladka"],
  ["Ovulatsiya","ovulyatsiya"],
  ["mammagrafiya","mammografiya"],
  ["kantratseptsiya","kontratseptsiya"],
  ["Hayzim kechikvotti","hayzim kechikyapti"],
  ["Qornm ogrivotti","qornim ogriyapti"],
  ["Qon ketvotti","qon ketyapti"]
 ];
 for(const [raw,want] of cases)assert.equal(normalizeMedicalQuery(raw),want,raw);
 assert.equal(fixConservativeMedicalTypos("ovulatsiya"),"ovulyatsiya");
});
test("typo dictionary supports topic lookups without model, embeddings or web calls",()=>{
 const cases=[
  ["Xayz sikli qanday hisoblanadi?","sikl"],
  ["Xayzim kechikvotti","kechikish"],
  ["Ovulatsiya qachon bo‘ladi?","ovulyatsiya"],
  ["Kontrasepsiya usullari","kontratseptsiya"],
  ["Mammagrafiya tekshiruvi","mammografiya"],
  ["Proklatka tez to‘lyapti","qon"]
 ];
 for(const [q,key] of cases)assert.equal(findMedicalTopics(q,1)[0]?.key,key,q);
});
test("an explicitly negated symptom does not itself create an emergency",()=>{
 for(const q of [
  "Qon ketmayapti va nafasim qismayapti",
  "Qon kelmayapti, boshim aylanmayapti",
  "Hushdan ketmadim va nafasim qismayapti",
  "Hushim ketmayapti"
 ]){
  assert.equal(assessMedicalRisk(q).level,"none",q);
 }
 assert.equal(removeExplicitNegatedSymptoms("qon ketmayapti lekin boshim aylanmayapti"),"lekin");
});
test("mixed negative and positive symptoms preserve genuine emergency signals",()=>{
 const cases=[
  ["Qon ketmayapti, lekin hushim ketvotti","emergency"],
  ["Qon ketmayapti ammo nafasim qisilyapti va qornim qattiq ogriyapti","emergency"],
  ["Xomiladorman, qornm qattiq ogrivotti","emergency"],
  ["Proklatka har soat to‘lib qolmoqda","urgent"],
  ["Bolam qimirlamayapti, homiladorman","urgent"]
 ];
 for(const [q,level] of cases){
  assert.equal(assessMedicalRisk(q).level,level,q);
  assert.equal(answerMedicalQuestion(q).kind,"safety",q);
 }
});
test("general educational questions mentioning fainting are not misclassified as events",()=>{
 assert.equal(assessMedicalRisk("Hushdan ketish nima?").level,"none");
});
test("typographic fixes do not mutate unrelated personal or medication wording",()=>{
 assert.equal(normalizeMedicalQuery("Necha mg antibiotik ichay?"),"necha mg antibiotik ichay");
 assert.equal(answerMedicalQuestion("Necha mg antibiotik ichay?").kind,"unknown");
 assert.equal(normalizeMedicalQuery("PCOS va xayzim haqida"),"pcos va hayzim haqida");
});
test("normalization is bounded and fails safely on malformed internal use",()=>{
 assert.throws(()=>fixConservativeMedicalTypos("a".repeat(701)));
 assert.throws(()=>removeExplicitNegatedSymptoms("a".repeat(701)));
 assert.equal(normalizeMedicalQuery(" ".repeat(1000)),"");
});
