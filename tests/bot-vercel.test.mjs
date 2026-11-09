import test from "node:test";
import assert from "node:assert/strict";
import webhook from "../bot-vercel/api/webhook.js";
import health from "../bot-vercel/api/health.js";
import {readFileSync} from "node:fs";
test("bot health is public but reveals no credentials or patient details",async()=>{
 const r=await health.fetch(new Request("https://bot.invalid/api/health"));
 const d=await r.json();
 assert.equal(r.status,200);assert.equal(d.ok,true);assert.equal(d.patient_data_stored,false);
 assert.equal(d.reminders_enabled,false);
 assert(!JSON.stringify(d).includes("BOT_TOKEN"));
});
test("Telegram webhook is POST only",async()=>{
 const r=await webhook.fetch(new Request("https://bot.invalid/api/webhook"));
 assert.equal(r.status,405);
});
test("Telegram webhook rejects unauthenticated callers",async()=>{
 const r=await webhook.fetch(new Request("https://bot.invalid/api/webhook",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}));
 assert.equal(r.status,403);
});
test("static configuration contains safe endpoint rewrites",()=>{
 const config=JSON.parse(readFileSync(new URL("../bot-vercel/vercel.json",import.meta.url),"utf8"));
 assert(config.rewrites.some(x=>x.source==="/webhook"&&x.destination==="/api/webhook"));
 assert(config.rewrites.some(x=>x.source==="/health"&&x.destination==="/api/health"));
});

test("valid webhook header is forwarded to the Telegram bot as POST",async t=>{
  const previousToken=process.env.BOT_TOKEN,previousSecret=process.env.WEBHOOK_SECRET;
  process.env.BOT_TOKEN="TEST_BOT_TOKEN";process.env.WEBHOOK_SECRET="TEST_SECRET";
  const calls=[];
  t.mock.method(globalThis,"fetch",async (_url,opts)=>{
    calls.push({method:opts.method,body:JSON.parse(opts.body)});
    return Response.json({ok:true,result:{message_id:1}});
  });
  try{
    const update={message:{chat:{id:101,type:"private"},text:"/start"}};
    const response=await webhook.fetch(new Request("https://example.test/api/webhook",{method:"POST",headers:{"X-Telegram-Bot-Api-Secret-Token":"TEST_SECRET","Content-Type":"application/json"},body:JSON.stringify(update)}));
    assert.equal(response.status,200);assert.equal(calls.length,1);assert.equal(calls[0].method,"POST");
  }finally{
    if(previousToken===undefined)delete process.env.BOT_TOKEN;else process.env.BOT_TOKEN=previousToken;
    if(previousSecret===undefined)delete process.env.WEBHOOK_SECRET;else process.env.WEBHOOK_SECRET=previousSecret;
  }
});
