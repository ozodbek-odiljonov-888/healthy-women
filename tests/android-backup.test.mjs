import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
test("Android backups explicitly exclude app data",()=>{
 const p=mkdtempSync(join(tmpdir(),"hw-manifest-"));
 try{
  const root=join(p,"app/src/main");mkdirSync(root,{recursive:true});
  writeFileSync(join(root,"AndroidManifest.xml"),'<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:allowBackup="true" android:label="Healthy Women"></application></manifest>');
  const args=[fileURLToPath(new URL("../.github/scripts/harden-android.mjs",import.meta.url)),p];
  execFileSync(process.execPath,args,{stdio:"pipe"});
  const output=readFileSync(join(root,"AndroidManifest.xml"),"utf8");
  assert(output.includes('android:allowBackup="false"'));
  assert(output.includes('android:fullBackupContent="@xml/healthy_women_backup_rules"'));
  assert(output.includes('android:dataExtractionRules="@xml/healthy_women_data_extraction_rules"'));
  const rules=readFileSync(join(root,"res/xml/healthy_women_data_extraction_rules.xml"),"utf8");
  assert(rules.includes("<cloud-backup>"));assert(rules.includes("<device-transfer>"));
  execFileSync(process.execPath,args,{stdio:"pipe"});
  const twice=readFileSync(join(root,"AndroidManifest.xml"),"utf8");
  assert.equal((twice.match(/android:allowBackup=/g)||[]).length,1);
 }finally{rmSync(p,{recursive:true,force:true});}
});
