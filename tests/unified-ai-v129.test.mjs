import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleAiRequest,runTelegramTopicAi,aiConfigReady,allowedOrigin,anonymousKey} from "../bot-vercel/api/ai.js";
import {AI_MODEL,AI_TOPICS} from "../bot-vercel/worker/ai-topics.js";
import bot,{handleUpdate} from "../bot-vercel/worker/index.js";
const origin="https://healthy-women.vercel.app",endpoint="https://healthy-women-bot.vercel.app/api/ai";
const env={AI_MODE:"free_preview",AI_FREE_TIER_NO_BILLING:"CONFIRMED",AI_ALLOWED_ORIGIN:origin,AI_ANDROID_ORIGIN:"https://localhost",AI_ALLOWED_HOSTNAME:"healthy-women-bot.vercel.app",GEMINI_API_KEY:"fictional-api-key-for-tests-only",AI_DATABASE_URL:"postgresql://example.invalid/fictional",AI_IP_PEPPER:"fictional-long-unique-pepper-thirty-two-plus-characters"};
const reserve=async()=>({allowed:true,remaining_daily:28,remaining_client:1});
const post=where=>new Request(endpoint,{method:"POST",headers:{"Origin":where,"Content-Type":"application/json","x-vercel-forwarded-for":"192.0.2.24"},body:'{"topic":"pain","consent":true}'});
test("model is officially named Free Tier Gemini 3.1 Flash-Lite",()=>{assert.equal(AI_MODEL,"gemini-3.1-flash-lite");assert.equal(Object.keys(AI_TOPICS).length,10);});
test("PWA and Android use the same limited server endpoint and IP quota",async()=>{
 const hashes=[];
 for(const where of [origin,"https://localhost"]){
  const r=await handleAiRequest(post(where),{env,reserve:async a=>{hashes.push(a.clientHash);return reserve();},generate:async p=>{assert.deepEqual(p.topic,AI_TOPICS.pain);return "Umumiy bilim";}});
  assert.equal(r.status,200);
  assert.equal(r.headers.get("access-control-allow-origin"),where);
  assert.equal((await r.json()).answer,"Umumiy bilim");
 }
 assert.equal(hashes.length,2);assert.equal(hashes[0],hashes[1]);
});
test("Android CORS explicitly allowlisted, untrusted origins remain denied",async()=>{
 assert.equal(allowedOrigin({...env,AI_ANDROID_ORIGIN:""},"https://localhost"),"");
 for(const site of ["http://localhost","https://evil.test","capacitor://localhost","https://localhost.attacker.test"]){
  assert.equal(allowedOrigin(env,site),"");
  assert.equal((await handleAiRequest(post(site),{env,reserve,generate:async()=>"NO"})).status,503);
 }
});
test("Telegram uses a per-user hash and sends only public topic to model",async()=>{
 let captured;
 const r=await runTelegramTopicAi({topic:"pcos",chatId:12345,env,
  reserve:async a=>{captured=a;return reserve();},
  generate:async a=>{assert.deepEqual(a.topic,AI_TOPICS.pcos);return "Ta'limiy javob";}});
 assert(r.ok);assert.equal(r.remainingToday,1);
 assert.equal(captured.clientHash,anonymousKey("tg:12345",env.AI_IP_PEPPER));
 assert(!JSON.stringify(captured).includes("12345"));
});
test("invalid user or absent server config and DB block Telegram inference",async()=>{
 let called=0;const generate=async()=>{called++;return "BAD";};
 assert.equal((await runTelegramTopicAi({topic:"pain",chatId:-1,env,generate})).status,400);
 assert.equal((await runTelegramTopicAi({topic:"secret-question",chatId:42,env,reserve,generate})).status,400);
 assert.equal((await runTelegramTopicAi({topic:"pain",chatId:42,env:{...env,AI_MODE:"off"},reserve,generate})).status,503);
 assert.equal((await runTelegramTopicAi({topic:"pain",chatId:42,env,reserve:async()=>{throw Error("DB down");},generate})).status,503);
 assert.equal(called,0);assert.equal(aiConfigReady({...env,AI_MODE:"off"}),false);
});
test("Telegram /ai asks for explicit topic consent; /ask remains offline",async t=>{
 const sent=[];
 t.mock.method(globalThis,"fetch",async(url,opts)=>{sent.push(JSON.parse(opts.body));return Response.json({ok:true,result:{message_id:1}});});
 const settings={BOT_TOKEN:"fake-token",WEBHOOK_SECRET:"fake-secret"};
 const req=message=>new Request("https://example.test/webhook",{method:"POST",headers:{"X-Telegram-Bot-Api-Secret-Token":"fake-secret"},body:JSON.stringify({message:{chat:{type:"private",id:42},text:message}})});
 assert.equal((await bot.fetch(req("/ai"),settings)).status,200);
 assert(sent.at(-1).text.includes("rozilik"));
 assert(sent.at(-1).reply_markup.inline_keyboard.flat().some(x=>x.callback_data==="ai:pain"));
 assert.equal((await bot.fetch(req("/ask hayz og‘rig‘i"),settings)).status,200);
 assert(!sent.at(-1).text.includes("AI ma’rifiy javobi"));
});
test("Telegram callback invokes exactly one opt-in AI topic and cites its fixed source",async t=>{
 const sent=[];
 t.mock.method(globalThis,"fetch",async(url,opts)=>{sent.push({url:String(url),body:JSON.parse(opts.body)});return Response.json({ok:true,result:{message_id:1}});});
 await handleUpdate({callback_query:{id:"cb1",data:"ai:pain",message:{chat:{type:"private",id:42}}}},{BOT_TOKEN:"fake-token"},
  {runAi:async input=>{assert.equal(input.chatId,42);assert.equal(input.topic,"pain");return {ok:true,answer:"Fictional education",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/",remainingToday:1};}});
 assert.equal(sent.length,2);assert(sent[0].url.includes("answerCallbackQuery"));assert(sent[1].body.text.includes("Fictional education"));
 assert(sent[1].body.text.includes("NHS"));
});
test("blocked private/group or malformed AI callbacks do not trigger provider",async t=>{
 let calls=0;t.mock.method(globalThis,"fetch",async()=>{throw Error("should not send");});
 for(const data of ["ai:wrong","ai:pain\nmalicious"]){
  await handleUpdate({callback_query:{id:"a",data,message:{chat:{type:"private",id:42}}}},{BOT_TOKEN:"x"},{runAi:async()=>{calls++;}});
 }
 await handleUpdate({callback_query:{id:"a",data:"ai:pain",message:{chat:{type:"group",id:42}}}},{BOT_TOKEN:"x"},{runAi:async()=>{calls++;}});
 assert.equal(calls,0);
});
test("site CSP, public config, service worker and privacy notice cover AI",()=>{
 const root=new URL("../site/",import.meta.url);
 const html=readFileSync(new URL("index.html",root),"utf8");
 const cfg=readFileSync(new URL("config.js",root),"utf8");
 const sw=readFileSync(new URL("sw.js",root),"utf8");
 const privacy=readFileSync(new URL("privacy.html",root),"utf8");
 assert(html.includes("connect-src 'self' https://healthy-women-bot.vercel.app"));
 assert(cfg.includes('window.HEALTHY_WOMEN_AI_API="https://healthy-women-bot.vercel.app/api/ai"'));
 assert(sw.includes("healthy-women-pwa-v29-unified-ai"));
 assert(privacy.includes("Ixtiyoriy AI"));
 for(const forbidden of ["GEMINI_API_KEY","AI_DATABASE_URL","AI_IP_PEPPER","BOT_TOKEN"])assert(!cfg.includes(forbidden));
});
