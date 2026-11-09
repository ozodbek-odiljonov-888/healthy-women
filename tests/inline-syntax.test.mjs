import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const html=readFileSync(new URL("../site/index.html",import.meta.url),"utf8");
test("embedded main app module has valid ECMAScript syntax",()=>{
 const m=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert(m,"Main application module missing");
 const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:m[1],encoding:"utf8",timeout:10000});
 assert.equal(result.status,0,result.stderr||result.error?.message||"Module did not compile");
});
test("medical note is HTML-escaped when an existing diary entry is edited",()=>{
 assert(html.includes('escapeHTML(edit.note||"")'));
 assert(html.includes("data-edit-checkin"));
 assert(html.includes("validateDiaryEntry(candidate,today)"));
});
