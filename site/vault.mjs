// Healthy Women: passphrase-protected OFFLINE backup file, not local database encryption.
// PBKDF2-SHA256 -> AES-256-GCM using native Web Crypto, no third-party crypto library.
const FORMAT="healthy-women-encrypted-backup";
const VERSION=1;
const ITERATIONS=310000;
const LIMIT=1024*1024; // one MiB max source and ciphertext
const MAX_EVENTS=3000;
const AAD=new TextEncoder().encode("Healthy Women | Encrypted Backup v1");
const encoder=new TextEncoder();
const decoder=new TextDecoder("utf-8",{fatal:true});
const FLOW=new Set(["none","light","normal","heavy","very-heavy"]);
const MOOD=new Set(["good","neutral","low","anxious"]);
const PHASE=new Set(["start","end","end-followup","middle"]);
const dateValid=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T12:00:00Z"))&&new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;
const bytesTo64=bytes=>{
  let binary="";
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
};
function from64(s,expectedLength) {
  if(typeof s!=="string"||s.length>LIMIT*2||!new RegExp("^[A-Za-z0-9+/]*={0,2}$").test(s)||s.length%4!==0)throw Error("Invalid encrypted file");
  let bytes;
  try{bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch{throw Error("Invalid encrypted file");}
  if(expectedLength!==undefined&&bytes.length!==expectedLength)throw Error("Invalid encrypted file");
  return bytes;
}
function sanitizeEvent(entry) {
  if(!entry||typeof entry!=="object"||Array.isArray(entry)||typeof entry.id!=="string"||entry.id.length<1||entry.id.length>90||
     !Number.isSafeInteger(entry.updated_at)||entry.updated_at<0||entry.updated_at>Number.MAX_SAFE_INTEGER||
     !["period","checkin"].includes(entry.type)||!entry.payload||typeof entry.payload!=="object"||Array.isArray(entry.payload)) throw Error("Invalid event");
  const payload=entry.payload;
  const deleted=entry.deleted?1:0;
  if(deleted)return {id:entry.id,type:entry.type,payload:{},updated_at:entry.updated_at,deleted:1};
  if(entry.type==="period"){
    if(!dateValid(payload.start)||!(payload.end==null||dateValid(payload.end))||(payload.end&&payload.end<payload.start))throw Error("Invalid period date");
    return {id:entry.id,type:"period",payload:{start:payload.start,end:payload.end||null},updated_at:entry.updated_at,deleted:0};
  }
  if(!dateValid(payload.date)||!Number.isInteger(Number(payload.pain))||Number(payload.pain)<0||Number(payload.pain)>10||
      !FLOW.has(payload.flow)||!MOOD.has(payload.mood)||typeof (payload.note??"")!=="string"||(payload.note??"").length>600)throw Error("Invalid symptom record");
  const note=payload.note??"";
  const normalized={date:payload.date,pain:Number(payload.pain),flow:payload.flow,mood:payload.mood,note,between:Boolean(payload.between)};
  if(payload.phase!==undefined) {
    if(!PHASE.has(payload.phase)||!dateValid(payload.periodStart)||typeof payload.hourly!=="boolean"||typeof payload.dizzy!=="boolean")throw Error("Invalid questionnaire");
    normalized.phase=payload.phase; normalized.periodStart=payload.periodStart;
    normalized.hourly=payload.hourly; normalized.dizzy=payload.dizzy;
    if(payload.endDate!==undefined) {
      if(!dateValid(payload.endDate)||payload.endDate<payload.periodStart||payload.endDate>payload.date)throw Error("Invalid end date");
      normalized.endDate=payload.endDate;
    }
  }
  return {id:entry.id,type:"checkin",payload:normalized,updated_at:entry.updated_at,deleted:0};
}
export function validateBackupEvents(events) {
  if(!Array.isArray(events)||events.length>MAX_EVENTS)throw Error("Invalid backup event list");
  const seen=new Set();const cleaned=[];
  for(const value of events){
    const entry=sanitizeEvent(value);
    if(seen.has(entry.id))throw Error("Duplicate event");
    seen.add(entry.id);cleaned.push(entry);
  }
  return cleaned;
}
async function deriveKey(password,salt,usages) {
  if(!globalThis.crypto?.subtle)throw Error("Secure cryptography not available");
  const secret=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},secret,{name:"AES-GCM",length:256},false,usages);
}
function passwordValid(s){return typeof s==="string"&&s.length>=12&&s.length<=256;}
export async function encryptBackup(events,password) {
  if(!passwordValid(password))throw Error("Use a password of at least 12 characters");
  const clean=validateBackupEvents(events);
  const plain=encoder.encode(JSON.stringify({format:"healthy-women-v1",events:clean,exportedAt:new Date().toISOString()}));
  if(plain.byteLength>LIMIT)throw Error("Backup is too large");
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveKey(password,salt,["encrypt"]);
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,plain));
  return JSON.stringify({format:FORMAT,version:VERSION,kdf:"PBKDF2-SHA256",iterations:ITERATIONS,algorithm:"AES-256-GCM",salt:bytesTo64(salt),iv:bytesTo64(iv),ciphertext:bytesTo64(cipher)});
}
export async function decryptBackup(fileText,password) {
  if(typeof fileText!=="string"||fileText.length>LIMIT*2||!passwordValid(password))throw Error("Invalid encrypted backup or password");
  let file;
  try{file=JSON.parse(fileText);}catch{throw Error("Invalid encrypted file");}
  if(!file||typeof file!=="object"||file.format!==FORMAT||file.version!==VERSION||file.kdf!=="PBKDF2-SHA256"||
     file.iterations!==ITERATIONS||file.algorithm!=="AES-256-GCM")throw Error("Unsupported backup format");
  const salt=from64(file.salt,16),iv=from64(file.iv,12),cipher=from64(file.ciphertext);
  if(cipher.length<16||cipher.length>LIMIT+16)throw Error("Invalid encrypted file");
  const key=await deriveKey(password,salt,["decrypt"]);
  let decoded;
  try{decoded=decoder.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,cipher));}
  catch{throw Error("Password incorrect or backup corrupted");}
  let data;
  try{data=JSON.parse(decoded);}catch{throw Error("Invalid backup data");}
  if(!data||data.format!=="healthy-women-v1")throw Error("Unsupported backup data");
  return validateBackupEvents(data.events);
}
