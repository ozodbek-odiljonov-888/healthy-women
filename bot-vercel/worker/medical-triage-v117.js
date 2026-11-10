// Healthy Women v1.17 — conservative *additional* safety guards.
// Facts checked against NHS patient guidance, 2026-11-10. No remote calls.
// Input must already be normalized Uzbek Latin (including explicit negations).
// This does not diagnose and does not guarantee complete symptom coverage.
const PREGNANCY_BLEED="https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/";
const ECTOPIC="https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/";
const POSTMENOPAUSE="https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/";
const PADS="https://www.nhs.uk/conditions/heavy-periods/";

const includesAny=(text,items)=>items.some(item=>text.includes(item));
const bleeding=(n)=>includesAny(n,["qon kel","qon ket","qon oq","hayz qoni","vaginal qon","qonli ajralma"]);
const pregnancy=(n)=>includesAny(n,["homilador","homiladorman","homiladorlik ehtimol","test ijobiy","test musbat"]);
const pregnantNegative=(n)=>includesAny(n,["homilador emas","homiladorlik testi manfiy","test manfiy","test negativ"]);
const shoulderTip=(n)=>includesAny(n,["yelka uchim ogri","yelka uchi ogri","yelkam uchida ogri","yelkaning uchida ogri"]);
const padEachHour=(n)=>/\b(?:har\s*(?:bir|1)\s*soat(?:da)?\s*(?:prokladka|tampon)|(?:prokladka|tampon)\s*har\s*(?:bir|1)\s*soat(?:da)?|(?:prokladka|tampon).{0,28}\b1\s*soat(?:da)?|1\s*soat(?:da)?.{0,28}(?:prokladka|tampon))\b/.test(n);
const saturated=(n)=>includesAny(n,["tolib qol","tez tolib","shimib","shimi","tolmoqda","toladi","tolgan","sopping"]);
const afterMenopause=(n)=>includesAny(n,["menopauzadan keyin","menopauzadan song","menopauzadan keyingi","klimaksdan keyin","12 oydan beri hayz bolmay"]);
const postmenopausalSpotting=(n)=>includesAny(n,["jigarrang","pushti","dog","ajralma","qon","spotting"]);

export function priorityMedicalSafety(n){
 if(typeof n!=="string"||n.length>700)throw Error("Invalid medical triage input");
 if(!n)return null;
 const expecting=pregnancy(n)&&!pregnantNegative(n);
 const hasBlood=bleeding(n);
 // NHS: pregnant + shoulder-tip pain with bleeding or severe blood loss -> emergency.
 if(expecting&&hasBlood&&(shoulderTip(n)||(padEachHour(n)&&saturated(n))
   ||includesAny(n,["juda kop qon","kuchli qon ket","kop qon ket","qon juda kop"]))){
  return {level:"emergency",text:"⚠️ Homiladorlik ehtimoli bilan qon ketishi va yelka uchidagi og‘riq yoki juda ko‘p qon ketishi shoshilinch holat bo‘lishi mumkin. Darhol shoshilinch tibbiy yordamga murojaat qiling.",url:PREGNANCY_BLEED};
 }
 // An ectopic pregnancy can present without vaginal bleeding.
 if(expecting&&shoulderTip(n)){
  return {level:"urgent",text:"⚠️ Homiladorlik ehtimoli va yelka uchidagi og‘riq bachadondan tashqari homiladorlikda uchrashi mumkin. Zudlik bilan tibbiy baholashga murojaat qiling.",url:ECTOPIC};
 }
 if(afterMenopause(n)&&postmenopausalSpotting(n)){
  return {level:"urgent",text:"⚠️ Menopauzadan keyin qonli, pushti yoki jigarrang ajralma oz bo‘lsa ham shifokor ko‘rigini talab qiladi. Sababini chat orqali aniqlab bo‘lmaydi.",url:POSTMENOPAUSE};
 }
 if(hasBlood&&padEachHour(n)&&saturated(n)){
  return {level:"urgent",text:"⚠️ Prokladka yoki tampon har soatda to‘lib qolsa, bu ko‘p qon ketishi bo‘lishi mumkin. Bugunoq tibbiy ko‘rikka murojaat qiling. Bosh aylanishi, hushdan ketish, kuchli og‘riq yoki nafas qisishi bo‘lsa, shoshilinch yordam zarur.",url:PADS};
 }
 return null;
}
