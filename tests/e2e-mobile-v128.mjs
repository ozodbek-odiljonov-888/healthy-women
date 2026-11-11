import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('site');
const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep))throw Error('Invalid path');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true});
 await mkdir('ui-preview',{recursive:true});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:800}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   if(sessionStorage.getItem('hw128-seeded'))return;
   const date=()=>{const d=new Date();d.setDate(d.getDate()-3);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
   localStorage.setItem('healthywomen.events.v1',JSON.stringify([{id:'fictional-period',type:'period',payload:{start:date(),end:null},updated_at:Date.now(),deleted:0}]));
   sessionStorage.setItem('hw128-seeded','yes');
  });
  await page.goto(origin+'/index.html');await page.locator('#view-home .hero').waitFor();
  if(width===390){
   assert.equal(await page.locator('#mainSidebar').isVisible(),false);
   await page.locator('#menuButton').click();assert.equal(await page.locator('#menuButton').getAttribute('aria-expanded'),'true');
   await page.locator('#mainNav [data-view="assistant"]').click();assert(await page.locator('#view-assistant').isVisible());
   assert.equal(await page.locator('#mainSidebar').isVisible(),false);
   await page.locator('#menuButton').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#mainSidebar').isVisible(),false);
   await page.locator('#menuButton').click();await page.locator('#mainNav [data-view="learn"]').click();assert(await page.locator('#view-learn').isVisible());
   await page.locator('#menuButton').click();await page.locator('#mainNav [data-view="assistant"]').click();
  }else await page.locator('#mainNav [data-view="assistant"]').click();
  await page.locator('#chatInput').fill('Hayz og‘rig‘i haqida');await page.locator('#chatForm button[type="submit"]').click();
  assert((await page.locator('#aiQuotaStatus').textContent()).includes('Tanlangan umumiy mavzu: pain'));
  assert(await page.locator('#askAiButton').isDisabled());
  if(width===390)await page.locator('.mobile-nav [data-view="settings"]').click();
  else await page.locator('#mainNav [data-view="settings"]').click();
  assert(await page.locator('#view-settings').isVisible());
  assert((await page.locator('#view-settings').textContent()).includes('v1.32'));
  assert((await page.locator('#installPwaStatus').textContent()).includes('Android Chrome'));
  await page.evaluate(()=>{
   const event=new Event('beforeinstallprompt',{cancelable:true});
   event.prompt=async()=>{};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);
  });
  assert(await page.locator('#installPwaButton').isVisible());
  await page.locator('#installPwaButton').click();
  await page.waitForFunction(()=>document.querySelector('#installPwaStatus')?.textContent?.includes('o‘rnatilgan'));
  assert(await page.locator('#installPwaButton').isHidden());
  await page.screenshot({path:'ui-preview/v128-settings-'+width+'.png',fullPage:true});
  const dimensions=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert(dimensions.scroll<=dimensions.client+2,'Overflow: '+JSON.stringify(dimensions));
  assert.deepEqual(errors,[]);
  await context.close();console.log('PASS v1.28 UX: '+width+'px mobile menu, AI, PWA install, no overflow');
 }
}finally{
 if(browser)await browser.close();await new Promise(done=>server.close(done));
}
