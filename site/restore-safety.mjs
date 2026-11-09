// Healthy Women: loss-prevention guard for destructive encrypted backup imports.
import {encryptBackup,decryptBackup,validateBackupEvents} from "./vault.mjs";
export function canonicalJournal(events){
 return JSON.stringify(validateBackupEvents(events));
}
export function assertCurrentJournal(events,expectedSnapshot){
 if(canonicalJournal(events)!==expectedSnapshot)
  throw Error("Kundalik tiklashga tayyorlanayotgan paytda o‘zgargan. Avvalgi qaydlar saqlangan; qayta zaxira oling.");
 return true;
}
export async function createVerifiedRecoveryBackup(events,password){
 const canonical=canonicalJournal(events);
 if(JSON.parse(canonical).length===0)return {required:false,archive:null,snapshot:canonical};
 const archive=await encryptBackup(JSON.parse(canonical),password);
 const verification=await decryptBackup(archive,password);
 if(canonicalJournal(verification)!==canonical)
  throw Error("Tiklashdan oldingi zaxira tekshiruvi muvaffaqiyatsiz. Qaydlar almashtirilmadi.");
 return {required:true,archive,snapshot:canonical};
}
