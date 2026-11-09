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