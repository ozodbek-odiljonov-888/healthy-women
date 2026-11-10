import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleAiRequest,anonymousKey} from "../bot-vercel/api/ai.js";
import {AI_TOPICS,AI_MODEL,AI_LIMITS} from "../bot-vercel/worker/ai-topics.js";
import {askPublicAi,remoteAiReady,pickAiTopic} from "../site/ai-client.mjs";
const origin="https://healthy-women.vercel.app",endpoint="https://healthy-women-bot.vercel.app/api/ai";
const env={AI_MODE:"free_preview",AI_FREE_TIER_NO_BILLING:"CONFIRMED",GEMINI_API_KEY:"fictional-api-key-for-tests-123",AI_DATABASE_URL:"postgresql://example.invalid/db",AI_IP_PEPPER:"fictitious-secret-longer-than-thirty-two-characters",AI_ALLOWED_ORIGIN:origin,AI_ALLOWED_HOSTNAME:"healthy-women-bot.vercel.app"};
const request=(body={topic:"pain",consent:true},headers={})=>new Request(endpoint,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json","x-vercel-forwarded-for":"192.0.2.42",...headers},body:typeof body==="string"?body:JSON.stringify(body)});
const quota=async()=>({allowed:true,remaining_client:2,remaining_daily:29});
test("AI is fail-closed unless manually enabled, no billing project confirmed and DB exists",async()=>{
 for(const patch of [{AI_MODE:"off"},{AI_FREE_TIER_NO_BILLING:""},{AI_DATABASE_URL:""},{GEMINI_API_KEY:""},{AI_IP_PEPPER:""},{AI_ALLOWED_HOSTNAME:"attacker.example"}]){
  let called=0;const r=await handleAiRequest(request(),{env:{...env,...patch},reserve:async()=>{called++;return quota();},generate:async()=>"BAD"});
  assert.equal(r.status,503);assert.equal(called,0);
 }
});
test("server accepts ONLY predefined topic and explicit opt-in; no diary or arbitrary text",async()=>{
 for(const body of [{topic:"pain",consent:false},{topic:"pain",consent:true,diary:"private"},{topic:"my private notes",consent:true},{topic:"pain"},"{}",{topic:null,consent:true},{topic:["pain"],consent:true}]){
  let called=0;const r=await handleAiRequest(request(body),{env,reserve:async()=>{called++;return quota();},generate:async()=>"BAD"});
  assert.equal(r.status,400);assert.equal(called,0);
 }
});
test("origin, hostname, and method cannot be bypassed",async()=>{
 const badOrigin=request({topic:"pain",consent:true},{Origin:"https://attacker.example"});
 assert.equal((await handleAiRequest(badOrigin,{env})).status,503);
 const get=new Request(endpoint,{method:"GET",headers:{Origin:origin}});
 assert.equal((await handleAiRequest(get,{env})).status,405);
 const wrongHost=new Request("https://attacker.example/api/ai",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:'{"topic":"pain","consent":true}'});
 assert.equal((await handleAiRequest(wrongHost,{env})).status,503);
});
test("no database or quota denial means no upstream generation",async()=>{
 let count=0;const gen=async()=>{count++;return "BAD";};
 assert.equal((await handleAiRequest(request(),{env,reserve:async()=>{throw Error("db down");},generate:gen})).status,503);
 const denied=await handleAiRequest(request(),{env,reserve:async()=>({allowed:false}),generate:gen});
 assert.equal(denied.status,429);assert.equal(count,0);
});
test("single fixed-topic generation, bounded output and remaining quota",async()=>{
 let captured;
 const res=await handleAiRequest(request(),{env,reserve:quota,generate:async p=>{captured=p;return "Umumiy ma'lumot.";}});
 assert.equal(res.status,200);const answer=await res.json();
 assert.equal(answer.answer,"Umumiy ma'lumot.");assert.equal(answer.remainingToday,2);assert.equal(answer.model,AI_MODEL);
 assert.deepEqual(captured.topic,AI_TOPICS.pain);assert(!JSON.stringify(captured).includes("192.0.2.42"));
});
test("provider failure returns anonymous fallback; no automatic provider retries",async()=>{
 let calls=0;const result=await handleAiRequest(request(),{env,reserve:quota,generate:async()=>{calls++;throw Error("secret provider response");}});
 assert.equal(result.status,503);assert.equal(calls,1);assert(!JSON.stringify(await result.json()).includes("secret"));
});
test("PII not persisted in anonymous key; schema uses transactional global reservation",()=>{
 assert.match(anonymousKey("192.0.2.42",env.AI_IP_PEPPER),/^[a-f0-9]{64}$/);
 assert.notEqual(anonymousKey("192.0.2.42",env.AI_IP_PEPPER),anonymousKey("192.0.2.43",env.AI_IP_PEPPER));
 assert.equal(AI_LIMITS.globalDay,30);assert.equal(AI_LIMITS.globalLifetime,1000);
 const sql=readFileSync(new URL("../db/migrations/003_ai_free_limits.sql",import.meta.url),"utf8");
 assert(sql.includes("pg_advisory_xact_lock"));assert(sql.includes("c_day>=30"));assert(sql.includes("c_month>=300"));assert(sql.includes("c_lifetime>=1000"));assert(sql.includes("c_client>=3"));assert(sql.includes("c_minute>=1"));
});
test("client only sends canonical topic and consent, never typed question or diary",async()=>{
 assert(remoteAiReady(endpoint));assert(!remoteAiReady("https://evil.example/api/ai"));
 assert(!remoteAiReady("http://healthy-women-bot.vercel.app/api/ai"));
 let called;
 const response=await askPublicAi("pain",{endpoint,fetchFn:async(url,options)=>{
  called={url,options};return new Response(JSON.stringify({answer:"General",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/",remainingToday:1}),{status:200});
 }});
 assert.equal(response.text,"General");assert.deepEqual(JSON.parse(called.options.body),{topic:"pain",consent:true});
 assert.equal(called.options.credentials,"omit");assert.equal(called.url,endpoint);
 let forwarded=0;
 await assert.rejects(()=>askPublicAi("raw-personal-data",{endpoint,fetchFn:async()=>{forwarded++;}}));assert.equal(forwarded,0);
});
test("offline and sync fail-closed behavior preserved; CSP and cache account for AI",()=>{
 const base=new URL("../site/",import.meta.url);const app=readFileSync(new URL("app.mjs",base),"utf8");
 const sw=readFileSync(new URL("sw.js",base),"utf8");
 assert(app.includes("async function syncData(){ /* fail closed: no plaintext health-data network sync */ return; }"));
 assert(app.includes("askPublicAi(topic"));assert(app.includes("aiConsentChecked"));
 assert(sw.includes('"./ai-client.mjs"'));assert(sw.includes("!STATIC_PATHS.has(url.pathname)"));
 assert(!sw.includes("cache.put("));
 const config=readFileSync(new URL("config.js",base),"utf8");
 assert(config.includes('window.HEALTHY_WOMEN_AI_API="https://healthy-women-bot.vercel.app/api/ai"'));
});

test("client resolves symptom intent before generic hayz keywords",()=>{
 assert.equal(pickAiTopic("Hayz og‘rig‘i haqida"),"pain");
 assert.equal(pickAiTopic("Qon juda ko‘p ketmoqda"),"heavy");
 assert.equal(pickAiTopic("PCOS nima?"),"pcos");
 assert.equal(pickAiTopic("Hayz kechiksa"),"pregnancy");
 assert.equal(pickAiTopic("Hayz sikli nima?"),"cycle");
 assert.equal(pickAiTopic("Shaxsiy parolim 123456"),null);
});
