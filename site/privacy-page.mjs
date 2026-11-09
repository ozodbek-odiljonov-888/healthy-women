// Healthy Women: erase the local diary without letting other tabs revive old records.
import {cancelDailyReminder} from "./reminders.mjs";
import {eraseLocalJournal} from "./erasure.mjs";
const button=document.getElementById("erase"),notice=document.getElementById("notice");
button.addEventListener("click",async()=>{
 if(button.disabled||!confirm("Shu qurilmadagi qaydlar butunlay o‘chirilsinmi?"))return;
 button.disabled=true;notice.textContent="Mahalliy qaydlarni o‘chirish tekshirilmoqda...";
 try{
  await eraseLocalJournal();
  const reminder=await cancelDailyReminder();
  notice.textContent=reminder.ok
   ?"Kundalik va lokal sozlamalar o‘chirildi. Boshqa ochiq oynalar eski ma’lumotlarni qayta yozolmaydi."
   :"Kundalik va lokal sozlamalar o‘chirildi, ammo Android eslatmasini bekor qilishda muammo bor. Qurilma bildirishnomalarini tekshiring.";
 }catch(err){
  notice.textContent="O‘chirish yakunlanmadi: "+String(err?.message||"Xotira xatosi")+". Jarayonni qayta tekshiring.";
 }finally{button.disabled=false;}
});
