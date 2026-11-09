// Healthy Women v0.6: pure local-date safeguards for period entries and estimates.
// No network access and no patient data persistence in this module.
const DAY_MS=86400000;
export function validDay(s){
 if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const v=Date.parse(s+"T12:00:00Z");
 return Number.isFinite(v)&&new Date(v).toISOString().slice(0,10)===s;
}
export function deltaDays(from,to){
 if(!validDay(from)||!validDay(to))return null;
 return Math.round((Date.parse(to+"T12:00:00Z")-Date.parse(from+"T12:00:00Z"))/DAY_MS);
}
export function addDays(start,days){
 if(!validDay(start)||!Number.isInteger(days)||Math.abs(days)>3660)return null;
 return new Date(Date.parse(start+"T12:00:00Z")+days*DAY_MS).toISOString().slice(0,10);
}
export function validatePeriod(periods,{start,end=null,today,editingId=null}={}){
 if(!validDay(start)||!validDay(today)||start>today)
  return {ok:false,message:"Boshlanish sanasini tekshiring: kelajak sana kiritilmaydi."};
 if(end!==null&&end!==""){
  if(!validDay(end)||end<start||end>today)return {ok:false,message:"Tugash sanasi boshlanishdan oldin yoki kelajakda bo‘lishi mumkin emas."};
  if(deltaDays(start,end)>30)return {ok:false,message:"30 kundan ortiq qon ketishini tibbiy baholash zarur. Sanani tekshiring."};
 }
 const endDay=end||start;
 for(const p of Array.isArray(periods)?periods:[]){
  if(!p||String(p.id)===String(editingId)||!validDay(p.start))continue;
  if(p.start===start)return {ok:false,message:"Bu sanada hayz boshlanishi oldin qayd etilgan. Yangi qayd o‘rniga mavjudini tahrirlang."};
  // Unknown end dates are intentionally NOT treated as indefinite bleeding.
  const existingEnd=validDay(p.end)&&p.end>=p.start?p.end:p.start;
  if(start<=existingEnd&&p.start<=endDay)
   return {ok:false,message:"Siz kiritgan sana boshqa qayd etilgan hayz davri bilan kesishmoqda."};
 }
 return {ok:true,message:""};
}
// Never present a past predicted date as the user's next future period.
export function forecastNext(latestStart,cycleDays,today){
 if(!validDay(latestStart)||!validDay(today)||!Number.isInteger(cycleDays)||cycleDays<15||cycleDays>90||latestStart>today)
  return {next:null,state:"unavailable"};
 const elapsed=deltaDays(latestStart,today);
 const maxAge=Math.max(60,cycleDays*2);
 if(elapsed>maxAge)return {next:null,state:"stale"};
 const expected=addDays(latestStart,cycleDays);
 if(expected<today)return {next:null,state:"overdue"};
 return {next:expected,state:"estimate"};
}
const safeFormula=s=>/^[\s\uFEFF]*[=+@\t\r]/.test(s)||/^[\s\uFEFF]*-(?!\d+(?:[.,]\d+)?$)/.test(s)?"'"+s:s;
function csvValue(value) {
 const s=safeFormula(String(value??""));
 return '"'+s.replaceAll('"','""').replaceAll("\r"," ").replaceAll("\n"," ")+'"';
}
export function exportCycleCsv(periods,checkins) {
 const rows=[["tur","sana","tugash_sanasi","ogriq_0_10","qon_miqdori","kayfiyat","alomatlar","hayzlar_orasida_qon"]];
 for(const p of Array.isArray(periods)?periods:[]){
  if(!validDay(p?.start))continue;
  rows.push(["hayz",p.start,validDay(p.end)?p.end:"","","","","",""]);
 }
 for(const c of Array.isArray(checkins)?checkins:[]){
  if(!validDay(c?.date))continue;
  rows.push(["kundalik",c.date,"",Number.isFinite(Number(c.pain))?String(c.pain):"",c.flow||"",c.mood||"",String(c.note||"").slice(0,600),c.between?"ha":"yo‘q"]);
 }
 return "\uFEFF"+rows.map(row=>row.map(csvValue).join(",")).join("\r\n")+"\r\n";
}
