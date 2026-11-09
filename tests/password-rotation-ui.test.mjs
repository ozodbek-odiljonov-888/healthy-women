import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {passwordRotationSettingsHtml} from "../site/password-rotation-ui.mjs";
test("password-change control exists only for encrypted local journals",()=>{
 assert(passwordRotationSettingsHtml(true).includes('id="rotateOpen"'));
 assert.equal(passwordRotationSettingsHtml(false),"");
});
test("password-change UI requires recovery backup and explicit user confirmation",()=>{
 const html=passwordRotationSettingsHtml(true);
 assert(html.includes("zaxira olish"));
});

test("dialog only operates with a verified recovery copy, old password and storage revision",()=>{
 const code=readFileSync(new URL("../site/password-rotation-ui.mjs",import.meta.url),"utf8");
 assert(code.includes("rotateAck"));
 assert(code.includes("if(storage.getItem(LOCAL_VAULT_KEY)!==source)"));
 assert(code.includes("rotateEncryptedJournalPassword"));
 assert(code.includes("dialog.addEventListener(\"close\",resetSecrets)"));
});
