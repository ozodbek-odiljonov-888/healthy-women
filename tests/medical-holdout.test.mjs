// Holdout questions were NOT placed in the 120 training examples.
// This checks limited phrase generalization, not clinical validation.
import test from "node:test";
import assert from "node:assert/strict";
import {normalizeMedicalQuery,findMedicalTopics,answerMedicalQuestion,assessMedicalRisk} from "../bot-vercel/worker/medical-qa.js";
import {TRAINING_UTTERANCES} from "../bot-vercel/worker/medical-curriculum.js";

const HOLDOUT=[
 ["Siklim 30 kunlik bo‘lib qolgan, bu nimani anglatadi?","sikl"],
 ["Necha kun davom etsa hayz odatiy bo‘ladi?","davomiylik"],
 ["Hayzimda qorinim og‘riyapti, qanday yengillashtiraman?","ogriq"],
 ["Laxta kelishi ko‘p qon ketishi bilan bog‘liqmi?","qon"],
 ["Hayz boshlanishi kechikmoqda, nima qilay?","kechikish"],
 ["Menstrual siklim juda notekis bo‘ldi","nomuntazam"],
 ["Test ijobiy bo‘lsa shifokorga qachon borish kerak?","test"],
 ["Ovulyatsiya testini qachon o‘tkazsam?","ovulyatsiya"],
 ["Hayzdan oldin yig‘lagim keladi, PMS bo‘lishi mumkinmi?","pms"],
 ["Perimenopauza va klimaks farqi nima?","menopauza"],
 ["Endometriosis tashxisiga o‘xshash alomatlar","endometrioz"],
 ["Birinchi hayz haqidagi savollar","birinchi_hayz"],
 ["Hayzdan tashqari qonli dog‘ nimadan keladi?","oraliq_qon"],
 ["Oq ajralma hidsiz bo‘lsa xavflimi?","ajralma"],
 ["Vaginitni qanday bilish mumkin?","vaginit"],
 ["Siydik yo‘li infeksiyasi qachon davolanadi?","siydik_yoli"],
 ["Polikistoz gormon buzilishimi?","pcos"],
 ["Mioma UZI da ko‘rinadimi?","mioma"],
 ["Himoyasiz aloqa bo‘lib qoldi, qanday himoyalanish mumkin?","tezkor_himoya"],
 ["Hayz gigiyenasi uchun nima maslahat?","gigiyena"],
 ["Qindan yomon hidli ajralma chiqmoqda","ajralma"],
 ["Siyganda kuydiradi, sabab bo‘lishi mumkinmi?","siydik_yoli"],
 ["Kondom yirtilib ketdi","tezkor_himoya"],
 ["Tamponni nechchi soatda almashtiray?","gigiyena"]
];

test("holdout examples are independent of all 120 stored training phrases",()=>{
 const train=new Set(Object.values(TRAINING_UTTERANCES).flat().map(normalizeMedicalQuery));
 for(const [question] of HOLDOUT)assert(!train.has(normalizeMedicalQuery(question)),question);
});
test("24 never-seen, ordinary health questions select correct topics, not canned alternatives",()=>{
 const failures=[];
 for(const [question,expected] of HOLDOUT){
  const found=findMedicalTopics(question,1)[0]?.key??"none";
  const output=answerMedicalQuestion(question);
  if(found!==expected||output.kind!=="answer"||output.articles[0]?.key!==expected)
   failures.push({question,expected,found,kind:output.kind});
 }
 assert.deepEqual(failures,[]);
});
test("holdout emergency phrasings outrank routine topic advice",()=>{
 const redFlags=[
  ["Qon ketishi kuchli, nafasim qisilib qoldi","emergency"],
  ["Homilador bo‘lishim mumkin, bir tomondan qornim juda qattiq og‘riyapti","emergency"],
  ["Har soat bitta prokladka to‘lib qolmoqda","urgent"],
  ["Menopauzadan keyin qon kelyapti","urgent"]
 ];
 const failures=[];
 for(const [question,expected] of redFlags){
  const actual=assessMedicalRisk(question).level;
  if(actual!==expected||answerMedicalQuestion(question).kind!=="safety")failures.push({question,expected,actual});
 }
 assert.deepEqual(failures,[]);
});
