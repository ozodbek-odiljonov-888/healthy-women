import test from "node:test";
import assert from "node:assert/strict";
import {validateDiaryEntry,editableDiaryForDate,diaryById} from "../site/diary.mjs";
const raw={date:"2026-11-09",pain:3,flow:"normal",mood:"good",note:"Bosh og‘rig‘i",between:false};
test("validates and normalizes daily diary entries",()=>{
 const r=validateDiaryEntry({...raw,pain:"3"},"2026-11-09");
 assert.equal(r.ok,true);assert.equal(r.value.pain,3);assert.equal(r.value.note,raw.note);
});
test("rejects future days, invalid pain and oversized notes",()=>{
 assert.equal(validateDiaryEntry({...raw,date:"2026-12-01"},"2026-11-09").ok,false);
 assert.equal(validateDiaryEntry({...raw,pain:11},"2026-11-09").ok,false);
 assert.equal(validateDiaryEntry({...raw,pain:"foo"},"2026-11-09").ok,false);
 assert.equal(validateDiaryEntry({...raw,note:"x".repeat(601)},"2026-11-09").ok,false);
});
test("finds ordinary entries without replacing phase-specific clinical prompts",()=>{
 const list=[{id:"phase",date:"2026-11-09",phase:"start",pain:9},{id:"ordinary",date:"2026-11-09",pain:3,updated_at:123}];
 assert.equal(editableDiaryForDate(list,"2026-11-09")?.id,"ordinary");
 assert.equal(diaryById(list,"phase"),null);
 assert.equal(diaryById(list,"ordinary")?.id,"ordinary");
 assert.equal(editableDiaryForDate(list,"2026-11-09","ordinary"),null);
});
test("duplicate lookup considers entries only on matching day",()=>{
 assert.equal(editableDiaryForDate([{id:"one",date:"2026-11-01"}],"2026-11-09"),null);
 assert.equal(editableDiaryForDate([{id:"one",date:"2026-11-09"}],"2026-11-09")?.id,"one");
});
