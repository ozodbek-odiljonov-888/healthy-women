import test from "node:test";
import assert from "node:assert/strict";
import {createHmac,webcrypto} from "node:crypto";
import {handleSyncRequest} from "../bot-vercel/api/sync.js";
import {encryptSyncSnapshot} from "../site/sync-crypto.mjs";

globalThis.crypto ||= webcrypto;
const HOST="healthy-women-sync-staging.example";
const CLIENT="https://healthy-women.vercel.app";
const URL="https://"+HOST+"/api/sync";
const TOKEN="123456789:FICTIONAL_TEST_BOT_TOKEN_abcdefghijklmnop";
const NOW=1794301200;
const ID_A=902101,ID_B=902102;
const PASSPHRASE="FICTIONAL-long-recovery-secret-2026";
const ENV={SYNC_API_MODE:"staging",SYNC_ALLOWED_HOSTNAME:HOST,
 SYNC_CLIENT_ORIGIN:CLIENT,BOT_TOKEN:TOKEN,DATABASE_URL:"postgresql://fake:fake@ep-fixture.neon.tech/staging?sslmode=require"};
const events=[{id:"fictional",type:"period",payload:{start:"2026-09-01",end:"2026-09-05"},updated_at:1790000000000,deleted:0}];

function sign(id,authDate=NOW){
 const form=new URLSearchParams({auth_date:String(authDate),user:JSON.stringify({id,first_name:"Fictional"})});
 const check=[...form].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+"="+v).join("\n");
 const secret=createHmac("sha256","WebAppData").update(TOKEN).digest();
 const hash=createHmac("sha256",secret).update(check).digest("hex");
 form.set("hash",hash);
 return form.toString();
}
function fixtureStore(){
 const rows=new Map();
 let reads=0,writes=0;
 return {rows,
  get reads(){return reads;},get writes(){return writes;},
  async read(id){reads++;return rows.get(id)??null;},
  async compareAndSwap(id,expected,newValue){
   writes++;
   const old=rows.get(id);
   if(old?.deleted || (old?.revision??null)!==expected)return false;
   rows.set(id,newValue);return true;
  }
 };
}
function req(method,{data,origin=CLIENT,raw=sign(ID_A),path=URL,headers={},body}={}){
 const opts={method,headers:{"X-Telegram-Init-Data":raw,...(origin===null?{}:{Origin:origin}),...headers}};
 if(method==="PUT"||method==="DELETE"){
  opts.headers["Content-Type"]??="application/json";
  opts.body=body===undefined?JSON.stringify(data):body;
 }
 return new Request(path,opts);
}
function api(store,env=ENV,nowMs=()=>NOW*1000){
 return (request)=>handleSyncRequest(request,{env,loadStorage:async()=>store,nowMs});
}

