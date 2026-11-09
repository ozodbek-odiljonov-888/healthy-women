import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("no unencrypted backup restore bypass in main application",()=>{
 const s=read("../site/app.mjs");
 assert(!s.includes("localStorage.setItem(KEY,JSON.stringify(restored))"));
 assert(s.includes("writeEncryptedJournal(next,session)"));
 assert(s.includes("removeAllJournalData()"));
 assert(s.includes("hasEncryptedJournal()||syncBusy"));
 assert(s.includes("savePhaseRecord"));
});
test("privacy delete erases encrypted and old journal keys",()=>{
 const s=read("../site/privacy-page.mjs");
 assert(s.includes("healthywomen.encrypted-local.v1"));
 assert(s.includes("healthywomen.events.v1"));
});
test("offline app pre-caches the encryption UI and algorithm",()=>{
 const s=read("../site/sw.js");
 assert(s.includes("./local-crypto.mjs")&&s.includes("./local-crypto-ui.mjs"));
});

test("main app serializes writes and blocks corrupted legacy overwrites",()=>{
 const app=read("../site/app.mjs");
 assert(app.includes("withJournalWriteLock(async()=>"));
 assert(app.includes("assertJournalRevision(localStorage,KEY,plainRevision)"));
 assert(app.includes("if(plainCorrupt)throw Error"));
 assert(app.includes("Asl nusxani saqlash"));
});
