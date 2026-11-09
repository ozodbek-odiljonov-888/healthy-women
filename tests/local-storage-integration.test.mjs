import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("no unencrypted backup restore bypass in main application",()=>{
 const s=read("../site/app.mjs");
 assert(!s.includes("localStorage.setItem(KEY,JSON.stringify(restored))"));
 assert(s.includes("writeEncryptedJournal(next,session)"));
 assert(s.includes("removeAllJournalData()"));
 assert(s.includes("hasEncryptedJournal()||syncBusy"));
 assert(s.includes("savePhaseRecord"));
});
test("privacy-page uses the same coordinated erasure as the main app",()=>{
 const s=read("../site/privacy-page.mjs"),app=read("../site/app.mjs"),erase=read("../site/erasure.mjs");
 assert(s.includes("await eraseLocalJournal()"));
 assert(app.includes("await eraseLocalJournal()"));
 assert(app.includes("if(e.key===ERASE_EPOCH_KEY)"));
 assert(app.includes("assertEraseEpoch(localStorage,eraseEpoch)"));
 assert(erase.includes("healthywomen.encrypted-local")===false);
 assert(erase.includes("removeAllJournalData(storage)"));
});
test("offline app pre-caches the encryption UI and algorithm",()=>{
 const s=read("../site/sw.js");
 assert(s.includes("./local-crypto.mjs")&&s.includes("./local-crypto-ui.mjs"));
});

test("main app serializes writes and blocks corrupted legacy overwrites",()=>{
 const app=read("../site/app.mjs");
 assert(app.includes("withJournalWriteLock(async()=>"));
 assert(app.includes("assertJournalRevision(localStorage,KEY,plainRevision)"));
 assert(app.includes("if(plainCorrupt)throw Error"));
 assert(app.includes("Asl nusxani saqlash"));
});

test("backup export awaits writes and validates normalized encrypted contents",()=>{
 const app=read("../site/app.mjs"),vault=read("../site/vault-ui.mjs");
 assert(app.includes("getEvents:async()=>{await finishWrites()"));
 assert(vault.includes("validateBackupEvents(latest)"));
 assert(vault.includes("await decryptBackup(result,secret)"));
 assert(vault.includes("await replaceEvents(entries,currentSnapshot)"));
});
test("encrypted migration is also guarded by cross-tab Web Locks",()=>{
 const module=read("../site/local-crypto-ui.mjs");
 assert(module.includes("withJournalWriteLock(()=>migratePlainJournal(p,storage))"));
});

test("encrypted mode never deletes stale plaintext from a storage event",()=>{
 const app=read("../site/app.mjs");
 assert(!app.includes("if(e.key===KEY&&hasEncryptedJournal()){localStorage.removeItem(KEY)"));
 assert(app.includes("localProtection.onExternalChange()"));
 const protector=read("../site/local-crypto-ui.mjs");
 assert(protector.includes("inspectLegacy(storage,restored.events)"));
 assert(protector.includes("mergeLegacySafely"));
 assert(protector.includes("legacyDownload"));
});

test("encrypted backup import requires a current-diary snapshot and explicit acknowledgement",()=>{
 const ui=read("../site/vault-ui.mjs"),app=read("../site/app.mjs");
 assert(ui.includes("createVerifiedRecoveryBackup(current,secret)"));
 assert(ui.includes("restoreAck.checked"));
 assert(ui.includes("await replaceEvents(entries,currentSnapshot)"));
 assert(app.includes("assertCurrentJournal(current,expectedSnapshot)"));
});
