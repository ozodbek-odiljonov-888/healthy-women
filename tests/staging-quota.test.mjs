import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
import {createStagingRequestLimiter,STAGING_QUOTAS,QUOTA_STATEMENT} from "../bot-vercel/worker/staging-quota.js";
import {createNeonStagingLimiterFromEnv} from "../bot-vercel/worker/neon-quota-provider.js";

globalThis.crypto ||= webcrypto;
const BOT_TOKEN="123456789:FICTIONAL_LONG_TELEGRAM_TOKEN_FOR_TESTS_abcdefgh";
const DAY=1794301200000,DAY_MS=86400000;

function fakeDb(){
 const rows=new Map();
 const calls=[];
 return {rows,calls,
  async query(query,params){
   calls.push({query,params});
   const [scope,day,max]=params;
   const current=rows.get(scope);
   if(current && current.day===day && current.used>=max)return [];
   const next=current&&current.day===day?current.used+1:1;
   rows.set(scope,{day,used:next});
   return [{used:next}];
  }
 };
}

test("fixed no-cost staging caps cannot exceed 60 global requests/day and 12 per tester",()=>{
 assert.deepEqual(STAGING_QUOTAS,{globalPerDay:60,userPerDay:12,maxUsers:5});
 assert.match(QUOTA_STATEMENT,/ON CONFLICT \(scope_key\) DO UPDATE/);
 assert.match(QUOTA_STATEMENT,/existing\.used < \$3::integer/);
 assert.match(QUOTA_STATEMENT,/window_day = EXCLUDED\.window_day/);
});
test("successful request consumes global and pseudonymous user counters only",async()=>{
 const db=fakeDb(),limiter=createStagingRequestLimiter(db);
 const result=await limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:DAY});
 assert.deepEqual(result,{allowed:true});
 assert.equal(db.rows.size,2);
 const [global,user]=[...db.rows.keys()];
 assert.equal(global,"global");
 assert.match(user,/^u:[0-9a-f]{64}$/);
 assert(!JSON.stringify([...db.rows]).includes("902101"));
 assert(!JSON.stringify([...db.rows]).includes(BOT_TOKEN));
 assert.equal(db.calls.length,2);
 assert(db.calls.every(x=>x.params.length===3));
});
test("per-tester limit denies 13th request while global limit is conserved",async()=>{
 const db=fakeDb(),limiter=createStagingRequestLimiter(db);
 let accepted=0,denied=0;
 for(let i=0;i<15;i++){
  const result=await limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:DAY+1000});
  result.allowed?accepted++:denied++;
 }
 assert.equal(accepted,12);assert.equal(denied,3);
 assert.equal(db.rows.get("global").used,15);
 assert.equal([...db.rows.values()].find(x=>x.used===12).used,12);
});
test("global daily budget blocks further users, before per-user DB query",async()=>{
 const db=fakeDb();
 const limiter=createStagingRequestLimiter(db,{limits:{globalPerDay:3,userPerDay:2}});
 for(const id of [902101,902102,902103]){
  assert.equal((await limiter.consume({userId:id,botToken:BOT_TOKEN,nowMs:DAY})).allowed,true);
 }
 const before=db.calls.length;
 const blocked=await limiter.consume({userId:902104,botToken:BOT_TOKEN,nowMs:DAY});
 assert.equal(blocked.allowed,false);
 assert(blocked.retryAfterSeconds>=1&&blocked.retryAfterSeconds<=86400);
 assert.equal(db.calls.length,before+1);
 assert.equal(db.rows.get("global").used,3);
});
test("UTC daily rollover resets counters without adding new user rows or cron",async()=>{
 const db=fakeDb(),limiter=createStagingRequestLimiter(db,{limits:{globalPerDay:1,userPerDay:1}});
 const day=Math.floor(DAY/DAY_MS),start=day*DAY_MS;
 assert((await limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:start+DAY_MS-1000})).allowed);
 assert.equal((await limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:start+DAY_MS-500})).allowed,false);
 const after=await limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:start+DAY_MS+1000});
 assert.equal(after.allowed,true);
 assert.equal(db.rows.size,2);
 assert.equal(db.rows.get("global").day,day+1);
});
test("parallel simulated calls cannot exceed global and per-user budgets",async()=>{
 const db=fakeDb(),limiter=createStagingRequestLimiter(db,{limits:{globalPerDay:5,userPerDay:5}});
 const results=await Promise.all(Array.from({length:15},()=>limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:DAY})));
 assert.equal(results.filter(x=>x.allowed).length,5);
 assert.equal(db.rows.get("global").used,5);
});
test("bad identity, connection and budget settings fail closed",async()=>{
 const db=fakeDb();
 assert.throws(()=>createStagingRequestLimiter({}));
 assert.throws(()=>createStagingRequestLimiter(db,{limits:{globalPerDay:1001,userPerDay:1}}));
 const limiter=createStagingRequestLimiter(db);
 await assert.rejects(limiter.consume({userId:0,botToken:BOT_TOKEN,nowMs:DAY}));
 await assert.rejects(limiter.consume({userId:123,botToken:"short",nowMs:DAY}));
 await assert.rejects(limiter.consume({userId:123,botToken:BOT_TOKEN,nowMs:-10}));
 assert.equal(db.calls.length,0);
});
test("quota database outage is not treated as allowed",async()=>{
 const limiter=createStagingRequestLimiter({query:async()=>{throw Error("database suspended");}});
 await assert.rejects(limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:DAY}),/database suspended/);
});
test("existing Neon connection can provide a quota adapter without new services",async()=>{
 const raw="postgresql://fixture:dummy@ep-synthetic.neon.tech/dev?sslmode=require";
 const db=fakeDb();
 let drivers=0;
 const limiter=await createNeonStagingLimiterFromEnv({DATABASE_URL:raw},async()=>({
  neon:(url)=>{assert.equal(url,raw);drivers++;return db;}
 }));
 assert.equal(drivers,1);
 assert.equal((await limiter.consume({userId:902101,botToken:BOT_TOKEN,nowMs:DAY})).allowed,true);
});
test("private SQL migration requires no paid provider or scheduled purge service",()=>{
 const src=readFileSync(new URL("../db/migrations/002_staging_request_quota.sql",import.meta.url),"utf8");
 assert.match(src,/CREATE TABLE IF NOT EXISTS hw_private\.sync_request_quota/);
 assert.match(src,/REVOKE ALL ON TABLE hw_private\.sync_request_quota FROM PUBLIC/);
 assert.match(src,/scope_key = 'global'/);
 assert.match(src,/window_day integer NOT NULL/);
 assert(!/CREATE EXTENSION|CREATE TRIGGER|CREATE MATERIALIZED VIEW|CRON|pg_cron/i.test(src));
});
