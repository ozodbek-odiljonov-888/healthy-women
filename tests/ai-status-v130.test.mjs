import test from "node:test";import assert from "node:assert/strict";
import {getAiStatus} from "../bot-vercel/api/ai-status.js";
import {checkAiAvailability,AI_STATUS_URL} from "../site/ai-status.mjs";
import {readFileSync} from "node:fs";
const origin="https://healthy-women.vercel.app";
const env={AI_MODE:"free_preview",AI_FREE_TIER_NO_BILLING:"CONFIRMED",AI_ALLOWED_ORIGIN:origin,AI_ANDROID_ORIGIN:"https://localhost",AI_ALLOWED_HOSTNAME:"healthy-women-bot.vercel.app",GEMINI_API_KEY:"fictional-local-test-key-over-20chars",AI_DATABASE_URL:"postgresql://test.invalid/db",AI_IP_PEPPER:"fictional-pepper-more-than-32-characters"};
const request=(method="GET",url="https://healthy-women-bot.vercel.app/api/ai-status",from=origin)=>new Request(url,{method,headers:{Origin:from}});
test("status read is public metadata only; disabled by default",async()=>{
 const s=await getAiStatus(request(),{env:{...env,AI_MODE:"off"}}).json();
 assert.equal(s.enabled,false);assert.equal(s.freeTierVerified,false);
 assert.equal(JSON.stringify(s).includes("fictional"),false);
});
test("status has explicit CORS allowlist and no quota or upstream call",async()=>{
 const r=getAiStatus(request(),{env});assert.equal(r.status,200);assert.equal(r.headers.get("access-control-allow-origin"),origin);
 const s=await r.json();assert.equal(s.enabled,true);assert.equal(s.freeTierVerified,true);
 const bad=getAiStatus(request("GET",undefined,"https://malicious.example"),{env});assert.equal(bad.headers.get("access-control-allow-origin"),null);
});
test("browser status check fails closed, never sends diary or raw questions",async()=>{
 let calls=[];const status=await checkAiAvailability({fetchFn:async(url,options)=>{calls.push({url,options});return Response.json({enabled:false,freeTierVerified:false});}});
 assert.equal(status.enabled,false);assert.equal(calls[0].url,AI_STATUS_URL);assert.equal(calls[0].options.method,"GET");
 assert.equal("body" in calls[0].options,false);
 assert.equal((await checkAiAvailability({fetchFn:async()=>{throw Error("network");}})).enabled,false);
});
test("AI provider uses low-cost minimal thinking level, one candidate and token cap",()=>{
 const src=readFileSync(new URL("../bot-vercel/api/ai.js",import.meta.url),"utf8");
 assert(src.includes('thinkingConfig:{thinkingLevel:"minimal"}'));
 assert(src.includes("candidateCount:1"));
 assert(src.includes("maxOutputTokens:AI_LIMITS.maxOutputTokens"));
});
test("site requires explicit status check before send and precaches module",()=>{
 const app=readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(app.includes("checkAiAvailability()"));assert(app.includes("!aiRemoteStatus?.enabled"));
 assert(sw.includes("./ai-status.mjs"));assert(sw.includes("healthy-women-pwa-v32-small-demo"));
});
