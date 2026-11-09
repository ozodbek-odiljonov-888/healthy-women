import test from "node:test";
import assert from "node:assert/strict";
import {encryptBackup,decryptBackup,validateBackupEvents} from "../site/vault.mjs";
const passphrase="Roses-And-Cycle-2026";
const records=[
 {id:"abc",type:"period",payload:{start:"2026-09-04",end:"2026-09-08"},updated_at:1830000000000,deleted:0},
 {id:"xyz",type:"checkin",payload:{date:"2026-09-06",pain:4,flow:"normal",mood:"neutral",between:false,note:"charchoq"},updated_at:1830000000001,deleted:0},
 {id:"phase",type:"checkin",payload:{date:"2026-09-17",periodStart:"2026-09-04",phase:"middle",pain:2,flow:"none",mood:"good",between:false,hourly:false,dizzy:false,note:""},updated_at:1830000000002,deleted:0},
 {id:"old",type:"period",payload:{},updated_at:1830000000003,deleted:1}
];
test("AES-GCM PBKDF2 encrypted backup roundtrip",async()=>{
 const encrypted=await encryptBackup(records,passphrase);
 const json=JSON.parse(encrypted);
 assert.equal(json.format,"healthy-women-encrypted-backup");
 assert.equal(json.algorithm,"AES-256-GCM");
 assert(!encrypted.includes("charchoq"),"plaintext must not be present in backup");
 assert.deepEqual(await decryptBackup(encrypted,passphrase),records);
});
test("wrong password cannot decrypt",async()=>{
 const encrypted=await encryptBackup(records,passphrase);
 await assert.rejects(decryptBackup(encrypted,"WRONG-PASSWORD-STRING"));
});
test("changing encrypted payload must break authenticated decryption",async()=>{
 const encrypted=JSON.parse(await encryptBackup(records,passphrase));
 const tail=encrypted.ciphertext.slice(-12,-10);
 encrypted.ciphertext=encrypted.ciphertext.slice(0,-12)+(tail==="AA"?"BB":"AA")+encrypted.ciphertext.slice(-10);
 await assert.rejects(decryptBackup(JSON.stringify(encrypted),passphrase));
});
test("backup input validates identifiers and invalid period dates",()=>{
 assert.throws(()=>validateBackupEvents([{...records[0],payload:{start:"2026-02-30",end:null}}]));
 assert.throws(()=>validateBackupEvents([records[0],records[0]]));
 assert.deepEqual(validateBackupEvents(records),records);
});
test("password length required",async()=>{await assert.rejects(encryptBackup(records,"short"));});
