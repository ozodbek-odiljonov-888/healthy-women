import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
test("app module and privacy handler both parse as ES modules",()=>{
 for(const p of ["../site/app.mjs","../site/privacy-page.mjs"]){
  const source=read(p);
  const r=spawnSync(process.execPath,["--check","--input-type=module"],{input:source,encoding:"utf8",timeout:10000});
  assert.equal(r.status,0,r.stderr||r.error?.message||"Module failed: "+p);
 }
});
test("app protects notes from HTML injection",()=>{
 const app=read("../site/app.mjs");
 assert(app.includes('escapeHTML(edit.note||"")'));
 assert(app.includes("data-edit-checkin"));
 assert(app.includes("validateDiaryEntry(candidate,today)"));
});
test("static pages have only external scripts, no inline scripts or event handler attributes",()=>{
 for(const p of ["../site/index.html","../site/privacy.html"]){
  const html=read(p);
  assert(!/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html),"Inline script found: "+p);
  assert(!/\son(?:click|load|error|change|submit)\s*=/i.test(html),"Inline handler found: "+p);
  assert(html.includes('http-equiv="Content-Security-Policy"'));
 }
 assert(read("../site/index.html").includes('src="./app.mjs"'));
 assert(read("../site/privacy.html").includes('src="./privacy-page.mjs"'));
});
