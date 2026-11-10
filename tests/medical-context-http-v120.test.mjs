// Only fictional requests. Both HTTP interfaces must use identical safety decisions.
import test from "node:test";
import assert from "node:assert/strict";
import bot from "../bot-vercel/worker/index.js";
const ENV={
 BOT_TOKEN:"FICTIONAL_TEST_BOT_TOKEN",WEBHOOK_SECRET:"FICTIONAL_WEBHOOK_SECRET",
 ALLOWED_ORIGINS:"https://fictional-staging.example"
};
async function telegramQuestion(t,text){
 const sent=[];
 t.mock.method(globalThis,"fetch",async(_url,options)=>{
  sent.push(JSON.parse(options.body));
  return Response.json({ok:true,result:{message_id:1}});
 });
 const req=new Request("https://bot-staging.example/webhook",{
  method:"POST",headers:{
   "Content-Type":"application/json",
   "X-Telegram-Bot-Api-Secret-Token":ENV.WEBHOOK_SECRET
  },body:JSON.stringify({message:{chat:{id:101,type:"private"},text}})
 });
 const result=await bot.fetch(req,ENV);
 assert.equal(result.status,200);
 assert.equal(sent.length,1);
 return sent[0].text;
}
async function knowledge(question){
 const url=new URL("https://bot-staging.example/api/knowledge");
 url.searchParams.set("q",question);
 const res=await bot.fetch(new Request(url,{headers:{Origin:"https://fictional-staging.example"}}),ENV);
 assert.equal(res.status,200);
 return res.json();
}
test("Telegram refuses third-party individualized conclusion and keeps educational sources available",async t=>{
 const reply=await telegramQuestion(t,"Opamda hayz og‘rig‘i bor, nima qilsin?");
 assert.match(reply,/boshqa bir odamning holatiga/i);
 assert.match(reply,/shaxsiy ma’lumotlarsiz/i);
 assert(!reply.includes("Iliq kompress"),"No direct individual care claim");
});
test("Telegram sends an emergency warning for a relative, never a routine FAQ",async t=>{
 const reply=await telegramQuestion(t,"Opam homilador. Qon ketmoqda va yelka uchim og‘riyapti.");
 assert.match(reply,/shoshilinch/i);
 assert.match(reply,/boshqa odam/i);
 assert.match(reply,/Manba:/);
});
test("knowledge GET no longer bypasses third-party and multiple-person clarification",async()=>{
 const third=await knowledge("Opamda hayz og‘rig‘i bor, nima qilsin?");
 assert.deepEqual(third.articles,[]);
 assert.equal(third.urgent,false);
 assert.match(third.clarification,/boshqa bir odamning holatiga/i);
 const mixed=await knowledge("Men hayzimni, opam esa PCOSni so‘rayapti");
 assert.deepEqual(mixed.articles,[]);
 assert.match(mixed.clarification,/bir nechta odam/i);
});
test("knowledge GET still supplies a sourced ordinary article",async()=>{
 const answer=await knowledge("Hayz sikli nima?");
 assert.equal(answer.urgent,false);
 assert.equal(answer.clarification,null);
 assert.equal(answer.articles.length,1);
 assert.equal(answer.articles[0].key,"sikl");
});
test("knowledge GET keeps urgent content out of article results",async()=>{
 const answer=await knowledge("Onamda menopauzadan keyin qon kelmoqda");
 assert.equal(answer.urgent,true);
 assert.deepEqual(answer.articles,[]);
 assert.match(answer.warning,/shifokor/i);
 assert.equal(answer.clarification,null);
});
