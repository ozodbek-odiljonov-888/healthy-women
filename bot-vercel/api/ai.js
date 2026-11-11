// Free-tier, fixed-topic educational AI preview. NOT a general patient chat.
// No patient diary, personal prompt, or direct public key is sent to Gemini.
import {createHash} from "node:crypto";
import {AI_TOPICS,AI_MODEL,AI_LIMITS} from "../worker/ai-topics.js";

const maxBytes=200,allowedMethods="POST, OPTIONS";
const DEMO_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const baseHeaders={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'","Vary":"Origin"};
// Fixed, opt-in origins. No wildcard CORS, even for native WebViews.
const canonicalHttpsOrigin=value=>{
 try{const u=new URL(value);return u.protocol==="https:"&&u.origin===value&&!u.username&&!u.password&&!u.search&&!u.hash?u.origin:"";}catch{return "";}
};
export const allowedOrigin=(env,origin)=>{
 const web=canonicalHttpsOrigin(env.AI_ALLOWED_ORIGIN);
 if(web&&origin===web)return web;
 if(env.AI_ANDROID_ORIGIN==="https://localhost"&&origin==="https://localhost")return origin;
 return "";
};
export const aiConfigReady=env=>env?.AI_MODE==="free_preview"
 &&env?.AI_FREE_TIER_NO_BILLING==="CONFIRMED"
 &&typeof env?.GEMINI_API_KEY==="string"&&env.GEMINI_API_KEY.length>=20
 &&typeof env?.AI_DATABASE_URL==="string"&&/^postgres(?:ql)?:\/\//.test(env.AI_DATABASE_URL)
 &&typeof env?.AI_IP_PEPPER==="string"&&env.AI_IP_PEPPER.length>=32
 &&canonicalHttpsOrigin(env.AI_ALLOWED_ORIGIN)!==""
 &&env.AI_ALLOWED_HOSTNAME==="healthy-women-bot.vercel.app";
const isEnabled=(request,env,origin)=>{
 const u=new URL(request.url);
 return aiConfigReady(env)&&allowedOrigin(env,origin)!==""
   &&u.protocol==="https:"&&u.hostname===env.AI_ALLOWED_HOSTNAME
   &&u.pathname==="/api/ai"&&!u.search&&!u.hash;
};
const response=(obj,status,origin,env,extra={})=>new Response(JSON.stringify(obj),{status,headers:{
 ...baseHeaders,...(origin&&allowedOrigin(env,origin)?{"Access-Control-Allow-Origin":origin}:{}),...extra
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
const defaultReserve=async({env,clientHash,networkHash=null})=>{
 const {neon}=await import("@neondatabase/serverless");
 const sql=neon(env.AI_DATABASE_URL);
 const rows=networkHash
  ? await sql`SELECT allowed,remaining_daily,remaining_client FROM hw_ai_reserve_demo_free(${clientHash},${networkHash})`
  : await sql`SELECT allowed,remaining_daily,remaining_client FROM hw_ai_reserve_free(${clientHash})`;
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
   generationConfig:{candidateCount:1,maxOutputTokens:AI_LIMITS.maxOutputTokens,temperature:0.2,thinkingConfig:{thinkingLevel:"minimal"}}}),
  signal:AbortSignal.timeout(10000),redirect:"error",cache:"no-store"
 });
 if(!res.ok)throw Error("provider unavailable");
 const json=await res.json();const answer=safeOutput(json?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join(""));
 if(!answer)throw Error("empty response");return answer;
};
/** Dependency injection for offline tests only. Not configurable by clients. */
// All three platforms share a single server-quota reservation.
// Never send raw chat, personal ID, period dates or symptom history upstream.
export async function runFixedTopicAi({topic,identity,networkHash=null,env=process.env,reserve=defaultReserve,generate=defaultGenerate}={}){
 if(!aiConfigReady(env))return {ok:false,status:503,error:"AI hozircha yoqilmagan. Offline javobdan foydalaning."};
 if(typeof topic!=="string"||!Object.hasOwn(AI_TOPICS,topic)||typeof identity!=="string"||!identity||identity.length>120)
  return {ok:false,status:400,error:"Faqat umumiy mavzu tanlanadi."};
 const clientHash=anonymousKey(identity,env.AI_IP_PEPPER);
 let quota;
 try{quota=await reserve({env,clientHash,networkHash});}
 catch{return {ok:false,status:503,error:"Bepul AI kvotasi vaqtincha mavjud emas."};}
 if(!quota?.allowed)return {ok:false,status:429,error:"Bepul AI limiti tugadi. Offline javobdan foydalaning."};
 try{
  const output=await generate({apiKey:env.GEMINI_API_KEY,topic:AI_TOPICS[topic]});
  const answer=safeOutput(output);
  if(!answer)return {ok:false,status:503,error:"AI javobi mavjud emas. Offline javobdan foydalaning."};
  return {ok:true,status:200,answer,source:AI_TOPICS[topic].source,url:AI_TOPICS[topic].url,
   remainingToday:Math.max(0,Math.min(Number(quota.remaining_daily)||0,Number(quota.remaining_client)||0)),model:AI_MODEL};
 }catch{return {ok:false,status:503,error:"AI vaqtincha ishlamayapti. Offline javobdan foydalaning."};}
}
export async function runTelegramTopicAi({topic,chatId,env=process.env,reserve=defaultReserve,generate=defaultGenerate}={}){
 if(!Number.isSafeInteger(chatId)||chatId<=0)return {ok:false,status:400,error:"Noto‘g‘ri Telegram identifikatori."};
 return runFixedTopicAi({topic,identity:"tg:"+String(chatId),env,reserve,generate});
}
export async function handleAiRequest(request,{env=process.env,reserve=defaultReserve,generate=defaultGenerate}={}){
 const origin=request.headers.get("Origin")||"";
 if(!isEnabled(request,env,origin))return response({error:"AI preview unavailable"},503,origin,env);
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...baseHeaders,"Access-Control-Allow-Origin":origin,
  "Access-Control-Allow-Methods":allowedMethods,"Access-Control-Allow-Headers":"Content-Type, X-HW-Demo-Id","Access-Control-Max-Age":"0"}});
 if(request.method!=="POST")return response({error:"Method not allowed"},405,origin,env,{Allow:allowedMethods});
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("Content-Type")||""))
  return response({error:"JSON required"},415,origin,env);
 let payload;try{payload=await parseSmallJson(request);}catch{return response({error:"Invalid body"},400,origin,env);}
 if(!payload||Array.isArray(payload)||typeof payload!=="object"||Object.keys(payload).sort().join(",")!=="consent,topic"
  ||payload.consent!==true||typeof payload.topic!=="string"||!Object.hasOwn(AI_TOPICS,payload.topic))
  return response({error:"General educational topic and consent required"},400,origin,env);
 const ip=(request.headers.get("x-vercel-forwarded-for")||"").split(",")[0].trim();
 if(!ip||ip.length>64||!/^[0-9a-fA-F.:]+$/.test(ip))return response({error:"Rate limit unavailable"},503,origin,env);
 const demoId=request.headers.get("x-hw-demo-id")||"";
 if(demoId&&!DEMO_ID.test(demoId))return response({error:"Invalid anonymous demo identity"},400,origin,env);
 // Separate tester quotas behind a shared Wi-Fi IP; a separate DB network cap limits resets.
 const networkHash=anonymousKey("network:"+ip,env.AI_IP_PEPPER);
 const result=await runFixedTopicAi({topic:payload.topic,identity:"web:"+ip+(demoId?":"+demoId:""),
   networkHash,env,reserve,generate});
 if(!result.ok)return response({error:result.error},result.status,origin,env,
   result.status===429?{"Retry-After":"60"}:{});
 const {ok,status,...body}=result;
 return response(body,200,origin,env);
}
export default {fetch(request){return handleAiRequest(request,{env:process.env});}};
