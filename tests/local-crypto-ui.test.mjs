import test from "node:test";
import assert from "node:assert/strict";
import {protectionSettingsHtml,STORAGE_STYLE} from "../site/local-crypto-ui.mjs";
test("unencrypted diary explicitly offers opt-in protection",()=>{const html=protectionSettingsHtml(false);assert(html.includes("secureEnable"));assert(html.includes("shifrlanmagan"));});
test("encrypted diary offers lock and explains lost password",()=>{const html=protectionSettingsHtml(true);assert(html.includes("secureLock"));assert(html.includes("Parol unutilsa"));});
test("encrypted unlock overlay masks old interface",()=>{assert(STORAGE_STYLE.includes("body.secure-locked .app-shell"));assert(STORAGE_STYLE.includes("visibility:hidden!important"));});
