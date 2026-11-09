import test from "node:test";
import assert from "node:assert/strict";
import {readJournalSnapshot,assertJournalRevision,withJournalWriteLock,JOURNAL_LOCK_NAME} from "../site/journal-guard.mjs";
function storage(initial=null){
 let value=initial;
 return {getItem:()=>value,setItem:(_,v)=>{value=v;},removeItem:()=>{value=null;}};
}
test("malformed or non-array journals stay unreadable rather than silently overwriting",()=>{
 for(const input of ["{bad json}",'{"events":[]}',"null"]){
  const s=storage(input),x=readJournalSnapshot(s,"journal");
  assert.equal(x.valid,false);assert.equal(x.revision,input);assert.deepEqual(x.events,[]);
 }
 const empty=readJournalSnapshot(storage(null),"journal");
 assert.equal(empty.valid,true);assert.deepEqual(empty.events,[]);
});
test("old tab revision cannot overwrite more recently saved journal",()=>{
 const s=storage('[{"a":1}]'),snap=readJournalSnapshot(s,"journal");
 s.setItem("journal",'[{"a":2}]');
 assert.throws(()=>assertJournalRevision(s,"journal",snap.revision),/boshqa oynada/);
 assert.doesNotThrow(()=>assertJournalRevision(s,"journal",'[{"a":2}]'));
});
test("Web Locks serializes two concurrent writers",async()=>{
 let last=Promise.resolve(),inFlight=0,peak=0;
 const locks={request:(_name,_opts,fn)=>{
  const next=last.then(async()=>{inFlight++;peak=Math.max(peak,inFlight);try{return await fn();}finally{inFlight--;}});
  last=next.catch(()=>{});return next;
 }};
 const values=await Promise.all([withJournalWriteLock(async()=>{await new Promise(resolve=>setImmediate(resolve));return 1;},locks),withJournalWriteLock(async()=>2,locks)]);
 assert.deepEqual(values,[1,2]);assert.equal(peak,1);
});
test("unavailable Web Locks falls back to optimistic checks",async()=>{
 assert.equal(await withJournalWriteLock(async()=>42,null),42);
 assert.equal(JOURNAL_LOCK_NAME,"healthy-women-journal-write-v1");
});
