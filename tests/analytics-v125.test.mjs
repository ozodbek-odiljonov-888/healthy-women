import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildAnalytics,renderAnalyticsHTML} from "../site/analytics.mjs";
const TODAY="2026-11-10";
const empty={periods:[],checkins:[],spans:[],variability:null};
const fixture={periods:[{start:"2026-09-01"},{start:"2026-09-29"},{start:"2026-10-29"}],
 checkins:[
  {date:"2026-09-03",pain:9,flow:"heavy",mood:"low",between:true},
  {date:"2026-09-04",pain:3,flow:"normal",mood:"good"},
  {date:"2026-10-02",pain:4,flow:"light",mood:"neutral"},
  {date:"2026-11-09",pain:8,flow:"very-heavy",mood:"anxious"},
  {date:"2026-11-20",pain:10,flow:"very-heavy",mood:"anxious"}
 ],spans:[28,30],avg:29,variability:2};
test("empty journal has no fabricated predictions or pain measurements",()=>{
 const d=buildAnalytics(empty,TODAY);
 assert.equal(d.total,0);assert.equal(d.avgPain,null);assert.equal(d.measured,false);
 assert.equal(d.series.length,6);
 const html=renderAnalyticsHTML(d);
 assert(html.includes("Kamida 2 ta hayz sanasi kerak"));
 assert(html.includes("Qayd yo‘q oyda 0"));
 assert(!html.includes("NaN"));assert(!html.includes("undefined"));
});
test("analytics use recorded dates and exclude future entries",()=>{
 const d=buildAnalytics(fixture,TODAY,3);
 assert.equal(d.total,4);assert.equal(d.activeMonths,3);
 assert.equal(d.avgPain,6);assert.equal(d.highPain,2);
 assert.equal(d.heavyFlow,2);assert.equal(d.betweenBleeding,1);
 assert.equal(d.cycleMedian,29);assert.equal(d.cycleVariability,2);
 assert.deepEqual(d.series.map(x=>x.month),["2026-09","2026-10","2026-11"]);
 assert.deepEqual(d.moodCounts,{good:1,neutral:1,low:1,anxious:1});
 const html=renderAnalyticsHTML(d);
 assert(html.includes('data-analytics-months="3"'));
 assert(html.includes('aria-pressed="true"'));
});
test("valid window selections and malformed dates are rejected safely",()=>{
 const d=buildAnalytics(fixture,TODAY,12);
 assert.equal(d.total,4);assert.equal(d.series.length,12);
 assert.throws(()=>buildAnalytics(fixture,TODAY,1));
 assert.throws(()=>buildAnalytics(fixture,"2026-99-99",3));
});
test("notes cannot inject HTML through analytics",()=>{
 const data={...fixture,checkins:[{date:"2026-11-01",pain:5,flow:"light",mood:"good",note:"<img src=x onerror=alert(1)>"}]};
 const html=renderAnalyticsHTML(buildAnalytics(data,TODAY));
 assert(!html.includes("<img"));assert(!html.includes("onerror"));
 assert(!html.includes("fetch("));
});
test("new view is integrated in navigation and offline cache",()=>{
 const app=readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(app.includes("function renderInsights()"));
 assert(app.includes("renderAnalyticsHTML(metrics)"));
 assert(app.includes("analyticsWindow=value;renderInsights();"));
 assert(app.includes("insights:renderInsights"));
 assert(html.includes('id="view-insights"'));
 assert(sw.includes('"./analytics.mjs"'));
});
