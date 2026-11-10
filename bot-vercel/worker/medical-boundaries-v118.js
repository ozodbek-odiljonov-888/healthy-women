// Healthy Women v1.18 — a conservative boundary for multi-topic and
// individual diagnosis requests. No ML, network, logging or patient storage.
// This does not understand every dialect or guarantee medical safety.
const COMPARISON=/\b(?:farq\w*|solishtir\w*|taqqosla\w*|qaysi biri|ikkalasi\w*)\b/;
const CONDITION_PATTERNS=[
 ["pcos",/\b(?:pcos(?:ni|ga|da|dan)?|polikistoz(?:ni)?|pmos)\b/],
 ["endometrioz",/\b(?:endometrioz|endometriosis)\b/],
 ["adenomioz",/\b(?:adenomioz|adenomyosis)\b/],
 ["mioma",/\b(?:mioma|fibroma|fibroid)\b/],
 ["ektopik",/\b(?:ektopik|bachadondan tashqari homiladorlik)\b/],
 ["preeklampsiya",/\b(?:preeklampsiya|gestoz)\b/],
 ["gestatsion_diabet",/\b(?:gestatsion diabet|homiladorlik diabeti)\b/],
 ["vaginit",/\b(?:vaginit)\b/],
 ["kandidoz",/\b(?:kandidoz|kandida)\b/],
 ["bakterial_vaginoz",/\b(?:bakterial vaginoz)\b/],
 ["menopauza",/\b(?:menopauza|klimaks)\b/],
 ["hpv",/\b(?:hpv|papillomavirus)\b/],
 ["xlamidiya",/\b(?:xlamidiya|chlamydia)\b/]
];
const PERSONAL_RESULT=/(?:\b(?:mening|meni|menda|natijam|analizim|tahlilim|tekshiruvim|uttim|uzi natijam)\b.{0,65}\b(?:tashxis|davolash|operatsiya|retsept|davolansam|natija|chiqdi|chiqqan|talqin))|(?:\b(?:uttda|utt|uzida|uzi|analiz|tahlil)\b.{0,50}\b(?:\d+(?:\.\d+)?\s*(?:sm|mm|mg|g\/l)|natijam|operatsiya kerak))/;
const INDIVIDUAL_DIAGNOSIS=/\b(?:menga tashxis|menda nima kasallik|aniq tashxis qoy|menga operatsiya kerakmi|dori yozib ber|retsept ber|necha mg)\b/;

export function checkMedicalQuestionBoundaries(normalized){
 if(typeof normalized!=="string"||normalized.length>700)throw Error("Invalid normalized user question");
 if(INDIVIDUAL_DIAGNOSIS.test(normalized)||PERSONAL_RESULT.test(normalized))
  return {blocked:true,reason:"personal_clinical_decision"};
 const matched=CONDITION_PATTERNS.filter(([,regex])=>regex.test(normalized)).map(([key])=>key);
 if(COMPARISON.test(normalized)&&matched.length>=2)
  return {blocked:true,reason:"multi_topic_comparison"};
 return {blocked:false,reason:null};
}
