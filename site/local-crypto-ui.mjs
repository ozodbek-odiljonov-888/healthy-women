// Healthy Women v1.0: explicit local journal encryption and unlock screens.
import {encryptBackup,validateBackupEvents} from "./vault.mjs";
import {LEGACY_EVENTS_KEY,hasEncryptedJournal,readPlainJournal,unlockEncryptedJournal,migratePlainJournal} from "./local-crypto.mjs";
export const STORAGE_STYLE=".secure-wall[hidden],.secure-dialog[hidden]{display:none!important}.secure-wall{position:fixed;inset:0;z-index:1000001;background:linear-gradient(140deg,#fcf2f5,#f4eefa);display:flex;align-items:center;justify-content:center;padding:20px}.secure-card{width:min(100%,460px);padding:32px;background:#fff;border-radius:25px;box-shadow:0 25px 85px #6b3c5928;border:1px solid #e9d7e2;text-align:center}.secure-card h2{color:#6f4c60;font-size:23px;margin:8px 0}.secure-card p{font-size:12px;line-height:1.7;color:#77616f}.secure-card .secure-flower{font-size:38px;color:#b46d8d}.secure-card input,.secure-dialog input[type=password]{width:100%;border:1px solid #e3d1dd;border-radius:13px;background:#fff;padding:13px;min-height:44px;font:inherit;color:#47313e;margin:11px 0}.secure-card button,.secure-dialog button{font:inherit;background:#a85d7f;color:#fff;border:0;border-radius:13px;font-weight:700;min-height:43px;padding:11px 18px;cursor:pointer}.secure-card button:disabled,.secure-dialog button:disabled{opacity:.55;cursor:wait}.secure-note{font-size:11px;line-height:1.7;color:#856e7c}.secure-error{min-height:20px;color:#af3c65;font-size:12px;line-height:1.6}.secure-dialog{max-width:500px;width:min(96vw,500px);max-height:90dvh;border:0;border-radius:23px;box-shadow:0 20px 80px #6341575a;padding:0;overflow:auto}.secure-dialog::backdrop{background:#281a2999}.secure-dialog form{padding:25px}.secure-dialog h2{font-size:21px;margin-bottom:10px}.secure-dialog p{font-size:12px;line-height:1.65;color:#705f69}.secure-dialog label{display:grid;gap:5px;font-size:12px;margin:15px 0}.secure-dialog .secure-ack{display:flex;gap:9px;align-items:flex-start;line-height:1.6}.secure-dialog .secure-ack input{width:auto;margin-top:4px}.secure-dialog-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;margin-top:14px}.secure-dialog .secure-cancel{background:#f5e6ed;color:#774e63}body.secure-locked .app-shell{visibility:hidden!important}";
export function protectionSettingsHtml(enabled){
 return '<div class="settings-row"><div><strong>🔐 Mahalliy kundalikni shifrlash</strong><p>'+
 (enabled?'Kundalik yozuvlari parol bilan shifrlangan. Ilova qayta ochilganda parol kerak.':'Kundalikdagi ma’lumotlar hozir ochiq (shifrlanmagan) mahalliy xotirada. Himoyani yoqish uchun zaxira nusxa yaratib, ko‘chirishni tasdiqlang.')+
 '</p></div><button id="'+(enabled?'secureLock':'secureEnable')+'" type="button" class="button ghost">'+(enabled?'Qulflash':'Shifrlashni yoqish')+'</button></div>'+
 '<p class="micro">'+(enabled?'Parol unutilsa, ma’lumotlarni tiklash uchun oldindan olingan zaxira nusxa zarur.':'Parolni yo‘qotmang. Avval saqlangan fayllar va qurilma zaxiralaridagi ochiq nusxalar avtomatik o‘chirilmaydi.')+'</p>';
}
const wallHTML='<div id="secureWall" class="secure-wall" hidden role="dialog" aria-modal="true" aria-labelledby="secureWallTitle"><div class="secure-card"><div class="secure-flower">✿</div><h2 id="secureWallTitle">Healthy Women</h2><p>Mahalliy kundalik parol bilan shifrlangan. Qaydlarni ko‘rish uchun parol kiriting.</p><form id="secureUnlockForm"><input id="secureUnlockPassword" type="password" minlength="12" maxlength="256" autocomplete="current-password" placeholder="Kundalik paroli" required/><button id="secureUnlockButton" type="submit">Qulfni ochish</button></form><p id="secureUnlockError" class="secure-error" role="alert"></p><p class="secure-note">Parol serverga yuborilmaydi. Parol unutilsa uni tiklash funksiyasi yo‘q.</p></div></div>';
const dialogHTML='<dialog id="secureEnableDialog" class="secure-dialog" aria-labelledby="secureEnableTitle"><form id="secureEnableForm"><h2 id="secureEnableTitle">🔐 Kundalikni himoyalash</h2><p>Avval parol bilan shifrlangan zaxira faylini yuklab oling. Uni saqlaganingizni tasdiqlaganingizdan keyingina eski mahalliy qaydlarni shifrlaymiz.</p><label>Yangi parol (12–256 belgi)<input id="secureNewPassword" type="password" minlength="12" maxlength="256" autocomplete="new-password" required/></label><label>Parolni takrorlang<input id="secureNewRepeat" type="password" minlength="12" maxlength="256" autocomplete="new-password" required/></label><label class="secure-ack"><input id="secureBackupAcknowledged" type="checkbox" disabled/> Zaxira fayli saqlanganini tekshirdim va parolni xavfsiz saqladim.</label><p class="secure-note">Eski qurilma zaxiralari avtomatik tozalanmaydi. Bu prototip to‘liq xavfsizlik auditidan o‘tmagan.</p><p id="secureEnableStatus" class="secure-error" role="alert"></p><div class="secure-dialog-actions"><button type="button" id="secureCancel" class="secure-cancel">Bekor qilish</button><button type="button" id="secureDownload">1. Zaxira olish</button><button type="submit" id="secureMigrate" disabled>2. Shifrlashni yoqish</button></div></form></dialog>';
export function createLocalProtection({getLiveEvents,onUnlocked,onLocked,onMigrated,waitForWrites,download,notify,storage=globalThis.localStorage,doc=globalThis.document}){
 const style=doc.createElement("style");style.textContent=STORAGE_STYLE;doc.head.appendChild(style);
 const temp=doc.createElement("template");temp.innerHTML=wallHTML+dialogHTML;doc.body.appendChild(temp.content);
 const get=id=>doc.getElementById(id),wall=get("secureWall"),unlockForm=get("secureUnlockForm"),unlockPassword=get("secureUnlockPassword"),unlockError=get("secureUnlockError"),dialog=get("secureEnableDialog"),enableForm=get("secureEnableForm"),password=get("secureNewPassword"),repeat=get("secureNewRepeat"),downloadButton=get("secureDownload"),migrateButton=get("secureMigrate"),ack=get("secureBackupAcknowledged"),status=get("secureEnableStatus"),cancel=get("secureCancel");
 const app=doc.querySelector(".app-shell");
 let session=null,locked=hasEncryptedJournal(storage),busy=false,backedUp=false;
 function showWall(){
  for(const dialog of doc.querySelectorAll("dialog[open]"))dialog.close();
  locked=true;wall.hidden=false;doc.body.classList.add("secure-locked");
  if(app){app.inert=true;app.setAttribute("aria-hidden","true");}
  unlockPassword.value="";unlockError.textContent="";
 }
 function hideWall(){
  locked=false;wall.hidden=true;doc.body.classList.remove("secure-locked");
  if(app){app.inert=false;app.removeAttribute("aria-hidden");}
 }
 function setBusy(v){
  busy=v;downloadButton.disabled=v;migrateButton.disabled=v||!backedUp||!ack.checked;
  cancel.disabled=v;get("secureUnlockButton").disabled=v;
 }
 async function lock(){
  if(!hasEncryptedJournal(storage))return;
  showWall();
  await waitForWrites();session=null;onLocked();
 }
 unlockForm.addEventListener("submit",async e=>{
  e.preventDefault();if(busy)return;
  const pass=unlockPassword.value;setBusy(true);unlockError.textContent="Qaydlar ochilmoqda...";
  try{
   const restored=await unlockEncryptedJournal(pass,storage);session=restored.session;
   if(storage.getItem(LEGACY_EVENTS_KEY)!==null){
    storage.removeItem(LEGACY_EVENTS_KEY);
    if(storage.getItem(LEGACY_EVENTS_KEY)!==null)throw Error("Eski shifrlanmagan nusxani o‘chirib bo‘lmadi.");
   }
   await onUnlocked(restored.events);
   hideWall();unlockPassword.value="";notify?.("Kundalik qulfi ochildi.");
  }catch(err){session=null;unlockError.textContent=String(err?.message||"Qulfni ochib bo‘lmadi.");}
  finally{setBusy(false);}
 });
 function bindSettings(){
  const enable=get("secureEnable"),lockButton=get("secureLock");
  if(lockButton)lockButton.onclick=()=>{void lock();};
  if(enable)enable.onclick=()=>{if(locked)return;enableForm.reset();backedUp=false;ack.disabled=true;migrateButton.disabled=true;status.textContent="";dialog.showModal();};
 }
 const safePassword=()=>{
  if(password.value.length<12||password.value.length>256)throw Error("Parol kamida 12 belgidan iborat bo‘lsin.");
  if(password.value!==repeat.value)throw Error("Parollar bir xil emas.");return password.value;
 };
 const resetStage=()=>{backedUp=false;ack.checked=false;ack.disabled=true;migrateButton.disabled=true;};
 password.addEventListener("input",resetStage);repeat.addEventListener("input",resetStage);
 cancel.onclick=()=>{if(!busy)dialog.close();};
 ack.onchange=()=>{migrateButton.disabled=busy||!backedUp||!ack.checked;};
 downloadButton.onclick=async()=>{
  if(busy)return;
  try{
   const p=safePassword();setBusy(true);await waitForWrites();
   const original=readPlainJournal(storage),current=await getLiveEvents();
   if(JSON.stringify(original)!==JSON.stringify(validateBackupEvents(current)))throw Error("Yozuvlar boshqa oynada yangilangan. Sahifani qayta oching.");
   const ciphertext=await encryptBackup(original,p);
   download(ciphertext,"healthy-women-maxfiy-zaxira.hwbak","application/json");
   backedUp=true;ack.disabled=false;status.textContent="Zaxira fayli yuklandi. Uni saqlaganingizni tekshirib tasdiqlang.";
  }catch(err){status.textContent=String(err?.message||"Zaxira yaratilmadi.");}
  finally{setBusy(false);}
 };
 enableForm.addEventListener("submit",async e=>{
  e.preventDefault();if(busy||!backedUp||!ack.checked)return;
  try{
   const p=safePassword();setBusy(true);await waitForWrites();
   const original=readPlainJournal(storage),current=await getLiveEvents();
   if(JSON.stringify(original)!==JSON.stringify(validateBackupEvents(current)))throw Error("Kundalik yangilangan. Zaxira bosqichini takrorlang.");
   const migrated=await migratePlainJournal(p,storage);
   session=migrated.session;storage.removeItem("healthywomen.sync-optin.v1");
   dialog.close();password.value="";repeat.value="";
   await onMigrated(migrated.events);
   notify?.("Kundalik shifrlangan holda saqlandi. Keyingi kirishda parol so‘raladi.");
  }catch(err){status.textContent=String(err?.message||"Shifrlash muvaffaqiyatsiz.");}
  finally{setBusy(false);}
 });
 doc.addEventListener("visibilitychange",()=>{if(doc.hidden&&session)void lock();});
 if(locked)showWall();
 return {bindSettings,lock,isLocked:()=>locked,getSession:()=>session,isEnabled:()=>hasEncryptedJournal(storage),
  onDeleted:()=>{session=null;hideWall();},
  onExternalChange:()=>{showWall();session=null;onLocked()}};
}
