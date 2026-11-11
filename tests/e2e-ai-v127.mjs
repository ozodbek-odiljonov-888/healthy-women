// Browser verifies optional AI never leaves the device without a direct, informed click.
// All online responses are mocked. No real API credentials or network calls.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=resolve("site"),types={".html":"text/html",".mjs":"application/javascript",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer(async(req,res)=>{
 try{let url=new URL(req.url,"http://localhost"),path=url.pathname==="/"?"/index.html":url.pathname;
  let file=resolve(root,"."+path);if(!file.startsWith(root+sep))throw Error("Invalid path");
  let bytes=await readFile(file);res.writeHead(200,{"Content-Type":types[extname(file)]||"text/plain","Cache-Control":"no-store"});res.end(bytes);
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const origin="http://127.0.0.1:"+server.address().port,api="https://healthy-women-bot.vercel.app/api/ai";
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:800}});
  const page=await context.newPage();const errors=[],sent=[];
  page.on("pageerror",error=>errors.push(String(error)));
  await page.route("**/config.js",route=>route.fulfill({status:200,contentType:"application/javascript",body:'window.HEALTHY_WOMEN_API="";window.HEALTHY_WOMEN_AI_API="'+api+'";'}));
  await page.route("https://healthy-women-bot.vercel.app/api/ai-status",async route=>{
    await route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":origin},body:JSON.stringify({enabled:true,freeTierVerified:true})});
  });
  await page.route(api,async route=>{
   const req=route.request();sent.push(JSON.parse(req.postData()||"{}"));
   await route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":origin,"cache-control":"no-store"},
    body:JSON.stringify({answer:"Sinov uchun umumiy AI javobi",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/",remainingToday:2})});
  });
  await page.goto(origin+"/index.html");
  await page.locator("#view-home .hero").waitFor();
  // Viewing educational content is allowed before encryption; medical writes remain blocked.
  await page.locator("#secureCancel").click();
  await page.locator('#mainNav [data-view="assistant"]').evaluate(el=>el.click());
  await page.locator("#aiConsent").waitFor();
  assert.equal(await page.locator("#askAiButton").isDisabled(),true);
  assert.equal(sent.length,0);
  await page.locator("#chatInput").fill("Hayz og‘rig‘i sabablarini ayt");
  await page.locator("#chatForm button[type=submit]").click(); // Offline, no request.
  assert.equal(sent.length,0);
  await page.locator("#chatInput").fill("Hayz og‘rig‘i haqida");
  await page.locator("#checkAiStatusButton").click();
  await page.locator("#aiStatusText").getByText("Bepul AI tekshirildi.").waitFor();
  await page.locator("#aiConsent").check();
  await page.locator("#askAiButton").click();
  await page.locator("#chatMessages").getByText("Sinov uchun umumiy AI javobi",{exact:false}).waitFor();
  assert.deepEqual(sent,[{topic:"pain",consent:true}]);
  assert.equal(await page.locator("#chatMessages").textContent().then(x=>x.includes("AI — umumiy ma’lumot")),true);
  assert.equal(errors.length,0,JSON.stringify(errors));
  await context.close();
  console.log("PASS: explicit opt-in, canonical-topic-only, offline fallback at "+width+"px");
 }
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
