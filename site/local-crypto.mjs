// Healthy Women: optional passphrase-protected on-device journal storage.
// Security scope: encrypts the JSON in localStorage. It cannot make a compromised
// device or previously created plaintext backups private.
import {validateBackupEvents} from "./vault.mjs";

export const LOCAL_VAULT_KEY="healthywomen.encrypted-local.v1";
export const LEGACY_EVENTS_KEY="healthywomen.events.v1";
const FORMAT="healthy-women-local-v1",ROUNDS=310000;
const encoder=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
const AAD=encoder.encode("Healthy Women | private local diary v1");
const BOUND=1024*1024;
function bytes64(bytes){
 let out="";for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(out);
}
function read64(input,size){
 if(typeof input!=="string"||input.length>BOUND*2||input.length%4!==0||!/^[a-zA-Z0-9+/]*={0,2}$/.test(input))throw Error("Buzilgan shifrlangan qayd.");
 let out;try{out=Uint8Array.from(atob(input),x=>x.charCodeAt(0));}catch{throw Error("Buzilgan shifrlangan qayd.");}
 if(size!==undefined&&out.length!==size)throw Error("Buzilgan shifrlangan qayd.");
 return out;
}
const passwordValid=p=>typeof p==="string"&&p.length>=12&&p.length<=256;
function parseRecord(text){
 if(typeof text!=="string"||text.length>BOUND*2)throw Error("Shifrlangan qayd buzilgan.");
 let o;try{o=JSON.parse(text);}catch{throw Error("Shifrlangan qayd buzilgan.");}
 if(!o||o.format!==FORMAT||o.iterations!==ROUNDS||o.kdf!=="PBKDF2-SHA256"||
    o.algorithm!=="AES-256-GCM"||o.version!==1)throw Error("Shifrlangan qaydning formati mos emas.");
 const salt=read64(o.salt,16),iv=read64(o.iv,12),cipher=read64(o.ciphertext);
 if(cipher.length<16||cipher.length>BOUND+16)throw Error("Shifrlangan qayd buzilgan.");
 return {record:o,salt,iv,cipher};
}
function cryptoApi(){
 const subtle=globalThis.crypto?.subtle;
 if(!subtle||!globalThis.crypto?.getRandomValues)throw Error("Qurilma HTTPS yoki xavfsiz kriptografiyani qo‘llamaydi.");
 return subtle;
}
async function derive(p,salt){
 if(!passwordValid(p))throw Error("Parol kamida 12 va ko‘pi bilan 256 belgidan iborat bo‘lsin.");
 const subtle=cryptoApi();
 const material=await subtle.importKey("raw",encoder.encode(p),"PBKDF2",false,["deriveKey"]);
 return subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt,iterations:ROUNDS},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function encodeEvents(events) {
 const clean=validateBackupEvents(events);
 const data=encoder.encode(JSON.stringify({format:FORMAT,events:clean}));
 if(data.byteLength>BOUND)throw Error("Qaydlar hajmi oshib ketdi.");
 return data;
}
function encryptedRecord(bytes,key,salt){
 return (async()=>{
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=new Uint8Array(await cryptoApi().encrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,bytes));
  return JSON.stringify({format:FORMAT,version:1,algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",iterations:ROUNDS,salt:bytes64(salt),iv:bytes64(iv),ciphertext:bytes64(cipher)});
 })();
}
async function decryptedRecord(raw,key) {
 const {iv,cipher}=parseRecord(raw);
 let parsed;
 try {
  const bytes=await cryptoApi().decrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,cipher);
  parsed=JSON.parse(decoder.decode(bytes));
 }catch{throw Error("Parol noto‘g‘ri yoki shifrlangan qayd buzilgan.");}
 if(parsed?.format!==FORMAT)throw Error("Qaydlar formati mos emas.");
 return validateBackupEvents(parsed.events);
}
export function hasEncryptedJournal(storage=globalThis.localStorage){
 return storage?.getItem(LOCAL_VAULT_KEY)!==null;
}
// New installs AND old installs with an empty legacy diary must encrypt
// before the first medical record. A nonempty or damaged legacy journal is
// preserved for deliberate, user-consented migration or safe recovery.
export function needsEncryptedJournalSetup(storage=globalThis.localStorage){
 if(hasEncryptedJournal(storage))return false;
 const raw=storage.getItem(LEGACY_EVENTS_KEY);
 if(raw===null)return true;
 // Parsing huge or corrupt legacy data to determine emptiness is unsafe.
 // Such data must remain untouched and should be handled by recovery UI.
 if(raw.length>BOUND*2)return false;
 try{return validateBackupEvents(JSON.parse(raw)).length===0;}
 catch{return false;}
}
export function readPlainJournal(storage=globalThis.localStorage) {
 try {
  const data=JSON.parse(storage.getItem(LEGACY_EVENTS_KEY)||"[]");
  return validateBackupEvents(data);
 }catch{throw Error("Eski kundalikni o‘qib bo‘lmadi. Avval fayllaringizni zaxiralang.");}
}
export async function unlockEncryptedJournal(password,storage=globalThis.localStorage) {
 const source=storage.getItem(LOCAL_VAULT_KEY);
 if(!source)throw Error("Shifrlangan kundalik topilmadi.");
 const parsed=parseRecord(source);
 const key=await derive(password,parsed.salt);
 const events=await decryptedRecord(source,key);
 return {session:{key,salt:parsed.salt,lastRecord:source},events};
}
export async function writeEncryptedJournal(events,session,storage=globalThis.localStorage){
 if(!session?.key||!(session.salt instanceof Uint8Array)||session.salt.length!==16)throw Error("Qulf ochilmagan.");
 const source=storage.getItem(LOCAL_VAULT_KEY);
 if(!source)throw Error("Shifrlangan kundalik topilmadi.");
 const saved=parseRecord(source);
 if(bytes64(saved.salt)!==bytes64(session.salt)||source!==session.lastRecord)throw Error("Kundalik boshqa oynada o‘zgartirilgan. Qaytadan qulfni oching.");
 const bytes=encodeEvents(events),next=await encryptedRecord(bytes,session.key,session.salt);
 if(storage.getItem(LOCAL_VAULT_KEY)!==source)throw Error("Kundalik boshqa oynada o‘zgartirilgan. Qaytadan qulfni oching.");
 storage.setItem(LOCAL_VAULT_KEY,next);
 session.lastRecord=next;
 return true;
}
export async function migratePlainJournal(password,storage=globalThis.localStorage){
 if(hasEncryptedJournal(storage))throw Error("Shifrlangan kundalik allaqachon mavjud.");
 const legacyRevision=storage.getItem(LEGACY_EVENTS_KEY);
 const plain=readPlainJournal(storage),bytes=encodeEvents(plain);
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await derive(password,salt);
 const record=await encryptedRecord(bytes,key,salt);
 if(storage.getItem(LEGACY_EVENTS_KEY)!==legacyRevision||hasEncryptedJournal(storage))
  throw Error("Eski qaydlar boshqa oynada yangilandi. Ko‘chirishni qaytadan boshlang.");
 // Write and verify ciphertext BEFORE deleting anything. If verification fails,
 // the old, readable data remains available.
 storage.setItem(LOCAL_VAULT_KEY,record);
 try{
  const verified=await decryptedRecord(storage.getItem(LOCAL_VAULT_KEY),key);
  if(JSON.stringify(verified)!==JSON.stringify(plain))throw Error("Ko‘chirishni tekshirish muvaffaqiyatsiz.");
 }catch(err){
  storage.removeItem(LOCAL_VAULT_KEY);
  throw err;
 }
 try {
  if(storage.getItem(LEGACY_EVENTS_KEY)!==legacyRevision){
   if(storage.getItem(LOCAL_VAULT_KEY)===record)storage.removeItem(LOCAL_VAULT_KEY);
   throw Error("Eski yozuvlar boshqa oynada o‘zgargan, ochiq nusxa saqlab qolindi.");
  }
  storage.removeItem(LEGACY_EVENTS_KEY);
  if(storage.getItem(LEGACY_EVENTS_KEY)!==null)throw Error("Eski shifrlanmagan nusxani o‘chirib bo‘lmadi.");
 }catch {
  // Leave ciphertext (verified) and legacy records; do not claim cleanup.
  throw Error("Shifrlangan nusxa yaratildi, lekin eski ochiq qaydlar ham qolgan. Qayta tekshirish kerak.");
 }
 return {session:{key,salt,lastRecord:record},events:plain};
}
// Rotate the on-device encryption key, never storing either passphrase.
// Caller must take and verify an independent old-password backup before invoking.
export async function rotateEncryptedJournalPassword(oldPassword,newPassword,expectedSource,storage=globalThis.localStorage){
 if(!passwordValid(newPassword)||!passwordValid(oldPassword))
  throw Error("Yangi va eski parollar 12–256 belgidan iborat bo‘lsin.");
 if(oldPassword===newPassword)throw Error("Yangi parol eskisidan farq qilishi kerak.");
 const source=storage.getItem(LOCAL_VAULT_KEY);
 if(!source)throw Error("Shifrlangan kundalik topilmadi.");
 if(typeof expectedSource!=="string"||source!==expectedSource)
  throw Error("Kundalik zaxira olinganidan keyin o‘zgargan. Zaxirani yangidan yarating.");
 if(storage.getItem(LEGACY_EVENTS_KEY)!==null)
  throw Error("Eski ochiq nusxa topildi. Avval uni saqlang va ziddiyatni hal qiling.");
 const old=await unlockEncryptedJournal(oldPassword,storage);
 const salt=cryptoApi()&&crypto.getRandomValues(new Uint8Array(16));
 const key=await derive(newPassword,salt);
 const next=await encryptedRecord(encodeEvents(old.events),key,salt);
 const verified=await decryptedRecord(next,key);
 if(JSON.stringify(verified)!==JSON.stringify(old.events))
  throw Error("Yangi shifrlangan nusxani tekshirib bo‘lmadi. Eski nusxa saqlandi.");
 if(storage.getItem(LOCAL_VAULT_KEY)!==source)
  throw Error("Kundalik boshqa oynada o‘zgardi. Eski parol bilan qayta oching.");
 storage.setItem(LOCAL_VAULT_KEY,next);
 if(storage.getItem(LOCAL_VAULT_KEY)!==next)
  throw Error("Shifrlangan nusxani saqlash tasdiqlanmadi.");
 const fresh=await unlockEncryptedJournal(newPassword,storage);
 if(JSON.stringify(fresh.events)!==JSON.stringify(old.events))
  throw Error("Yangi parolni tekshirishda xatolik. Zaxira nusxasini saqlang.");
 return fresh;
}

export function removeAllJournalData(storage=globalThis.localStorage){
 storage.removeItem(LOCAL_VAULT_KEY);
 storage.removeItem(LEGACY_EVENTS_KEY);
 return storage.getItem(LOCAL_VAULT_KEY)===null&&storage.getItem(LEGACY_EVENTS_KEY)===null;
}
