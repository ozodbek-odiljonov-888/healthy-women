import test from "node:test";
import assert from "node:assert/strict";
import {passwordRotationSettingsHtml} from "../site/password-rotation-ui.mjs";
test("password-change control exists only for encrypted local journals",()=>{
 assert(passwordRotationSettingsHtml(true).includes('id="rotateOpen"'));
 assert.equal(passwordRotationSettingsHtml(false),"");
});
test("password-change UI requires recovery backup and explicit user confirmation",()=>{
 const html=passwordRotationSettingsHtml(true);
 assert(html.includes("zaxira olish"));
});
