import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const workflow=readFileSync(new URL("../.github/workflows/android-release.yml",import.meta.url),"utf8");
test("release signing is triggered manually only",()=>{
 assert(workflow.includes("workflow_dispatch:"));assert(!/^\s*push:\s*$/m.test(workflow));
});
test("Gradle config receives private key from secret environment variables",()=>{
 for(const key of ["HEALTHY_WOMEN_ANDROID_KEYSTORE_B64","HEALTHY_WOMEN_ANDROID_STORE_PASSWORD","HEALTHY_WOMEN_ANDROID_KEY_ALIAS","HEALTHY_WOMEN_ANDROID_KEY_PASSWORD"])assert(workflow.includes("secrets."+key));
 assert(workflow.includes('System.getenv("HW_STORE_PASS")'));assert(workflow.includes("assembleRelease"));
});
test("APK verification and checksum are required",()=>{assert(workflow.includes("apksigner"));assert(workflow.includes("sha256sum app-release.apk"));});
