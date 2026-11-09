import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {LOCAL_VAULT_KEY,LEGACY_EVENTS_KEY,hasEncryptedJournal,readPlainJournal,unlockEncryptedJournal,writeEncryptedJournal,migratePlainJournal,removeAllJournalData} from "../site/local-crypto.mjs";
globalThis.crypto ||= webcrypto;
const PASSWORD="Fair-Evening-Flowers-2026";
const records=[{id:"a2",type:"period",payload:{start:"2026-10-04",end:"2026-10-08"},updated_at:1790000000000,deleted:0},{id:"b3",type:"checkin",payload:{date:"2026-10-06",pain:4,flow:"normal",mood:"good",between:false,note:"Sensitive test note"},updated_at:1790000000001,deleted:0}];
function store(){const map=new Map();return {setItem:(k,v)=>map.set(k,String(v)),getItem:k=>map.has(k)?map.get(k):null,removeItem:k=>map.delete(k),map};}
test("migration encrypts all entries and removes plaintext only after verifying",async()=>{
 const storage=store();storage.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 const out=await migratePlainJournal(PASSWORD,storage);
 assert.equal(hasEncryptedJournal(storage),true);assert.equal(storage.getItem(LEGACY_EVENTS_KEY),null);
 assert(!storage.getItem(LOCAL_VAULT_KEY).includes("Sensitive test note"));
 assert.deepEqual(out.events,records);
 const unlocked=await unlockEncryptedJournal(PASSWORD,storage);
 assert.deepEqual(unlocked.events,records);
});
test("wrong password cannot read ciphertext",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 await assert.rejects(unlockEncryptedJournal("incorrect-password-123",s));
});
test("encrypted updates preserve complete entries and never write plaintext",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 const {session}=await migratePlainJournal(PASSWORD,s);
 const next=[...records,{id:"c4",type:"checkin",payload:{date:"2026-10-07",pain:6,flow:"light",mood:"neutral",between:false,note:"Another secret"},updated_at:1790000000002,deleted:0}];
 await writeEncryptedJournal(next,session,s);
 assert.deepEqual((await unlockEncryptedJournal(PASSWORD,s)).events,next);
 assert(!s.getItem(LOCAL_VAULT_KEY).includes("Another secret"));
});
test("invalid existing plaintext never deleted during migration",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,"broken JSON");
 await assert.rejects(migratePlainJournal(PASSWORD,s));
 assert.equal(s.getItem(LEGACY_EVENTS_KEY),"broken JSON");
 assert.equal(s.getItem(LOCAL_VAULT_KEY),null);
});
test("failing encrypted write keeps the original plaintext copy",async()=>{
 const s=store();const old=JSON.stringify(records);s.setItem(LEGACY_EVENTS_KEY,old);
 let once=true,removed=[];
 const fragile={getItem:s.getItem,setItem:(k,v)=>{if(k===LOCAL_VAULT_KEY&&once){once=false;throw Error("quota");}s.setItem(k,v);},removeItem:k=>{removed.push(k);s.removeItem(k);}};
 await assert.rejects(migratePlainJournal(PASSWORD,fragile));
 assert.equal(s.getItem(LEGACY_EVENTS_KEY),old);
 assert(!removed.includes(LEGACY_EVENTS_KEY));
});
test("manipulating ciphertext breaks AES-GCM verification",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 const obj=JSON.parse(s.getItem(LOCAL_VAULT_KEY));
 obj.ciphertext=obj.ciphertext.slice(0,-4)+"AAAA";
 s.setItem(LOCAL_VAULT_KEY,JSON.stringify(obj));
 await assert.rejects(unlockEncryptedJournal(PASSWORD,s));
});
test("all local data keys can be cleared without passphrase",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 assert(removeAllJournalData(s));assert.equal(s.getItem(LOCAL_VAULT_KEY),null);
});

test("a stale tab cannot overwrite encrypted journal changes",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 const first=await migratePlainJournal(PASSWORD,s);
 const second=await unlockEncryptedJournal(PASSWORD,s);
 await writeEncryptedJournal(records,first.session,s);
 await assert.rejects(writeEncryptedJournal(records,second.session,s),/boshqa oynada/);
});

test("phase questionnaire observations survive encrypted migration",async()=>{
 const s=store();
 const rows=[...records,{id:"questionnaire",type:"checkin",payload:{date:"2026-10-16",phase:"middle",periodStart:"2026-10-04",pain:3,flow:"none",mood:"neutral",hourly:false,dizzy:false,between:false,note:"Private phase note"},updated_at:1790000000005,deleted:0}];
 s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(rows));
 const {session}=await migratePlainJournal(PASSWORD,s);
 const out=await unlockEncryptedJournal(PASSWORD,s);
 assert.equal(out.events.length,rows.length);
 const phase=out.events.find(x=>x.id==="questionnaire");
 assert.equal(phase.payload.phase,"middle");
 assert.equal(phase.payload.periodStart,"2026-10-04");
 assert.equal(phase.payload.note,"Private phase note");
 await writeEncryptedJournal(out.events,session,s);
 assert(!s.getItem(LOCAL_VAULT_KEY).includes("Private phase note"));
});
