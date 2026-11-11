// Reproduces user screenshot: unrecognized offline question then AI click with no topic.
// Mock provider, no keys or private health data.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('site'),types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep))throw Error('bad path');
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin=`http://127.0.0.1:${server.address().port}`,api='https://healthy-women-bot.vercel.app/api/ai';
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:800}});
  const page=await context.newPage(),sent=[],errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://healthy-women-bot.vercel.app/api/ai-status',async route=>route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':origin},body:JSON.stringify({enabled:true,freeTierVerified:true})}));
  await page.route(api,async route=>{
   sent.push(JSON.parse(route.request().postData()||'{}'));
   await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':origin},body:JSON.stringify({answer:'Only a synthetic general medical topic response.',source:'NHS',url:'https://www.nhs.uk/symptoms/period-pain/',remainingToday:2})});
  });
  await page.goto(origin+'/index.html');await page.locator('#view-home .hero').waitFor();
  if(await page.locator('#secureCancel').isVisible())await page.locator('#secureCancel').click();
  if(width===390){await page.locator('#menuButton').click();await page.locator('#mainNav [data-view="assistant"]').click();}
  else await page.locator('#mainNav [data-view="assistant"]').click();
  await page.locator('#chatInput').fill('Menga yordam bering');
  await page.locator('#chatForm button[type="submit"]').click();
  assert.equal(await page.locator('#chatInput').inputValue(),'Menga yordam bering');
  assert.equal(sent.length,0);
  await page.locator('#checkAiStatusButton').click();
  await page.locator('#aiStatusText').getByText('Bepul AI tekshirildi.').waitFor();
  await page.locator('#aiConsent').check();
  await page.locator('#askAiButton').click();
  await page.locator('#aiTopicHint').getByText('mavzuni tanlang',{exact:false}).waitFor();
  assert.equal(sent.length,0);
  const botText=await page.locator('#chatMessages').textContent();
  assert.equal((botText.match(/Bu savolni umumiy mavzuga xavfsiz bog/g)||[]).length,0);
  await page.locator('#aiTopicSelect').selectOption('pain');
  await page.locator('#askAiButton').click();
  await page.locator('#chatMessages').getByText('Only a synthetic general medical topic response.',{exact:false}).waitFor();
  assert.deepEqual(sent,[{topic:'pain',consent:true}]);
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS v1.33 unmatched user question -> manual safe topic -> simulated AI at '+width+'px');
 }
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
