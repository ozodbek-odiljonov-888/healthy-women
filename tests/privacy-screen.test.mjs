import test from "node:test";
import assert from "node:assert/strict";
import {SCREEN_PRIVACY_KEY,isAutoMaskEnabled,setAutoMask,privacyShieldMarkup,PRIVACY_SHIELD_CSS} from "../site/privacy-screen.mjs";
const storage=()=>{const x=new Map();return {getItem:k=>x.get(k)||null,setItem:(k,v)=>x.set(k,v),removeItem:k=>x.delete(k)}};
test("mask on background is enabled by default",()=>{
 const s=storage();assert.equal(isAutoMaskEnabled(s),true);
 setAutoMask(false,s);assert.equal(s.getItem(SCREEN_PRIVACY_KEY),"off");assert.equal(isAutoMaskEnabled(s),false);
 setAutoMask(true,s);assert.equal(s.getItem(SCREEN_PRIVACY_KEY),null);assert.equal(isAutoMaskEnabled(s),true);
});
test("shield has a clear privacy warning and no real authentication claim",()=>{
 const html=privacyShieldMarkup();
 assert(html.includes("id=\"privacyReveal\""));assert(html.includes("shifrlanmaydi"));assert(html.includes("parol talab qilinmaydi"));
 assert(PRIVACY_SHIELD_CSS.includes("visibility:hidden!important"));
});
test("setting cannot be changed with a nonboolean value",()=>{
 assert.throws(()=>setAutoMask("yes",storage()));
});
