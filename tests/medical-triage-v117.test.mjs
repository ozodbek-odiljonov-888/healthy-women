import test from "node:test";
import assert from "node:assert/strict";
import {answerMedicalQuestion,assessMedicalRisk,normalizeMedicalQuery} from "../bot-vercel/worker/medical-qa.js";
import {priorityMedicalSafety} from "../bot-vercel/worker/medical-triage-v117.js";

const verify=(q,level)=>{const risk=assessMedicalRisk(q);assert.equal(risk.level,level,q);assert.equal(answerMedicalQuestion(q).kind,"safety",q);assert.match(risk.url,/^https:\/\/www\.nhs\.uk\//);};

test("pregnant, bleeding and shoulder-tip pain always trigger emergency guidance",()=>{
 for(const q of [
  "Homiladorman, qon ketyapti va yelka uchim og‘riyapti",
  "Homiladorlik ehtimoli bor, yelka uchi og‘rig‘i va qon kelmoqda",
  "Homiladorlik testi musbat, vaginal qon ketmoqda, yelkam uchida og‘riq bor"
 ])verify(q,"emergency");
});
test("pregnancy bleeding soaking a pad each hour requires emergency escalation",()=>{
 for(const q of [
  "Homiladorman, qon ketyapti, har 1 soatda prokladka to‘lib qolmoqda",
  "Homiladorlik ehtimoli bor, prokladka har bir soat to‘ladi, qon ketishi ko‘p"
 ])verify(q,"emergency");
});
test("pregnancy and shoulder-tip pain without bleeding still requires urgent care",()=>{
 verify("Homiladorlik ehtimoli bor, yelka uchim og‘riyapti","urgent");
});
test("menopause with minor pink or brown spotting never gets routine reassurance",()=>{
 for(const q of [
  "Menopauzadan keyin ozgina jigarrang ajralma paydo bo‘ldi",
  "Klimaksdan keyin pushti dog‘ chiqyapti",
  "Menopauzadan so‘ng qonli ajralma keldi"
 ])verify(q,"urgent");
});
test("hourly soaked pads during normal menstruation triggers urgent not automatic emergency",()=>{
 verify("Hayz qoni har 1 soatda prokladka to‘lib qolmoqda","urgent");
 verify("Hayzda qon ketyapti, prokladka har bir soat to‘ladi","urgent");
});
test("negative or unrelated educational questions do not get priority red-flag false positive",()=>{
 const cases=[
  "Homilador emasman, qon ketmayapti, yelkam uchida og‘riq bor",
  "Menopauzadan keyingi ajralma nima ekanini o‘qimoqchiman",
  "Homiladorlikda qon ketishi sabablari haqida umumiy ma’lumot",
  "Prokladkani har bir soatda almashtirish kerakmi?"
 ];
 for(const q of cases){
  const normalized=normalizeMedicalQuery(q);
  const result=priorityMedicalSafety(normalized);
  assert.equal(result,null,q);
 }
});
test("no single patient text or drug instruction leaves the deterministic triage module",()=>{
 assert.equal(priorityMedicalSafety(""),null);
 assert.throws(()=>priorityMedicalSafety("x".repeat(701)));
});
