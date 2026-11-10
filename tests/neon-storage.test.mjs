import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createNeonStorageAdapter,STORAGE_SQL} from "../bot-vercel/worker/neon-storage.js";
import {createNeonStorageFromEnv} from "../bot-vercel/worker/neon-provider.js";

const REV1="11111111-1111-4111-8111-111111111111";
const REV2="22222222-2222-4222-8222-222222222222";
const REV3="33333333-3333-4333-8333-333333333333";
const ENC={
 format:"healthy-women-sync-v1",
 version:1,algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",iterations:310000,
 salt:Buffer.alloc(16,1).toString("base64"),
 iv:Buffer.alloc(12,2).toString("base64"),
 ciphertext:Buffer.alloc(64,3).toString("base64")
};

// Simulates the *results* of a PostgreSQL CAS, not PostgreSQL's lock semantics.
// The actual SQL's transactional behavior must be tested on a dedicated Neon DB.
function fakeSql(){
 const data=new Map(),calls=[];
 return {
  calls,data,
  async query(query,params){
   calls.push({query,params});
   if(query.includes("SELECT revision::text")){
    const r=data.get(params[0]);return r?[{...r}]:[];
   }
   if(query.includes("INSERT INTO hw_private.opaque_snapshots")){
    const [id,revision,deleted,json,expected]=params;
    const existing=data.get(id);
    if(existing && (existing.deleted || existing.revision!==expected))return [];
    if(!existing && expected!==null)return [];
    const rec={revision,deleted,envelope:json===null?null:JSON.parse(json)};
    data.set(id,rec);
    return [{revision}];
   }
   throw Error("Unexpected SQL command");
  }
 };
}

