import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeMedicalSourceUrl,askPublicAi} from '../site/ai-client.mjs';
import {createInstallUi,installCardHtml} from '../site/install-ui.mjs';
const root=new URL('../site/',import.meta.url);
const text=p=>readFileSync(new URL(p,root),'utf8');
test('mobile menu opens all seven sections and is dismissible by keyboard',()=>{
 const html=text('index.html'),app=text('app.mjs'),css=text('style.css');
 assert.match(html,/id="mainSidebar"/);
 assert.match(html,/id="menuButton"[^>]*aria-expanded="false"/);
 assert.match(html,/id="mobileMenuBackdrop"/);
 assert.match(html,/id="closeMobileMenu"/);
 assert.equal((html.match(/class="nav-button/g)||[]).length,7);
 assert(app.includes("$('#menuButton').onclick=()=>openMobileNav();"));
 assert(app.includes("if(e.key==='Escape')"));
 assert(app.includes('closeMobileNav(false);'));
 assert(css.includes('.sidebar.is-open'));
 assert(css.includes('.mobile-menu-backdrop:not([hidden])'));
 assert(!app.includes("$('#menuButton').onclick=()=>setView('settings')"));
});
test('only allow verified source domains, not attacker domains or URLs with credentials',()=>{
 assert.equal(safeMedicalSourceUrl('https://www.nhs.uk/symptoms/period-pain/'),'https://www.nhs.uk/symptoms/period-pain/');
 for(const input of ['https://www.nhs.uk.evil.test/a','https://evil.test/','javascript:alert(1)','https://user:password@www.nhs.uk/a','https://www.nhs.uk/a?token=secret','https://www.nhs.uk/a#unknown','http://www.nhs.uk/a'])assert.equal(safeMedicalSourceUrl(input),'');
});
test('public AI response strips untrusted source links without rejecting its answer',async()=>{
 const result=await askPublicAi('pain',{endpoint:'https://healthy-women-bot.vercel.app/api/ai',fetchFn:async()=>new Response(JSON.stringify({answer:'General response.',source:'Unknown',url:'https://phishing.example/abc',remainingToday:1}),{status:200})});
 assert.equal(result.text,'General response.');assert.equal(result.url,'');
 const app=text('app.mjs');assert(app.includes('href="${escapeHTML(m.url)}"'));
});
test('PWA install is opt-in and available only after browser install event',async()=>{
 const events=new Map();
 const win={addEventListener(name,cb){events.set(name,cb)},matchMedia:()=>({matches:false}),navigator:{}};
 const btn={hidden:true,disabled:false,handlers:{},addEventListener(type,cb){this.handlers[type]=cb}};
 const status={textContent:''};
 const doc={getElementById:id=>id==='installPwaButton'?btn:id==='installPwaStatus'?status:null};
 const controller=createInstallUi({win,doc});controller.bind();
 assert.equal(btn.hidden,true);assert(status.textContent.includes('Android Chrome'));
 let didPrompt=0;let prevented=0;
 events.get('beforeinstallprompt')({preventDefault(){prevented++},async prompt(){didPrompt++},userChoice:Promise.resolve({outcome:'accepted'})});
 assert.equal(prevented,1);assert.equal(btn.hidden,false);
 await btn.handlers.click();
 assert.equal(didPrompt,1);assert.equal(btn.hidden,true);assert.equal(controller.state().installed,true);
 assert(installCardHtml().includes('installPwaButton'));
});
test('site assets and setting metadata updated safely and offline',()=>{
 const sw=text('sw.js'),app=text('app.mjs');
 assert(sw.includes('"./install-ui.mjs"'));
 assert(sw.includes('healthy-women-pwa-v29-unified-ai'));
 assert(!sw.includes('cache.put('));
 assert(app.includes('v1.28 — Sifat va qulaylik sinovi'));
 assert(text('style.css').includes('#installPwaButton[hidden]{display:none!important}'));
 assert(app.includes('lastAiPublicTopic=pickAiTopic(q)'));
 assert(app.includes('q?pickAiTopic(q):lastAiPublicTopic'));
});
