import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {join,resolve,sep,extname} from "node:path";
import {chromium} from "playwright";

const root=resolve("site");
const mime={".html":"text/html",".js":"application/javascript",".mjs":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer(async(request,response)=>{
 try{
  let name=decodeURIComponent(new URL(request.url,"http://localhost").pathname);
  if(name==="/")name="/index.html";
  const file=resolve(root,"."+name);
  if(!file.startsWith(root+sep))throw Error("invalid path");
  const bytes=await readFile(file);
  response.writeHead(200,{"Content-Type":mime[extname(file)]||"text/plain","Cache-Control":"no-store"});
  response.end(bytes);
 }catch{response.writeHead(404);response.end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 const jsErrors=[];
 page.on("pageerror",err=>jsErrors.push(String(err)));
 await page.addInitScript(()=>{
  if(sessionStorage.getItem("test-seeded")!=="yes"){
   localStorage.setItem("healthywomen.events.v1"," [ ] ");
   sessionStorage.setItem("test-seeded","yes");
  }
 });
 await page.goto("http://127.0.0.1:"+server.address().port+"/index.html");
 await page.locator("#secureEnableDialog").waitFor({state:"visible"});
 await page.locator("#secureCancel").click();
 await page.locator('#mainNav [data-view="journal"]').click();
 await page.locator('#checkinForm textarea[name="note"]').fill("TEST-ONLY-ENTRY");
 await page.locator('#checkinForm button[type="submit"]').click();
 await page.locator("#secureEnableDialog").waitFor({state:"visible"});
 await page.waitForFunction(()=>Boolean(document.querySelector("#diaryFormError")?.textContent));
 assert.equal(await page.evaluate(()=>localStorage.getItem("healthywomen.events.v1"))," [ ] ");
 assert.equal(await page.evaluate(()=>localStorage.getItem("healthywomen.encrypted-local.v1")),null);
 assert.deepEqual(jsErrors,[]);
 console.log("PASS: an empty legacy journal cannot create an unprotected new entry.");
 await context.close();
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
