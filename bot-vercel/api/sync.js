// Healthy Women v1.11 — staging-only encrypted sync API.
// NEVER enable on the public bot until the staging release gates are fulfilled.
// Authorization: signed Telegram initData. Transport: ciphertext envelopes only.
// This handler is intentionally not wired into the existing PWA or webhook.
import {verifyTelegramInitData} from "../worker/telegram-auth.js";
import {createOpaqueSyncProtocol,validateOpaqueEnvelope} from "../worker/opaque-sync-contract.js";
import {createNeonStorageFromEnv} from "../worker/neon-provider.js";
import {createNeonStagingLimiterFromEnv} from "../worker/neon-quota-provider.js";

const BODY_LIMIT=1_500_000;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METHODS="GET, PUT, DELETE, OPTIONS";
const HEADER_FIELDS="X-Telegram-Init-Data, Content-Type, X-Sync-Erase-Intent";
const HEADERS={
 "Content-Type":"application/json; charset=utf-8",
 "Cache-Control":"no-store, private",
 "Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff",
 "Content-Security-Policy":"default-src 'none'",
 "Vary":"Origin"
};
const response=(data,status,origin,allowedOrigin,extra={})=>
 new Response(JSON.stringify(data),{status,headers:{
   ...HEADERS,...(origin && origin===allowedOrigin?{"Access-Control-Allow-Origin":origin}:{}),...extra
 }});
function error(status,msg,origin,allowedOrigin,extra={}){
 return response({error:msg},status,origin,allowedOrigin,extra);
}
function validRevision(value){return value===null||(typeof value==="string"&&UUID.test(value));}
function exactlyFields(object,names){
 return object && typeof object==="object"&&!Array.isArray(object)
   && Object.keys(object).length===names.length
   && names.every(name=>Object.hasOwn(object,name));
}
async function readBoundedJson(request){
 const length=request.headers.get("Content-Length");
 if(length!==null && (!/^\d+$/.test(length)||Number(length)>BODY_LIMIT))throw {status:413};
 const stream=request.body;
 if(!stream)throw {status:400};
 const reader=stream.getReader();
 const pieces=[];let count=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   count+=value?.byteLength||0;
   if(count>BODY_LIMIT)throw {status:413};
   pieces.push(value);
  }
 }catch(err){try{await reader.cancel();}catch{}throw err;}
 finally{reader.releaseLock();}
 if(!count)throw {status:400};
 const bytes=new Uint8Array(count);let at=0;
 for(const piece of pieces){bytes.set(piece,at);at+=piece.byteLength;}
 let object;
 try{object=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}
 catch{throw {status:400};}
 return object;
}
function configIsSafe(request,env){
 if(env?.SYNC_API_MODE!=="staging" || typeof env?.BOT_TOKEN!=="string"
   || typeof env?.DATABASE_URL!=="string")return false;
 const host=env?.SYNC_ALLOWED_HOSTNAME;
 if(typeof host!=="string"||!/^[a-z0-9.-]+$/i.test(host))return false;
 const url=new URL(request.url);
 return url.protocol==="https:"&&url.hostname===host
   &&host!=="healthy-women-bot.vercel.app"
   &&host!=="healthy-women.vercel.app";
}
// Never permit an unbounded public rollout. Require 1-5 explicit signed
// Telegram tester IDs in a protected staging env variable.
function stagingUsers(env){
 const raw=env?.SYNC_STAGING_USER_IDS;
 if(typeof raw!=="string"||raw.length>90)return null;
 const ids=raw.split(",").map(s=>s.trim());
 if(!ids.length||ids.length>5||ids.some(s=>!/^([1-9][0-9]{0,15})$/.test(s)
   ||!Number.isSafeInteger(Number(s))))return null;
 const set=new Set(ids);
 return set.size===ids.length?set:null;
}
function trustedOrigin(env){
 // A staging rollout must name its client origin explicitly; no wildcard.
 const value=env?.SYNC_CLIENT_ORIGIN;
 if(typeof value!=="string")return "";
 try{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.search&&!url.hash
    &&url.origin===value
    &&url.hostname!=="localhost"
    &&url.hostname!=="healthy-women.vercel.app"
    &&url.hostname!=="healthy-women-bot.vercel.app"?value:"";
 }catch{return "";}
}
const loadDefaultStorage=env=>createNeonStorageFromEnv(env);
const loadDefaultLimiter=env=>createNeonStagingLimiterFromEnv(env);

/**
 * Dependency injection is for tests only. Never provide a browser-selected
 * database, Telegram identity, or arbitrary Origin.
 */
