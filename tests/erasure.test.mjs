import test from "node:test";
import assert from "node:assert/strict";
import {ERASE_EPOCH_KEY,SYNC_PREF_KEY,PHASE_PREF_KEY,readEraseEpoch,assertEraseEpoch,eraseLocalJournal} from "../site/erasure.mjs";
import {LEGACY_EVENTS_KEY,LOCAL_VAULT_KEY} from "../site/local-crypto.mjs";
function storage(){
 const map=new Map();return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
test("erasure removes both local diary copies and coordination preferences",async()=>{
 const s=storage();
 s.setItem(LEGACY_EVENTS_KEY,"fictional private note");s.setItem(LOCAL_VAULT_KEY,"fake cipher");s.setItem(SYNC_PREF_KEY,"yes");s.setItem(PHASE_PREF_KEY,"on");
 const initial=readEraseEpoch(s);
 const erased=await eraseLocalJournal({storage:s,locks:null});
 assert.equal(erased.erased,true);
 for(const key of [LEGACY_EVENTS_KEY,LOCAL_VAULT_KEY,SYNC_PREF_KEY,PHASE_PREF_KEY])assert.equal(s.getItem(key),null);
 assert.notEqual(erased.epoch,initial);
 assert.equal(s.getItem(ERASE_EPOCH_KEY),erased.epoch);
 assert.throws(()=>assertEraseEpoch(s,initial),/boshqa oynadan o‘chirilgan/);
 assert.equal(assertEraseEpoch(s,erased.epoch),true);
});
test("a following erasure increments the epoch",async()=>{
 const s=storage(),first=(await eraseLocalJournal({storage:s,locks:null})).epoch;
 const second=(await eraseLocalJournal({storage:s,locks:null})).epoch;
 assert.notEqual(first,second);
});
test("failed journal deletion cannot be reported as success",async()=>{
 const s=storage();s.setItem(LEGACY_EVENTS_KEY,"fictional");
 const broken={getItem:s.getItem,setItem:s.setItem,removeItem:k=>{if(k!==LEGACY_EVENTS_KEY)s.removeItem(k);}};
 await assert.rejects(eraseLocalJournal({storage:broken,locks:null}),/to‘liq o‘chirib bo‘lmadi/);
 assert.equal(s.getItem(LEGACY_EVENTS_KEY),"fictional");
 assert(s.getItem(ERASE_EPOCH_KEY));
});
test("erasure requests an exclusive journal lock when supported",async()=>{
 const s=storage(),calls=[];
 const locks={request:async(name,opts,fn)=>{calls.push({name,opts});return fn();}};
 await eraseLocalJournal({storage:s,locks});
 assert.equal(calls.length,1);
 assert.equal(calls[0].name,"healthy-women-journal-write-v1");
 assert.equal(calls[0].opts.mode,"exclusive");
});
