import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';
test('preview health endpoint is active',async()=>{
  const r=await worker.fetch(new Request('https://example.test/health'),{});
  assert.equal(r.status,200);assert.equal((await r.json()).health_data_collection,false);
});
test('webhook rejects requests without secret',async()=>{
  const r=await worker.fetch(new Request('https://example.test/webhook',{method:'POST',body:'{}'}),{WEBHOOK_SECRET:'private'});
  assert.equal(r.status,403);
});
test('FAQ gives sourced educational content',async()=>{
  const r=await worker.fetch(new Request('https://example.test/api/knowledge?q=ogriq'),{});
  const j=await r.json();assert.equal(r.status,200);assert(j.articles.length>0);assert(j.articles[0].url.startsWith('https://'));
});
test('health synchronization is closed',async()=>{
  const r=await worker.fetch(new Request('https://example.test/api/sync',{method:'POST',body:'{}'}),{});
  assert.equal(r.status,503);
});
test('start command provides useful interactive menu',async t=>{
 const sent=[];
 t.mock.method(globalThis,'fetch',async(url,opts)=>{sent.push(JSON.parse(opts.body));return new Response(JSON.stringify({ok:true,result:{message_id:1}}),{status:200});});
 const update={message:{chat:{type:'private',id:1234},text:'/start'}};
 const resp=await worker.fetch(new Request('https://example.test/webhook',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':'test_secret'},body:JSON.stringify(update)}),{WEBHOOK_SECRET:'test_secret',BOT_TOKEN:'TEST_TOKEN'});
 assert.equal(resp.status,200);assert.equal(sent.length,1);assert(sent[0].reply_markup.inline_keyboard.length>=3);
});
test('topic callback yields a sourced reply',async t=>{
 const sent=[];
 t.mock.method(globalThis,'fetch',async(url,opts)=>{sent.push(JSON.parse(opts.body));return new Response(JSON.stringify({ok:true,result:{message_id:1}}),{status:200});});
 const update={callback_query:{id:'cb123',data:'faq:ogriq',message:{chat:{type:'private',id:1234}}}};
 const resp=await worker.fetch(new Request('https://example.test/webhook',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':'test_secret'},body:JSON.stringify(update)}),{WEBHOOK_SECRET:'test_secret',BOT_TOKEN:'TEST_TOKEN'});
 assert.equal(resp.status,200);assert.equal(sent.length,2);assert(sent[1].text.includes('https://www.nhs.uk/'));
});
