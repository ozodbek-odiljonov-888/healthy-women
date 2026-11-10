// Free-tier, fixed-topic educational AI preview. NOT a general patient chat.
// No patient diary, personal prompt, or direct public key is sent to Gemini.
import {createHash} from "node:crypto";
import {AI_TOPICS,AI_MODEL,AI_LIMITS} from "../worker/ai-topics.js";

const maxBytes=200,allowedMethods="POST, OPTIONS";
const baseHeaders={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'","Vary":"Origin"};
const allowedOrigin=env=>{
 try {const u=new URL(env.AI_ALLOWED_ORIGIN);return u.protocol==="https:"&&u.origin===env.AI_ALLOWED_ORIGIN&&!u.username&&!u.password?u.origin:"";}catch{return "";}
};
const isEnabled=(request,env,origin)=>{
 const u=new URL(request.url);
 return env.AI_MODE==="free_preview"&&env.AI_FREE_TIER_NO_BILLING==="CONFIRMED"
   &&typeof env.GEMINI_API_KEY==="string"&&env.GEMINI_API_KEY.length>=20
   &&typeof env.AI_DATABASE_URL==="string"&&env.AI_DATABASE_URL.startsWith("postgresql://")
   &&typeof env.AI_IP_PEPPER==="string"&&env.AI_IP_PEPPER.length>=32
   &&allowedOrigin(env)!==""&&origin===allowedOrigin(env)
   &&u.protocol==="https:"&&u.hostname===env.AI_ALLOWED_HOSTNAME
   &&u.pathname==="/api/ai"&&!u.search&&!u.hash;
};
const response=(obj,status,origin,env,extra={})=>new Response(JSON.stringify(obj),{status,headers:{
 ...baseHeaders,...(origin&&origin===allowedOrigin(env)?{"Access-Control-Allow-Origin":origin}:{}),...extra
}});
async function parseSmallJson(request){
 const len=request.headers.get("Content-Length");if(len&&(!/^\d+$/.test(len)||Number(len)>maxBytes))throw Error("invalid length");
 const reader=request.body?.getReader();if(!reader)throw Error("empty body");
 let bytes=0;let chunks=[];
 try {for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes)throw Error("too large");chunks.push(value);}}
 finally{try{await reader.cancel();}catch{}reader.releaseLock();}
 const all=new Uint8Array(bytes);let p=0;for(const b of chunks){all.set(b,p);p+=b.length;}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(all));
}
export const anonymousKey=(ip,pepper)=>createHash("sha256").update(pepper+"\n"+ip).digest("hex");
const defaultReserve=async({env,clientHash})=>{
 const {neon}=await import("@neondatabase/serverless");
 const sql=neon(env.AI_DATABASE_URL);
 const rows=await sql`SELECT allowed,remaining_daily,remaining_client FROM hw_ai_reserve_free(${clientHash})`;
 if(!Array.isArray(rows)||rows.length!==1||typeof rows[0]?.allowed!=="boolean")throw Error("quota unavailable");
 return rows[0];
};
const safeOutput=v=>typeof v==="string"?v.trim().slice(0,1600):"";
const SYSTEM=`Siz Healthy Women ilovasidagi o‘zbekcha umumiy tibbiy savodxonlik yordamchisisiz.
Faqat berilgan umumiy mavzuni tushunarli, ehtiyotkor 3-5 jumlada yoritib bering. Shaxsiy ma'lumotlar YO‘Q.
Tashxis qo‘ymang, dorilar dozasini yoki kontrasepsiya/ovulyatsiya "xavfsiz kunlar" jadvalini bermang.
Qattiq og‘riq, hushdan ketish, nafas qisishi yoki kuchli qon ketish bo‘lsa shoshilinch yordam tavsiya eting.
Haqiqiy manba havolasini o‘ylab topmang. O‘zbek lotinida javob bering, 110 so‘zdan oshirmang.`;
const defaultGenerate=async({apiKey,topic,fetchFn=fetch})=>{
 // Only a fixed server-authored question and safety instruction go upstream.
 const res=await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`,{
  method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
  body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM}]},contents:[{role:"user",parts:[{text:topic.question}]}],
   generationConfig:{maxOutputTokens:AI_LIMITS.maxOutputTokens,temperature:0.2}}),
  signal:AbortSignal.timeout(10000),redirect:"error",cache:"no-store"
 });
 if(!res.ok)throw Error("provider unavailable");
 const json=await res.json();const answer=safeOutput(json?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join(""));
 if(!answer)throw Error("empty response");return answer;
};
/** Dependency injection for offline tests only. Not configurable by clients. */
export async function handleAiRequest(request,{env=process.env,reserve=defaultReserve,generate=defaultGenerate}={}){
 const origin=request.headers.get("Origin")||"";
 if(!isEnabled(request,env,origin))return response({error:"AI preview unavailable"},503,origin,env);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...baseHeaders,"Access-Control-Allow-Origin":origin,
  "Access-Control-Allow-Methods":allowedMethods,"Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"0"}});
 if(request.method!=="POST")return response({error:"Method not allowed"},405,origin,env,{Allow:allowedMethods});
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("Content-Type")||""))
  return response({error:"JSON required"},415,origin,env);
 let payload;try{payload=await parseSmallJson(request);}catch{return response({error:"Invalid body"},400,origin,env);}
 if(!payload||Array.isArray(payload)||typeof payload!=="object"||Object.keys(payload).sort().join(",")!=="consent,topic"
   ||payload.consent!==true||typeof payload.topic!=="string"||!Object.hasOwn(AI_TOPICS,payload.topic))
  return response({error:"General educational topic and consent required"},400,origin,env);
 // No raw IP is persisted. Missing edge-derived IP: refuse, never unlimited fallback.
 const ip=(request.headers.get("x-vercel-forwarded-for")||"").split(",")[0].trim();
 if(!ip||ip.length>64||!/^[0-9a-fA-F.:]+$/.test(ip))return response({error:"Rate limit unavailable"},503,origin,env);
 const clientHash=anonymousKey(ip,env.AI_IP_PEPPER);
 let quota;try{quota=await reserve({env,clientHash});}catch{return response({error:"Rate limit unavailable"},503,origin,env);}
 if(!quota?.allowed)return response({error:"Bepul AI limiti tugadi. Offline javobdan foydalaning.",remaining:0},429,origin,env,{"Retry-After":"60"});
 try{
  const answer=await generate({apiKey:env.GEMINI_API_KEY,topic:AI_TOPICS[payload.topic]});
  return response({answer,source:AI_TOPICS[payload.topic].source,url:AI_TOPICS[payload.topic].url,
   remainingToday:Math.max(0,Math.min(quota.remaining_daily,quota.remaining_client)),model:AI_MODEL},200,origin,env);
 }catch{return response({error:"AI vaqtincha ishlamayapti. Offline javobdan foydalaning."},503,origin,env);}
}
export default {fetch(request){return handleAiRequest(request,{env:process.env});}};
