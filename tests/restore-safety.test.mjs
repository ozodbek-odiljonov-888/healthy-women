import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {canonicalJournal,assertCurrentJournal,createVerifiedRecoveryBackup} from "../site/restore-safety.mjs";
import {decryptBackup} from "../site/vault.mjs";
globalThis.crypto ||= webcrypto;
const password="Fictional-Backup-Only-2026";
const rows=[{id:"safe1",type:"checkin",payload:{date:"2026-11-09",pain:4,flow:"normal",mood:"good",between:false,note:"Fictional old record"},updated_at:1794000000000,deleted:0}];
test("empty journal does not require a redundant recovery backup",async()=>{
 const r=await createVerifiedRecoveryBackup([],password);
 assert.equal(r.required,false);assert.equal(r.archive,null);assert.equal(r.snapshot,"[]");
});
test("nonempty journal must be backed up and verified before replacement",async()=>{
 const result=await createVerifiedRecoveryBackup(rows,password);
 assert.equal(result.required,true);
 assert(result.archive.includes('"AES-256-GCM"'));
 assert(!result.archive.includes("Fictional old record"));
 assert.deepEqual(await decryptBackup(result.archive,password),rows);
});
test("later journal mutation invalidates user confirmation",()=>{
 const previous=canonicalJournal(rows);
 assert.equal(assertCurrentJournal(rows,previous),true);
 assert.throws(()=>assertCurrentJournal([...rows,{...rows[0],id:"safe2"}],previous),/o‘zgargan/);
});
test("corrupt journal data cannot silently become an empty snapshot",()=>{
 assert.throws(()=>canonicalJournal([{id:"bad",payload:{}}]));
});
