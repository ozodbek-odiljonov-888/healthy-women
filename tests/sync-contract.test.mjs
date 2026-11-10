import test from "node:test";
import assert from "node:assert/strict";
import {createHmac,webcrypto} from "node:crypto";
import {createOpaqueSyncProtocol,validateOpaqueEnvelope} from "../bot-vercel/worker/opaque-sync-contract.js";
import {encryptSyncSnapshot,decryptSyncSnapshot} from "../site/sync-crypto.mjs";
globalThis.crypto ||= webcrypto;

const TOKEN="123456789:FICTIONAL_SERVER_BOT_TOKEN_abcdefghijkl";
const NOW=1794299400;
const ID_A=67890123,ID_B=67890124;
const SECRET="FICTIONAL-SYNC-RECOVERY-SECRET-2026";
const events=[{id:"fixture-event",type:"period",payload:{start:"2026-10-01",end:"2026-10-04"},updated_at:1790000000000,deleted:0}];

function signed(id,authDate=NOW){
 const params=new URLSearchParams({auth_date:String(authDate),user:JSON.stringify({id,first_name:"Fictional"})});
 const body=[...params].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+"="+v).join("\n");
 const key=createHmac("sha256","WebAppData").update(TOKEN).digest();
 const signature=createHmac("sha256",key).update(body).digest("hex");
 params.set("hash",signature);
 return params.toString();
}
function memoryAdapter(){
 const rows=new Map();
 return {
  rows,
  async read(userId){return rows.get(userId)??null;},
  async compareAndSwap(userId,expectedRevision,next){
   const actual=rows.get(userId)?.revision??null;
   if(actual!==expectedRevision)return false;
   rows.set(userId,next);
   return true;
  }
 };
}
const setup=()=>createOpaqueSyncProtocol({botToken:TOKEN,storage:memoryAdapter(),nowMs:()=>NOW*1000});

test("server accepts only ciphertext metadata, not health events or extra keys",async()=>{
 const envelope=await encryptSyncSnapshot(events,SECRET,ID_A);
 assert.deepEqual(validateOpaqueEnvelope(envelope),envelope);
 assert(!JSON.stringify(envelope).includes("2026-10-01"));
 assert.throws(()=>validateOpaqueEnvelope({...envelope,events}));
 assert.throws(()=>validateOpaqueEnvelope({...envelope,plaintext:"fixture"}));
 assert.throws(()=>validateOpaqueEnvelope({...envelope,ciphertext:"AA=="}));
 assert.throws(()=>validateOpaqueEnvelope({format:"healthy-women-sync-v1"}));
});
test("signed Telegram user can store and recover only own account-bound ciphertext",async()=>{
 const store=memoryAdapter(),proto=createOpaqueSyncProtocol({botToken:TOKEN,storage:store,nowMs:()=>NOW*1000});
 const a=signed(ID_A),b=signed(ID_B),envelope=await encryptSyncSnapshot(events,SECRET,ID_A);
 assert.deepEqual(await proto.read(a),{status:"empty",revision:null});
 const uploaded=await proto.upload(a,envelope,null);
 assert.equal(uploaded.status,"stored");
 const retrieved=await proto.read(a);
 assert.equal(retrieved.status,"present");
 assert.equal(retrieved.revision,uploaded.revision);
 assert.deepEqual(await decryptSyncSnapshot(retrieved.envelope,SECRET,ID_A),events);
 assert.deepEqual(await proto.read(b),{status:"empty",revision:null});
 assert.equal(store.rows.size,1);
 assert.equal(JSON.stringify([...store.rows.values()]).includes("2026-10-01"),false);
});
test("stale writer cannot silently overwrite newer encrypted snapshot",async()=>{
 const p=setup(),a=signed(ID_A);
 const v1=await encryptSyncSnapshot(events,SECRET,ID_A);
 const v2=await encryptSyncSnapshot([...events,{id:"fixture-2",type:"period",payload:{start:"2026-11-01",end:null},updated_at:1790000001000,deleted:0}],SECRET,ID_A);
 const initial=await p.upload(a,v1,null);
 assert.equal(initial.status,"stored");
 assert.deepEqual(await p.upload(a,v2,null),{status:"conflict"});
 const next=await p.upload(a,v2,initial.revision);
 assert.equal(next.status,"stored");
 assert.deepEqual(await p.upload(a,v1,initial.revision),{status:"conflict"});
 assert.deepEqual(await decryptSyncSnapshot((await p.read(a)).envelope,SECRET,ID_A),
  [...events,{id:"fixture-2",type:"period",payload:{start:"2026-11-01",end:null},updated_at:1790000001000,deleted:0}]);
});
test("remote erasure requires revision and blocks stale device resurrection",async()=>{
 const p=setup(),a=signed(ID_A),envelope=await encryptSyncSnapshot(events,SECRET,ID_A);
 const first=await p.upload(a,envelope);
 assert.deepEqual(await p.erase(a,null),{status:"conflict"});
 const erased=await p.erase(a,first.revision);
 assert.equal(erased.status,"erased");
 assert.equal((await p.read(a)).status,"erased");
 assert.equal(Object.hasOwn(await p.read(a),"envelope"),false);
 assert.deepEqual(await p.upload(a,envelope,first.revision),{status:"erased"});
 assert.deepEqual(await p.upload(a,envelope,erased.revision),{status:"erased"});
});
test("expired, invalid or mismatched Telegram initData is denied before storage access",async()=>{
 const p=setup(),envelope=await encryptSyncSnapshot(events,SECRET,ID_A);
 await assert.rejects(p.read(signed(ID_A,NOW-3601)));
 await assert.rejects(p.read(signed(ID_A).replace("67890123","67890127")));
 await assert.rejects(p.upload("not-init-data",envelope));
 await assert.rejects(p.erase(signed(ID_A,NOW+61)));
});
test("remote persistence cannot be configured without verified identity and atomic adapter",()=>{
 assert.throws(()=>createOpaqueSyncProtocol({}));
 assert.throws(()=>createOpaqueSyncProtocol({botToken:TOKEN,storage:{read:async()=>null}}));
});
