import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderCheckinCard} from "../site/checkin-ui.mjs";
test("home, diary and settings include phase questionnaires",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
 for(const name of ["renderCheckinCard","openCheckinDialog","phaseToggle","PROMPT_PREF_KEY","./checkin-ui.mjs","./vault-ui.mjs","attachVaultControls","restoreBtn","./cycle-safety.mjs","validatePeriod","exportCsv","./insights.mjs","./reminders.mjs","renderSymptomInsights","reminderSettingsMarkup","attachReminderControls"]){
  assert(html.includes(name),"Integration is missing: "+name);
 }
 assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(html));
});
test("PWA pre-caches the questionnaire modules",()=>{
 const sw=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(sw.includes("./checkins.mjs"));
 assert(sw.includes("./checkin-ui.mjs"));assert(sw.includes("./vault.mjs"));assert(sw.includes("./vault-ui.mjs"));assert(sw.includes("./cycle-safety.mjs"));assert(sw.includes("./insights.mjs"));assert(sw.includes("./reminders.mjs"));
});

test('app-open questionnaire card renders when a period starts',()=>{const markup=renderCheckinCard([{id:'p1',start:'2026-10-01',end:null}],[],'2026-10-01',28);assert(markup.includes('id="phaseOpen"'));});
