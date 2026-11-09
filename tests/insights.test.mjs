import test from "node:test";
import assert from "node:assert/strict";
import {summarizeSymptoms,overallSummary,renderSymptomInsights} from "../site/insights.mjs";
test("monthly statistics summarize only dates not in the future",()=>{
 const rows=[{date:"2026-10-01",pain:6,flow:"normal",mood:"good",between:false},{date:"2026-10-02",pain:10,flow:"very-heavy",mood:"low",between:true},{date:"2026-11-02",pain:2,flow:"light",mood:"neutral",between:false},{date:"2026-12-01",pain:7}];
 const d=summarizeSymptoms(rows,"2026-11-09",6),oct=d.find(x=>x.month==="2026-10");
 assert.equal(oct.count,2);assert.equal(oct.avgPain,8);assert.equal(oct.highPain,1);assert.equal(oct.heavyFlow,1);assert.equal(oct.betweenBleeding,1);
 assert.deepEqual(overallSummary(d),{total:3,highPain:1,heavyFlow:1,betweenBleeding:1,recordedMonths:2});
});
test("invalid pain and unrecorded months have no calculated pain",()=>{
 const d=summarizeSymptoms([{date:"2026-11-01",pain:"invalid",flow:"heavy"}],"2026-11-09");
 assert.equal(d.at(-1).avgPain,null);assert.equal(d.at(-1).heavyFlow,1);assert.equal(d[0].avgPain,null);
});
test("rendered chart does not include free-text medical notes",()=>{
 const h=renderSymptomInsights([{date:"2026-11-03",note:"TEST_NOTE_ABC",pain:4,flow:"normal",mood:"good"}],"2026-11-09");
 assert(h.includes("Alomatlar dinamikasi"));assert(h.includes("4/10"));assert(!h.includes("TEST_NOTE_ABC"));
});
