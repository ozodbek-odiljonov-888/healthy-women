// Healthy Women v1.26 interactive calendar check on fictional data only.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {chromium} from "playwright";
const root=resolve("site");
const type={".html":"text/html",".js":"application/javascript",".mjs":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost"),path=url.pathname==="/"?"/index.html":url.pathname;
  const file=resolve(root,"."+path);
  if(!file.startsWith(root+sep))throw Error("Invalid path");
  const content=await readFile(file);
  res.writeHead(200,{"Content-Type":type[extname(file)]||"text/plain","Cache-Control":"no-store"});res.end(content);
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
  const context=await browser.newContext({viewport:{width,height:width===390?844:800}});
  const page=await context.newPage();page.on("pageerror",e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   if(sessionStorage.getItem("hw-v126-fixture"))return;
   const date=ago=>{const d=new Date();d.setDate(d.getDate()-ago);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
   const periods=[90,61,32].map((n,i)=>({id:"fake-period-"+i,type:"period",payload:{start:date(n),end:date(n-4)},updated_at:Date.now(),deleted:0}));
   localStorage.setItem("healthywomen.events.v1",JSON.stringify(periods));
   sessionStorage.setItem("hw-v126-fixture","true");
  });
  await page.goto(origin+"/index.html");
  await page.locator("#view-home .hero").waitFor();
  const nav=width===390?'.mobile-nav [data-view="calendar"]':'#mainNav [data-view="calendar"]';
  await page.locator(nav).click();
  await page.locator("#calendarDayDetail").waitFor();
  const today=await page.evaluate(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");});
  // Selecting a day now shows a detail panel; it does NOT unexpectedly open the form.
  await page.locator('[data-date="'+today+'"]').click();
  assert.equal(await page.locator("#periodDialog").evaluate(el=>el.open),false);
  assert.equal(await page.locator('[data-date="'+today+'"]').getAttribute("aria-pressed"),"true");
  await page.locator("#dayAddPeriod").click();
  assert.equal(await page.locator("#periodStart").inputValue(),today);
  await page.locator('#periodForm button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#calendarDayDetail")?.textContent?.includes("Hayz boshlangan kun"));
  assert.equal(await page.locator('[data-date="'+today+'"]').evaluate(el=>el.classList.contains("recorded")),true);
  const tomorrow=await page.evaluate(()=>{
   const d=new Date();d.setDate(d.getDate()+1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
  });
  // An unfinished period must not paint tomorrow as confirmed bleeding.
  assert.equal(await page.locator('[data-date="'+tomorrow+'"]').evaluate(el=>el.classList.contains("recorded")),false);
  await page.locator("#dayEditPeriod").click();
  assert.equal(await page.locator("#periodStart").inputValue(),today);
  await page.locator("#periodEnd").fill(today);
  await page.locator('#periodForm button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector("#calendarDayDetail")?.textContent?.includes("Tugash"));
  await page.locator("#dayOpenDiary").click();
  assert.equal(await page.locator('#checkinForm input[name="date"]').inputValue(),today);
  await page.locator('#checkinForm textarea[name="note"]').fill("FICTIONAL PRIVATE DIARY");
  await page.locator('#checkinForm button[type="submit"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("healthywomen.events.v1")||"[]").filter(e=>e.type==="checkin"&&!e.deleted).length===1);
  await page.locator(nav).click();
  await page.locator('[data-date="'+today+'"]').click();
  assert(await page.locator("#calendarDayDetail").textContent().then(x=>x.includes("FICTIONAL PRIVATE DIARY")));
  await page.screenshot({path:"ui-preview/calendar-"+width+".png",fullPage:true});
  const clientWidth=await page.evaluate(()=>document.documentElement.clientWidth);
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert(scrollWidth<=clientWidth+1,"Horizontal overflow at "+width+": "+scrollWidth);
  await context.close();
  console.log("PASS: date details, add/edit period, diary workflow, unknown-end safety at "+width+"px");
 }
 assert.deepEqual(errors,[]);
 console.log("HEALTHY WOMEN v1.26 CALENDAR E2E PASSED");
}finally{
 if(browser)await browser.close();
 await new Promise(done=>server.close(done));
}
