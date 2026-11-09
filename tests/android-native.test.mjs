import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {hardenAndroid,hardenManifest,hardenMainActivity} from "../scripts/harden-android.mjs";
import {signingGradle,configureSignedBuild} from "../scripts/configure-android-signing.mjs";

const manifest='<?xml version="1.0"?><manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:label="@string/app_name" android:allowBackup="true" android:usesCleartextTraffic="true"><activity android:name=".MainActivity"/></application></manifest>';
const java='package org.healthywomen.cycle;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity {\n}\n';

test("Android manifest disables backups and cleartext network traffic",()=>{
 const s=hardenManifest(manifest);
 for(const term of ['android:allowBackup="false"','android:fullBackupContent="@xml/hw_backup_rules"','android:dataExtractionRules="@xml/hw_data_extraction_rules"','android:usesCleartextTraffic="false"'])assert(s.includes(term));
 assert(!s.includes('android:allowBackup="true"'));
});
test("native activity blocks screenshots and recent-apps previews",()=>{
 const s=hardenMainActivity(java);
 assert(s.includes("WindowManager.LayoutParams.FLAG_SECURE"));
 assert(s.includes("super.onCreate(state)"));
 assert.equal(hardenMainActivity(s),s);
});
test("Android hardening adds both legacy and Android 12+ backup rules",()=>{
 const base=mkdtempSync(join(tmpdir(),"healthy-women-android-"));
 try {
  const dir=join(base,"app","src","main"),javaDir=join(dir,"java","org","healthywomen","cycle");
  mkdirSync(javaDir,{recursive:true});
  writeFileSync(join(dir,"AndroidManifest.xml"),manifest);
  writeFileSync(join(javaDir,"MainActivity.java"),java);
  const paths=hardenAndroid(base);
  assert(readFileSync(paths.manifest,"utf8").includes('android:allowBackup="false"'));
  assert(readFileSync(paths.activity,"utf8").includes("FLAG_SECURE"));
  const old=readFileSync(paths.backup,"utf8"),modern=readFileSync(paths.extraction,"utf8");
  assert(old.includes('domain="root"'));
  assert(modern.includes("<cloud-backup>"));
  assert(modern.includes("<device-transfer>"));
  assert(modern.includes('domain="device_root"'));
 }finally{rmSync(base,{force:true,recursive:true});}
});
test("signed Gradle build depends on secret env and increasing version code",()=>{
 const text=signingGradle(17);
 assert(text.includes("versionCode 100017"));
 assert(text.includes('versionName "1.0.1-signed.17"'));
 assert(text.includes("System.getenv('HW_SIGNING_STORE_PASSWORD')"));
 assert(text.includes("System.getenv('HW_SIGNING_KEY_ALIAS')"));
 assert.throws(()=>signingGradle(0));
 assert.throws(()=>signingGradle("invalid"));
});
test("signed build cannot proceed without secrets",()=>{
 const folder=mkdtempSync(join(tmpdir(),"hw-gradle-"));
 try {
  mkdirSync(join(folder,"app"),{recursive:true});
  writeFileSync(join(folder,"app","build.gradle"),"apply plugin: 'com.android.application'\nandroid { defaultConfig {} }\n");
  assert.throws(()=>configureSignedBuild(folder,{GITHUB_RUN_NUMBER:"2"}),/Signing secrets unavailable/);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
