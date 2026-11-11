// Explicit user click only. The raw question, diary and session never leave this file.
export const REMOTE_AI_TOPICS=new Set(["cycle","duration","pain","heavy","irregular","pregnancy","between","pcos","endo","selfcare"]);
export const AI_TOPIC_LABELS=Object.freeze({
 cycle:"Hayz sikli va kalendar",duration:"Hayz davomiyligi",pain:"Hayz og‘rig‘i",heavy:"Ko‘p qon ketishi",irregular:"Nomuntazam hayz",
 pregnancy:"Hayz kechikishi",between:"Hayzlar oralig‘ida qon",pcos:"PCOS",endo:"Endometrioz",selfcare:"O‘zini parvarishlash"
});
export function resolveAiTopic({question="",selected=null}={}){
 const detected=pickAiTopic(question);
 return REMOTE_AI_TOPICS.has(selected)?selected:detected;
}
const API_HOST="healthy-women-bot.vercel.app";
const DEMO_STORAGE_KEY="healthywomen.ai-demo-device.v1";
const DEMO_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Pseudonymous, random per-install quota handle; no health data or identity is encoded.
// The handle never leaves the browser except in a request to Healthy Women quota server.
export function getDemoClientId({storage=globalThis.localStorage,randomUUID=globalThis.crypto?.randomUUID?.bind(globalThis.crypto)}={}){
 try{
  const old=storage?.getItem(DEMO_STORAGE_KEY);
  if(typeof old==="string"&&DEMO_UUID.test(old))return old;
  if(typeof randomUUID!=="function"||!storage)return "";
  const fresh=randomUUID();
  if(typeof fresh!=="string"||!DEMO_UUID.test(fresh))return "";
  storage.setItem(DEMO_STORAGE_KEY,fresh);
  return storage.getItem(DEMO_STORAGE_KEY)===fresh?fresh:"";
 }catch{return "";}
}
export function safeMedicalSourceUrl(value){
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&["www.nhs.uk","www.acog.org","www.who.int","www.cdc.gov"].includes(u.hostname)
   &&!u.username&&!u.password&&!u.search&&!u.hash?u.href:"";
 }catch{return "";}
}
export function remoteAiReady(config){
 try{const url=new URL(config);return url.protocol==="https:"&&url.hostname===API_HOST
  &&url.pathname==="/api/ai"&&!url.search&&!url.hash&&!url.username&&!url.password&&url.href===config;}
 catch{return false;}
}
export async function askPublicAi(topic,{endpoint="",fetchFn=fetch}={}){
 if(!REMOTE_AI_TOPICS.has(topic))throw Error("Faqat umumiy ma'rifiy mavzu tanlanadi.");
 if(!remoteAiReady(endpoint))throw Error("Bepul AI serveri hali ulanmagan. Mahalliy javobdan foydalaning.");
 const demoId=getDemoClientId();
 const res=await fetchFn(endpoint,{method:"POST",
  headers:{"Content-Type":"application/json",...(demoId?{"X-HW-Demo-Id":demoId}:{})},
  body:JSON.stringify({topic,consent:true}),
  signal:AbortSignal.timeout(26000),cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer"});
 let payload={};try{payload=await res.json();}catch{}
 if(!res.ok||typeof payload?.answer!=="string"||!payload.answer.trim())
  throw Error(res.status===429?"Bugungi bepul AI limiti tugadi.":"AI hozir javob bermadi. Mahalliy javobdan foydalaning.");
 if(payload.answer.length>1600)throw Error("AI javobi kutilgan chegaradan oshdi.");
 return {text:payload.answer,source:typeof payload.source==="string"?payload.source:"AI ma'lumot",url:safeMedicalSourceUrl(payload.url),
 remaining:Number.isInteger(payload.remainingToday)?payload.remainingToday:null};
}

// Local-only topic classification; input never enters provider JSON or a server log.
export function pickAiTopic(question){
 const q=String(question||"").toLocaleLowerCase("uz").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[‘’ʻ']/g,"").replace(/[^a-z0-9\s]/g," ");
 if(!q.trim()||q.length>280)return null;
 if(/endometrioz/.test(q))return "endo";
 if(/polikist|pcos/.test(q))return "pcos";
 if(/oralig|orasida|hayzdan tashqari|dog lanish/.test(q))return "between";
 if(/kop qon|qon kop|kop ket|prokladka|qon juda|juda kop/.test(q))return "heavy";
 if(/ogri|spazm|kramp|qorin sanch/.test(q))return "pain";
 if(/kechik|homilador|pregnan/.test(q))return "pregnancy";
 if(/nomuntazam|tartibsiz/.test(q))return "irregular";
 if(/parvarish|issiq kompress|grelka|mashq/.test(q))return "selfcare";
 if(/necha kun davom|qonash davom|qon ketishi necha|tugash/.test(q))return "duration";
 if(/sikl|hayz|menstrual/.test(q))return "cycle";
 return null;
}
