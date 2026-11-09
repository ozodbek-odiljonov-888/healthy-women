import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const code=readFileSync(new URL("../site/sw.js",import.meta.url),"utf8");
function serviceWorker(scope="https://example.test/"){
 const listeners=new Map(),record={added:[],deleted:[],fetched:[],opened:[]};
 const store=new Map([["healthy-women-pwa-v11",new Map()],["some-other-site-cache",new Map()]]);
 const caches={
  open:async name=>{
   record.opened.push(name);if(!store.has(name))store.set(name,new Map());const items=store.get(name);
   return {addAll:async files=>{record.added.push(...files);for(const f of files)items.set(new URL(f,scope).href,{ok:true,cached:true});},
    match:async request=>items.get(request.url)||undefined};
  },
  keys:async()=>[...store.keys()],
  delete:async name=>{record.deleted.push(name);return store.delete(name);}
 };
 const self={registration:{scope},location:{origin:new URL(scope).origin},clients:{claim:async()=>{}},skipWaiting:async()=>{},
  addEventListener:(name,fn)=>listeners.set(name,fn)};
 runInNewContext(code,{self,caches,URL,Set,Promise,fetch:async request=>{record.fetched.push(request.url);return {ok:true,source:"network"};}});
 return {listeners,record,store};
}
async function perform(sw,method,url){
 let handled=false;
 const event={request:{method,url},respondWith:p=>{handled=true;event.response=p;}};
 sw.listeners.get("fetch")(event);
 return {handled,response:handled?await event.response:null};
}
test("install caches only audited static app files",async()=>{
 const sw=serviceWorker();
 await new Promise((resolve,reject)=>sw.listeners.get("install")({waitUntil:promise=>promise.then(resolve,reject)}));
 assert(sw.record.added.includes("./index.html"));
 assert(sw.record.added.includes("./local-crypto.mjs"));
 assert(!sw.record.added.some(x=>x.includes("/api/")));
});
test("non-static URLs, personal API calls, query strings and POST are never cached",async()=>{
 const sw=serviceWorker();
 for(const [method,url] of [
  ["GET","https://example.test/api/sync?events=secret"],
  ["GET","https://example.test/index.html?private=diary"],
  ["GET","https://example.test/medical-report.txt"],
  ["GET","https://example.test/vault-export.hwbak"],
  ["GET","https://outside.test/index.html"],
  ["POST","https://example.test/index.html"],
  ["GET","https://example.test/health?note=secret"],
 ])assert.equal((await perform(sw,method,url)).handled,false,url);
 assert.deepEqual(sw.record.fetched,[]);
});
test("known static file can be served offline from a fixed cache without new entries",async()=>{
 const sw=serviceWorker();
 await new Promise((resolve,reject)=>sw.listeners.get("install")({waitUntil:promise=>promise.then(resolve,reject)}));
 const r=await perform(sw,"GET","https://example.test/local-crypto.mjs");
 assert.equal(r.handled,true);assert.equal(r.response.cached,true);
 assert.deepEqual(sw.record.fetched,[]);
});
test("GitHub Pages nested scope is supported and unrelated caches survive activation",async()=>{
 const sw=serviceWorker("https://example.test/healthy-women/");
 assert.equal((await perform(sw,"GET","https://example.test/index.html")).handled,false);
 assert.equal((await perform(sw,"GET","https://example.test/healthy-women/index.html")).handled,true);
 await new Promise((resolve,reject)=>sw.listeners.get("activate")({waitUntil:p=>p.then(resolve,reject)}));
 assert(sw.record.deleted.includes("healthy-women-pwa-v11"));
 assert(!sw.record.deleted.includes("some-other-site-cache"));
});
