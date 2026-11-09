// Healthy Women: local data erasure marker coordinates multiple open tabs.
// This is a local device feature; it cannot erase previously downloaded exports.
import {removeAllJournalData} from "./local-crypto.mjs";
import {withJournalWriteLock} from "./journal-guard.mjs";
export const ERASE_EPOCH_KEY="healthywomen.erase-epoch.v1";
export const SYNC_PREF_KEY="healthywomen.sync-optin.v1";
export const PHASE_PREF_KEY="healthywomen.phase-prompts.v1";
export function readEraseEpoch(storage=globalThis.localStorage){
 return storage.getItem(ERASE_EPOCH_KEY);
}
export function assertEraseEpoch(storage,expected){
 if(readEraseEpoch(storage)!==expected)
  throw Error("Kundalik boshqa oynadan o‘chirilgan. Eski qayd yozilmadi; sahifani qayta oching.");
 return true;
}
export async function eraseLocalJournal({storage=globalThis.localStorage,locks=globalThis.navigator?.locks}={}){
 return withJournalWriteLock(()=>{
  const old=readEraseEpoch(storage);
  let marker=globalThis.crypto?.randomUUID?.();
  if(!marker||marker===old)marker=String(Date.now())+"-"+String(Math.random());
  // Announce erasure first, before clearing any user data. Old tabs now fail
  // revision checks rather than resurrecting erased records.
  storage.setItem(ERASE_EPOCH_KEY,marker);
  if(readEraseEpoch(storage)!==marker)throw Error("Qaydlarni o‘chirish belgisini yozib bo‘lmadi.");
  if(!removeAllJournalData(storage))throw Error("Mahalliy qaydlarni to‘liq o‘chirib bo‘lmadi.");
  storage.removeItem(SYNC_PREF_KEY);
  storage.removeItem(PHASE_PREF_KEY);
  if(storage.getItem(SYNC_PREF_KEY)!==null||storage.getItem(PHASE_PREF_KEY)!==null)
   throw Error("Mahalliy rozilik/sozlama yozuvlarini o‘chirib bo‘lmadi.");
  return {epoch:marker,erased:true};
 },locks);
}
