import test from "node:test";
import assert from "node:assert/strict";
import {validDay,deltaDays,addDays,validatePeriod,forecastNext,exportCycleCsv} from "../site/cycle-safety.mjs";
const p=[{id:"old",start:"2026-10-01",end:"2026-10-06"}];
test("dates are validated across leap years and month boundaries",()=>{
 assert(validDay("2024-02-29"));assert(!validDay("2026-02-29"));
 assert.equal(deltaDays("2026-02-28","2026-03-01"),1);
 assert.equal(addDays("2026-02-28",1),"2026-03-01");
});
test("duplicate starts and overlapping dates are blocked",()=>{
 assert.equal(validatePeriod(p,{start:"2026-10-01",today:"2026-11-09"}).ok,false);
 assert.equal(validatePeriod(p,{start:"2026-10-04",today:"2026-11-09"}).ok,false);
 assert.equal(validatePeriod(p,{start:"2026-09-29",end:"2026-10-03",today:"2026-11-09"}).ok,false);
});
test("nonoverlapping past periods and editing same entry pass",()=>{
 assert.equal(validatePeriod(p,{start:"2026-10-10",today:"2026-11-09"}).ok,true);
 assert.equal(validatePeriod(p,{start:"2026-10-01",end:"2026-10-07",today:"2026-11-09",editingId:"old"}).ok,true);
});
test("unknown end dates do not block later period onset",()=>{
 assert.equal(validatePeriod([{id:"old",start:"2026-09-01",end:null}],{start:"2026-10-01",today:"2026-11-09"}).ok,true);
});
test("invalid future, reversed and too-long periods fail validation",()=>{
 assert.equal(validatePeriod([],{start:"2026-12-01",today:"2026-11-09"}).ok,false);
 assert.equal(validatePeriod([],{start:"2026-11-01",end:"2026-10-31",today:"2026-11-09"}).ok,false);
 assert.equal(validatePeriod([],{start:"2026-09-01",end:"2026-11-01",today:"2026-11-09"}).ok,false);
});
test("estimate stays within future or current date; overdue and stale are labelled",()=>{
 assert.deepEqual(forecastNext("2026-11-01",28,"2026-11-09"),{next:"2026-11-29",state:"estimate"});
 assert.equal(forecastNext("2026-10-01",28,"2026-11-09").state,"overdue");
 assert.equal(forecastNext("2026-03-01",28,"2026-11-09").state,"stale");
 assert.equal(forecastNext("2026-12-01",28,"2026-11-09").state,"unavailable");
});
test("CSV handles medical notes with spreadsheet formula prefixes",()=>{
 const csv=exportCycleCsv([{start:"2026-10-01",end:"2026-10-06"}],[{date:"2026-10-02",pain:3,flow:"normal",mood:"good",note:"=HYPERLINK(\\"https://bad\\")",between:false}]);
 assert(csv.startsWith("\uFEFF"));assert(csv.includes("hayz"));assert(csv.includes("'=HYPERLINK"));
 assert(!csv.includes('\n"=HYPERLINK'));
});
