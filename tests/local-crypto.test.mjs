import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {LOCAL_VAULT_KEY,LEGACY_EVENTS_KEY,hasEncryptedJournal,readPlainJournal,unlockEncryptedJournal,writeEncryptedJournal,migratePlainJournal,rotateEncryptedJournalPassword,removeAllJournalData} from "../site/local-crypto.mjs";
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

test("migration does not delete a newer plaintext revision arriving during encryption",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 let checkCount=0;const updated=JSON.stringify([...records,{id:"new2",type:"period",payload:{start:"2026-11-02",end:null},updated_at:1791000000000,deleted:0}]);
 const raced={getItem:k=>{if(k===LEGACY_EVENTS_KEY&&++checkCount===2)s.setItem(LEGACY_EVENTS_KEY,updated);return s.getItem(k);},setItem:s.setItem,removeItem:s.removeItem};
 await assert.rejects(migratePlainJournal(PASSWORD,raced),/boshqa oynada/);
 assert.equal(s.getItem(LEGACY_EVENTS_KEY),updated);
 assert.equal(s.getItem(LOCAL_VAULT_KEY),null);
});

test("plaintext revision changed after ciphertext verification is never deleted",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 const newer=JSON.stringify([...records,{id:"recent",type:"period",payload:{start:"2026-11-02",end:null},updated_at:1791000000000,deleted:0}]);
 let reads=0;
 const racing={getItem:k=>{
  if(k===LEGACY_EVENTS_KEY&&++reads===4)s.setItem(LEGACY_EVENTS_KEY,newer);
  return s.getItem(k);
 },setItem:s.setItem,removeItem:s.removeItem};
 await assert.rejects(migratePlainJournal(PASSWORD,racing));
 assert.equal(s.getItem(LEGACY_EVENTS_KEY),newer);
 assert.equal(s.getItem(LOCAL_VAULT_KEY),null);
});

test("rotation changes salt and password without losing any medical entry",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 const before=s.getItem(LOCAL_VAULT_KEY),beforeSalt=JSON.parse(before).salt;
 const pass2="A-New-Unique-Local-Pass-2026";
 const rotated=await rotateEncryptedJournalPassword(PASSWORD,pass2,before,s);
 assert.deepEqual(rotated.events,records);
 assert.equal(s.getItem(LEGACY_EVENTS_KEY),null);
 const after=s.getItem(LOCAL_VAULT_KEY);
 assert.notEqual(after,before);
 assert.notEqual(JSON.parse(after).salt,beforeSalt);
 assert(!after.includes("Sensitive test note"));
 await assert.rejects(unlockEncryptedJournal(PASSWORD,s),/noto‘g‘ri/);
 assert.deepEqual((await unlockEncryptedJournal(pass2,s)).events,records);
});
test("wrong old password never alters ciphertext",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 const source=s.getItem(LOCAL_VAULT_KEY);
 await assert.rejects(rotateEncryptedJournalPassword("Wrong-Old-Passphrase-123","Correct-New-Passphrase-456",source,s));
 assert.equal(s.getItem(LOCAL_VAULT_KEY),source);
});
test("stale backed-up revision cannot be rotated",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 const original=await migratePlainJournal(PASSWORD,s);
 const source=s.getItem(LOCAL_VAULT_KEY);
 await writeEncryptedJournal(records,original.session,s);
 await assert.rejects(rotateEncryptedJournalPassword(PASSWORD,"Correct-New-Passphrase-456",source,s),/o‘zgargan/);
});
test("password rotation cannot be attempted while an unresolved legacy plaintext copy remains",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 const source=s.getItem(LOCAL_VAULT_KEY);
 s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await assert.rejects(rotateEncryptedJournalPassword(PASSWORD,"Correct-New-Passphrase-456",source,s),/Eski ochiq nusxa/);
 assert.equal(s.getItem(LOCAL_VAULT_KEY),source);
});
test("failure to save rekeyed ciphertext leaves previous encryption accessible",async()=>{
 const s=store();s.setItem(LEGACY_EVENTS_KEY,JSON.stringify(records));
 await migratePlainJournal(PASSWORD,s);
 const original=s.getItem(LOCAL_VAULT_KEY);
 const failed={getItem:s.getItem,removeItem:s.removeItem,setItem:(k,v)=>{if(k===LOCAL_VAULT_KEY)throw Error("Storage quota");s.setItem(k,v);}};
 await assert.rejects(rotateEncryptedJournalPassword(PASSWORD,"Correct-New-Passphrase-456",original,failed),/Storage quota/);
 assert.equal(s.getItem(LOCAL_VAULT_KEY),original);
 assert.deepEqual((await unlockEncryptedJournal(PASSWORD,s)).events,records);
});
