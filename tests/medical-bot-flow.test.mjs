import test from "node:test";
import assert from "node:assert/strict";
import bot from "../bot-vercel/worker/index.js";

const ENV={BOT_TOKEN:"FICTIONAL_BOT_TOKEN",WEBHOOK_SECRET:"FICTIONAL_SECRET",APP_URL:"https://healthy-women.vercel.app/"};
const webhook="https://healthy-women-bot.example/webhook";

async function askThroughBot(t,text,{chatType="private",withSecret=true}={}){
 const sent=[];
 t.mock.method(globalThis,"fetch",async(_url,opts)=>{
  sent.push(JSON.parse(opts.body));
  return Response.json({ok:true,result:{message_id:101}});
 });
 const update={message:{chat:{id:901,type:chatType},text}};
 const request=new Request(webhook,{method:"POST",
  headers:{"Content-Type":"application/json",...(withSecret?{"X-Telegram-Bot-Api-Secret-Token":"FICTIONAL_SECRET"}:{})},
  body:JSON.stringify(update)
 });
 const response=await bot.fetch(request,ENV);
 return {response,sent};
}
test("ordinary direct question gets a one-topic medical answer without an AI API",async t=>{
 const {response,sent}=await askThroughBot(t,"Hayz sikli necha kun davom etadi?");
 assert.equal(response.status,200);
 assert.equal(sent.length,1);
 assert.match(sent[0].text,/Hayz sikli/);
 assert.match(sent[0].text,/Manba:/);
 assert.match(sent[0].text,/tashxis emas/i);
});
test("/ask works with Uzbek Cyrillic questions",async t=>{
 const {sent}=await askThroughBot(t,"/ask Ҳайз оғриғи қандай енгиллашади?");
 assert.equal(sent.length,1);
 assert.match(sent[0].text,/Hayz og‘rig‘i/);
 assert(sent[0].text.includes("nhs.uk"));
});
test("dangerous symptoms escalate instead of showing an ordinary menstrual article",async t=>{
 const {sent}=await askThroughBot(t,"Qon ko‘p ketmoqda, boshim aylanmoqda");
 assert.equal(sent.length,1);
 assert.match(sent[0].text,/shoshilinch/i);
 assert(!sent[0].text.startsWith("Ko‘p qon ketishi\n"));
});
test("unsupported medication questions abstain and do not invent prescriptions",async t=>{
 const {sent}=await askThroughBot(t,"Qaysi antibiotikni qancha ichsam?");
 assert.equal(sent.length,1);
 assert.match(sent[0].text,/ishonchli qisqa javob topilmadi/i);
});
test("unknown slash command retains menu help instead of treating it as health input",async t=>{
 const {sent}=await askThroughBot(t,"/unknowncommand");
 assert.equal(sent.length,1);
 assert.match(sent[0].text,/\/start/);
});
test("private Telegram medical FAQ rejects secretless webhook and group chats",async t=>{
 const {response,sent}=await askThroughBot(t,"Hayz og‘rig‘i",{withSecret:false});
 assert.equal(response.status,403);
 assert.equal(sent.length,0);
});
test("medical FAQ ignores nonprivate group messages",async t=>{
 const {response,sent}=await askThroughBot(t,"Hayz og‘rig‘i",{chatType:"group"});
 assert.equal(response.status,200);
 assert.equal(sent.length,0);
});
test("knowledge endpoint returns no topic articles on severe query",async()=>{
 const url=new URL("https://healthy-women-bot.example/api/knowledge");
 url.searchParams.set("q","Qon ketmoqda va hushdan ketdim");
 const res=await bot.fetch(new Request(url),{...ENV,ALLOWED_ORIGINS:"https://healthy-women.vercel.app"});
 assert.equal(res.status,200);
 const body=await res.json();
 assert.equal(body.urgent,true);
 assert.deepEqual(body.articles,[]);
});
