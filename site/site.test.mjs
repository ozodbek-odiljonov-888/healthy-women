import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderCheckinCard} from "./checkin-ui.mjs";
test("home, diary and settings include phase questionnaires",()=>{
 const html=readFileSync(new URL("./index.html",import.meta.url),"utf8");
 for(const name of ["renderCheckinCard","openCheckinDialog","phaseToggle","PROMPT_PREF_KEY","./checkin-ui.mjs"]){
  assert(html.includes(name),"Integration is missing: "+name);
 }
 assert(!/ozodbek|odiljonov|odiljonovich/i.test(html));
});
test("PWA pre-caches the questionnaire modules",()=>{
 const sw=readFileSync(new URL("./sw.js",import.meta.url),"utf8");
 assert(sw.includes("./checkins.mjs"));
 assert(sw.includes("./checkin-ui.mjs"));
});

test('app-open questionnaire card renders when a period starts',()=>{const markup=renderCheckinCard([{id:'p1',start:'2026-10-01',end:null}],[],'2026-10-01',28);assert(markup.includes('id="phaseOpen"'));});
