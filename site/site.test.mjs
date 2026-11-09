import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
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