export async function handleSyncRequest(request,{
 env={},loadStorage=loadDefaultStorage,loadLimiter=loadDefaultLimiter,
 nowMs=()=>Date.now()
}={}){
 const origin=request.headers.get("Origin");
 const allowedOrigin=trustedOrigin(env);
 const allowlisted=stagingUsers(env);
 const path=new URL(request.url);
 if(path.pathname!=="/api/sync"||path.search||path.hash)return error(404,"Not found",origin,allowedOrigin);
 if(!configIsSafe(request,env)||!allowedOrigin||!allowlisted)return error(503,"Synchronization unavailable",origin,allowedOrigin);
 if(origin && origin!==allowedOrigin)return error(403,"Forbidden",origin,allowedOrigin);
 if(request.method==="OPTIONS"){
  if(origin!==allowedOrigin)return error(403,"Forbidden",origin,allowedOrigin);
  return new Response(null,{status:204,headers:{
   ...HEADERS,"Access-Control-Allow-Origin":origin,
   "Access-Control-Allow-Methods":METHODS,
   "Access-Control-Allow-Headers":HEADER_FIELDS,
   "Access-Control-Max-Age":"0"
  }});
 }
 if(!["GET","PUT","DELETE"].includes(request.method)){
  return error(405,"Method not allowed",origin,allowedOrigin,{"Allow":METHODS});
 }
 const raw=request.headers.get("X-Telegram-Init-Data");
 let verified;
 try{verified=await verifyTelegramInitData(raw,env.BOT_TOKEN,{nowMs:nowMs()});}
 catch{return error(401,"Unauthorized",origin,allowedOrigin);}
 if(!allowlisted.has(String(verified.userId)))
  return error(403,"Staging access denied",origin,allowedOrigin);
 if(request.method==="DELETE" && (Math.floor(nowMs()/1000)-verified.authDate)>300){
  return error(401,"Reopen Telegram Mini App to erase remote data",origin,allowedOrigin);
 }
 let payload;
 if(request.method!=="GET"){
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("Content-Type")||""))
   return error(415,"JSON required",origin,allowedOrigin);
  try{payload=await readBoundedJson(request);}
  catch(e){return error(e?.status===413?413:400,"Invalid request",origin,allowedOrigin);}
 }
 if(request.method==="PUT"){
  if(!exactlyFields(payload,["envelope","expectedRevision"])||!validRevision(payload.expectedRevision))
   return error(400,"Invalid request",origin,allowedOrigin);
  try{validateOpaqueEnvelope(payload.envelope);}
  catch{return error(400,"Encrypted envelope required",origin,allowedOrigin);}
 }
 if(request.method==="DELETE"){
  if(!exactlyFields(payload,["expectedRevision","confirmation"])
    ||!validRevision(payload.expectedRevision)
    ||payload.confirmation!=="ERASE_REMOTE_ENCRYPTED_DATA"
    ||request.headers.get("X-Sync-Erase-Intent")!=="erase-remote")
   return error(400,"Deletion confirmation required",origin,allowedOrigin);
 }
 // A single global daily allowance caps the number of paid-compute-like
 // operations; no per-request Redis/cache subscription is required.
 let quota;
 try{
  const limiter=await loadLimiter(env);
  quota=await limiter.consume({userId:verified.userId,botToken:env.BOT_TOKEN,nowMs:nowMs()});
 }catch{return error(503,"Synchronization unavailable",origin,allowedOrigin);}
 if(!quota?.allowed)return error(429,"Daily staging limit reached",origin,allowedOrigin,{
  "Retry-After":String(Math.max(1,Math.min(86400,Math.ceil(quota?.retryAfterSeconds||86400))))
 });
 let protocol;
 try{
  const storage=await loadStorage(env);
  protocol=createOpaqueSyncProtocol({botToken:env.BOT_TOKEN,storage,nowMs});
 }catch{return error(503,"Synchronization unavailable",origin,allowedOrigin);}
 try{
  if(request.method==="GET"){
   const result=await protocol.read(raw);
   return response(result,result.status==="erased"?410:200,origin,allowedOrigin);
  }
  if(request.method==="PUT"){
   const result=await protocol.upload(raw,payload.envelope,payload.expectedRevision);
   return response(result,result.status==="stored"?200:result.status==="erased"?410:409,origin,allowedOrigin);
  }
  const result=await protocol.erase(raw,payload.expectedRevision);
  return response(result,result.status==="erased"?200:409,origin,allowedOrigin);
 }catch{
  // Never send SQL errors, Telegram initData, or sensitive request bodies back.
  return error(503,"Synchronization unavailable",origin,allowedOrigin);
 }
}

export default {
 fetch(request){
  return handleSyncRequest(request,{env:process.env});
 }
};
