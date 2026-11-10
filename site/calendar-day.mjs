// Healthy Women v1.26: read-only selected-day summary. No remote data or writes.
import {validDay} from "./cycle-safety.mjs";
import {formatUzDate} from "./date-uz.mjs";

const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const flows={none:"Qon ketishi yo‘q",light:"Kam",normal:"O‘rtacha",heavy:"Ko‘p","very-heavy":"Juda ko‘p"};
const moods={good:"Yaxshi",neutral:"O‘rtacha",low:"Past",anxious:"Bezovta"};
const formatDay=iso=>formatUzDate(iso,{day:"numeric",month:"long",year:"numeric"});

// Only an explicitly confirmed end date can establish a recorded date range.
// If a period is missing its end, do not invent additional bleeding days.
export function confirmedPeriodDates(periods=[]){
 const dates=new Set();
 for(const p of Array.isArray(periods)?periods:[]){
  if(!validDay(p?.start))continue;
  const end=validDay(p?.end)&&p.end>=p.start?p.end:p.start;
  const n=Math.min(31,Math.round((Date.parse(end+"T12:00:00Z")-Date.parse(p.start+"T12:00:00Z"))/86400000)+1);
  for(let i=0;i<n;i++){
   const d=new Date(Date.parse(p.start+"T12:00:00Z")+i*86400000).toISOString().slice(0,10);
   dates.add(d);
  }
 }
 return dates;
}

export function getCalendarDayDetails({date,today,periods=[],checkins=[],predicted=[]}={}){
 if(!validDay(date)||!validDay(today))throw new Error("Kalendar sanasi noto‘g‘ri.");
 const future=date>today;
 const period=future?null:(Array.isArray(periods)?periods:[]).find(p=>{
  if(!validDay(p?.start)||p.start>today||p.start>date)return false;
  return (validDay(p.end)&&p.end>=p.start)?date<=p.end:date===p.start;
 })||null;
 const notes=future?[]:(Array.isArray(checkins)?checkins:[]).filter(c=>c&&validDay(c.date)&&c.date===date).slice(0,20);
 const estimated=!period&&(predicted instanceof Set?predicted.has(date):Array.isArray(predicted)&&predicted.includes(date));
 return {date,future,period,notes,estimated:!!estimated};
}
export function renderCalendarDayDetails(day){
 const {date,future,period,notes,estimated}=day;
 const state=period
  ?(period.end?"Tasdiqlangan hayz kuni":"Hayz boshlangan kun · tugash noma’lum")
  :estimated?"Taxminiy hayz kuni":future?"Kelajakdagi sana":"Hozircha qayd yo‘q";
 const noteMarkup=notes.map(c=>{
  const pain=Number.isInteger(Number(c.pain))&&Number(c.pain)>=0&&Number(c.pain)<=10?Number(c.pain)+"/10":"—";
  const mood=moods[c.mood]||"Kiritilmagan",flow=flows[c.flow]||"Kiritilmagan";
  return `<div class="day-note"><strong>${c.phase?"Sikl so‘rovnomasi":"Kundalik qaydi"}</strong><span>Og‘riq: ${pain} · Kayfiyat: ${esc(mood)} · Qon: ${esc(flow)}</span>${c.note?`<p>${esc(String(c.note).slice(0,160))}</p>`:""}</div>`;
 }).join("");
 return `<section class="card calendar-detail" id="calendarDayDetail" aria-live="polite" aria-label="Tanlangan kun ma’lumotlari">
  <p class="eyebrow">TANLANGAN KUN</p><h2>${esc(formatDay(date))}</h2>
  <span class="day-state ${period?"is-recorded":estimated?"is-estimated":""}">${esc(state)}</span>
  ${period?`<p class="day-context">Boshlanish: ${esc(period.start)}${period.end?" · Tugash: "+esc(period.end):". Tugash sanasini tasdiqlash uchun qaydni tahrirlang."}</p>`:""}
  ${notes.length?`<h3 class="day-detail-heading">Kundalikdagi yozuvlar (${notes.length})</h3>${noteMarkup}`:`<p class="day-context">${future?"Kelajakdagi kunga hali qayd kiritib bo‘lmaydi.":"Bu kun uchun alomatlar qayd etilmagan."}</p>`}
  ${!future?`<div class="day-actions">
    ${period?`<button type="button" id="dayEditPeriod" data-id="${esc(period.id??"")}" class="button ghost">✎ Hayz qaydini tahrirlash</button>`:`<button type="button" id="dayAddPeriod" class="button ghost">＋ Hayz boshlanishini belgilash</button>`}
    <button type="button" id="dayOpenDiary" class="button primary">♡ Kundalikni ochish</button>
   </div>`:`<p class="micro">Prognoz faqat taxmin bo‘lib, real kuzatuv o‘rnini bosmaydi.</p>`}
  </section>`;
}
