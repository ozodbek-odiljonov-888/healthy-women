// Healthy Women v1.6 — explicit, backup-first rotation of the local encryption password.
// The passphrases exist only in the active dialog and are never logged or sent online.
import {LOCAL_VAULT_KEY,LEGACY_EVENTS_KEY,unlockEncryptedJournal,rotateEncryptedJournalPassword} from "./local-crypto.mjs";
import {encryptBackup,decryptBackup,validateBackupEvents} from "./vault.mjs";
import {withJournalWriteLock} from "./journal-guard.mjs";
const css=".rotate-dialog{width:min(95vw,500px);max-height:90dvh;overflow-y:auto;padding:0;border:0;border-radius:21px;box-shadow:0 22px 80px #49304c66;background:#fff;color:#493543}.rotate-dialog::backdrop{background:#281a2999}.rotate-form{padding:27px}.rotate-form h2{font-size:21px;margin:0 0 10px}.rotate-form p{font-size:12px;line-height:1.7;color:#77616e}.rotate-form label{font-size:12px;display:grid;gap:7px;margin:14px 0}.rotate-form input[type=password]{width:100%;font:inherit;min-height:45px;padding:12px;border:1px solid #dbcad6;border-radius:11px}.rotate-form .rotate-ack{display:flex;gap:9px;align-items:start;background:#fff7ed;padding:11px;border-radius:12px;line-height:1.6}.rotate-form .rotate-ack[hidden]{display:none!important}.rotate-form .rotate-ack input{margin-top:4px;flex-shrink:0}.rotate-form button{font:inherit;min-height:44px;padding:11px 17px;border:0;border-radius:12px;background:#ac6287;color:#fff;font-weight:700;cursor:pointer}.rotate-form button:disabled{opacity:.5;cursor:wait}.rotate-form .rotate-cancel{background:#f6e9ef;color:#71455d}.rotate-form .rotate-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:15px}.rotate-status{font-size:12px!important;color:#a43c5c!important;min-height:18px}";
const markup='<dialog id="rotateDialog" class="rotate-dialog" aria-labelledby="rotateTitle"><form id="rotateForm" class="rotate-form"><h2 id="rotateTitle">🔑 Mahalliy kundalik parolini almashtirish</h2><p>Eski parolni kiriting, yangi parolni tanlang. Avval eski parol bilan ochiladigan shifrlangan zaxira faylini oling. Zaxira saqlanganini tasdiqlaganingizdan keyingina yangi parol qo‘llanadi.</p><label>Amaldagi parol<input id="rotateOld" type="password" minlength="12" maxlength="256" autocomplete="current-password" required/></label><label>Yangi parol<input id="rotateNew" type="password" minlength="12" maxlength="256" autocomplete="new-password" required/></label><label>Yangi parolni takrorlang<input id="rotateRepeat" type="password" minlength="12" maxlength="256" autocomplete="new-password" required/></label><p>Parol serverga jo‘natilmaydi. Eski parol bilan saqlangan avvalgi zaxiralarni ochish uchun eski parol saqlanib qolishi kerak. Yangi parol unutilsa uni tiklash imkoniyati yo‘q.</p><label class="rotate-ack" id="rotateAckWrap" hidden><input id="rotateAck" type="checkbox" disabled/> Eski parol bilan shifrlangan zaxira fayli qurilmaga saqlanganini tekshirdim va eski/yangi parollarni xavfsiz saqlayman.</label><p id="rotateStatus" role="alert" class="rotate-status"></p><div class="rotate-actions"><button id="rotateCancel" type="button" class="rotate-cancel">Bekor qilish</button><button id="rotateBackup" type="button">1. Eski parol bilan zaxira olish</button><button id="rotateSubmit" type="submit" disabled>2. Parolni yangilash</button></div></form></dialog>';
export function passwordRotationSettingsHtml(encrypted){
 return encrypted?'<div class="settings-row"><div><strong>🔑 Kundalik parolini almashtirish</strong><p>Joriy qaydlar saqlanadi. Parol almashtirishdan oldin eski parol bilan shifrlangan zaxira olish talab qilinadi.</p></div><button type="button" id="rotateOpen" class="button ghost">Parolni almashtirish</button></div>':'';
}
export function createPasswordRotationUI({getEvents,waitForWrites,lock,download,notify,storage=globalThis.localStorage,doc=globalThis.document}={}){
 const style=doc.createElement("style");style.id="rotateStyles";style.textContent=css;doc.head.appendChild(style);
 const template=doc.createElement("template");template.innerHTML=markup;doc.body.appendChild(template.content);
 const get=id=>doc.getElementById(id),dialog=get("rotateDialog"),form=get("rotateForm"),old=get("rotateOld"),next=get("rotateNew"),repeat=get("rotateRepeat"),ack=get("rotateAck"),ackWrap=get("rotateAckWrap"),backupButton=get("rotateBackup"),submitButton=get("rotateSubmit"),cancelButton=get("rotateCancel"),status=get("rotateStatus");
 let stage=null,busy=false;
 const compare=records=>JSON.stringify(validateBackupEvents(records));
 const resetStage=()=>{stage=null;ack.checked=false;ack.disabled=true;ackWrap.hidden=true;submitButton.disabled=true;};
 const resetSecrets=()=>{form.reset();resetStage();status.textContent="";};
 const setBusy=v=>{busy=v;backupButton.disabled=v;submitButton.disabled=v||!stage||!ack.checked;cancelButton.disabled=v;};
 const validate=()=>{
  const current=old.value,newPass=next.value;
  if(current.length<12||current.length>256||newPass.length<12||newPass.length>256)throw Error("Har bir parol 12–256 belgidan iborat bo‘lsin.");
  if(current===newPass)throw Error("Yangi parol eskisidan farq qilishi kerak.");
  if(newPass!==repeat.value)throw Error("Yangi parollar bir xil emas.");
  return {current,newPass};
 };
 for(const input of [old,next,repeat])input.addEventListener("input",resetStage);
 ack.addEventListener("change",()=>{submitButton.disabled=busy||!stage||!ack.checked;});
 dialog.addEventListener("close",resetSecrets);
 cancelButton.onclick=()=>{if(!busy)dialog.close();};
 const closeForPrivacy=()=>{if(dialog.open){dialog.close();resetSecrets();}};
 doc.addEventListener("visibilitychange",()=>{if(doc.hidden)closeForPrivacy();});
 globalThis.window?.addEventListener("pagehide",closeForPrivacy);
 function bindSettings(){
  const trigger=get("rotateOpen");
  if(!trigger)return;
  trigger.onclick=()=>{
   if(busy||dialog.open)return;
   if(storage.getItem(LEGACY_EVENTS_KEY)!==null){
    notify?.("Avval eski ochiq nusxa bilan bog‘liq ziddiyatni hal qiling.");return;
   }
   if(storage.getItem(LOCAL_VAULT_KEY)===null){notify?.("Shifrlangan kundalik topilmadi.");return;}
   resetSecrets();dialog.showModal();
  };
 }
 backupButton.onclick=async()=>{
  if(busy)return;
  try{
   const {current}=validate();
   setBusy(true);status.textContent="Parol va mavjud qaydlar tekshirilmoqda...";
   await waitForWrites();
   const source=storage.getItem(LOCAL_VAULT_KEY);
   if(storage.getItem(LEGACY_EVENTS_KEY)!==null)throw Error("Eski ochiq nusxa mavjud. Uni avval hal qiling.");
   const unlocked=await unlockEncryptedJournal(current,storage);
   const currentJournal=await getEvents();
   if(compare(unlocked.events)!==compare(currentJournal))throw Error("Qaydlar boshqa oynada o‘zgargan. Kundalikni qayta oching.");
   const backup=await encryptBackup(unlocked.events,current);
   const verified=await decryptBackup(backup,current);
   if(compare(verified)!==compare(unlocked.events))throw Error("Zaxira faylini tekshirib bo‘lmadi.");
   if(storage.getItem(LOCAL_VAULT_KEY)!==source)throw Error("Kundalik zaxira davomida o‘zgargan. Qayta urinib ko‘ring.");
   download(backup,"healthy-women-parol-almashtirishdan-oldin.hwbak","application/json");
   stage={source,snapshot:compare(unlocked.events)};
   ackWrap.hidden=false;ack.disabled=false;status.textContent="Shifrlangan zaxira yuborildi. Fayl haqiqatda saqlanganini tekshiring.";
  }catch(error){resetStage();status.textContent=String(error?.message||"Zaxira olish bajarilmadi.");}
  finally{setBusy(false);}
 };
 form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(busy||!stage||!ack.checked)return;
  const priorStage=stage;
  try{
   const {current,newPass}=validate();
   setBusy(true);status.textContent="Yangi parol bilan qayta shifrlanmoqda...";
   await waitForWrites();
   await withJournalWriteLock(async()=>{
    const latest=await getEvents();
    if(compare(latest)!==priorStage.snapshot)throw Error("Kundalik zaxiradan keyin o‘zgardi. Yangi zaxira oling.");
    const updated=await rotateEncryptedJournalPassword(current,newPass,priorStage.source,storage);
    if(compare(updated.events)!==priorStage.snapshot)throw Error("Shifrlangan qaydlar tekshiruvi muvaffaqiyatsiz.");
   });
   dialog.close();
   await lock();
   const unlockError=get("secureUnlockError");
   if(unlockError)unlockError.textContent="Parol almashtirildi. Kundalikni yangi parol bilan oching.";
   notify?.("Yangi parol o‘rnatildi. Kundalik qayta qulflandi.");
  }catch(error){resetStage();status.textContent=String(error?.message||"Parol almashtirilmadi.");}
  finally{setBusy(false);}
 });
 return {bindSettings};
}
