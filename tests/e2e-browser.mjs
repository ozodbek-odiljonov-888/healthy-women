// Browser-level Healthy Women smoke checks. Fictional data only; no remote APIs.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const ROOT=resolve("site"),PASS="Fictional-Diary-Passphrase-2026";
const TYPE={".html":"text/html",".js":"application/javascript",".mjs":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const tmp=await mkdtemp(join(tmpdir(),"hw-e2e-"));
const server=createServer(async(req,res)=>{
 try{
  let name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(name==="/")name="/index.html";
  const path=resolve(ROOT,"."+name);
  if(!path.startsWith(ROOT+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(path);
  res.writeHead(200,{"Content-Type":TYPE[extname(path)]||"text/plain","Cache-Control":"no-store"});
  res.end(data);
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const base="http://127.0.0.1:"+server.address().port;
let browser,page;
const errors=[];
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1280,height:900}});
 page=await context.newPage();page.on("pageerror",e=>errors.push(String(e)));
 await page.goto(base+"/index.html");
 await page.locator("#view-home .hero").waitFor();
 assert.equal(errors.length,0,"Startup errors: "+errors.join("; "));
 console.log("PASS: homepage and app modules load in Chromium.");
 await page.locator('#mainNav [data-view="journal"]').click();
 await page.locator('#checkinForm textarea[name="note"]').fill("FICTIONAL-HEALTH-NOTE-NEVER-REAL-PATIENT");
 await page.locator('#checkinForm select[name="pain"]').selectOption("4");
 await page.locator('#checkinForm select[name="flow"]').selectOption("normal");
 await page.locator('#checkinForm button[type="submit"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("healthywomen.events.v1")||"[]").length===1);
 assert.equal(await page.locator("#view-journal [data-edit-checkin]").count(),1);
 const originalLegacy=await page.evaluate(()=>localStorage.getItem("healthywomen.events.v1"));
 console.log("PASS: fictional daily diary entry saved.");
 await page.locator('#mainNav [data-view="settings"]').click();
 await page.locator("#secureEnable").click();
 await page.locator("#secureNewPassword").fill(PASS);
 await page.locator("#secureNewRepeat").fill(PASS);
 const initial=page.waitForEvent("download");
 await page.locator("#secureDownload").click();
 await (await initial).saveAs(join(tmp,"initial.hwbak"));
 assert((await readFile(join(tmp,"initial.hwbak"),"utf8")).includes("AES-256-GCM"));
 await page.locator("#secureBackupAcknowledged").check();
 await page.locator("#secureMigrate").click();
 await page.waitForFunction(()=>localStorage.getItem("healthywomen.encrypted-local.v1")!==null&&localStorage.getItem("healthywomen.events.v1")===null);
 const encrypted=await page.evaluate(()=>localStorage.getItem("healthywomen.encrypted-local.v1"));
 assert(!encrypted.includes("FICTIONAL-HEALTH-NOTE"));
 console.log("PASS: encrypted migration validated; plaintext removed.");
 await page.locator("#secureLock").click();
 await page.locator("#secureWall").waitFor({state:"visible"});
 await page.locator("#secureUnlockPassword").fill("Incorrect-Password-For-Testing");
 await page.locator("#secureUnlockButton").click();
 await page.waitForFunction(()=>/noto|buzil/i.test(document.querySelector("#secureUnlockError")?.textContent||""));
 assert(await page.locator("#secureWall").isVisible());
 await page.locator("#secureUnlockPassword").fill(PASS);
 await page.locator("#secureUnlockButton").click();
 await page.locator("#secureWall").waitFor({state:"hidden"});
 await page.locator('#mainNav [data-view="journal"]').click();
 assert.equal(await page.locator("#view-journal [data-edit-checkin]").count(),1);
 console.log("PASS: wrong password denied, correct password restores diary.");
 await page.reload();
 await page.locator("#secureWall").waitFor({state:"visible"});
 assert(!await page.locator(".app-shell").isVisible());
 await page.locator("#secureUnlockPassword").fill(PASS);
 await page.locator("#secureUnlockButton").click();
 await page.locator("#secureWall").waitFor({state:"hidden"});
 console.log("PASS: reload requires a new password unlock.");

 // Simulate an old tab restoring a plaintext key after this encrypted session.
 // The new entry must be preserved and merged ONLY after a backup is downloaded.
 await page.evaluate(raw=>{
  const records=JSON.parse(raw);
  records.push({id:"late-test-record",type:"checkin",payload:{date:"2026-11-08",pain:2,flow:"light",mood:"good",note:"FICTIONAL-OLD-TAB-NEW-ENTRY",between:false},updated_at:1794150000000,deleted:0});
  localStorage.setItem("healthywomen.events.v1",JSON.stringify(records));
 },originalLegacy);
 await page.reload();
 await page.locator("#secureWall").waitFor({state:"visible"});
 await page.locator("#secureUnlockPassword").fill(PASS);
 await page.locator("#secureUnlockButton").click();
 await page.locator("#legacyConflictPanel").waitFor({state:"visible"});
 assert((await page.evaluate(()=>localStorage.getItem("healthywomen.events.v1"))).includes("FICTIONAL-OLD-TAB-NEW-ENTRY"));
 page.once("dialog",d=>d.accept());
 const rescue=page.waitForEvent("download");
 await page.locator("#legacyDownload").click();
 const rescueFile=join(tmp,"legacy-rescue.json");
 await (await rescue).saveAs(rescueFile);
 assert((await readFile(rescueFile,"utf8")).includes("FICTIONAL-OLD-TAB-NEW-ENTRY"));
 await page.locator("#legacyAcknowledged").check();
 await page.locator("#legacyMerge").click();
 await page.locator("#secureWall").waitFor({state:"hidden"});
 assert.equal(await page.evaluate(()=>localStorage.getItem("healthywomen.events.v1")),null);
 const reconciled=await page.evaluate(()=>localStorage.getItem("healthywomen.encrypted-local.v1"));
 assert(!reconciled.includes("FICTIONAL-OLD-TAB-NEW-ENTRY"));
 await page.locator('#mainNav [data-view="journal"]').click();
 assert.equal(await page.locator("#view-journal [data-edit-checkin]").count(),2);
 console.log("PASS: stale-tab plaintext record is preserved, downloaded and safely merged under encryption.");

 await page.locator('#mainNav [data-view="settings"]').click();
 await page.locator("#backupBtn").click();
 await page.locator("#vaultPassword").fill(PASS);
 await page.locator("#vaultRepeat").fill(PASS);
 const arch=page.waitForEvent("download");
 await page.locator("#vaultSubmit").click();
 const backup=join(tmp,"final.hwbak");
 await (await arch).saveAs(backup);
 assert((await readFile(backup,"utf8")).includes("AES-256-GCM"));
 page.once("dialog",d=>d.accept());
 await page.locator("#clearBtn").click();
 await page.waitForFunction(()=>localStorage.getItem("healthywomen.encrypted-local.v1")===null&&localStorage.getItem("healthywomen.events.v1")===null);
 await page.locator("#restoreBtn").click();
 await page.locator("#vaultFile").setInputFiles(backup);
 await page.locator("#vaultPassword").fill(PASS);
 page.once("dialog",d=>d.accept());
 await page.locator("#vaultSubmit").click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem("healthywomen.events.v1")||"[]").length===2);
 await page.locator('#mainNav [data-view="journal"]').click();
 assert.equal(await page.locator("#view-journal [data-edit-checkin]").count(),2);
 console.log("PASS: encrypted backup restores deleted fictional records.");
 await page.setViewportSize({width:390,height:844});
 await page.locator('.mobile-nav [data-view="calendar"]').click();
 await page.locator("#view-calendar .calendar-box").waitFor({state:"visible"});
 console.log("PASS: mobile navigation works.");
 await page.setViewportSize({width:1280,height:900});
 const second=await context.newPage();
 second.on("pageerror",e=>errors.push(String(e)));
 await second.goto(base+"/index.html");
 await second.locator("#view-home .hero").waitFor();
 await second.locator('#mainNav [data-view="journal"]').click();
 assert.equal(await second.locator("#view-journal [data-edit-checkin]").count(),2);
 await page.locator('#mainNav [data-view="journal"]').click();
 await page.locator("#view-journal [data-edit-checkin]").click();
 await page.locator('#checkinForm select[name="pain"]').selectOption("5");
 await page.locator('#checkinForm button[type="submit"]').click();
 await second.waitForFunction(()=>document.querySelector("#view-journal")?.textContent?.includes("Og‘riq: 5/10"));
 await second.close();
 console.log("PASS: second browser tab refreshes after another tab edits a diary record.");

 await page.evaluate(()=>localStorage.setItem("healthywomen.events.v1","{broken-example-json"));
 await page.reload();
 await page.locator("#rescueLegacy").waitFor({state:"visible"});
 const corrupted=await page.evaluate(()=>localStorage.getItem("healthywomen.events.v1"));
 await page.locator('#mainNav [data-view="journal"]').click();
 await page.locator('#checkinForm textarea[name="note"]').fill("FICTIONAL NEW ENTRY THAT MUST NOT OVERWRITE");
 await page.locator('#checkinForm button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector("#diaryFormError")?.textContent?.length>0);
 assert.equal(await page.evaluate(()=>localStorage.getItem("healthywomen.events.v1")),corrupted);
 console.log("PASS: corrupt local journal remains preserved, and accidental overwrites are blocked.");

 assert.deepEqual(errors,[]);
 console.log("PASS: no JavaScript runtime errors.");
 console.log("BROWSER E2E PASSED.");
}catch(e){
 console.error("BROWSER E2E FAILED: "+String(e));
 if(page)try{console.error("Location:",page.url());console.error("Errors:",errors);console.error("Form notices:",await page.locator("#secureEnableStatus, #secureUnlockError, #vaultStatus, #diaryFormError").allTextContents());}catch{}
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
 await rm(tmp,{recursive:true,force:true});
}
