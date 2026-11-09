// Privacy-preserving selection for unencrypted, user-triggered TXT/CSV exports.
// The full original journal is not mutated. A period overlapping the cutoff is
// retained intact so a clinically meaningful start/end pair is not truncated.
const DAY_MS=86_400_000;
const ALLOWED=new Set(['90','180','365','all']);
function dateMs(iso){
 if(typeof iso!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return null;
 const ms=Date.parse(iso+'T12:00:00Z');
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===iso?ms:null;
}
export function exportRangeLabel(scope){
 const s=String(scope);
 return ({'90':'Oxirgi 90 kun','180':'Oxirgi 180 kun','365':'Oxirgi 365 kun','all':'Barcha qaydlar'})[s]||'Oxirgi 180 kun';
}
export function selectExportEvents(events,today,scope='180'){
 const now=dateMs(today),key=String(scope);
 if(now===null)throw Error('Eksport uchun sana noto‘g‘ri.');
 if(!ALLOWED.has(key))throw Error('Eksport davri noto‘g‘ri.');
 if(!Array.isArray(events))throw Error('Kundalik yozuvlari noto‘g‘ri.');
 const cutoff=key==='all'?null:now-(Number(key)-1)*DAY_MS;
 return events.filter(event=>{
  if(!event||event.deleted||!['period','checkin'].includes(event.type)||!event.payload)return false;
  const entry=event.payload;
  if(event.type==='checkin'){
   const at=dateMs(entry.date);
   return at!==null&&at<=now&&(cutoff===null||at>=cutoff);
  }
  const start=dateMs(entry.start),end=entry.end?dateMs(entry.end):null;
  if(start===null||start>now||entry.end&&end===null||end!==null&&(end<start||end>now))return false;
  const last=end??start;
  return cutoff===null||last>=cutoff;
 });
}
export function plaintextExportWarning(kind,scope){
 if(!['txt','csv'].includes(kind))throw Error('Noma’lum eksport turi.');
 const name=kind==='csv'?'CSV jadval':'TXT hisobot';
 return exportRangeLabel(scope)+' bo‘yicha '+name+' yuklab olinadi.\n\n⚠ Fayl SHIFRLANMAYDI va hayz sanalari, alomatlar yoki shaxsiy qaydlarni saqlashi mumkin. Uni umumiy kompyuter, chat yoki bulutga joylamang.\n\nDavom etib, faylni qurilmangizga saqlaysizmi?';
}
