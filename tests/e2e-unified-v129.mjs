// Actual PWA configuration + CSP, mocked remote AI only, no patient data.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=resolve("site"),type={".html":"text/html",".js":"application/javascript",".mjs":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,"http://localhost").pathname;
  const file=resolve(root,"."+(p==="/"?"/index.html":p));
  if(!file.startsWith(root+sep))throw Error("Traversal");
  const content=await readFile(file);
  res.writeHead(200,{"Content-Type":type[extname(file)]||"text/plain","Cache-Control":"no-store"});res.end(content);
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const api="https://healthy-women-bot.vercel.app/api/ai";
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:800}});
  const page=await context.newPage(),requests=[],errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  // Unlike v1.27 smoke test, do NOT override config.js — test real build.
  await page.route("https://healthy-women-bot.vercel.app/api/ai-status",async route=>{
   await route.fulfill({status:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":origin},body:JSON.stringify({enabled:true,freeTierVerified:true})});
  });
  await page.route(api,async route=>{
   const req=route.request();
   requests.push({method:req.method(),data:JSON.parse(req.postData()||"{}"),origin:req.headers()["origin"]});
   await route.fulfill({status:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":origin,"Cache-Control":"no-store"},body:JSON.stringify({
     answer:"Fictional general educational response",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/",remainingToday:2
   })});
  });
  await page.goto(origin+"/index.html");await page.locator("#view-home .hero").waitFor();
  const cancel=page.locator("#secureCancel");if(await cancel.isVisible())await cancel.click();
  if(width===390){await page.locator("#menuButton").click();await page.locator('#mainNav [data-view="assistant"]').click();}
  else await page.locator('#mainNav [data-view="assistant"]').click();
  await page.locator("#aiConsent").waitFor();
  assert.equal(requests.length,0);
  await page.locator("#chatInput").fill("Hayz og‘rig‘i nima?");
  await page.locator("#chatForm button[type=submit]").click();
  assert.equal(requests.length,0);
  await page.locator("#checkAiStatusButton").click();
  await page.locator("#aiStatusText").getByText("Bepul AI tekshirildi.").waitFor();
  await page.locator("#aiConsent").check();
  await page.locator("#askAiButton").click();
  await page.locator("#chatMessages").getByText("Fictional general educational response",{exact:false}).waitFor();
  assert.equal(requests.length,1);
  assert.equal(requests[0].method,"POST");
  assert.deepEqual(requests[0].data,{topic:"pain",consent:true});
  assert.equal(requests[0].origin,origin);
  assert.deepEqual(errors,[]);
  await context.close();
  console.log("PASS unified v1.29 AI real config/CSP, user consent, offline fallback, privacy at "+width+"px");
 }
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
