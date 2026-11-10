// Healthy Women v1.20 — safe, limited Uzbek speaker/reference awareness.
// No generative model, API, IP address, history, user profile or question logs.
// This detects a small list of clear textual cues; it is NOT clinical NLP.
// Medical urgency is ALWAYS assessed before applying the response rules here.

const SELF=[
 "men","menda","mening","mendan","ozim","ozimda","ozimni",
 "hayzim","hayzlarim","qornim","qorinim","boshim","kozim","korishim",
 "nafasim","homiladorman","homiladorm an","homiladorligim"
];
const OTHER=[
 "onam","opam","singlim","dugonam","qizim","xolam","ammam",
 "rafiqam","ayolim","turmush ortogim","xotinim","kelinim",
 "bemorda","bemorga","bemorim","onasi","opasi",
 "boshqa odam","bir ayol","bir qiz"
];
// These words indicate an individual is reporting or asking for help about
// concrete symptoms; do NOT generate patient-specific conclusions from them.
const SYMPTOM_MARKERS=[
 "ogri","ogriy","sanch","qon ket","qon kel","qon oq",
 "kechik","kelyapti","kelmay","isitma","toshma","qus",
 "ajralma","shish","xiralash","hushim","hushdan",
 "nafas qis","nafasim","test musbat","test manfiy",
 "qimirlam","harakat kamay","holsizlik","bosh aylan"
];
const EDUCATION_MARKERS=[
 "haqida umumiy","umumiy malumot","tushuntirib ber",
 "nima degani","nima ekan","nima uchun","ta rifi",
 "nimani anglatadi","haqida oqimoqchiman"
];
const UNCERTAIN_MARKERS=[
 "kimda","kimniki","qaysimiz","qaysi birimiz","aniq bilmayman"
];
function includesPhrase(value,phrase){
 let at=value.indexOf(phrase);
 while(at!==-1){
  if((at===0||value[at-1]===" ") &&
     (at+phrase.length===value.length||value[at+phrase.length]===" "))return true;
  at=value.indexOf(phrase,at+1);
 }
 return false;
}
const any=(n,items)=>items.some(item=>includesPhrase(n,item)||
 // Allow only deliberately listed inflected symptom stems, not arbitrary edit-distance.
 (SYMPTOM_MARKERS===items && n.split(" ").some(w=>w.startsWith(item)&&w.length>item.length)));
export const OTHER_PERSON_CLARIFICATION=
 "Savolingiz boshqa bir odamning holatiga o‘xshaydi. O‘sha odamning alomatlarini taxminan tashxislash o‘rniga, alohida va shaxsiy ma’lumotlarsiz umumiy tibbiy mavzuni so‘rang. Agar ahvoli og‘irlashsa yoki xavfli alomatlar bo‘lsa, u tibbiy yordamga murojaat qilishi kerak.";
export const MIXED_PERSON_CLARIFICATION=
 "Savolda bir nechta odam yoki alomatlarning kimga tegishli ekani noaniq. Iltimos, odamlarni ajratib, shaxsiy ma’lumotlarsiz bitta umumiy savol bering. Xavfli alomatlar bo‘lsa, o‘sha alomatga ega odam tibbiy yordamga murojaat qilishi kerak.";
export const THIRD_PERSON_RISK_PREFIX=
 "⚠️ Savol boshqa odam haqida bo‘lsa, quyidagi ogohlantirish aynan alomatlari bor odam uchun: ";
export const MIXED_PERSON_RISK_PREFIX=
 "⚠️ Xabarda turli odamlarning alomatlari aralash bo‘lishi mumkin. Kimda aynan qaysi belgi borligi noma’lum; shunga qaramay xavfli belgilar bo‘lsa, ular bor odam shoshilinch yordamga murojaat qilishi kerak. ";

export function assessMedicalSpeaker(raw,normalized){
 if(typeof raw!=="string"||typeof normalized!=="string"||
    raw.length>3000||normalized.length>700)
  throw Error("Invalid medical context input");
 const n=normalized.trim();
 if(!n)return {scope:"unspecified",multipleSentences:false,personalSymptoms:false,generalQuestion:false};
 const self=any(n,SELF),other=any(n,OTHER);
 const uncertain=any(n,UNCERTAIN_MARKERS);
 const symptom=any(n,SYMPTOM_MARKERS);
 const general=any(n,EDUCATION_MARKERS);
 const scope=uncertain||self&&other?"mixed":other?"other":self?"self":"unspecified";
 const multipleSentences=(raw.match(/[.!?]+/gu)||[]).length>=2;
 return {scope,multipleSentences,personalSymptoms:symptom,generalQuestion:general&&!symptom};
}
