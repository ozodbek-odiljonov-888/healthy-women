// Healthy Women v1.9: NOT DEPLOYED, no HTTP route or persistent database.
// Reference storage contract for a future encrypted-only, authenticated sync.
// A real storage implementation MUST provide atomic compareAndSwap transactions.
import {verifyTelegramInitData} from "./telegram-auth.js";

const FORMAT="healthy-women-sync-v1";
const MAX_BYTES=1024*1024;
const FIELDS=["format","version","algorithm","kdf","iterations","salt","iv","ciphertext"];
const invalid=()=>new Error("Invalid opaque synchronization envelope");
function bytes64(value,expected=null){
 if(typeof value!=="string"||value.length<4||value.length>MAX_BYTES*2
    ||value.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))throw invalid();
 let binary;try{binary=atob(value);}catch{throw invalid();}
 if(expected!==null&&binary.length!==expected)throw invalid();
 return binary.length;
}
/** The server ONLY validates format and limits: it cannot decrypt content. */
export function validateOpaqueEnvelope(value){
 if(!value||typeof value!=="object"||Array.isArray(value)
   ||Object.keys(value).length!==FIELDS.length
   ||FIELDS.some(key=>!Object.hasOwn(value,key)))throw invalid();
 if(value.format!==FORMAT||value.version!==1||value.algorithm!=="AES-256-GCM"
   ||value.kdf!=="PBKDF2-SHA256"||value.iterations!==310000)throw invalid();
 bytes64(value.salt,16);bytes64(value.iv,12);
 const cipherLength=bytes64(value.ciphertext);
 if(cipherLength<16||cipherLength>MAX_BYTES+16)throw invalid();
 // Copy only known metadata. Rejecting extras prevents raw-event uploads.
 return Object.fromEntries(FIELDS.map(key=>[key,value[key]]));
}
function validRevision(value){
 return value===null||(typeof value==="string"&&/^[0-9a-f-]{36}$/.test(value));
}

/**
 * storage.read(accountId) => null or {revision,deleted,envelope?}
 * storage.compareAndSwap(accountId,expectedRevision,newRecord) => boolean
 *
 * compareAndSwap must run atomically across ALL app instances and compare
 * null for absence. Nonatomic map/get/put is NOT a supported production store.
 *
 * Caller MUST supply a server-side Telegram bot token, never a browser token.
 */
export function createOpaqueSyncProtocol({botToken,storage,nowMs=()=>Date.now()}={}){
 if(!botToken||typeof storage?.read!=="function"||typeof storage?.compareAndSwap!=="function")throw Error("Secure sync dependencies are not configured");
 async function identity(initData){
  const verified=await verifyTelegramInitData(initData,botToken,{nowMs:nowMs()});
  return verified.userId;
 }
 async function read(initData){
  const accountId=await identity(initData);
  const record=await storage.read(accountId);
  if(!record)return {status:"empty",revision:null};
  if(record.deleted)return {status:"erased",revision:record.revision};
  return {status:"present",revision:record.revision,envelope:validateOpaqueEnvelope(record.envelope)};
 }
 async function upload(initData,envelope,expectedRevision=null){
  const accountId=await identity(initData);
  if(!validRevision(expectedRevision))throw Error("Invalid revision");
  const clean=validateOpaqueEnvelope(envelope);
  const old=await storage.read(accountId);
  if(old?.deleted)return {status:"erased"};
  const revision=crypto.randomUUID();
  const ok=await storage.compareAndSwap(accountId,expectedRevision,{revision,deleted:false,envelope:clean});
  return ok?{status:"stored",revision}:{status:"conflict"};
 }
 async function erase(initData,expectedRevision=null){
  const accountId=await identity(initData);
  if(!validRevision(expectedRevision))throw Error("Invalid revision");
  const old=await storage.read(accountId);
  if(old?.deleted)return {status:"erased",revision:old.revision};
  const revision=crypto.randomUUID();
  const ok=await storage.compareAndSwap(accountId,expectedRevision,{revision,deleted:true});
  return ok?{status:"erased",revision}:{status:"conflict"};
 }
 return {read,upload,erase};
}
