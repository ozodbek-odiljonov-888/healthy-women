// Healthy Women: protect against stale tabs recreating plaintext after encryption.
// No merging or deletion happens without a verified encrypted journal and user intent.
import {validateBackupEvents} from "./vault.mjs";
import {LEGACY_EVENTS_KEY,unlockEncryptedJournal,writeEncryptedJournal} from "./local-crypto.mjs";
export function inspectLegacy(storage,encryptedEvents){
 const raw=storage.getItem(LEGACY_EVENTS_KEY);
 if(raw===null)return {state:"none",raw:null,count:0,legacy:null};
 let legacy;
 try{legacy=validateBackupEvents(JSON.parse(raw));}
 catch{return {state:"invalid",raw,count:0,legacy:null};}
 const secured=validateBackupEvents(encryptedEvents);
 if(JSON.stringify(legacy)===JSON.stringify(secured))
  return {state:"same",raw,count:legacy.length,legacy};
 return {state:"different",raw,count:legacy.length,legacy};
}
export function combineNonConflicting(encryptedEvents,legacyEvents){
 const secured=validateBackupEvents(encryptedEvents),legacy=validateBackupEvents(legacyEvents);
 const known=new Map(secured.map(entry=>[entry.id,entry]));
 const merged=[...secured];
 for(const entry of legacy){
  const original=known.get(entry.id);
  if(original){
   if(JSON.stringify(original)!==JSON.stringify(entry))
    throw Error("Ikkala nusxada bitta qayd turlicha o‘zgargan. Avval ochiq nusxani saqlang; avtomatik birlashtirish bloklandi.");
  }else{merged.push(entry);known.set(entry.id,entry);}
 }
 return validateBackupEvents(merged);
}
export function dropLegacyIfUnchanged(storage,expectedRaw){
 if(expectedRaw===null)return true;
 if(storage.getItem(LEGACY_EVENTS_KEY)!==expectedRaw)
  throw Error("Ochiq kundalik boshqa oynada o‘zgardi. Qayta tekshiring.");
 storage.removeItem(LEGACY_EVENTS_KEY);
 if(storage.getItem(LEGACY_EVENTS_KEY)!==null)
  throw Error("Eski nusxani o‘chirib bo‘lmadi; qurilma saqlash xotirasini tekshiring.");
 return true;
}
export async function mergeLegacySafely({storage,encryptedEvents,legacy,raw,session,password}){
 if(raw===null||storage.getItem(LEGACY_EVENTS_KEY)!==raw)
  throw Error("Ochiq kundalik boshqa oynada o‘zgardi. Yangi zaxira oling.");
 const combined=combineNonConflicting(encryptedEvents,legacy);
 // The encrypted store is written FIRST. A successful fresh decrypt verifies the result.
 if(JSON.stringify(combined)!==JSON.stringify(validateBackupEvents(encryptedEvents)))
  await writeEncryptedJournal(combined,session,storage);
 const fresh=await unlockEncryptedJournal(password,storage);
 if(JSON.stringify(fresh.events)!==JSON.stringify(combined))
  throw Error("Birlashtirilgan shifrlangan nusxani tasdiqlab bo‘lmadi.");
 dropLegacyIfUnchanged(storage,raw);
 return {events:combined,session:fresh.session};
}
