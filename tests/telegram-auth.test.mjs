import test from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {verifyTelegramInitData} from "../bot-vercel/worker/telegram-auth.js";
import {handleAuthRequest} from "../bot-vercel/api/auth.js";

// All credentials and users below are made-up test fixtures.
const TOKEN="123456789:FAKE_TEST_BOT_TOKEN_ABCDEFGHIJKLMNOP";
const OTHER_TOKEN="987654321:FAKE_TEST_BOT_TOKEN_ZYXWVUTSRQPONMLK";
const NOW=1794260000;
const ORIGIN="https://healthy-women.vercel.app";
const user=JSON.stringify({id:123456789,first_name:"Fictional Example",username:"fixture_test"});
const signed=(items={},token=TOKEN)=>{
  const values={auth_date:String(NOW),user,...items};
  const params=new URLSearchParams(values);
  const check=[...params].sort(([a],[b])=>a<b?-1:a>b?1:0)
    .map(([key,value])=>key+"="+value).join("\n");
  const secret=createHmac("sha256","WebAppData").update(token).digest();
  const hash=createHmac("sha256",secret).update(check).digest("hex");
  params.set("hash",hash);
  return params.toString();
};
const verify=(raw,opts={})=>verifyTelegramInitData(raw,TOKEN,{nowMs:NOW*1000,...opts});
function req(raw,origin=ORIGIN,method="POST") {
  const h={"X-Telegram-Init-Data":raw};
  if(origin!==null)h.Origin=origin;
  return new Request("https://healthy-women-bot.vercel.app/api/auth",{method,headers:h});
}

test("accepts fresh signed Telegram identity without exposing profile",async()=>{
 const result=await verify(signed());
 assert.deepEqual(result,{userId:123456789,authDate:NOW});
 assert.equal(JSON.stringify(result).includes("Fictional"),false);
});
test("accepts optional signature field when included in Telegram HMAC",async()=>{
 const result=await verify(signed({signature:"mock-third-party-field"}));
 assert.equal(result.userId,123456789);
});
test("tampered user and wrong bot token cannot authenticate",async()=>{
 const raw=signed();
 await assert.rejects(verify(raw.replace("123456789","222222222")));
 await assert.rejects(verifyTelegramInitData(raw,OTHER_TOKEN,{nowMs:NOW*1000}));
});
test("old and future auth_date are rejected",async()=>{
 await assert.rejects(verify(signed(),{nowMs:(NOW+3601)*1000}));
 await assert.rejects(verify(signed(),{nowMs:(NOW-61)*1000}));
 assert.equal((await verify(signed(),{nowMs:(NOW+3600)*1000})).userId,123456789);
});
test("duplicate hash, duplicate user, malformed and huge data are rejected",async()=>{
 await assert.rejects(verify(signed()+"&hash="+("0".repeat(64))));
 await assert.rejects(verify(signed()+"&user="+encodeURIComponent(user)));
 await assert.rejects(verify("hash=invalid&auth_date="+NOW+"&user=x"));
 await assert.rejects(verify("x".repeat(8193)));
 await assert.rejects(verify(signed({auth_date:"not-a-time"})));
});
test("even correctly signed malformed user identities are rejected",async()=>{
 for(const value of ["not-json",JSON.stringify({id:0}),JSON.stringify({id:4.3}),JSON.stringify({id:"1"})]){
   await assert.rejects(verify(signed({user:value})));
 }
});
test("auth endpoint refuses missing/invalid credentials with generic response",async()=>{
 const missing=await handleAuthRequest(req(""),{botToken:TOKEN,nowMs:NOW*1000});
 assert.equal(missing.status,401);
 assert.deepEqual(await missing.json(),{authenticated:false,error:"Unauthorized"});
 const absent=await handleAuthRequest(req(signed()),{nowMs:NOW*1000});
 assert.equal(absent.status,503);
 const badOrigin=await handleAuthRequest(req(signed(),"https://attacker.example"),{botToken:TOKEN,nowMs:NOW*1000});
 assert.equal(badOrigin.status,403);
 assert.equal(badOrigin.headers.get("access-control-allow-origin"),null);
});
test("auth endpoint verifies without returning any personal or medical data",async()=>{
 const response=await handleAuthRequest(req(signed()),{botToken:TOKEN,nowMs:NOW*1000});
 assert.equal(response.status,200);
 assert.equal(response.headers.get("access-control-allow-origin"),ORIGIN);
 assert.match(response.headers.get("cache-control"),/no-store/);
 const body=await response.json();
 assert.deepEqual(body,{authenticated:true,features:{cloudSync:false}});
 assert.equal(JSON.stringify(body).includes("123456789"),false);
 assert.equal(JSON.stringify(body).includes("Fictional"),false);
});
test("preflight rejects foreign websites and authorizes only required header",async()=>{
 const good=await handleAuthRequest(req("",ORIGIN,"OPTIONS"),{botToken:TOKEN});
 assert.equal(good.status,204);
 assert.equal(good.headers.get("access-control-allow-headers"),"X-Telegram-Init-Data");
 assert.equal(good.headers.get("access-control-allow-origin"),ORIGIN);
 const bad=await handleAuthRequest(req("","https://attacker.example","OPTIONS"),{botToken:TOKEN});
 assert.equal(bad.status,403);
 const noOrigin=await handleAuthRequest(req("",null,"OPTIONS"),{botToken:TOKEN});
 assert.equal(noOrigin.status,403);
});
test("GET and unexpected POST bodies are rejected",async()=>{
 const get=await handleAuthRequest(req("",ORIGIN,"GET"),{botToken:TOKEN});
 assert.equal(get.status,405);
 const post=new Request("https://healthy-women-bot.vercel.app/api/auth",{
   method:"POST",headers:{"Origin":ORIGIN,"X-Telegram-Init-Data":signed()},body:"sensitive-diary-not-allowed"
 });
 assert.equal((await handleAuthRequest(post,{botToken:TOKEN})).status,400);
});
