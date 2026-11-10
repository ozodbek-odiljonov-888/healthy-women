// Healthy Women: $0 rule-based medical knowledge assistant (Uzbek).
import {ADDITIONAL_MEDICAL_TOPICS,TRAINING_UTTERANCES,UNSUPPORTED_TRAINING_UTTERANCES} from "./medical-curriculum.js";
// No paid models, API calls, patient database, request logs or model claims.
// Editorial sources: NHS and ACOG. This is NOT a diagnosis or emergency service.
const DISCLAIMER="\n\nℹ️ Bu umumiy ma’lumot, tashxis emas. Botga shaxsiy tibbiy tarix yoki maxfiy ma’lumot yubormang.";
const UNKNOWN="Bu savol bo‘yicha ishonchli qisqa javob topilmadi. Savolni umumiy tarzda qayta yozing yoki shifokorga murojaat qiling. Dori dozasini, retseptni yoki shaxsiy tashxisni bot belgilamaydi.";
const EMERGENCY_SOURCE="https://www.nhs.uk/symptoms/pelvic-pain/";
const PREGNANCY_SOURCE="https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/";

export const MEDICAL_TOPICS=Object.freeze([
 {key:"sikl",title:"Hayz sikli",words:["hayz sikli","sikl","menstrual sikl","hayz oraligi","hayz orasidagi","hayz har necha","28 kun"],
  answer:"Sikl hayzning birinchi kunidan keyingi hayzning birinchi kunigacha hisoblanadi. Kattalarda ko‘pincha 21–35 kun, o‘smirlarda esa 21–45 kun bo‘lishi mumkin. Kalendar taxminiy sanani ko‘rsatadi, tashxis yoki kontratsepsiya vositasi emas.",
  url:"https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods"},
 {key:"davomiylik",title:"Hayz necha kun davom etadi?",words:["hayz davomiyligi","hayz qancha kun","hayz necha kun","necha kun davom","hayz uzoq","7 kundan","hayz tugamay","hayz davom"],
  answer:"Hayz ko‘pincha 2–7 kun davom etadi. Qon ketishi 7 kundan ortsa, odatdagidan ko‘paysa yoki takrorlansa, tibbiy baholash kerak.",
  url:"https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods"},
 {key:"ogriq",title:"Hayz og‘rig‘i",words:["hayz ogr","qorin ogr","ogriq","ogri","sanch","dismenoreya","bel ogri"],
  answer:"Hayz oldidan yoki hayz paytida qorin tortishi uchrashi mumkin. Iliq kompress, iliq dush va yengil harakat ba’zan yengillik beradi. Og‘riq kuchaysa, odatdagidan farq qilsa yoki kundalik hayotga xalaqit bersa, shifokor ko‘rigi kerak. Dori dozasini bot belgilamaydi.",
  url:"https://www.nhs.uk/symptoms/period-pain/"},
 {key:"qon",title:"Ko‘p qon ketishi",words:["qon ketishi","qon ket","kop qon","qon kop","qon juda kop","prokladka","tampon","laxta","hayz qoni","hayz kop"],
  answer:"Gigiyenik vositani har 1–2 soatda almashtirish zarurati, 7 kundan ortiq hayz yoki katta qon laxtalari ko‘p qon ketishidan dalolat berishi mumkin. Ginekologga murojaat qiling. Kuchli qon ketish bilan hushdan ketish, bosh aylanishi yoki nafas qisishi bo‘lsa, shoshilinch yordam kerak.",
  url:"https://www.nhs.uk/conditions/heavy-periods/"},
 {key:"kechikish",title:"Hayz kechikishi",words:["kechik","hayz kelm","hayzim kelm","hayz yoq","hayzim yoq","hayz toxtab","hayz toxtadi","hayz bolmad"],
  answer:"Hayz kechikishiga homiladorlik, stress, vazn o‘zgarishi, kuchli jismoniy mashq yoki gormonal omillar sabab bo‘lishi mumkin. Homiladorlik ehtimoli bo‘lsa, test qiling. Hayz ketma-ket uch marta kelmasa yoki kechikish takrorlansa, shifokorga murojaat qiling.",
  url:"https://www.nhs.uk/symptoms/missed-or-late-periods/"},
 {key:"nomuntazam",title:"Nomuntazam sikl",words:["nomuntazam","notekis","tartibsiz","muntazam emas","sikl ozgar","hayzlar oras","hayz orasida"],
  answer:"Siklning doimiy ravishda juda qisqa, uzun yoki o‘zgaruvchan bo‘lib qolishi, shuningdek hayzlar orasida qon kelishi tekshiruvni talab qiladi. O‘smirlikda va menopauzaga yaqin davrda sikl o‘zgarishi mumkin, ammo davomli o‘zgarishni e’tiborsiz qoldirmang.",
  url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"},
 {key:"test",title:"Homiladorlik testi",words:["homiladorlik testi","test qachon","test qilish","test qilsam","test musbat","test ijobiy","test manfiy","test natijasi"],
  answer:"Uy sharoitidagi homiladorlik testi odatda hayz kechikkan birinchi kundan boshlab ishonchliroq bo‘ladi. Keyingi hayz sanasi noma’lum bo‘lsa, himoyasiz jinsiy aloqadan kamida 21 kun o‘tgach test qilish tavsiya etiladi. Natija tushunarsiz bo‘lsa, shifokor bilan maslahatlashing.",
  url:"https://www.nhs.uk/pregnancy/trying-for-a-baby/doing-a-pregnancy-test/"},
 {key:"ovulyatsiya",title:"Ovulyatsiya",words:["ovulyatsiya","ovulyats","tuxum chiq","fertil","serhosil kun"],
  answer:"Ovulyatsiya tuxum hujayraning tuxumdondan chiqishidir. U odatda keyingi hayz boshlanishidan taxminan 10–16 kun oldin bo‘lishi mumkin, ammo vaqt har siklda farq qiladi. Faqat kalendarga qarab homiladorlikdan saqlanish ishonchli emas.",
  url:"https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/"},
 {key:"pms",title:"Hayz oldi sindromi (PMS)",words:["pms","hayz oldi","hayz oldidan","kayfiyat ozgar","kokrak sezgir","hayzdan oldin"],
  answer:"PMS hayzdan oldin kayfiyat o‘zgarishi, ko‘krak sezgirligi, dam bo‘lish yoki charchoq bilan namoyon bo‘lishi mumkin. Yetarli uyqu, muntazam yengil harakat va muvozanatli ovqatlanish yordam berishi mumkin. Alomatlar kundalik hayotga jiddiy xalaqit bersa, tibbiy ko‘rik kerak.",
  url:"https://www.nhs.uk/conditions/pre-menstrual-syndrome/"},
 {key:"menopauza",title:"Menopauza va perimenopauza",words:["menopauza","menopoz","klimaks","issiq bosish","hayz toxtashi"],
  answer:"Perimenopauza davrida hayz vaqti va miqdori o‘zgarishi, issiq bosishi va uyqu buzilishi mumkin. Hayz 12 oy bo‘lmaganidan keyin qayta vaginal qon kelishi albatta tibbiy tekshiruvni talab qiladi.",
  url:"https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/"},
 {key:"endometrioz",title:"Endometrioz haqida",words:["endometrioz","endometriosis","endometriozis"],
  answer:"Endometrioz bachadon ichki qavatiga o‘xshash to‘qimaning boshqa joylarda uchrashidir. Belgilariga kuchli hayz og‘rig‘i, chanoq og‘rig‘i yoki ko‘p qon ketishi kirishi mumkin. Faqat chatdan tashxis qo‘yilmaydi; ginekolog tekshiruvi zarur.",
  url:"https://www.nhs.uk/conditions/endometriosis/"}
,...ADDITIONAL_MEDICAL_TOPICS
]);

const CYR={"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts","ч":"ch","ш":"sh","щ":"sh","ъ":"","ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ў":"o","қ":"q","ғ":"g","ҳ":"h"};
export function normalizeMedicalQuery(raw){
 return String(raw??"").slice(0,700).toLocaleLowerCase("uz").normalize("NFKC")
  .replace(/[ʼʻ‘’`´']/g,"")
  .replace(/[а-яёўқғҳъь]/g,c=>CYR[c]??c)
  .replace(/[^a-z0-9\s]/g," ")
  .replace(/\s+/g," ").trim();
}
function contains(n,term){
 const t=normalizeMedicalQuery(term);
 if(!t)return false;
 let at=n.indexOf(t);
 while(at!==-1){
  if(at===0||n[at-1]===" ")return true;
  at=n.indexOf(t,at+1);
 }
 return false;
}
const any=(n,patterns)=>patterns.some(p=>contains(n,p));
const faint=["hushdan ket","hushim ket","hushsiz","bosh aylan","boshim aylan","boshim juda aylan","koz oldi qorong","ozimdan ket","ozimdan ketyap"];
const breath=["nafas qis","nafasim qis","nafas ololma","nafas yetishma"];
const severe=["chidab bolmas","juda kuchli ogri","ogri juda kuchli","qattiq ogri","tosatdan kuchli ogri","keskin ogri","toxtovsiz kuchli ogri"];
const bleeding=["qon ket","qon kel","qon kop","kop qon","qon oq","qon juda kop","qoni","qonim","hayz qoni","prokladka","tampon"];
const pregnancy=["homilador","homilador bolishim mumkin","test ijobiy","test musbat","test pozitiv","homiladorlik ehtimol"];
const pelvicPain=["qorin ogri","qorinim","qornim","tos ogri","chanoq ogri","bir tomonlama ogri","bir tomondan","pastki qorin","yelka uchi","yelka uchim"];
const padHour=/(har (bir )?soat.{0,30}(prokladka|tampon)|(?:prokladka|tampon).{0,30}har (bir )?soat|1 soat.{0,30}(prokladka|tampon))/;

export function assessMedicalRisk(raw){
 const n=normalizeMedicalQuery(raw);
 if(!n)return {level:"none"};
 const bleedingMention=any(n,bleeding);
 const faintMention=any(n,faint);
 const breathMention=any(n,breath);
 const pregnant=any(n,pregnancy)&&!any(n,["homilador emas","test manfiy","test negativ"]);
 const pelvic=any(n,pelvicPain)||any(n,["ogri","sanch"]);
 const intense=any(n,severe);
 // Clear emergency markers take precedence over ordinary FAQ matches.
 if((bleedingMention&&(faintMention||breathMention))
   ||(pregnant&&(intense||faintMention||breathMention
     ||(pelvic&&any(n,["kuchli","qattiq"]))))
   ||(pelvic&&(intense||faintMention||breathMention))
   ||(faintMention&&breathMention)){
  return {level:"emergency",text:"⚠️ Bu alomatlar shoshilinch tibbiy baholashni talab qilishi mumkin. Hozirning o‘zida shoshilinch tibbiy yordamga murojaat qiling. Chat orqali tashxis qo‘yib bo‘lmaydi.",url:pregnant?PREGNANCY_SOURCE:EMERGENCY_SOURCE};
 }
 if(padHour.test(n)){
  return {level:"urgent",text:"⚠️ Gigiyenik vosita har soatda to‘lib qolishi ko‘p qon ketishi belgisi bo‘lishi mumkin. Bugunoq tibbiy ko‘rikka murojaat qiling; holsizlik, hushdan ketish yoki nafas qisilishi bo‘lsa, shoshilinch yordam chaqiring.",url:"https://www.nhs.uk/conditions/heavy-periods/"};
 }
 if(pregnant&&(pelvic||bleedingMention)){
  return {level:"urgent",text:"⚠️ Homiladorlik ehtimoli bilan birga qorin/chanoq og‘rig‘i yoki qon ketishi bo‘lsa, tezda tibbiy ko‘rikdan o‘ting. Og‘riq kuchli bo‘lsa, hushdan ketsangiz yoki ko‘p qon ketsa, shoshilinch yordamga murojaat qiling.",url:PREGNANCY_SOURCE};
 }
 if((any(n,["hayz kechik","hayzim kechik","hayz kelmad"])&&bleedingMention&&pelvic)
    ||(pregnant&&any(n,["yelka uchi","yelka uchim"]))){
  return {level:"urgent",text:"⚠️ Hayz kechikishi yoki homiladorlik ehtimoli fonida qon ketishi, chanoq yoki yelka uchida og‘riq bo‘lsa, tez tibbiy ko‘rik zarur. Bu ayrim hollarda bachadondan tashqari homiladorlik belgisi bo‘lishi mumkin.",url:"https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/"};
 }
 if((any(n,["tampon","menstrual cup","menstrual kubok"])&&any(n,["isitma","toshma","qusish","holsizlik"]))
   ||(any(n,["siydik achish","siyganda achish","siydik yoli infeks"])&&
      (any(n,["isitma","belim ogri","bel ogri"])||pregnant))){
  return {level:"urgent",text:"⚠️ Bu alomatlarda jiddiy infeksiya ehtimolini istisno qilish kerak. Tez tibbiy ko‘rikdan o‘ting. Hush buzilishi, nafas qisilishi yoki keskin yomonlashish bo‘lsa, shoshilinch yordam chaqiring.",url:"https://www.nhs.uk/conditions/urinary-tract-infections-utis/"};
 }
 if((any(n,["menopauza","menopoz","klimaks"])&&bleedingMention)
    ||any(n,["12 oydan keyin qon","hayz toxtagandan keyin qon"])){
  return {level:"urgent",text:"⚠️ Menopauzadan keyingi vaginal qon ketishi, oz miqdorda bo‘lsa ham, shifokor ko‘rigini talab qiladi.",url:"https://www.nhs.uk/conditions/menopause-and-perimenopause/symptoms/"};
 }
 return {level:"none"};
}
function scoreTopic(query,topic){
 // Do not treat unrelated headaches, back pain or drug requests as period pain.
 if(topic.key==="ogriq"&&!any(query,["hayz","hayzim","qorin","qornim","chanoq","tos","bachadon","dismenoreya"]))return 0;
 let points=0;
 for(const word of topic.words){
  if(contains(query,word)){
   const tokens=normalizeMedicalQuery(word).split(" ");
   points+=tokens.length>=2?2*tokens.length+1:3;
  }
 }
 return points;
}
const TRAINED_EXACT=new Map(Object.entries(TRAINING_UTTERANCES)
 .flatMap(([key,questions])=>questions.map(q=>[normalizeMedicalQuery(q),key])));
const UNSUPPORTED_EXACT=new Set(UNSUPPORTED_TRAINING_UTTERANCES.map(normalizeMedicalQuery));
const PERSONAL_MEDICATION=/(qaysi (dori|antibiotik|gormon|ukol)|necha (mg|milligram|tomchi|tabletka)|doza|dozasi|retsept yoz|qanday dori ich)/;

export function findMedicalTopics(raw,max=2){
 const query=normalizeMedicalQuery(raw);
 if(!query)return [];
 const exact=TRAINED_EXACT.get(query);
 if(exact){const topic=MEDICAL_TOPICS.find(x=>x.key===exact);return topic&&max>0?[topic]:[];}
 const found=MEDICAL_TOPICS.map(topic=>({topic,score:scoreTopic(query,topic)}))
   .filter(x=>x.score>=3).sort((a,b)=>b.score-a.score||a.topic.key.localeCompare(b.topic.key));
 // Only one strongest topic avoids confident-looking but unrelated answers.
 return found.slice(0,Math.max(0,Math.min(1,max))).map(x=>x.topic);
}
export function answerMedicalQuestion(raw){
 const risk=assessMedicalRisk(raw);
 if(risk.level!=="none")return {kind:"safety",articles:[],text:risk.text+"\nManba: "+risk.url+DISCLAIMER,urgent:true};
 const normalized=normalizeMedicalQuery(raw);
 if(UNSUPPORTED_EXACT.has(normalized)||PERSONAL_MEDICATION.test(normalized))
  return {kind:"unknown",articles:[],text:UNKNOWN+DISCLAIMER,urgent:false};
 const found=findMedicalTopics(raw,1);
 if(!found.length)return {kind:"unknown",articles:[],text:UNKNOWN+DISCLAIMER,urgent:false};
 const article=found[0];
 return {kind:"answer",articles:[article],
  text:article.title+"\n"+article.answer+"\nManba: "+article.url+DISCLAIMER,urgent:false};
}
