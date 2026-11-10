import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const PREP=fileURLToPath(new URL("../scripts/prepare-medical-clinical-review.mjs",import.meta.url));
const CHECK=fileURLToPath(new URL("../scripts/check-medical-release.mjs",import.meta.url));
const exec=(file,output)=>spawnSync(process.execPath,[file,output],{encoding:"utf8",timeout:30000});

test("release gate blocks absent and unapproved clinical review files",()=>{
 const dir=mkdtempSync(join(tmpdir(),"healthy-women-medical-gate-"));
 const target=join(dir,"review.json");
 try{
  const missing=exec(CHECK,target);
  assert.equal(missing.status,1);
  assert.match(missing.stderr,/BLOCKED/);
  const generated=exec(PREP,target);
  assert.equal(generated.status,0,generated.stderr);
  const json=JSON.parse(readFileSync(target,"utf8"));
  assert.equal(json.entries.length,50);
  assert.equal(json.entries.filter(x=>x.review_status==="APPROVED_BY_CLINICIAN").length,0);
  const result=exec(CHECK,target);
  assert.equal(result.status,1);
  assert.match(result.stderr,/only 0\/50/);
  const again=exec(PREP,target);
  assert.notEqual(again.status,0,"Never overwrite clinicians' original notes");
 }finally{
  rmSync(dir,{recursive:true,force:true});
 }
});
