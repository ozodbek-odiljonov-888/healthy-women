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
