import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("production PWA cannot send unencrypted diary entries to legacy sync endpoint",()=>{
 const app=readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 assert(!app.includes("api('/api/sync'"),"Legacy plaintext sync request must be removed");
 assert(app.includes("async function syncData(){ /* fail closed: no plaintext health-data network sync */ return; }"));
 assert(app.includes('id="syncToggle" disabled'));
 assert(app.includes("Bulut sinxronlash xavfsizlik va shifrlash tekshiruvigacha o‘chirilgan."));
});
test("Telegram launch parser remains offline-cached and does not transmit initData automatically",()=>{
 const app=readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 const module=readFileSync(new URL("../site/telegram-launch.mjs",import.meta.url),"utf8");
 const cache=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(app.includes('import {getRawTelegramInitData} from "./telegram-launch.mjs";'));
 assert(cache.includes('"./telegram-launch.mjs"'));
 assert(!/fetch\s*\(/.test(module));
 assert(!/localStorage\.setItem|sessionStorage\.setItem|console\.log\s*\(/.test(module));
});
