// v1.25 — Chromium UI regression using ONLY fictional on-device records.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=resolve("site");
const type={".html":"text/html",".js":"application/javascript",".mjs":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost"),urlPath=url.pathname==="/"?"/index.html":url.pathname;
  const file=resolve(root,"."+urlPath);
  if(!file.startsWith(root+sep))throw Error("Bad path");
  const content=await readFile(file);res.writeHead(200,{"Content-Type":type[extname(file)]||"text/plain","Cache-Control":"no-store"});res.end(content);
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
const errors=[];
let browser;
try{
 browser=await chromium.launch({headless:true});
 await mkdir("ui-preview",{recursive:true});
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:800},acceptDownloads:true});
  const page=await context.newPage();page.on("pageerror",error=>errors.push(String(error)));
  await page.addInitScript(()=>{
   if(sessionStorage.getItem("hw-v125-fixture"))return;
   const date=ago=>{const d=new Date();d.setDate(d.getDate()-ago);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
   const periods=[90,61,32,3].map((n,i)=>({id:"test-period-"+i,type:"period",payload:{start:date(n),end:null},updated_at:Date.now(),deleted:0}));
   const checkins=[{date:date(4),pain:9,flow:"heavy",mood:"low",between:true},{date:date(3),pain:5,flow:"normal",mood:"good",between:false}]
     .map((data,i)=>({id:"test-checkin-"+i,type:"checkin",payload:{...data,note:"FICTIONAL DEMO"},updated_at:Date.now(),deleted:0}));
   localStorage.setItem("healthywomen.events.v1",JSON.stringify([...periods,...checkins]));
   sessionStorage.setItem("hw-v125-fixture","yes");
  });
  await page.goto(origin+"/index.html");
  await page.locator("#view-home .hero").waitFor();
  assert.equal(await page.locator(".pro-shortcut").count(),4);
  await page.screenshot({path:"ui-preview/home-"+width+".png",fullPage:true});
  const nav=width===390?'.mobile-nav [data-view="insights"]':'#mainNav [data-view="insights"]';
  await page.locator(nav).click();
  await page.locator(".pro-analytics").waitFor();
  assert.equal(await page.locator(".pro-analysis-card").count(),4);
  assert.equal(await page.locator(".pro-metrics article").count(),4);
  await page.locator('[data-analytics-months="3"]').click();
  assert.equal(await page.locator(".pro-bars").first().locator(".pro-bar-item").count(),3);
  await page.locator('[data-analytics-months="12"]').click();
  assert.equal(await page.locator(".pro-bars").first().locator(".pro-bar-item").count(),12);
  assert.equal(await page.locator('[data-analytics-months="12"]').getAttribute("aria-pressed"),"true");
  const clientWidth=await page.evaluate(()=>document.documentElement.clientWidth);
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert(scrollWidth<=clientWidth+1,"Horizontal overflow at "+width+": "+scrollWidth);
  await page.screenshot({path:"ui-preview/insights-"+width+".png",fullPage:true});
  await page.locator('.pro-summary-actions [data-go="journal"]').click();
  assert(await page.locator("#view-journal").isVisible());
  await page.locator('#checkinForm textarea[name="note"]').fill("FICTIONAL CHECKIN");
  await page.locator('#checkinForm button[type="submit"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("healthywomen.events.v1")||"[]").length===7);
  await context.close();
  console.log("PASS: advanced dashboard, 3/12 month filters, real diary save, responsive layout at "+width+"px");
 }
 assert.deepEqual(errors,[]);
 console.log("HEALTHY WOMEN v1.25 CHROMIUM E2E PASSED");
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
