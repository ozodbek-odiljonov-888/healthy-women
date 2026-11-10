// Healthy Women v1.9 — proof-of-concept encrypted cloud snapshot format.
// This module does not upload or persist data. Never send the passphrase to a server.
import {validateBackupEvents} from "./vault.mjs";

export const SYNC_FORMAT="healthy-women-sync-v1";
export const SYNC_MAX_PLAINTEXT_BYTES=1024*1024;
const ROUNDS=310000, VERSION=1;
const ENCODER=new TextEncoder();
const DECODER=new TextDecoder("utf-8",{fatal:true});
const FIELDS=["format","version","algorithm","kdf","iterations","salt","iv","ciphertext"];
const bad=()=>new Error("Shifrlangan sinxronlash ma’lumoti noto‘g‘ri yoki buzilgan.");
function account(value){
 if(!Number.isSafeInteger(value)||value<=0)throw bad();
 return value;
}
function passphrase(value){
 if(typeof value!=="string"||value.length<16||value.length>256)throw Error("Sinxronlash paroli 16–256 belgidan iborat bo‘lishi kerak.");
 return value;
}
function webCrypto(){
 const provider=globalThis.crypto;
 if(!provider?.subtle||!provider?.getRandomValues)throw Error("Xavfsiz Web Crypto mavjud emas; HTTPS yoki qurilmani tekshiring.");
 return provider;
}
function to64(bytes){
 let out="";
 for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(out);
}
function from64(input,requiredLength=null){
 if(typeof input!=="string"||input.length===0||input.length>SYNC_MAX_PLAINTEXT_BYTES*2
    ||input.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(input))throw bad();
 let bytes;
 try{bytes=Uint8Array.from(atob(input),c=>c.charCodeAt(0));}catch{throw bad();}
 if(requiredLength!==null&&bytes.length!==requiredLength)throw bad();
 return bytes;
}
function aad(id){
 return ENCODER.encode("Healthy Women | account-bound encrypted sync v1 | "+account(id));
}
async function deriveKey(secret,salt){
 const subtle=webCrypto().subtle;
 const material=await subtle.importKey("raw",ENCODER.encode(passphrase(secret)),"PBKDF2",false,["deriveKey"]);
 return subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",iterations:ROUNDS,salt},
   material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
/**
 * Parse/validate an opaque, versioned envelope; rejecting extra fields ensures
 * no plaintext health values are accidentally accepted by a future server.
 */
export function parseSyncEnvelope(value){
 let envelope=value;
 if(typeof value==="string"){
  if(value.length>SYNC_MAX_PLAINTEXT_BYTES*2)throw bad();
  try{envelope=JSON.parse(value);}catch{throw bad();}
 }
 if(!envelope||typeof envelope!=="object"||Array.isArray(envelope)
   ||Object.keys(envelope).length!==FIELDS.length
   ||FIELDS.some(k=>!Object.hasOwn(envelope,k)))throw bad();
 if(envelope.format!==SYNC_FORMAT||envelope.version!==VERSION
    ||envelope.algorithm!=="AES-256-GCM"||envelope.kdf!=="PBKDF2-SHA256"
    ||envelope.iterations!==ROUNDS)throw bad();
 const salt=from64(envelope.salt,16),iv=from64(envelope.iv,12);
 const ciphertext=from64(envelope.ciphertext);
 if(ciphertext.length<16||ciphertext.length>SYNC_MAX_PLAINTEXT_BYTES+16)throw bad();
 // Normalize representation; do not preserve arbitrary object prototypes or fields.
 return {format:SYNC_FORMAT,version:VERSION,algorithm:"AES-256-GCM",
   kdf:"PBKDF2-SHA256",iterations:ROUNDS,
   salt:to64(salt),iv:to64(iv),ciphertext:to64(ciphertext)};
}
/**
 * Encrypt validated diary events locally with a NEW salt and AES-GCM nonce on
 * each snapshot. The Telegram identity is AAD, not an encryption secret.
 * Credential verification must happen independently on the server.
 */
export async function encryptSyncSnapshot(events,secret,verifiedAccountId){
 const id=account(verifiedAccountId);
 const clean=validateBackupEvents(events);
 const data=ENCODER.encode(JSON.stringify({format:SYNC_FORMAT,events:clean}));
 if(data.length>SYNC_MAX_PLAINTEXT_BYTES)throw Error("Sinxronlash uchun ma’lumotlar hajmi juda katta.");
 const provider=webCrypto();
 const salt=provider.getRandomValues(new Uint8Array(16));
 const iv=provider.getRandomValues(new Uint8Array(12));
 const key=await deriveKey(secret,salt);
 const ciphertext=new Uint8Array(await provider.subtle.encrypt(
   {name:"AES-GCM",iv,additionalData:aad(id),tagLength:128},key,data));
 return parseSyncEnvelope({format:SYNC_FORMAT,version:VERSION,
  algorithm:"AES-256-GCM",kdf:"PBKDF2-SHA256",iterations:ROUNDS,
  salt:to64(salt),iv:to64(iv),ciphertext:to64(ciphertext)});
}
/** Decrypt only inside the authorized account's client, then validate records. */
export async function decryptSyncSnapshot(envelope,secret,verifiedAccountId){
 const id=account(verifiedAccountId);
 const record=parseSyncEnvelope(envelope);
 const salt=from64(record.salt,16),iv=from64(record.iv,12);
 const key=await deriveKey(secret,salt);
 let decoded;
 try {
  const bytes=await webCrypto().subtle.decrypt(
    {name:"AES-GCM",iv,additionalData:aad(id),tagLength:128},
    key,from64(record.ciphertext));
  decoded=JSON.parse(DECODER.decode(bytes));
 }catch{throw bad();}
 if(decoded?.format!==SYNC_FORMAT)throw bad();
 try{return validateBackupEvents(decoded.events);}catch{throw bad();}
}