test("adapter stores and retrieves only valid encrypted envelopes",async()=>{
 const db=fakeSql(),storage=createNeonStorageAdapter(db);
 assert.equal(await storage.read(123456789),null);
 assert.equal(await storage.compareAndSwap(123456789,null,{revision:REV1,deleted:false,envelope:ENC}),true);
 assert.deepEqual(await storage.read(123456789),{revision:REV1,deleted:false,envelope:ENC});
 const write=db.calls.find(c=>c.query.includes("INSERT INTO"));
 assert.equal(write.params.length,5);
 assert.equal(write.params[0],"123456789");
 assert.equal(write.params[2],false);
 assert.deepEqual(JSON.parse(write.params[3]),ENC);
 assert.equal(write.params[4],null);
 assert(!write.query.includes("123456789"));
 assert(!write.query.includes(ENC.ciphertext));
 assert(!write.query.includes("PRIVATE-HEALTH-NOTE"));
});
test("second user cannot read first user's encrypted snapshot",async()=>{
 const db=fakeSql(),storage=createNeonStorageAdapter(db);
 await storage.compareAndSwap(1201,null,{revision:REV1,deleted:false,envelope:ENC});
 assert.equal(await storage.read(1202),null);
 assert.equal(db.data.size,1);
});
test("stale revision fails and current revision updates atomically",async()=>{
 const db=fakeSql(),storage=createNeonStorageAdapter(db);
 assert.equal(await storage.compareAndSwap(9001,REV1,{revision:REV2,deleted:false,envelope:ENC}),false,"Cannot insert a missing account using an old revision");
 assert.equal(await storage.compareAndSwap(9001,null,{revision:REV1,deleted:false,envelope:ENC}),true);
 assert.equal(await storage.compareAndSwap(9001,null,{revision:REV2,deleted:false,envelope:ENC}),false);
 assert.equal(await storage.compareAndSwap(9001,REV1,{revision:REV2,deleted:false,envelope:ENC}),true);
 assert.equal(await storage.compareAndSwap(9001,REV1,{revision:REV3,deleted:false,envelope:ENC}),false);
 assert.equal((await storage.read(9001)).revision,REV2);
 assert.match(STORAGE_SQL.compareAndSwap,/WITH changed AS/);
 assert.match(STORAGE_SQL.compareAndSwap,/existing\.revision = \$5::uuid/);
 assert.match(STORAGE_SQL.compareAndSwap,/WHERE \$5::uuid IS NULL/);
 assert.match(STORAGE_SQL.compareAndSwap,/ON CONFLICT \(telegram_user_id\) DO NOTHING/);
 assert.match(STORAGE_SQL.compareAndSwap,/existing\.deleted = false/);
});
test("erasure permanently tombstones the row and rejects stale resurrection",async()=>{
 const db=fakeSql(),storage=createNeonStorageAdapter(db);
 await storage.compareAndSwap(101,null,{revision:REV1,deleted:false,envelope:ENC});
 assert.equal(await storage.compareAndSwap(101,REV1,{revision:REV2,deleted:true}),true);
 assert.deepEqual(await storage.read(101),{revision:REV2,deleted:true});
 assert.equal(db.data.get("101").envelope,null);
 assert.equal(await storage.compareAndSwap(101,REV2,{revision:REV3,deleted:false,envelope:ENC}),false);
 assert.equal(await storage.compareAndSwap(101,REV1,{revision:REV3,deleted:false,envelope:ENC}),false);
});
test("creating a deletion tombstone for an empty account is supported",async()=>{
 const db=fakeSql(),storage=createNeonStorageAdapter(db);
 assert.equal(await storage.compareAndSwap(777,null,{revision:REV1,deleted:true}),true);
 assert.deepEqual(await storage.read(777),{revision:REV1,deleted:true});
 assert.equal(await storage.compareAndSwap(777,REV1,{revision:REV2,deleted:false,envelope:ENC}),false);
});
test("invalid user IDs, revision strings and plaintext payloads fail before SQL",async()=>{
 const db=fakeSql(),storage=createNeonStorageAdapter(db);
 for(const id of [0,-1,1.1,"12",Number.MAX_SAFE_INTEGER+1]){
  await assert.rejects(storage.read(id));
 }
 for(const record of [
  {revision:"not-uuid",deleted:false,envelope:ENC},
  {revision:REV1,deleted:"false",envelope:ENC},
  {revision:REV1,deleted:false,envelope:{...ENC,events:[{note:"unsafe"}]}},
  {revision:REV1,deleted:true,envelope:ENC}
 ]){
  await assert.rejects(storage.compareAndSwap(1,null,record));
 }
 await assert.rejects(storage.compareAndSwap(1,"unsafe",{revision:REV1,deleted:false,envelope:ENC}));
 assert.equal(db.calls.length,0);
});
test("database driver failures do not silently report successful writes",async()=>{
 const db={query:async()=>{throw Error("database unavailable");}};
 const storage=createNeonStorageAdapter(db);
 await assert.rejects(storage.read(1),/database unavailable/);
 await assert.rejects(storage.compareAndSwap(1,null,{revision:REV1,deleted:false,envelope:ENC}),/database unavailable/);
 assert.throws(()=>createNeonStorageAdapter({}));
});
test("server-only Neon connection rejects non-Neon URLs, refuses missing credentials",async()=>{
 for(const DATABASE_URL of [undefined,"https://example.com","postgresql://x:y@evil.example/db","postgresql://u@ep-test.neon.tech/db","postgresql://u:p@ep-test.neon.tech/db?sslmode=disable"]){
  await assert.rejects(createNeonStorageFromEnv({DATABASE_URL}));
 }
 const raw="postgresql://demo:secret@ep-fixture.neon.tech/test?sslmode=require";
 let driverCount=0;
 const storage=await createNeonStorageFromEnv({DATABASE_URL:raw},async()=>({
  neon:(url)=>{driverCount++;assert.equal(url,raw);return fakeSql();}
 }));
 assert.equal(driverCount,1);
 assert.equal(await storage.read(123),null);
});
test("SQL schema is private and rejects both open plaintext and deletion-with-envelope",()=>{
 const sql=readFileSync(new URL("../db/migrations/001_opaque_snapshots.sql",import.meta.url),"utf8");
 assert.match(sql,/CREATE SCHEMA IF NOT EXISTS hw_private/);
 assert.match(sql,/REVOKE ALL ON SCHEMA hw_private FROM PUBLIC/);
 assert.match(sql,/REVOKE ALL ON TABLE hw_private\.opaque_snapshots FROM PUBLIC/);
 assert.match(sql,/CHECK \(telegram_user_id > 0\)/);
 assert.match(sql,/deleted = true AND envelope IS NULL/);
 assert.match(sql,/deleted = false AND envelope IS NOT NULL/);
 assert.match(sql,/octet_length\(envelope::text\) <= 1500000/);
 assert(!sql.includes("PUBLIC GRANT"));
});
