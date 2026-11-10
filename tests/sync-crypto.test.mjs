import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {encryptSyncSnapshot,decryptSyncSnapshot,parseSyncEnvelope,SYNC_FORMAT} from "../site/sync-crypto.mjs";

globalThis.crypto ||= webcrypto;
const PASSPHRASE="FICTIONAL-long-sync-passphrase-2026";
const ACCOUNT=812345678;
const events=[
 {id:"fixture-period",type:"period",payload:{start:"2026-10-01",end:"2026-10-05"},updated_at:1790000000000,deleted:0},
 {id:"fixture-checkin",type:"checkin",payload:{date:"2026-10-03",pain:2,flow:"light",mood:"neutral",between:false,note:"FICTIONAL private symptom"},updated_at:1790000000001,deleted:0}
];
let original;
test("client encryption returns account-bound ciphertext rather than symptom records",async()=>{
 original=await encryptSyncSnapshot(events,PASSPHRASE,ACCOUNT);
 assert.equal(original.format,SYNC_FORMAT);
 assert.equal(original.version,1);
 assert.equal(original.algorithm,"AES-256-GCM");
 assert.equal(original.kdf,"PBKDF2-SHA256");
 assert.equal(original.iterations,310000);
 assert(!JSON.stringify(original).includes("FICTIONAL private symptom"));
 assert(!JSON.stringify(original).includes("2026-10-01"));
 assert(!JSON.stringify(original).includes(PASSPHRASE));
 assert(!JSON.stringify(original).includes(String(ACCOUNT)));
 assert.deepEqual(await decryptSyncSnapshot(original,PASSPHRASE,ACCOUNT),events);
});
test("separate encryptions use fresh salt and nonce, both open with the same recovery key",async()=>{
 const second=await encryptSyncSnapshot(events,PASSPHRASE,ACCOUNT);
 assert.notEqual(second.salt,original.salt);
 assert.notEqual(second.iv,original.iv);
 assert.notEqual(second.ciphertext,original.ciphertext);
 assert.deepEqual(await decryptSyncSnapshot(second,PASSPHRASE,ACCOUNT),events);
});
test("wrong passphrase and a different authenticated Telegram account cannot decrypt",async()=>{
 await assert.rejects(decryptSyncSnapshot(original,"Fictional-WRONG-secret-2026",ACCOUNT));
 await assert.rejects(decryptSyncSnapshot(original,PASSPHRASE,ACCOUNT+1));
});
test("tampering with ciphertext, nonce or KDF parameters is rejected",async()=>{
 const mutate=(field,value)=>({...original,[field]:value});
 const changed=(raw)=>((raw[0]==="A"?"B":"A")+raw.slice(1));
 await assert.rejects(decryptSyncSnapshot(mutate("ciphertext",changed(original.ciphertext)),PASSPHRASE,ACCOUNT));
 await assert.rejects(decryptSyncSnapshot(mutate("iv",changed(original.iv)),PASSPHRASE,ACCOUNT));
 assert.throws(()=>parseSyncEnvelope(mutate("iterations",1)));
 assert.throws(()=>parseSyncEnvelope(mutate("algorithm","AES-128-CBC")));
});
test("server cannot accept accidentally attached plaintext health records",()=>{
 assert.throws(()=>parseSyncEnvelope({...original,events}));
 assert.throws(()=>parseSyncEnvelope({...original,plainText:"Do not upload"}));
 assert.throws(()=>parseSyncEnvelope({format:SYNC_FORMAT,version:1}));
 assert.throws(()=>parseSyncEnvelope("not-json"));
});
test("invalid envelope dimensions, unsafe account and weak passphrase are rejected",async()=>{
 assert.throws(()=>parseSyncEnvelope({...original,salt:"AAAA"}));
 assert.throws(()=>parseSyncEnvelope({...original,iv:"AAAA"}));
 assert.throws(()=>parseSyncEnvelope({...original,ciphertext:"AAAA"}));
 await assert.rejects(encryptSyncSnapshot(events,"short",ACCOUNT));
 await assert.rejects(encryptSyncSnapshot(events,PASSPHRASE,-1));
 await assert.rejects(decryptSyncSnapshot(original,PASSPHRASE,0));
});
test("a deleted diary event remains an encrypted tombstone",async()=>{
 const deleted=[{id:"fixture-period",type:"period",payload:{},updated_at:1790000001000,deleted:1}];
 const safe=await encryptSyncSnapshot(deleted,PASSPHRASE,ACCOUNT);
 assert.deepEqual(await decryptSyncSnapshot(safe,PASSPHRASE,ACCOUNT),deleted);
});
test("invalid records and duplicate IDs fail before encryption",async()=>{
 await assert.rejects(encryptSyncSnapshot([...events,events[0]],PASSPHRASE,ACCOUNT));
 await assert.rejects(encryptSyncSnapshot([{id:"bad",type:"checkin",payload:{note:"raw"},updated_at:0}],PASSPHRASE,ACCOUNT));
});
