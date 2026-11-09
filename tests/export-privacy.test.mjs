import test from 'node:test';
import assert from 'node:assert/strict';
import {selectExportEvents,exportRangeLabel,plaintextExportWarning} from '../site/export-privacy.mjs';
const now='2026-11-10';
const period=(id,start,end=null)=>({id,type:'period',payload:{start,end},deleted:0});
const diary=(id,date)=>({id,type:'checkin',payload:{date},deleted:0});
test('supported report windows',()=>{
 assert.equal(exportRangeLabel('90'),'Oxirgi 90 kun');
 assert.equal(exportRangeLabel('180'),'Oxirgi 180 kun');
 assert.equal(exportRangeLabel('365'),'Oxirgi 365 kun');
 assert.equal(exportRangeLabel('all'),'Barcha qaydlar');
});
test('90-day window first day inclusive',()=>{
 const first=new Date(Date.parse(now+'T12:00:00Z')-89*86400000).toISOString().slice(0,10);
 const prior=new Date(Date.parse(first+'T12:00:00Z')-86400000).toISOString().slice(0,10);
 assert.deepEqual(selectExportEvents([diary('yes',first),diary('no',prior)],now,'90').map(x=>x.id),['yes']);
});
test('period crossing cutoff retains its actual start date',()=>{
 const data=[period('cross','2026-05-01','2026-11-02'),period('old','2025-01-01','2025-01-03'),period('recent','2026-11-08','2026-11-10')];
 assert.deepEqual(selectExportEvents(data,now,'90').map(x=>x.id),['cross','recent']);
});
test('exclude future, invalid, deleted, unexpected event types',()=>{
 const rows=[diary('yes',now),diary('future','2026-11-11'),diary('bad','2026-02-30'),period('future-end','2026-11-08','2026-12-01'),{...diary('deleted',now),deleted:1},{id:'x',type:'other',payload:{date:now}}];
 assert.deepEqual(selectExportEvents(rows,now,'all').map(x=>x.id),['yes']);
});
test('reversed or future periods excluded',()=>{
 assert.equal(selectExportEvents([period('future','2026-11-11'),period('reverse','2026-11-10','2026-11-09')],now,'all').length,0);
});
test('journal is not mutated and invalid ranges are refused',()=>{
 const rows=[diary('id',now)],original=JSON.stringify(rows);
 assert.deepEqual(selectExportEvents(rows,now,'180').map(x=>x.id),['id']);
 assert.equal(JSON.stringify(rows),original);
 assert.throws(()=>selectExportEvents(rows,now,'invalid'));
 assert.throws(()=>selectExportEvents(rows,'bad','90'));
 assert.throws(()=>selectExportEvents({},now,'90'));
});
test('TXT and CSV disclosure explicitly warns against plaintext',()=>{
 for(const kind of ['csv','txt']){
  const warning=plaintextExportWarning(kind,'180');
  assert.match(warning,/SHIFRLANMAYDI/);
  assert.match(warning,/180 kun/);
  assert.match(warning,/saqlaysizmi/);
 }
 assert.throws(()=>plaintextExportWarning('pdf','180'));
});
