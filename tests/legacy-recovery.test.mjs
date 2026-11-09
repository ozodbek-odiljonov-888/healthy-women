import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {inspectLegacy,combineNonConflicting,dropLegacyIfUnchanged,mergeLegacySafely} from "../site/legacy-recovery.mjs";
import {LEGACY_EVENTS_KEY,LOCAL_VAULT_KEY,migratePlainJournal,unlockEncryptedJournal} from "../site/local-crypto.mjs";
globalThis.crypto ||= webcrypto;
const password="Only-Test-Password-2026";
const original={id:"a",type:"period",payload:{start:"2026-10-01",end:"2026-10-05"},updated_at:1000,deleted:0};
const added={id:"b",type:"checkin",payload:{date:"2026-10-08",pain:4,flow:"normal",mood:"good",note:"fictional only",between:false},updated_at:2000,deleted:0};
function memory(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
test("identical legacy records are distinguishable from changed or malformed ones",async()=>{
 const storage=memory();storage.setItem(LEGACY_EVENTS_KEY,JSON.stringify([original]));
 await migratePlainJournal(password,storage);
 const unlocked=await unlockEncryptedJournal(password,storage);
 assert.equal(inspectLegacy(storage,unlocked.events).state,"none");
 storage.setItem(LEGACY_EVENTS_KEY,JSON.stringify([original]));
 assert.equal(inspectLegacy(storage,unlocked.events).state,"same");
 storage.setItem(LEGACY_EVENTS_KEY,JSON.stringify([original,added]));
 assert.equal(inspectLegacy(storage,unlocked.events).state,"different");
 storage.setItem(LEGACY_EVENTS_KEY,"{not-json");
 assert.equal(inspectLegacy(storage,unlocked.events).state,"invalid");
});
test("noncolliding entries are merged and conflicting versions cannot be silently replaced",()=>{
 assert.equal(combineNonConflicting([original],[original,added]).length,2);
 const changed={...original,updated_at:4000};
 assert.throws(()=>combineNonConflicting([original],[changed]),/birlashtirish bloklandi/);
 assert.throws(()=>combineNonConflicting([original],[{...original,deleted:1,payload:{}}]),/birlashtirish bloklandi/);
});
test("extra plaintext entry is encrypted, verified, then deleted",async()=>{
 const storage=memory();storage.setItem(LEGACY_EVENTS_KEY,JSON.stringify([original]));
 await migratePlainJournal(password,storage);
 const unlocked=await unlockEncryptedJournal(password,storage);
 const legacy=[original,added],raw=JSON.stringify(legacy);storage.setItem(LEGACY_EVENTS_KEY,raw);
 const reconciled=await mergeLegacySafely({storage,encryptedEvents:unlocked.events,legacy,raw,session:unlocked.session,password});
 assert.equal(reconciled.events.length,2);
 assert.equal(storage.getItem(LEGACY_EVENTS_KEY),null);
 assert(!storage.getItem(LOCAL_VAULT_KEY).includes("fictional only"));
 assert.equal((await unlockEncryptedJournal(password,storage)).events.length,2);
});
test("changed plaintext is never destroyed by stale confirmation",()=>{
 const storage=memory();storage.setItem(LEGACY_EVENTS_KEY,"old");
 assert.throws(()=>dropLegacyIfUnchanged(storage,"different"),/boshqa oynada/);
 assert.equal(storage.getItem(LEGACY_EVENTS_KEY),"old");
});
test("conflicting same-ID records preserve BOTH stores untouched",async()=>{
 const storage=memory();storage.setItem(LEGACY_EVENTS_KEY,JSON.stringify([original]));
 await migratePlainJournal(password,storage);
 const encryptedBefore=storage.getItem(LOCAL_VAULT_KEY);
 const unlocked=await unlockEncryptedJournal(password,storage);
 const conflicting={...original,updated_at:4000};
 const legacy=[conflicting],raw=JSON.stringify(legacy);storage.setItem(LEGACY_EVENTS_KEY,raw);
 await assert.rejects(mergeLegacySafely({storage,encryptedEvents:unlocked.events,legacy,raw,session:unlocked.session,password}),/bloklandi/);
 assert.equal(storage.getItem(LEGACY_EVENTS_KEY),raw);
 assert.equal(storage.getItem(LOCAL_VAULT_KEY),encryptedBefore);
});
