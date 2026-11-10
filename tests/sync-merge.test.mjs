import test from "node:test";
import assert from "node:assert/strict";
import {planSyncMerge,mergeWithExplicitChoices} from "../site/sync-merge.mjs";

const period={id:"fixture-a",type:"period",payload:{start:"2026-10-03",end:"2026-10-07"},updated_at:1790000000000,deleted:0};
const diary={id:"fixture-b",type:"checkin",payload:{date:"2026-10-03",pain:2,flow:"light",mood:"good",note:"FICTIONAL A",between:false},updated_at:1790000000001,deleted:0};
const remoteEdit={...diary,payload:{...diary.payload,note:"FICTIONAL REMOTE EDIT"},updated_at:1790000000002};
const deleted={id:diary.id,type:diary.type,payload:{},updated_at:1790000000003,deleted:1};

test("nonconflicting local and remote events merge without losing either",()=>{
 const out=planSyncMerge([period],[period,diary]);
 assert.equal(out.safeToApply,true);
 assert.deepEqual(out.mergedEvents,[period,diary]);
 assert.deepEqual(out.conflictIds,[]);
});
test("divergent edits are never silently resolved by timestamps",()=>{
 const out=planSyncMerge([period,diary],[period,remoteEdit]);
 assert.equal(out.safeToApply,false);
 assert.equal(out.mergedEvents,null);
 assert.deepEqual(out.conflictIds,[diary.id]);
});
test("a deletion marker conflicting with live record is not resurrected",()=>{
 const out=planSyncMerge([deleted],[diary]);
 assert.equal(out.safeToApply,false);
 assert.deepEqual(out.conflictIds,[diary.id]);
 const userKeepsDeletion=mergeWithExplicitChoices([deleted],[diary],{[diary.id]:"local"});
 assert.deepEqual(userKeepsDeletion,[deleted]);
 const userRestoresAfterReview=mergeWithExplicitChoices([deleted],[diary],{[diary.id]:"remote"});
 assert.deepEqual(userRestoresAfterReview,[diary]);
});
test("all conflicting records require explicit choices before any merge",()=>{
 assert.throws(()=>mergeWithExplicitChoices([diary],[remoteEdit],{}));
 assert.throws(()=>mergeWithExplicitChoices([diary],[remoteEdit],{[diary.id]:"both"}));
 assert.deepEqual(mergeWithExplicitChoices([diary],[remoteEdit],{[diary.id]:"remote"}),[remoteEdit]);
});
test("unexpected resolutions and malformed events are rejected",()=>{
 assert.throws(()=>mergeWithExplicitChoices([period],[period],{[period.id]:"local"}));
 assert.throws(()=>planSyncMerge([period,period],[]));
 assert.throws(()=>planSyncMerge([diary],[{...diary,id:"invalid id"}]));
});
