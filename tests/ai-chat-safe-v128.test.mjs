import test from 'node:test';
import assert from 'node:assert/strict';
import {settlePendingAiReply} from '../site/ai-chat-safe.mjs';
import {readFileSync} from 'node:fs';
test('AI completion replaces only its own placeholder, leaving newer offline messages',()=>{
 const first={who:'user',text:'General'},pending={who:'bot',text:'Waiting'},newUser={who:'user',text:'New question'},newReply={who:'bot',text:'Local answer'};
 const old=[first,pending,newUser,newReply];
 const next=settlePendingAiReply(old,pending,{who:'bot',text:'AI result'});
 assert.equal(next[1].text,'AI result');assert.equal(next[3],newReply);
 assert.equal(old[1],pending);
});
test('a privacy erase never resurrects a pending AI result',()=>{
 const first={who:'bot',text:'Welcome'},pending={who:'bot',text:'Waiting'};
 const erased=[first];
 assert.equal(settlePendingAiReply(erased,pending,{who:'bot',text:'PRIVATE'}),erased);
});
test('AI state is cancelled on vault lock and delete',()=>{
 const s=readFileSync(new URL('../site/app.mjs',import.meta.url),'utf8');
 assert(s.includes('if(requestEpoch!==aiRequestEpoch)return;'));
 assert(s.includes('aiRequestEpoch++;aiBusy=false;chatMessages=chatMessages.slice(0,1)'));
 assert(s.includes('settlePendingAiReply(chatMessages,placeholder'));
});
