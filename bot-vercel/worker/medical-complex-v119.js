// Healthy Women v1.19 — conservative ambiguity checks for compound medical questions.
// Local, deterministic, no AI model, web requests, logging or patient storage.
// Critical triage must run FIRST; this module only helps abstain from an
// unsupported comparison or an internally contradictory non-urgent question.

const CONDITION_ANCHORS=Object.freeze([
 {key:"pcos",label:"PCOS",phrases:["pcos","polikistoz","polikistik tuxumdon"]},
 {key:"mioma",label:"Mioma",phrases:["mioma","fibroid","bachadonda tugun"]},
 {key:"endometrioz",label:"Endometrioz",phrases:["endometrioz","endometriosis"]},
 {key:"adenomioz",label:"Adenomioz",phrases:["adenomioz","adenomyosis"]},
 {key:"tuxumdon_kistasi",label:"Tuxumdon kistasi",phrases:["tuxumdon kistasi","ovarian cyst"]},
 {key:"vaginit",label:"Vaginit",phrases:["vaginit","vaginitis"]},
 {key:"kandida",label:"Kandidoz",phrases:["kandidoz","kandida","thrush"]},
 {key:"bakterial_vaginoz",label:"Bakterial vaginoz",phrases:["bakterial vaginoz","bacterial vaginosis"]},
 {key:"siydik_yoli",label:"Siydik yo‘li infeksiyasi",phrases:["siydik yoli infeksiyasi","sistit","tsistit","uti"]},
 {key:"chanoq_infeksiyasi",label:"Chanoq a’zolari yallig‘lanishi",phrases:["chanoq infeksiyasi","chanoq yalliglanishi","pid"]},
 {key:"hpv",label:"HPV",phrases:["hpv virus","hpv virusi","papillomavirus","inson papilloma virusi"]},
 {key:"pap_test",label:"Bachadon bo‘yni skriningi",phrases:["pap test","pap smear","servikal skrining","bachadon boyni skrining"]},
 {key:"mammografiya",label:"Mammografiya",phrases:["mammografiya","mammogram"]},
 {key:"kokrak_tugun",label:"Ko‘krakdagi tugun",phrases:["kokrakda tugun","kokrak tuguni","breast lump"]},
 {key:"kontratseptsiya",label:"Kontratseptsiya",phrases:["kontratseptsiya","contraception","homiladorlikdan saqlanish"]},
 {key:"tezkor_himoya",label:"Shoshilinch kontratsepsiya",phrases:["favqulodda kontratsepsiya","shoshilinch kontratsepsiya","ertasi kuni tabletka"]},
 {key:"ovulyatsiya",label:"Ovulyatsiya",phrases:["ovulyatsiya","ovulyats","ovulation"]},
 {key:"menopauza",label:"Menopauza",phrases:["menopauza","menopoz","klimaks","perimenopauza"]},
 {key:"mastit",label:"Mastit",phrases:["mastit","mastitis"]},
 {key:"emizish",label:"Emizish",phrases:["emizish","emizaman","breastfeeding"]},
 {key:"sikl",label:"Hayz sikli",phrases:["hayz sikli","menstrual sikl"]},
 {key:"gigiyena",label:"Hayz gigiyenasi",phrases:["hayz gigiyenasi","menstrual gigiyena"]}
]);
const CONTRADICTIONS=Object.freeze([
 {topic:"qon ketishi",negative:/\bqon (?:ketmayapti|ketmadi|kelmayapti|kelmadi)\b/u,
  positive:/\bqon (?:ketmoqda|ketyapti|ketayapti|kelmoqda|keldi|ketdi)\b/u},
 {topic:"hushdan ketish",negative:/\bhush(?:im|dan) ket(?:mayapti|mayapman|madim|maganman)\b/u,
  positive:/\bhush(?:im|dan) ket(?:dim|moqda|yapti|ayapti)\b/u},
 {topic:"nafas qisishi",negative:/\bnafasim qis(?:mayapti|mayapman|madi)\b/u,
  positive:/\bnafasim qis(?:yapti|ilyapti|moqda|di)\b/u}
]);
function hasPhrase(s,phrase){
 let at=s.indexOf(phrase);
 while(at>=0){
  if((at===0||s[at-1]===" ") &&
    (at+phrase.length===s.length||s[at+phrase.length]===" "))return true;
  at=s.indexOf(phrase,at+1);
 }
 return false;
}
const hasAny=(s,phrases)=>phrases.some(p=>hasPhrase(s,p));
export const COMPLEX_REPLY="Savolingizda bir-biridan farqli tibbiy mavzular yoki qarama-qarshi alomatlar bor. Xato talqin qilmaslik uchun ularni alohida, umumiy savol sifatida yozing. Bot individual tashxis yoki dori tanlamaydi. Agar kuchli og‘riq, ko‘p qon ketishi, hushdan ketish, nafas qisilishi yoki homiladorlik bilan bog‘liq xavfli alomatlar bo‘lsa, tibbiy yordamga murojaat qiling.";

/**
 * Input must be output of normalizeMedicalQuery, BEFORE removing negations.
 * Output must not be taken as a medical diagnosis or proof of safety.
 * We avoid making an unsupported multi-condition comparison look authoritative.
 */
export function assessComplexMedicalQuestion(normalized){
 if(typeof normalized!=="string"||normalized.length>700)
  throw Error("Invalid medical question");
 if(!normalized)return null;
 const contradictions=CONTRADICTIONS.filter(c=>
  c.negative.test(normalized)&&c.positive.test(normalized)).map(c=>c.topic);
 if(contradictions.length)
  return {type:"contradiction",topics:contradictions};
 let mentions=CONDITION_ANCHORS.filter(item=>hasAny(normalized,item.phrases));
 // "Shoshilinch kontratsepsiya" is a narrower form of contraception,
 // not two unrelated problems. Do not turn existing FAQs into ambiguity.
 if(mentions.some(x=>x.key==="tezkor_himoya"))
  mentions=mentions.filter(x=>x.key!=="kontratseptsiya");
 // Requiring two separately, distinctly named topics minimizes false
 // positives for normal FAQ questions like "PCOS hayzga ta'sir qiladimi?".
 if(mentions.length>=2)
  return {type:"multiple_topics",topics:mentions.slice(0,4).map(x=>x.label)};
 return null;
}
