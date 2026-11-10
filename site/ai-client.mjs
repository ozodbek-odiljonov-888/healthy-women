// Explicit user click only. The raw question, diary and session never leave this file.
export const REMOTE_AI_TOPICS=new Set(["cycle","duration","pain","heavy","irregular","pregnancy","between","pcos","endo","selfcare"]);
const API_HOST="healthy-women-bot.vercel.app";
export function remoteAiReady(config){
 try{const url=new URL(config);return url.protocol==="https:"&&url.hostname===API_HOST
  &&url.pathname==="/api/ai"&&!url.search&&!url.hash&&!url.username&&!url.password&&url.href===config;}
 catch{return false;}
}
export async function askPublicAi(topic,{endpoint="",fetchFn=fetch}={}){
 if(!REMOTE_AI_TOPICS.has(topic))throw Error("Faqat umumiy ma'rifiy mavzu tanlanadi.");
 if(!remoteAiReady(endpoint))throw Error("Bepul AI serveri hali ulanmagan. Mahalliy javobdan foydalaning.");
 const res=await fetchFn(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,consent:true}),
  signal:AbortSignal.timeout(13000),cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer"});
 let payload={};try{payload=await res.json();}catch{}
 if(!res.ok||typeof payload?.answer!=="string"||!payload.answer.trim())
  throw Error(res.status===429?"Bugungi bepul AI limiti tugadi.":"AI hozir javob bermadi. Mahalliy javobdan foydalaning.");
 if(payload.answer.length>1600)throw Error("AI javobi kutilgan chegaradan oshdi.");
 return {text:payload.answer,source:typeof payload.source==="string"?payload.source:"AI ma'lumot",url:typeof payload.url==="string"&&payload.url.startsWith("https://")?payload.url:"",
 remaining:Number.isInteger(payload.remainingToday)?payload.remainingToday:null};
}
