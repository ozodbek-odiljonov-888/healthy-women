// Healthy Women — optimistic revision checks for local journal integrity.
// Web Locks serialize cooperating same-origin tabs; revision checks also help
// when the Web Locks API is unavailable. This is not a cross-device sync lock.
export const JOURNAL_LOCK_NAME="healthy-women-journal-write-v1";
export function readJournalSnapshot(storage,key){
 const revision=storage.getItem(key);
 try{
  const events=JSON.parse(revision===null?"[]":revision);
  if(!Array.isArray(events))throw Error("Journal must be a list");
  return {revision,events,valid:true};
 }catch{
  return {revision,events:[],valid:false};
 }
}
export function assertJournalRevision(storage,key,expected){
 if(storage.getItem(key)!==expected){
  throw Error("Qaydlar boshqa oynada o‘zgardi. Sahifani yangilang va qayta urinib ko‘ring.");
 }
}
export async function withJournalWriteLock(fn,locks=globalThis.navigator?.locks){
 if(typeof fn!=="function")throw TypeError("Journal mutation callback required");
 if(typeof locks?.request==="function"){
  return locks.request(JOURNAL_LOCK_NAME,{mode:"exclusive"},fn);
 }
 return fn();
}
