import {encryptBackup,decryptBackup} from "./vault.mjs";
const BACKUP_LIMIT=1024*1024*2;
const css=".vault-dialog{width:min(94vw,480px);max-height:90dvh;padding:0;overflow-y:auto;border:0;border-radius:22px;box-shadow:0 24px 75px #33233150;color:#493647;background:#fff}.vault-dialog::backdrop{background:#251a25a0}.vault-form{padding:25px}.vault-form h2{font-size:21px;margin:0 0 8px}.vault-form p{font-size:12px;line-height:1.7;color:#685762}.vault-form label{display:grid;gap:7px;font-size:13px;margin:15px 0}.vault-form input{display:block;width:100%;border:1px solid #e6d6de;border-radius:12px;padding:13px;color:#46333e;background:white}.vault-form .hint{font-size:11px;color:#856f7d}.vault-form .warning{font-size:11px;background:#fff9f0;padding:12px;border-radius:10px;color:#765b58;margin:11px 0}.vault-form .status{min-height:17px;font-size:12px;color:#ad416d}.vault-actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;margin-top:20px}@media(max-width:600px){.vault-form{padding:19px}}";
const markup=[
'<dialog id="vaultDialog" class="vault-dialog" aria-labelledby="vaultTitle">',
'<form id="vaultForm" class="vault-form"><h2 id="vaultTitle">Shifrlangan zaxira</h2>',
'<p id="vaultDescription">Qurilmadagi qaydlarni xavfsiz fayl ko‘rinishida saqlash.</p>',
'<label id="vaultFileWrap" hidden>Shifrlangan zaxira fayli<input type="file" id="vaultFile" accept=".hwbak,.json,application/json"/></label>',
'<label>Parol (kamida 12 belgi)<input id="vaultPassword" type="password" minlength="12" maxlength="256" autocomplete="off" required/></label>',
'<label id="vaultRepeatWrap">Parolni qayta kiriting<input id="vaultRepeat" type="password" minlength="12" maxlength="256" autocomplete="off"/></label>',
'<p class="warning">🔒 Bu funksiya faqat eksport qilinadigan faylni shifrlaydi. Qurilmada saqlangan qaydlar hozircha shifrlanmagan. Parol unutilsa, faylni tiklab bo‘lmaydi.</p>',
'<p class="status" id="vaultStatus" role="alert" aria-live="polite"></p>',
'<div class="vault-actions"><button class="button ghost" id="vaultCancel" type="button">Bekor qilish</button><button class="button primary" id="vaultSubmit" type="submit">Saqlash</button></div>',
'</form></dialog>'
].join("");
function ensureUI(){
 if(!document.getElementById("vaultStyles")){const el=document.createElement("style");el.id="vaultStyles";el.textContent=css;document.head.appendChild(el);}
 if(!document.getElementById("vaultDialog")){const tpl=document.createElement("template");tpl.innerHTML=markup;document.body.appendChild(tpl.content);}
}
export function attachVaultControls({getEvents,replaceEvents,download,notify}){
 const backup=document.getElementById("backupBtn"),restore=document.getElementById("restoreBtn");
 if(!backup||!restore)throw Error("Vault buttons absent");
 ensureUI();
 const get=id=>document.getElementById(id),dialog=get("vaultDialog"),form=get("vaultForm"),status=get("vaultStatus");
 let busy=false;let mode="export";
 function open(nextMode){
  if(dialog.open)return;
  mode=nextMode;form.reset();status.textContent="";
  get("vaultTitle").textContent=mode==="export"?"🔐 Shifrlangan zaxira yaratish":"🔑 Zaxiradan qayta tiklash";
  get("vaultDescription").textContent=mode==="export"?"Kundalik va hayz sanalarini parol bilan shifrlangan faylga saqlang. Parol faqat qurilmangizda ishlatiladi.":"Oldin yaratilgan shifrlangan zaxira faylini tanlang va parolini kiriting. Hozirgi ma’lumotlar faqat siz tasdiqlasangiz almashtiriladi.";
  get("vaultFileWrap").hidden=mode!=="restore";get("vaultFile").required=mode==="restore";
  get("vaultRepeatWrap").hidden=mode==="restore";get("vaultRepeat").required=mode==="export";
  get("vaultSubmit").textContent=mode==="export"?"🔐 Shifrlash va yuklash":"🔑 Faylni tiklash";
  dialog.showModal();
 }
 backup.onclick=()=>open("export");
 restore.onclick=()=>open("restore");
 get("vaultCancel").onclick=()=>{if(!busy)dialog.close();};
 form.onsubmit=async event=>{
  event.preventDefault();
  if(busy)return;
  const secret=get("vaultPassword").value;
  if(secret.length<12||secret.length>256){status.textContent="Parol kamida 12 belgidan iborat bo‘lishi kerak.";return;}
  if(mode==="export"&&secret!==get("vaultRepeat").value){status.textContent="Kiritilgan parollar bir xil emas.";return;}
  const chosenMode=mode;
  const chosenFile=chosenMode==="restore"?get("vaultFile").files?.[0]:null;
  if(chosenMode==="restore"&&(!chosenFile||chosenFile.size>BACKUP_LIMIT)){status.textContent="Fayl tanlanmagan yoki juda katta.";return;}
  busy=true;get("vaultSubmit").disabled=true;get("vaultCancel").disabled=true;status.textContent="Fayl qayta ishlanmoqda...";
  try{
   if(!globalThis.crypto?.subtle)throw Error("Qurilmada xavfsiz shifrlash mavjud emas (HTTPS talab qilinadi).");
   if(chosenMode==="export"){
    const result=await encryptBackup(getEvents(),secret);
    download(result,"healthy-women-"+new Date().toISOString().slice(0,10)+".hwbak","application/json");
    dialog.close();notify("Shifrlangan zaxira fayli saqlandi.");
   } else {
    const text=await chosenFile.text();
    const entries=await decryptBackup(text,secret);
    if(!confirm(entries.length+" ta yozuv tiklanadi. Hozirgi mahalliy qaydlar ALMASHTIRILADI. Davom etasizmi?")){status.textContent="Tiklash bekor qilindi.";return;}
    await replaceEvents(entries);
    dialog.close();notify("Shifrlangan zaxiradan "+entries.length+" ta yozuv tiklandi.");
   }
  }catch(error){status.textContent=chosenMode==="restore"?"Tiklash bajarilmadi: "+String(error?.message||"parol, fayl yoki saqlash xatosi"):"Zaxira yaratilmadi: "+String(error?.message||"xatolik");}
  finally{get("vaultSubmit").disabled=false;get("vaultCancel").disabled=false;busy=false;}
 };
}
