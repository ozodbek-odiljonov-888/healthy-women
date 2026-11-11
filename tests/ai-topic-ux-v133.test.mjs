import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AI_TOPIC_LABELS,REMOTE_AI_TOPICS,pickAiTopic,resolveAiTopic} from '../site/ai-client.mjs';
const root=new URL('../site/',import.meta.url);
const app=readFileSync(new URL('app.mjs',root),'utf8');
const style=readFileSync(new URL('style.css',root),'utf8');
test('every server topic is visibly selectable without inventing a diagnosis',()=>{
 assert.deepEqual(new Set(Object.keys(AI_TOPIC_LABELS)),REMOTE_AI_TOPICS);
 for(const label of Object.values(AI_TOPIC_LABELS))assert(label.length>=4);
 assert(app.includes('id="aiTopicSelect"'));
 assert(app.includes('Object.entries(AI_TOPIC_LABELS)'));
 assert(style.includes('#aiTopicSelect:focus-visible'));
});
test('reproduced unclassified question resolves with explicit selection, never random inference',()=>{
 for(const question of ['Salom','Menga yordam bering','Alo?','Shaxsiy parolim 123456']){
   assert.equal(pickAiTopic(question),null);
   assert.equal(resolveAiTopic({question,selected:null}),null);
   assert.equal(resolveAiTopic({question,selected:'pain'}),'pain');
 }
 assert.equal(resolveAiTopic({question:'Hayz og‘rig‘i qattiq',selected:null}),'pain');
 assert.equal(resolveAiTopic({question:'Salom',selected:'inject:own-prompt'}),null);
});
test('assistant retains previously entered text and topic after offline rerender',()=>{
 assert(app.includes('value="${escapeHTML(assistantDraft)}"'));
 assert(app.includes('assistantDraft=q;const detected=pickAiTopic(q)'));
 assert(app.includes('selectedAiTopic||lastAiPublicTopic'));
 assert(app.includes("const topic=resolveAiTopic({question:q||assistantDraft,selected:selectedAiTopic||lastAiPublicTopic})"));
});
test('unmatched question prompts a topic selection without repeated chat error bubbles',()=>{
 assert(app.includes("$('#aiTopicSelect')?.focus()"));
 assert(app.includes('id="aiTopicHint"'));
 assert(!app.includes('Bu savolni umumiy mavzuga xavfsiz bog‘lab bo‘lmadi. Faqat offline javob mavjud.'));
 assert(app.includes('Shaxsiy matni serverga yuborilmaydi') || app.includes('shaxsiy matni serverga yuborilmaydi'));
});
test('the app continues to submit only a fixed topic and informed consent',()=>{
 const client=readFileSync(new URL('ai-client.mjs',root),'utf8');
 assert(client.includes('JSON.stringify({topic,consent:true})'));
 assert(!client.includes('JSON.stringify({question'));
 assert(app.includes('aiConsentChecked'));
});
