import test from "node:test";
import assert from "node:assert/strict";
import {getDemoClientId,askPublicAi} from "../site/ai-client.mjs";
import {handleAiRequest,anonymousKey} from "../bot-vercel/api/ai.js";
import {getTelegramBotStatus} from "../bot-vercel/api/bot-status.js";
import {readFileSync} from "node:fs";
const origin="https://healthy-women.vercel.app",endpoint="https://healthy-women-bot.vercel.app/api/ai";
const env={AI_MODE:"free_preview",AI_FREE_TIER_NO_BILLING:"CONFIRMED",AI_ALLOWED_ORIGIN:origin,AI_ANDROID_ORIGIN:"https://localhost",AI_ALLOWED_HOSTNAME:"healthy-women-bot.vercel.app",GEMINI_API_KEY:"fictional-key-for-unit-tests-only",AI_DATABASE_URL:"postgresql://example.invalid/dummy",AI_IP_PEPPER:"long-test-pepper-at-least-32-characters"};
const ids=["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222","33333333-3333-4333-8333-333333333333","44444444-4444-4444-8444-444444444444"];
const post=(id,where=origin)=>new Request(endpoint,{method:"POST",headers:{Origin:where,"Content-Type":"application/json","x-vercel-forwarded-for":"192.0.2.10",...(id?{"X-HW-Demo-Id":id}:{})},body:JSON.stringify({topic:"pain",consent:true})});
test("four testers on one WiFi retain different anonymous client quotas",async()=>{
 const clientHashes=[],networks=[];
 for(const id of ids){
  const response=await handleAiRequest(post(id),{env,reserve:async(({clientHash,networkHash})=>{
   clientHashes.push(clientHash);networks.push(networkHash);return {allowed:true,remaining_daily:24,remaining_client:2};
  },generate:async()=> "Fictional educational topic only."});
  assert.equal(response.status,200);
 }
 assert.equal(new Set(clientHashes).size,4);
 assert.equal(new Set(networks).size,1);
 assert.equal(networks[0],anonymousKey("network:192.0.2.10",env.AI_IP_PEPPER));
});
test("invalid demo identity rejected before DB and upstream",async()=>{
 let calls=0;const r=await handleAiRequest(post("known-email@example.com"),{env,
 reserve:async()=>{calls++;return {allowed:true}},generate:async()=>{calls++;return "bad"}});
 assert.equal(r.status,400);assert.equal(calls,0);
});
test("CORS preflight includes only needed headers and no wildcard",async()=>{
 const r=await handleAiRequest(new Request(endpoint,{method:"OPTIONS",headers:{Origin:origin}}),{env});
 assert.equal(r.status,204);
 assert.match(r.headers.get("access-control-allow-headers"),/X-HW-Demo-Id/);
 assert.equal(r.headers.get("access-control-allow-origin"),origin);
});
test("local random identity persists, contains no personal information",()=>{
 const m=new Map(),storage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};
 const id=getDemoClientId({storage,randomUUID:()=>ids[0]});
 assert.equal(id,ids[0]);
 assert.equal(getDemoClientId({storage,randomUUID:()=>ids[1]}),ids[0]);
 assert.equal(m.size,1);
 assert.equal(getDemoClientId({storage:{getItem(){throw Error("blocked")}},randomUUID:()=>ids[2]}),"");
});
test("public AI client transmits only fixed topic and random demo ID; not diary",async()=>{
 const original=globalThis.localStorage;
 const captured=[];
 try{
  Object.defineProperty(globalThis,"localStorage",{value:{getItem:()=>ids[0]},configurable:true});
  const result=await askPublicAi("pain",{endpoint,fetchFn:async(url,opts)=>{
   captured.push(opts);
   return Response.json({answer:"General education.",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/",remainingToday:2});
  }});
  assert.equal(result.text,"General education.");
  assert.equal(captured[0].headers["X-HW-Demo-Id"],ids[0]);
  assert.deepEqual(JSON.parse(captured[0].body),{topic:"pain",consent:true});
 }finally{if(original===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,"localStorage",{value:original,configurable:true});}
});
test("Telegram status reports only public bot username and webhook match",async()=>{
 const token="12345678:"+"z".repeat(35);
 const fetchFn=async(url)=>Response.json({ok:true,result:String(url).endsWith("/getMe")
  ?{username:"healthy_women_demo_bot"}:{url:"https://healthy-women-bot.vercel.app/webhook"}});
 const data=await (await getTelegramBotStatus(new Request("https://healthy-women-bot.vercel.app/api/bot-status"),{env:{BOT_TOKEN:token},fetchFn})).json();
 assert.deepEqual(data,{configured:true,online:true,webhookReady:true,username:"healthy_women_demo_bot",hasRecentDeliveryError:false});
 assert(!JSON.stringify(data).includes(token));
});
test("bot status endpoint never returns webhook URL or bot token on error",async()=>{
 const token="12345678:"+"z".repeat(35);
 const data=await (await getTelegramBotStatus(new Request("https://example.com/api/bot-status"),{env:{BOT_TOKEN:token},fetchFn:async()=>{throw Error("offline");}})).json();
 assert.equal(data.online,false);assert.equal(data.webhookReady,false);
 assert(!JSON.stringify(data).includes(token));
});
test("SQL migration preserves global lock, lifetime counter and network safeguards",()=>{
 const sql=readFileSync(new URL("../db/migrations/004_ai_small_demo_network_limits.sql",import.meta.url),"utf8");
 assert(sql.includes("pg_advisory_xact_lock(271127001::BIGINT)"));
 assert(sql.includes("c_total>=1000"));assert(sql.includes("c_network>=12"));
 assert(sql.includes("c_network_minute>=2"));
 assert(sql.includes("GRANT EXECUTE"));
 assert(!sql.includes("TRUNCATE "));
});
