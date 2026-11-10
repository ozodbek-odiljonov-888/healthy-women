// Healthy Women v1.25: offline-only descriptive health analytics, never a diagnosis.
import {summarizeSymptoms,overallSummary} from "./insights.mjs";
import {formatUzChartMonth} from "./date-uz.mjs";
const MONTHS=new Set([3,6,12]);
const moodNames={good:"Yaxshi",neutral:"O‘rtacha",low:"Tushkun",anxious:"Bezovta"};
const flowNames={none:"Yo‘q",light:"Kam",normal:"O‘rtacha",heavy:"Ko‘p","very-heavy":"Juda ko‘p"};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const validDay=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
const monthName=key=>formatUzChartMonth(key);
export function buildAnalytics(a,today,months=6){
 if(!MONTHS.has(months)||!validDay(today))throw Error("Invalid analytics period");
 const checkins=(Array.isArray(a?.checkins)?a.checkins:[]).filter(c=>c&&validDay(c.date)&&c.date<=today);
 const monthly=summarizeSymptoms(checkins,today,months),summary=overallSummary(monthly);
 const recent=checkins.filter(c=>c.date>=monthly[0].month+"-01");
 const moodCounts=Object.fromEntries(Object.keys(moodNames).map(k=>[k,0]));
 const flowCounts=Object.fromEntries(Object.keys(flowNames).map(k=>[k,0]));
 const pains=[];
 for(const c of recent){
  if(Object.hasOwn(moodCounts,c.mood))moodCounts[c.mood]++;
  if(Object.hasOwn(flowCounts,c.flow))flowCounts[c.flow]++;
  if(Number.isInteger(c.pain)&&c.pain>=0&&c.pain<=10)pains.push(c.pain);
 }
 const spans=(Array.isArray(a?.spans)?a.spans:[]).filter(v=>Number.isInteger(v)&&v>=15&&v<=90).sort((a,b)=>a-b),mid=Math.floor(spans.length/2);
 const median=spans.length?(spans.length%2?spans[mid]:Math.round((spans[mid-1]+spans[mid])/2)):null;
 const indicators=[];
 for(const [label,value] of [["Kuchli og‘riq qaydlari",summary.highPain],["Ko‘p qon ketishi qaydlari",summary.heavyFlow],["Hayzlararo qon kelishi",summary.betweenBleeding]])if(value>0)indicators.push({label,value});
 return {months,series:monthly.map(b=>({month:b.month,label:monthName(b.month),count:b.count,avgPain:b.avgPain})),total:summary.total,activeMonths:summary.recordedMonths,
  avgPain:pains.length?Math.round(pains.reduce((a,b)=>a+b,0)/pains.length*10)/10:null,
  highPain:summary.highPain,heavyFlow:summary.heavyFlow,betweenBleeding:summary.betweenBleeding,
  moodCounts,flowCounts,measured:spans.length>0,cycleMedian:median,cycleCount:spans.length,
  cycleVariability:spans.length?a?.variability:null,
  completion:summary.recordedMonths===months?"To‘liqroq tarix mavjud":summary.recordedMonths?"Qisman ma’lumot mavjud":"Hali qayd kiritilmagan",
  indicators};
}
function columns(series,kind){
 const max=kind==="pain"?10:Math.max(1,...series.map(s=>s.count));
 return series.map(s=>{
  const value=kind==="pain"?s.avgPain:s.count,height=value==null?0:Math.round(value/max*100);
  const spoken=kind==="pain"?(value==null?"ma’lumot yo‘q":"o‘rtacha og‘riq "+value+"/10"):(value+" ta qayd");
  return `<div class="pro-bar-item" title="${esc(s.label+": "+spoken)}"><div class="pro-bar-shell"><div class="pro-bar-fill ${kind==="pain"?"pro-bar-pain":""}" style="height:${height}%"></div></div><span class="pro-bar-label">${esc(s.label)}</span><small>${value==null?"—":esc(value)}</small></div>`;
 }).join("");
}
function rows(data,labels){
 const total=Object.values(data).reduce((s,n)=>s+n,0);
 return Object.keys(labels).map(k=>`<div class="pro-hbar-row"><span>${esc(labels[k])}</span><div class="pro-hbar"><i style="width:${total?Math.round(data[k]/total*100):0}%"></i></div><strong>${data[k]}</strong></div>`).join("");
}
export function renderAnalyticsHTML(d){
 const metrics=[
  ["Kunlik qaydlar",d.total,"Tanlangan davrda"],
  ["Og‘riq o‘rtachasi",d.avgPain==null?"—":d.avgPain+"/10","Qayd etilgan kunlarda"],
  ["O‘rtacha sikl",d.measured?d.cycleMedian+" kun":"—",d.measured?d.cycleCount+" sikl oralig‘ida hisoblangan":"Kamida 2 ta hayz sanasi kerak"],
  ["Qamrov",d.activeMonths+" / "+d.months+" oy",d.completion]
 ];
 return `<div class="pro-analytics">
  <div class="pro-intro"><div><p class="eyebrow">SHAXSIY SALOMATLIK TAHLILI</p><h2>O‘zgarishlarni yaxshiroq tushuning</h2><p>Qaydlaringiz asosidagi statistik kuzatuvlar. Barcha qiymatlar faqat <strong>kiritilgan kunlar</strong> uchun hisoblangan.</p></div><div class="pro-trust-chip">◈ Faqat qurilmangizda</div></div>
  <div class="pro-filter-row" role="group" aria-label="Tahlil davri"><span>Tahlil davri</span><div class="pro-segments">${[3,6,12].map(n=>`<button type="button" data-analytics-months="${n}" class="${n===d.months?"selected":""}" aria-pressed="${n===d.months}">${n} oy</button>`).join("")}</div></div>
  <div class="pro-metrics">${metrics.map(([name,value,sub])=>`<article><span>${esc(name)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></article>`).join("")}</div>
  <div class="pro-analysis-grid">
   <article class="pro-analysis-card"><header><div><p class="eyebrow">DINAMIKA</p><h3>Oylik qaydlar</h3></div><span class="pro-card-icon">▥</span></header><div class="pro-bars" data-months="${d.months}" role="img" aria-label="Oylik qaydlar soni">${columns(d.series,"count")}</div><p class="pro-footnote">Qayd yo‘q oyda 0 chiqadi. Bu alomat bo‘lmaganini bildirmaydi.</p></article>
   <article class="pro-analysis-card"><header><div><p class="eyebrow">OG‘RIQ KUZATUVI</p><h3>Og‘riq darajasi</h3></div><span class="pro-card-icon">◈</span></header><div class="pro-bars" data-months="${d.months}" role="img" aria-label="O‘rtacha qayd etilgan og‘riq">${columns(d.series,"pain")}</div><p class="pro-footnote">0 — og‘riq yo‘q; 10 — eng kuchli. “—” — ma’lumot yo‘q.</p></article>
   <article class="pro-analysis-card"><header><div><p class="eyebrow">HISSIY HOLAT</p><h3>Kayfiyat taqsimoti</h3></div><span class="pro-card-icon">♡</span></header><div class="pro-hbars">${rows(d.moodCounts,moodNames)}</div><p class="pro-footnote">O‘zgarishlarning sababini bu grafik aniqlamaydi.</p></article>
   <article class="pro-analysis-card"><header><div><p class="eyebrow">KUZATUV</p><h3>Qon ketishi qaydlari</h3></div><span class="pro-card-icon">◉</span></header><div class="pro-hbars">${rows(d.flowCounts,flowNames)}</div><p class="pro-footnote">Har bir satr — kundalikka kiritilgan kuzatuvlar soni.</p></article>
  </div>
  <div class="pro-summary-block"><div><h3>Diqqatga sazovor qaydlar</h3>${d.indicators.length?d.indicators.map(v=>`<div class="pro-flag"><span>⚑ ${esc(v.label)}</span><strong>${v.value} ta</strong></div>`).join(""):"<p>Bu davrda qayd topilmadi. Bu alomatlar yo‘qligini isbotlamaydi.</p>"}<p class="pro-safety-note">Juda kuchli og‘riq, ko‘p qon ketishi, hushdan ketish yoki homiladorlik ehtimoli bilan birga qorin og‘rig‘i bo‘lsa, tez tibbiy yordamga murojaat qiling.</p></div>
   <div class="pro-summary-actions"><h3>Keyingi qadam</h3><p>Yangi alomat yozing yoki sikl taqvimini oching.</p><button class="button primary full" type="button" data-go="journal">＋ Kundalikka qayd</button><button class="button ghost full" type="button" data-go="calendar">▦ Sikl kalendari</button><p class="pro-footnote">Bu ilova tashxis qo‘ymaydi, dori tavsiya qilmaydi va homiladorlikdan saqlanish vositasi emas.</p></div></div>
 </div>`;
}
