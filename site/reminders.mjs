// Generic, opt-in Android reminders. No medical details in system notifications.
export const REMINDER_KEY="healthywomen.daily-reminder.v1";
export const REMINDER_ID=70701;
export function parseReminderTime(value){
 if(typeof value!=="string"||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
 const [hour,minute]=value.split(":").map(Number);return {hour,minute};
}
export function nativeNotifications(root=globalThis){
 const cap=root.Capacitor;
 if(cap?.isNativePlatform?.()&&cap?.getPlatform?.()==="android")return cap.Plugins?.LocalNotifications||null;
 return null;
}
export function storedReminder(storage=globalThis.localStorage){
 try{const x=JSON.parse(storage?.getItem(REMINDER_KEY)||"null");return x?.enabled===true&&parseReminderTime(x.time)?x.time:null;}catch{return null;}
}
export async function setDailyReminder(time,{plugin=nativeNotifications(),storage=globalThis.localStorage}={}){
 const parts=parseReminderTime(time);
 if(!parts)return {ok:false,message:"Eslatma vaqtini to‘g‘ri kiriting."};
 if(!plugin)return {ok:false,message:"Mahalliy eslatmalar faqat Android ilovada mavjud."};
 try{
  let permission=await plugin.checkPermissions();
  if(permission?.display!=="granted")permission=await plugin.requestPermissions();
  if(permission?.display!=="granted")return {ok:false,message:"Android bildirishnoma ruxsatini bermadi."};
  await plugin.cancel({notifications:[{id:REMINDER_ID}]});
  await plugin.schedule({notifications:[{id:REMINDER_ID,title:"Healthy Women",body:"Bugungi kundalik qaydlaringizni tekshirishni xohlaysizmi?",schedule:{on:{hour:parts.hour,minute:parts.minute,second:0}},autoCancel:true}]});
  storage.setItem(REMINDER_KEY,JSON.stringify({enabled:true,time}));
  return {ok:true,message:"Kunlik eslatma yoqildi. Android uni belgilangan vaqtdan biroz kech yetkazishi mumkin."};
 }catch{
  try{storage.removeItem(REMINDER_KEY);}catch{}
  return {ok:false,message:"Eslatmani sozlab bo‘lmadi. Android ruxsatlarini tekshiring."};
 }
}
export async function cancelDailyReminder({plugin=nativeNotifications(),storage=globalThis.localStorage}={}){
 if(plugin){try{await plugin.cancel({notifications:[{id:REMINDER_ID}]});}catch{return {ok:false,message:"Android eslatmasini bekor qilib bo‘lmadi."};}}
 try{storage?.removeItem(REMINDER_KEY);}catch{}
 return {ok:true,message:"Kunlik eslatma o‘chirildi."};
}
export function reminderSettingsMarkup(){
 const native=!!nativeNotifications(),time=storedReminder()||"20:00";
 const disabled=native?"":"disabled";
 return '<div class="settings-row"><div><strong>🔔 Kunlik Android eslatmasi</strong><p>Faqat Android ilovada va siz ruxsat berganda ishlaydi. Bildirishnomada hayz sanasi yoki shaxsiy tibbiy ma’lumotlar ko‘rsatilmaydi.</p></div></div>'+
 '<div class="reminder-options"><label class="reminder-time-label">Eslatma vaqti <input id="reminderTime" type="time" value="'+time+'" '+disabled+' aria-label="Eslatma vaqti"/></label>'+
 '<button id="reminderSave" type="button" class="button ghost" '+disabled+'>Yoqish / vaqtni yangilash</button><button id="reminderOff" type="button" class="button ghost" '+disabled+'>O‘chirish</button></div>'+
 '<p id="reminderStatus" class="micro" role="status">'+(!native?"Fon eslatmalari veb-saytda mavjud emas. Android APK’dan foydalaning.":storedReminder()?"Eslatma yoqilgan: "+time:"Eslatma o‘chirilgan.")+'</p>'+
 '<p class="micro">Android 13 va undan yangilarida bildirishnoma ruxsati kerak. Tizim eslatmalarni bir oz kech yetkazishi mumkin.</p>';
}
export function attachReminderControls(notify){
 const save=document.getElementById("reminderSave"),off=document.getElementById("reminderOff"),status=document.getElementById("reminderStatus"),input=document.getElementById("reminderTime");
 if(!save||!off||!status||!input)return;
 let busy=false;
 const setBusy=x=>{busy=x;save.disabled=x;off.disabled=x;};
 save.onclick=async()=>{if(busy)return;setBusy(true);try{const r=await setDailyReminder(input.value);status.textContent=r.message;if(r.ok)notify?.("Android eslatmasi yoqildi.");}finally{setBusy(false);}};
 off.onclick=async()=>{if(busy)return;setBusy(true);try{const r=await cancelDailyReminder();status.textContent=r.message;if(r.ok)notify?.("Android eslatmasi o‘chirildi.");}finally{setBusy(false);}};
}
export const REMINDER_CSS=".reminder-options{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:15px 0 10px}.reminder-time-label{display:grid;gap:7px;font-size:12px;color:#735b6e}.reminder-time-label input{padding:9px 11px;border:1px solid #e3d1db;border-radius:10px;min-height:42px;background:white;color:#544352}.reminder-options .button{font-size:11px;min-height:42px}.reminder-options .button:disabled{opacity:.48;cursor:not-allowed}";
