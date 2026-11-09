import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderCheckinCard} from "../site/checkin-ui.mjs";
test("home, diary and settings include phase questionnaires",()=>{
 const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8")+readFileSync(new URL("../site/app.mjs",import.meta.url),"utf8");
 for(const name of ["renderCheckinCard","openCheckinDialog","phaseToggle","PROMPT_PREF_KEY","./checkin-ui.mjs","./vault-ui.mjs","attachVaultControls","restoreBtn","./cycle-safety.mjs","validatePeriod","exportCsv","./insights.mjs","./reminders.mjs","renderSymptomInsights","reminderSettingsMarkup","attachReminderControls","./diary.mjs","validateDiaryEntry","data-edit-checkin","cancelDiaryEdit","./privacy-screen.mjs","autoMaskToggle","quickHide","createScreenPrivacy","./local-crypto.mjs","./local-crypto-ui.mjs","createLocalProtection","protectionSettingsHtml","writeEncryptedJournal","finishWrites"]){
  assert(html.includes(name),"Integration is missing: "+name);
 }
 assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(html));
});
test("PWA pre-caches the questionnaire modules",()=>{
 const sw=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
 assert(sw.includes("./checkins.mjs"));
 assert(sw.includes("./checkin-ui.mjs"));assert(sw.includes("./vault.mjs"));assert(sw.includes("./vault-ui.mjs"));assert(sw.includes("./cycle-safety.mjs"));assert(sw.includes("./insights.mjs"));assert(sw.includes("./reminders.mjs"));assert(sw.includes("./diary.mjs"));assert(sw.includes("./privacy-screen.mjs"));assert(sw.includes("./local-crypto.mjs"));assert(sw.includes("./local-crypto-ui.mjs"));assert(sw.includes("./app.mjs"));assert(sw.includes("./style.css"));assert(sw.includes("./privacy-page.mjs"));assert(sw.includes("./journal-guard.mjs"));assert(sw.includes("./legacy-recovery.mjs"));assert(sw.includes("./erasure.mjs"));assert(sw.includes("./password-rotation-ui.mjs"));
});

test('app-open questionnaire card renders when a period starts',()=>{const markup=renderCheckinCard([{id:'p1',start:'2026-10-01',end:null}],[],'2026-10-01',28);assert(markup.includes('id="phaseOpen"'));});