test("all cloud operations are disabled by default and never load storage",async()=>{
 const store=fixtureStore();
 const call=api(store,{...ENV,SYNC_API_MODE:"disabled"});
 assert.equal((await call(req("GET"))).status,503);
 assert.equal((await call(req("PUT",{data:{envelope:{},expectedRevision:null}}))).status,503);
 assert.equal(store.reads+store.writes,0);
});
test("a production bot hostname is forbidden even when staging flag was set",async()=>{
 const store=fixtureStore();
 const call=api(store,{...ENV,SYNC_ALLOWED_HOSTNAME:"healthy-women-bot.vercel.app"});
 const res=await call(req("GET",{path:"https://healthy-women-bot.vercel.app/api/sync"}));
 assert.equal(res.status,503);
 assert.equal(store.reads,0);
});
test("preflight and CORS only allow the exact configured site",async()=>{
 const store=fixtureStore(),call=api(store);
 const good=await call(req("OPTIONS"));
 assert.equal(good.status,204);
 assert.equal(good.headers.get("Access-Control-Allow-Origin"),CLIENT);
 assert.match(good.headers.get("Access-Control-Allow-Methods"),/PUT/);
 assert.equal(good.headers.get("Access-Control-Allow-Credentials"),null);
 const foreign=await call(req("OPTIONS",{origin:"https://attacker.invalid"}));
 assert.equal(foreign.status,403);
 assert.equal(foreign.headers.get("Access-Control-Allow-Origin"),null);
 const missing=await call(req("OPTIONS",{origin:null}));
 assert.equal(missing.status,403);
 assert.equal(store.reads,0);
});
test("missing, tampered and expired Telegram initialization data is rejected before DB access",async()=>{
 const store=fixtureStore(),call=api(store);
 for(const raw of ["",sign(ID_A).replace("902101","902102"),sign(ID_A,NOW-3601)]){
  const res=await call(req("GET",{raw}));
  assert.equal(res.status,401);
 }
 assert.equal(store.reads+store.writes,0);
});
test("encrypted PUT + GET are isolated by signed Telegram identity and use revisions",async()=>{
 const store=fixtureStore(),call=api(store);
 const encrypted=await encryptSyncSnapshot(events,PASSPHRASE,ID_A);
 const write=await call(req("PUT",{data:{envelope:encrypted,expectedRevision:null}}));
 assert.equal(write.status,200);
 const saved=await write.json();
 assert.equal(saved.status,"stored");
 assert.match(saved.revision,/^[a-f0-9-]{36}$/i);
 assert.equal(JSON.stringify(saved).includes(String(ID_A)),false);
 assert.equal((await call(req("PUT",{data:{envelope:encrypted,expectedRevision:null}}))).status,409);
 const own=await call(req("GET"));assert.equal(own.status,200);
 const body=await own.json();
 assert.deepEqual(body.envelope,encrypted);
 assert.equal(JSON.stringify(body).includes("2026-09-01"),false);
 assert.equal(JSON.stringify(body).includes("Fictional"),false);
 const other=await call(req("GET",{raw:sign(ID_B)}));
 assert.deepEqual(await other.json(),{status:"empty",revision:null});
 const next=await call(req("PUT",{data:{envelope:encrypted,expectedRevision:saved.revision}}));
 assert.equal(next.status,200);
 assert.notEqual((await next.json()).revision,saved.revision);
 assert.equal(store.rows.size,1);
});
test("malformed and plaintext payloads are rejected before storage is loaded",async()=>{
 let loads=0;
 const call=(request)=>handleSyncRequest(request,{env:ENV,nowMs:()=>NOW*1000,
  loadStorage:async()=>{loads++;return fixtureStore();}});
 for(const data of [
  {envelope:{...await encryptSyncSnapshot(events,PASSPHRASE,ID_A),events},expectedRevision:null},
  {envelope:{format:"not-encrypted"},expectedRevision:null},
  {envelope:null,expectedRevision:null},
  {envelope:{},expectedRevision:"not-uuid"},
  {envelope:{},expectedRevision:null,plaintext:events}
 ]){
  const res=await call(req("PUT",{data}));assert.equal(res.status,400);
 }
 assert.equal(loads,0);
});
test("payload limit, MIME and endpoint method are fail-closed",async()=>{
 const store=fixtureStore(),call=api(store);
 const large=req("PUT",{data:{envelope:{},expectedRevision:null},headers:{"Content-Length":"1500001"}});
 assert.equal((await call(large)).status,413);
 assert.equal((await call(req("PUT",{body:"hello",headers:{"Content-Type":"text/plain"}}))).status,415);
 assert.equal((await call(req("GET",{path:URL+"?leak=1"}))).status,404);
 assert.equal((await call(req("POST"))).status,405);
 assert.equal(store.reads+store.writes,0);
});
test("remote deletion requires explicit user confirmation and recent Telegram launch",async()=>{
 const store=fixtureStore(),call=api(store),encrypted=await encryptSyncSnapshot(events,PASSPHRASE,ID_A);
 const write=await call(req("PUT",{data:{envelope:encrypted,expectedRevision:null}}));
 const revision=(await write.json()).revision;
 const data={expectedRevision:revision,confirmation:"ERASE_REMOTE_ENCRYPTED_DATA"};
 const headers={"X-Sync-Erase-Intent":"erase-remote"};
 assert.equal((await call(req("DELETE",{data}))).status,400);
 assert.equal((await call(req("DELETE",{data,headers,raw:sign(ID_A,NOW-301)}))).status,401);
 assert.equal((await call(req("DELETE",{data:{expectedRevision:revision,confirmation:"NO"},headers}))).status,400);
 const erased=await call(req("DELETE",{data,headers}));
 assert.equal(erased.status,200);
 assert.equal((await erased.json()).status,"erased");
 assert.equal(store.rows.get(ID_A).envelope,undefined);
 assert.equal((await call(req("GET"))).status,410);
 assert.equal((await call(req("PUT",{data:{envelope:encrypted,expectedRevision:revision}}))).status,410);
});
test("backend errors return generic messages without exposing SQL, initData or passphrase",async()=>{
 const call=(request)=>handleSyncRequest(request,{env:ENV,nowMs:()=>NOW*1000,
  loadStorage:async()=>{throw Error("SQL database password: never-echo");}});
 const response=await call(req("GET"));
 assert.equal(response.status,503);
 const result=JSON.stringify(await response.json());
 assert.equal(result.includes("SQL"),false);
 assert.equal(result.includes("never-echo"),false);
 assert.equal(result.includes(String(ID_A)),false);
});
