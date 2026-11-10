// 500 entirely fictional Uzbek education question phrasings, no personal data.
// Transparent template expansion of a curated FAQ; this is NOT neural training.
// Some variants are formulaic on purpose, so held-out tests are required.
import {TRAINING_UTTERANCES as V114_UTTERANCES} from "./medical-curriculum.js";
import {CURRICULUM_V115_A,V115_SEEDS_A} from "./medical-topics-v115-a.js";
import {CURRICULUM_V115_B,V115_SEEDS_B} from "./medical-topics-v115-b.js";

export const NEW_MEDICAL_TOPICS=Object.freeze([...CURRICULUM_V115_A,...CURRICULUM_V115_B]);
const SEEDS={...V115_SEEDS_A,...V115_SEEDS_B};

function oldFour(topic){
 const short=topic.words[0];
 return [
  short+" haqida umumiy savolim bor",
  short+" bo‘yicha qisqacha ma’lumot bering",
  topic.title+" nimani anglatadi?",
  topic.title+" haqida sodda qilib tushuntiring"
 ];
}
function newTen(topic){
 const names=topic.words;
 const name=topic.title;
 return [
  SEEDS[topic.key]+"?",
  SEEDS[topic.key]+" haqida ma’lumot bering",
  name+" haqida savolim bor",
  name+" nimani anglatadi?",
  names[0]+" haqida qisqacha aytib bering",
  names[1]+" bo‘yicha nima bilish kerak?",
  names[2]+" haqida umumiy tushuntirish",
  names[3]+" bilan bog‘liq savol",
  names[4]+" bo‘yicha qachon tibbiy ko‘rik kerak?",
  name+" mavzusini tushunarli qilib tushuntiring"
 ];
}
/** Supply original 20 topics (the existing order) so the expansion stays explicit. */
export function buildTrainingCorpus500(existingTopics){
 if(!Array.isArray(existingTopics)||existingTopics.length!==20)throw Error("Expected original 20 curated topics");
 const existing=new Set(existingTopics.map(x=>x.key));
 if(existing.size!==20||NEW_MEDICAL_TOPICS.length!==30
    ||NEW_MEDICAL_TOPICS.some(x=>existing.has(x.key)))throw Error("Duplicate/invalid medical topic collection");
 const all=[
  ...existingTopics.map(topic=>{
   const original=V114_UTTERANCES[topic.key];
   if(!Array.isArray(original)||original.length!==6)throw Error("Original medical question set missing");
   return [topic.key,Object.freeze([...original,...oldFour(topic)])];
  }),
  ...NEW_MEDICAL_TOPICS.map(topic=>{
   if(!SEEDS[topic.key]||!Array.isArray(topic.words)||topic.words.length<5)throw Error("Topic seeds incomplete");
   return [topic.key,Object.freeze(newTen(topic))];
  })
 ];
 return Object.freeze(Object.fromEntries(all));
}
