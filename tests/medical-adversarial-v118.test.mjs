// Synthetic hard cases only. Not a performance claim on real patient text.
import test from "node:test";
import assert from "node:assert/strict";
import {checkMedicalQuestionBoundaries} from "../bot-vercel/worker/medical-boundaries-v118.js";
import {normalizeMedicalQuery,answerMedicalQuestion,assessMedicalRisk} from "../bot-vercel/worker/medical-qa.js";
import bot from "../bot-vercel/worker/index.js";

const COMPARISONS=[
 "PCOS va mioma farqi nimada?",
 "Endometrioz va adenomioz farqi haqida ayting",
 "Bakterial vaginoz va kandidoz qaysi biri boshqa?",
 "Mioma va endometrioz haqida solishtirib bering",
 "HPV va xlamidiya farqlari qanday?",
 "Vaginit va kandidoz ikkalasi bir xilmi?",
 "Menopauza va PCOSni taqqoslab bering"
];
const INDIVIDUAL=[
 "Menga tashxis qo‘yib bering",
 "Menda nima kasallik bor?",
 "Mening UTT natijam chiqdi, tashxis ayting",
 "UTTda 5 sm mioma chiqdi, operatsiya kerakmi?",
 "UZI natijamda 30 mm kista chiqdi, operatsiya kerakmi?",
 "Menga operatsiya kerakmi?",
 "Tahlilim natijamga qarab tashxis ayting",
 "Necha mg dori ichishim kerak?",
 "Menga retsept bering"
];
const DANGEROUS=[
 ["Homiladorman, qon ketyapti, yelka uchim og‘riyapti","emergency"],
 ["Qon ketmayapti, lekin hushim ketayapti","emergency"],
 ["Qon ketyapti, hushdan ketdim","emergency"],
 ["Homiladorman va qornim juda kuchli og‘riyapti","emergency"],
 ["Homiladorman, qon ketyapti va har soat prokladka to‘lib qolmoqda","emergency"],
 ["O‘zimga zarar yetkazmoqchiman","emergency"],
 ["Tug‘ruqdan keyin bolamga zarar yetkazish fikri keldi","emergency"],
 ["Homila harakati kamayib ketdi","urgent"],
 ["Bolam qimirlamayapti","urgent"],
 ["Homiladorman, ko‘rishim xiralashdi","urgent"],
 ["Homiladorman, homila suvi ketib qoldi","urgent"],
 ["Menopauzadan keyin jigarrang ajralma chiqdi","urgent"],
 ["Homiladorlik ehtimoli bor, yelka uchim og‘riyapti","urgent"],
 ["Har soat prokladka to‘lib qolmoqda","urgent"],
 ["Siyganda achishadi, isitma va belim og‘riyapti","urgent"],
 ["Tampon ishlataman, isitma va toshma chiqdi","urgent"]
];
const NORMAL=[
 "PCOS nima?",
 "Hayz sikli necha kun?",
 "Endometrioz haqida ma’lumot",
 "Ovulyatsiya qachon bo‘ladi?",
 "Foliy kislota nima uchun kerak?",
 "Mastit nima?",
 "Xayzim kechikvotti",
 "Hayz oldi sindromi qanday bo‘ladi?"
];

test("multi-disease comparison prompts avoid an invented one-sided answer",()=>{
 for(const q of COMPARISONS){
  const rule=checkMedicalQuestionBoundaries(normalizeMedicalQuery(q));
  assert.equal(rule.blocked,true,q);
  assert.equal(rule.reason,"multi_topic_comparison");
  const answer=answerMedicalQuestion(q);
  assert.equal(answer.kind,"unknown",q);
  assert.deepEqual(answer.articles,[]);
 }
});
test("individual test results, surgery or prescription requests never receive a bot diagnosis",()=>{
 for(const q of INDIVIDUAL){
  const answer=answerMedicalQuestion(q);
  assert.equal(answer.kind,"unknown",q);
  assert.deepEqual(answer.articles,[]);
 }
});
test("life-threatening or urgent symptoms override ambiguity and diagnosis guards",()=>{
 for(const [q,level] of DANGEROUS){
  const risk=assessMedicalRisk(q);
  assert.equal(risk.level,level,q);
  const answer=answerMedicalQuestion(q);
  assert.equal(answer.kind,"safety",q);
  assert.equal(answer.urgent,true);
  assert.equal(answer.articles.length,0);
 }
});
test("ordinary standalone health questions still receive a source-backed educational answer",()=>{
 for(const q of NORMAL){
  const answer=answerMedicalQuestion(q);
  assert.equal(answer.kind,"answer",q);
  assert.equal(answer.articles.length,1);
  assert.match(answer.text,/Manba:/);
 }
});
test("medical boundary rejects invalid internal values without auto-generating a diagnosis",()=>{
 assert.throws(()=>checkMedicalQuestionBoundaries("x".repeat(701)));
 assert.throws(()=>checkMedicalQuestionBoundaries(null));
});
test("public knowledge GET does not expose a one-sided disease comparison or personalized result",async()=>{
 const ENV={BOT_TOKEN:"FICTIONAL_TOKEN",WEBHOOK_SECRET:"FICTIONAL_SECRET",ALLOWED_ORIGINS:"https://healthy-women.vercel.app"};
 for(const q of ["PCOS va mioma farqi nimada?","UTTda 5 sm mioma chiqdi, operatsiya kerakmi?"]){
  const u=new URL("https://healthy-women-bot.example/api/knowledge");
  u.searchParams.set("q",q);
  const res=await bot.fetch(new Request(u,{headers:{Origin:"https://healthy-women.vercel.app"}}),ENV);
  assert.equal(res.status,200);
  const data=await res.json();
  assert.deepEqual(data.articles,[]);
  assert.equal(data.urgent,false);
 }
});
