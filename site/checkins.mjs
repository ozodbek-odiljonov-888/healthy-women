// Pure, offline menstrual check-in planning. No user data leaves the device.
export const PHASES = Object.freeze({
  start: {title:"Hayzning boshlanishi",description:"Bugungi og‘riq, qon ketishi va kayfiyatingizni qisqa qayd eting."},
  end: {title:"Hayz tugashini tekshirish",description:"Hayz tugagan-tugamaganini va o‘zingizni qanday his qilayotganingizni belgilang."},
  middle: {title:"Sikl o‘rtasidagi holat",description:"Sikl o‘rtasida kayfiyat, og‘riq va kutilmagan qon ketishini qayd eting. Bu ovulyatsiya sanasini aniqlamaydi."}
});
export const REFERENCE_URLS = Object.freeze({
  bleeding:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding",
  pain:"https://www.nhs.uk/symptoms/period-pain/"
});
const DAY=86400000;
export function validDate(value) {
  if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const time=Date.parse(value+"T12:00:00Z");
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;
}
export function daysBetween(a,b) {
  if(!validDate(a)||!validDate(b)) return null;
  return Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/DAY);
}
export function selectCheckinPhase(periods,checkins,today,cycleLength=28) {
  if(!validDate(today)||!Array.isArray(periods)||!Array.isArray(checkins))return null;
  const valid=periods.filter(x=>x&&validDate(x.start)&&x.start<=today).sort((a,b)=>a.start.localeCompare(b.start));
  const latest=valid.at(-1);
  if(!latest)return null;
  const elapsed=daysBetween(latest.start,today);
  if(elapsed===null||elapsed<0||elapsed>60)return null;
  const answered=(phase)=>checkins.some(x=>x&&x.phase===phase&&x.periodStart===latest.start);
  const result=(phase)=>({phase,period:latest,elapsed,...PHASES[phase]});
  if(elapsed<=2&&!answered("start"))return result("start");
  if(!latest.end&&elapsed>=3&&elapsed<=30&&!answered("end")) {
    const askedToday=checkins.some(x=>x&&x.phase==="end-followup"&&x.periodStart===latest.start&&x.date===today);
    if(!askedToday)return result("end");
  }
  const length=Number.isFinite(cycleLength)?Math.max(21,Math.min(45,Math.round(cycleLength))):28;
  const midpoint=Math.floor(length/2);
  if(latest.end&&elapsed>=Math.max(8,midpoint-2)&&elapsed<=midpoint+2&&!answered("middle"))return result("middle");
  return null;
}
export function validatePhaseEntry(entry,today) {
  if(!entry||!validDate(entry.date)||!validDate(today)||entry.date>today||!validDate(entry.periodStart))return false;
  if(!["start","end","end-followup","middle"].includes(entry.phase))return false;
  if(!Number.isInteger(entry.pain)||entry.pain<0||entry.pain>10)return false;
  if(!["none","light","normal","heavy","very-heavy"].includes(entry.flow))return false;
  if(!["good","neutral","low","anxious"].includes(entry.mood))return false;
  if(typeof entry.between!=="boolean"||typeof entry.hourly!=="boolean"||typeof entry.dizzy!=="boolean")return false;
  if(typeof entry.note!=="string"||entry.note.length>400)return false;
  if(entry.phase==="end"&&(!entry.endDate||!validDate(entry.endDate)||entry.endDate<entry.periodStart||entry.endDate>entry.date))return false;
  return true;
}
export function riskAdvice(entry) {
  const pain=Number(entry?.pain)||0;
  if(entry?.hourly&&entry?.dizzy)return {level:"urgent",text:"Juda ko‘p qon ketishi va bosh aylanishi birga kuzatilsa, zudlik bilan shoshilinch tibbiy yordamga murojaat qiling.",url:REFERENCE_URLS.bleeding};
  if(entry?.hourly||entry?.flow==="very-heavy"||entry?.dizzy)return {level:"medical",text:"Ko‘p qon ketishi yoki bosh aylanishi tibbiy baholashni talab qilishi mumkin. Kechiktirmasdan shifokor bilan bog‘laning.",url:REFERENCE_URLS.bleeding};
  if(pain>=8)return {level:"medical",text:"Juda kuchli yoki odatdagidan yomon og‘riqda tezroq tibbiy ko‘rikdan o‘ting.",url:REFERENCE_URLS.pain};
  if(entry?.between)return {level:"medical",text:"Hayzlar oralig‘ida qon ketishi takrorlansa yoki davom etsa, shifokor ko‘rigiga yoziling.",url:REFERENCE_URLS.bleeding};
  return {level:"routine",text:"Kundalik qaydi saqlandi. Bu ma’lumot tibbiy tashxis emas.",url:""};
}
