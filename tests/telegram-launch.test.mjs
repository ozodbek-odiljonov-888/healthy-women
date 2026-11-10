import test from "node:test";
import assert from "node:assert/strict";
import {getRawTelegramInitData} from "../site/telegram-launch.mjs";

const signed="auth_date=1794260000&user=%7B%22id%22%3A123456%7D&hash="+("a".repeat(64));
const fragment="#"+new URLSearchParams({tgWebAppData:signed,tgWebAppVersion:"9.1"}).toString();

test("Telegram SDK initData takes precedence over launch URL fragment",()=>{
 assert.equal(getRawTelegramInitData({Telegram:{WebApp:{initData:signed}},location:{hash:"#anything"}}),signed);
});
test("decodes Telegram hash launch parameter without changing signed raw bytes",()=>{
 assert.equal(getRawTelegramInitData({location:{hash:fragment}}),signed);
});
test("normal web browser has no untrusted launch credentials",()=>{
 assert.equal(getRawTelegramInitData({location:{hash:"#calendar"}}),"");
 assert.equal(getRawTelegramInitData({location:{hash:""}}),"");
 assert.equal(getRawTelegramInitData({}),"");
});
test("malformed SDK data falls back only to plausible raw launch value",()=>{
 assert.equal(getRawTelegramInitData({Telegram:{WebApp:{initData:"untrusted-no-hash"}},location:{hash:fragment}}),signed);
 assert.equal(getRawTelegramInitData({location:{hash:"#tgWebAppData=untrusted"}}),"");
});
test("oversized input is rejected without exposing or storing it",()=>{
 assert.equal(getRawTelegramInitData({Telegram:{WebApp:{initData:signed+"x".repeat(9000)}}}),"");
 assert.equal(getRawTelegramInitData({location:{hash:"#"+("a".repeat(24001))}}),"");
});
