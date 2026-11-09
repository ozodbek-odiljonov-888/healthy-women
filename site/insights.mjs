// Healthy Women — pure monthly symptom statistics, no diagnosis and no network calls.
const FLOWS=new Set(["none","light","normal","heavy","very-heavy"]);
const MOODS=new Set(["good","neutral","low","anxious"]);
export function summarizeSymptoms(checkins,today,months=6){
 if(typeof today!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(today))return [];
 const y=Number(today.slice(0,4)),m=Number(today.slice(5,7));
 if(m<1||m>12||!Number.isInteger(months)||months<1||months>12)return [];
 const buckets=[];
 for(let offset=months-1;offset>=0;offset--){
  const d=new Date(Date.UTC(y,m-1-offset,1,12)),key=d.toISOString().slice(0,7);
  buckets.push({month:key,count:0,painTotal:0,painCount:0,highPain:0,heavyFlow:0,betweenBleeding:0,moods:{good:0,neutral:0,low:0,anxious:0}});
 }
 const lookup=new Map(buckets.map((b,i)=>[b.month,i]));
 for(const c of Array.isArray(checkins)?checkins:[]){
  if(!c||typeof c.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||c.date>today)continue;
  const index=lookup.get(c.date.slice(0,7));if(index===undefined)continue;
  const b=buckets[index];b.count++;
  const value=Number(c.pain),pain=Number.isInteger(value)&&value>=0&&value<=10&&c.pain!==null?value:null;
  if(pain!==null){b.painTotal+=pain;b.painCount++;if(pain>=8)b.highPain++;}
  if(FLOWS.has(c.flow)&&(c.flow==="heavy"||c.flow==="very-heavy"))b.heavyFlow++;
  if(c.between===true)b.betweenBleeding++;
  if(MOODS.has(c.mood))b.moods[c.mood]++;
 }
 return buckets.map(({painTotal,painCount,...b})=>({...b,avgPain:painCount?Math.round(painTotal/painCount*10)/10:null}));
}
export function overallSummary(months){
 const data=Array.isArray(months)?months:[];
 return {total:data.reduce((s,x)=>s+(x.count||0),0),highPain:data.reduce((s,x)=>s+(x.highPain||0),0),heavyFlow:data.reduce((s,x)=>s+(x.heavyFlow||0),0),betweenBleeding:data.reduce((s,x)=>s+(x.betweenBleeding||0),0),recordedMonths:data.filter(x=>x.count>0).length};
}
const labelMonth=iso=>{const [y,m]=iso.split("-").map(Number);return new Intl.DateTimeFormat("uz-UZ",{month:"short",year:"numeric"}).format(new Date(y,m-1,1));};
export function renderSymptomInsights(checkins,today){
 const months=summarizeSymptoms(checkins,today),summary=overallSummary(months);
 const rows=months.map(x=>{
  const label=labelMonth(x.month),width=x.avgPain==null?0:Math.min(100,x.avgPain*10);
  const desc=x.avgPain==null?"og‘riq qaydi yo‘q":"o‘rtacha og‘riq "+x.avgPain+" / 10";
  return '<div class="insights-row"><span>'+label+'</span><div class="insights-track" role="img" aria-label="'+label+": "+desc+'"><span class="insights-fill" style="width:'+width+'%"></span></div><strong>'+(x.avgPain==null?"—":x.avgPain+"/10")+'</strong></div>';
 }).join("");
 return '<section class="card insights-card" aria-label="Alomatlar dinamikasi"><p class="eyebrow">SO‘NGGI 6 OY</p><h2>Alomatlar dinamikasi</h2><p class="muted" style="font-size:12px">Faqat kiritilgan qaydlar asosidagi statistika; tibbiy xulosa emas.</p><div class="insights-overview"><div><strong>'+summary.total+'</strong><span>Kundalik qaydlari</span></div><div><strong>'+summary.recordedMonths+'/6</strong><span>Qayd kiritilgan oylar</span></div><div><strong>'+summary.highPain+'</strong><span>8–10 ball og‘riq qaydlari</span></div></div><div class="insights-chart"><h3>Oylik o‘rtacha qayd etilgan og‘riq</h3>'+rows+'</div><p class="micro">'+(months.filter(x=>x.avgPain!==null).length<2?"Taqqoslash uchun kamida ikki oyda og‘riq qaydi kerak.":"Qiymatlar qayd kiritilgan kunlar uchun; qaydsiz kunlar hisobga olinmaydi.")+'</p><p class="insights-medical">⚕️ Kuchli og‘riq, ko‘p qon ketishi yoki hayzlar oralig‘ida qon kelishi kuzatilsa, shifokorga murojaat qiling. Qayd yo‘qligi alomat yo‘qligini bildirmaydi.</p></section>';
}
export const INSIGHT_CSS=".insights-card{margin-top:17px}.insights-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}.insights-overview>div{background:#fbf6f8;border:1px solid #f4e7ed;border-radius:13px;padding:13px 10px;display:grid;gap:6px}.insights-overview strong{font-size:23px;color:#a55d7e}.insights-overview span{font-size:10px;color:#786575;line-height:1.45}.insights-chart h3{font-size:13px;margin:16px 0 14px}.insights-row{display:grid;grid-template-columns:100px minmax(0,1fr) 55px;gap:11px;align-items:center;margin:11px 0;font-size:11px;color:#755e6e}.insights-row strong{text-align:right;color:#6b4b62}.insights-track{height:11px;background:#f5e7ed;border-radius:10px;overflow:hidden}.insights-fill{display:block;height:100%;background:linear-gradient(90deg,#dd91b1,#a95f86);border-radius:10px}.insights-medical{font-size:11px;padding:12px;border-left:3px solid #cbad85;border-radius:9px;background:#fff9f1;color:#6d5960;line-height:1.6}@media(max-width:450px){.insights-overview{gap:6px}.insights-overview strong{font-size:19px}.insights-row{grid-template-columns:85px minmax(0,1fr) 47px;gap:7px}}";
