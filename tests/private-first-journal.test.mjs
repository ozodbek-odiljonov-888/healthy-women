import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {needsEncryptedJournalSetup,hasEncryptedJournal,LEGACY_EVENTS_KEY,LOCAL_VAULT_KEY,migratePlainJournal,unlockEncryptedJournal} from "../site/local-crypto.mjs";

globalThis.crypto ||= webcrypto;
const PASSWORD="FICTIONAL-PRIVATE-FIRST-STRONG-2026";
const medicalNote="FICTIONAL NEVER REAL PATIENT";
function fakeStorage(){
 const values=new Map();
 return {getItem:k=>values.has(k)?values.get(k):null,
  setItem:(k,v)=>values.set(k,String(v)),
  removeItem:k=>values.delete(k),
  values};
}
test("brand-new local storage requires encryption before first health note",()=>{
 const storage=fakeStorage();
 assert.equal(needsEncryptedJournalSetup(storage),true);
 assert.equal(hasEncryptedJournal(storage),false);
 assert.equal(storage.getItem(LEGACY_EVENTS_KEY),null);
});
test("empty legacy data never bypasses first-use encryption",()=>{
 const storage=fakeStorage();
 for(const legacy of ["[]"," [  ] ","\n[]\n"]){
  storage.setItem(LEGACY_EVENTS_KEY,legacy);
  assert.equal(needsEncryptedJournalSetup(storage),true);
  assert.equal(storage.getItem(LEGACY_EVENTS_KEY),legacy);
 }
});
test("nonempty and corrupt legacy data remain preserved for explicit recovery",()=>{
 const storage=fakeStorage();
 const existing=[{id:"historical",type:"period",payload:{start:"2026-10-01",end:"2026-10-04"},updated_at:1790000000000,deleted:0}];
 for(const legacy of [JSON.stringify(existing),"{broken historical record", "[{}]", "null"]){
  storage.setItem(LEGACY_EVENTS_KEY,legacy);
  assert.equal(needsEncryptedJournalSetup(storage),false);
  assert.equal(storage.getItem(LEGACY_EVENTS_KEY),legacy);
 }
});
test("empty older diaries migrate without plaintext writes or data loss",async()=>{
 const storage=fakeStorage();
 storage.setItem(LEGACY_EVENTS_KEY," [ ] ");
 assert.equal(needsEncryptedJournalSetup(storage),true);
 const first=await migratePlainJournal(PASSWORD,storage);
 assert.deepEqual(first.events,[]);
 assert.equal(storage.getItem(LEGACY_EVENTS_KEY),null);
 assert.equal(hasEncryptedJournal(storage),true);
 assert.equal(needsEncryptedJournalSetup(storage),false);
});
test("fresh first-use setup stores only ciphertext, then reopens with the same password",async()=>{
 const storage=fakeStorage();
 assert.equal(needsEncryptedJournalSetup(storage),true);
 const result=await migratePlainJournal(PASSWORD,storage);
 assert.deepEqual(result.events,[]);
 assert.equal(needsEncryptedJournalSetup(storage),false);
 assert.equal(storage.getItem(LEGACY_EVENTS_KEY),null);
 const encrypted=storage.getItem(LOCAL_VAULT_KEY);
 assert.match(encrypted,/"AES-256-GCM"/);
 assert(!encrypted.includes(medicalNote));
 const reopened=await unlockEncryptedJournal(PASSWORD,storage);
 assert.deepEqual(reopened.events,[]);
});
test("security guard runs before every new plaintext write and prompts existing encryption dialog",()=>{
 const app=readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../site/local-crypto-ui.mjs",import.meta.url),"utf8");
 assert.match(app,/if\(needsEncryptedJournalSetup\(localStorage\)\)\{\s*localProtection\?\.openSetup\(\);\s*throw Error/);
 assert.match(app,/if\(needsEncryptedJournalSetup\(localStorage\)\)localProtection\.openSetup\(\)/);
 assert.match(ui,/function openSetup\(\)/);
 assert.match(ui,/return \{bindSettings,openSetup,lock/);
});
