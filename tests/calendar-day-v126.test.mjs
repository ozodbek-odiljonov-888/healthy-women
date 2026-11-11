import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {confirmedPeriodDates,getCalendarDayDetails,renderCalendarDayDetails} from "../site/calendar-day.mjs";
import {formatUzDate,formatUzMonth,formatUzChartMonth} from "../site/date-uz.mjs";

const today="2026-11-11";
test("unknown end never fabricates confirmed bleeding days",()=>{
 const dates=confirmedPeriodDates([{start:"2026-11-09",end:null}]);
 assert.deepEqual([...dates],["2026-11-09"]);
 assert.equal(dates.has("2026-11-10"),false);
});
test("confirmed end is inclusive through month boundary and malformed dates are skipped",()=>{
 const days=confirmedPeriodDates([{start:"2026-10-30",end:"2026-11-02"},{start:"2026-11-31",end:null}]);
 assert.deepEqual([...days],["2026-10-30","2026-10-31","2026-11-01","2026-11-02"]);
});
test("date selection matches recorded periods, diary entries, and probability distinctly",()=>{
 const periods=[{id:"p1",start:"2026-11-08",end:"2026-11-10"}];
 const checkins=[{id:"c1",date:"2026-11-09",pain:4,flow:"normal",mood:"good",note:"Bosh og‘rig‘i"}];
 let day=getCalendarDayDetails({date:"2026-11-09",today,periods,checkins,predicted:new Set(["2026-11-09"])});
 assert.equal(day.period.id,"p1");assert.equal(day.notes.length,1);assert.equal(day.estimated,false);
 assert.match(renderCalendarDayDetails(day),/Hayz qaydini tahrirlash/);
 day=getCalendarDayDetails({date:"2026-11-11",today,periods,checkins,predicted:new Set(["2026-11-11"])});
 assert.equal(day.period,null);assert.equal(day.estimated,true);
 assert.match(renderCalendarDayDetails(day),/Taxminiy hayz kuni/);
});
test("future selection is read-only and cannot reveal malformed future checkins",()=>{
 const day=getCalendarDayDetails({date:"2026-11-20",today,periods:[],checkins:[{date:"2026-11-20",note:"FUTURE-PROTECTED"}]});
 const html=renderCalendarDayDetails(day);
 assert.equal(day.future,true);assert.equal(day.notes.length,0);
 assert(!html.includes("dayAddPeriod"));assert(!html.includes("dayOpenDiary"));
 assert(!html.includes("FUTURE-PROTECTED"));
});
test("saved day notes are properly HTML escaped",()=>{
 const malicious='<img src=x onerror="alert(1)">';
 const day=getCalendarDayDetails({date:today,today,checkins:[{date:today,pain:2,flow:"light",mood:"good",note:malicious}]});
 const html=renderCalendarDayDetails(day);
 assert(!html.includes("<img"));assert(!html.includes('onerror="'));assert(html.includes("&lt;img"));assert(html.includes("onerror=&quot;"));
});
test("invalid selected days are refused and state remains local",()=>{
 assert.throws(()=>getCalendarDayDetails({date:"2026-02-30",today}),/noto‘g‘ri/);
 assert.throws(()=>getCalendarDayDetails({date:today,today:"tomorrow"}),/noto‘g‘ri/);
 const src=readFileSync(new URL("../site/calendar-day.mjs",import.meta.url),"utf8");
 assert(!src.includes("fetch("));assert(!src.includes("localStorage"));assert(!src.includes("XMLHttpRequest"));
});
test("app wiring and offline assets both include calendar interaction",()=>{
 const app=readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(app.includes("confirmedPeriodDates(a.periods)"));
 assert(app.includes("renderCalendarDayDetails(dayView)"));
 assert(app.includes("journalDraftDate=selected"));
 assert(app.includes("journalDraftDate||today"));
 assert(app.includes("selected=b.dataset.date;renderCalendar()"));
 assert(sw.includes('"./calendar-day.mjs"'));
 assert(sw.includes('healthy-women-pwa-v32-small-demo'));
});

test("Uzbek dates never display Chromium ICU placeholders such as M11",()=>{
 assert.equal(formatUzDate("2026-11-11"),"11-noyabr");
 assert.equal(formatUzDate("2026-11-11",{day:"numeric",month:"long",year:"numeric"}),"11-noyabr 2026");
 assert.equal(formatUzMonth(new Date(2026,10,1)),"Noyabr 2026");
 assert.equal(formatUzChartMonth("2026-11"),"noy '26");
 assert.equal(formatUzDate("2026-11-31"),"—");
 const html=renderCalendarDayDetails(getCalendarDayDetails({date:today,today}));
 assert(html.includes("11-noyabr 2026"));
 assert(!html.includes("M11"));
 const sw=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(sw.includes('"./date-uz.mjs"'));
});
