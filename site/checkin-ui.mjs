import {selectCheckinPhase,validatePhaseEntry,riskAdvice,daysBetween} from "./checkins.mjs";
export const PROMPT_PREF_KEY="healthywomen.phase-prompts.v1";
const css=".phase-card{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:23px;margin:20px 0;background:linear-gradient(115deg,#fff0f3,#f6effe);border:1px solid #eedce5;border-radius:20px;box-shadow:0 14px 36px #a35d7910}.phase-card h2{font-size:19px;margin:8px 0}.phase-card p{font-size:13px;line-height:1.55;color:#705d69;margin:7px 0}.phase-card small{display:block;color:#897784;font-size:11px}.phase-card button{min-height:43px;white-space:nowrap}.phase-kicker{font-weight:800;letter-spacing:.08em;font-size:10px;color:#ae5d80}.phase-dialog{border:0;border-radius:22px;max-height:90dvh;overflow:auto;width:min(94vw,530px);padding:0;background:#fff;box-shadow:0 23px 85px #42283b45;color:#3d3140}.phase-dialog::backdrop{background:#29182795}.phase-form{padding:24px}.phase-form h2{font-size:21px;margin:8px 0}.phase-form p{line-height:1.65}.phase-fields{display:grid;gap:14px;margin:20px 0}.phase-fields label{font-size:13px;line-height:1.5}.phase-fields input[type=range]{width:100%;accent-color:#b36a88}.phase-fields .form-field{display:grid;gap:6px}.phase-fields select,.phase-fields textarea,.phase-fields input[type=date]{padding:12px;border:1px solid #e5d8de;border-radius:11px;background:#fff;width:100%;color:#473843}.phase-check{display:flex;align-items:flex-start;gap:9px}.phase-check input{accent-color:#a45a7a;margin-top:3px;flex:0 0 auto}.phase-extra{padding:13px;background:#fcf7f9;border-radius:13px;display:grid;gap:12px}.phase-extra[hidden],.phase-end-date[hidden]{display:none}.phase-note{font-size:11px;background:#fff9ed;border-left:3px solid #cba171;padding:12px;border-radius:8px;color:#6a5964}.phase-error{min-height:15px;color:#a12850;font-size:12px}.phase-form .modal-actions{display:flex;justify-content:flex-end;gap:10px}@media(max-width:640px){.phase-card{display:block;padding:20px}.phase-card button{width:100%;white-space:normal;margin-top:14px}.phase-form{padding:19px}}";
function ensureStyles(){if(typeof document==="undefined"||document.getElementById("phaseStyles"))return;const style=document.createElement("style");style.id="phaseStyles";style.textContent=css;document.head.appendChild(style);}
const escapeText=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function renderCheckinCard(periods,checkins,today,avg){
 if(typeof localStorage!=="undefined"&&localStorage.getItem(PROMPT_PREF_KEY)==="off")return "";
 const phase=selectCheckinPhase(periods,checkins,today,avg);
 if(!phase)return "";
 ensureStyles();
 return '<section class="phase-card" aria-label="Sikl davridagi savollar"><div><span class="phase-kicker">✿ SIKLINGIZ BO‘YICHA SAVOLLAR</span><h2>'+escapeText(phase.title)+'</h2><p>'+escapeText(phase.description)+'</p><small>Savollar faqat ilova ochiq bo‘lganda ko‘rsatiladi; fon rejimidagi push hozircha mavjud emas.</small></div><button type="button" class="button primary" id="phaseOpen">Javob berish →</button></section>';
}
const dialogMarkup=[
 '<dialog id="phaseDialog" class="phase-dialog" aria-labelledby="phaseTitle"><form id="phaseForm" class="phase-form">',
 '<span class="phase-kicker">HEALTHY WOMEN · SHAXSIY KUNDALIK</span><h2 id="phaseTitle">Qisqa savollar</h2><p id="phaseDescription">Bugungi holatingizni qayd eting.</p>',
 '<div class="phase-fields">',
 '<label class="form-field">Og‘riq (0–10): <strong id="phasePainValue">0/10</strong><input id="phasePain" type="range" name="pain" min="0" max="10" step="1" value="0"/></label>',
 '<label class="form-field">Qon ketishi<select id="phaseFlow" name="flow" required><option value="none">Yo‘q</option><option value="light">Kam</option><option value="normal">O‘rtacha</option><option value="heavy">Ko‘p</option><option value="very-heavy">Juda ko‘p</option></select></label>',
 '<label class="form-field">Kayfiyat<select name="mood" required><option value="good">Yaxshi</option><option value="neutral" selected>O‘rtacha</option><option value="low">Tushkun</option><option value="anxious">Bezovta</option></select></label>',
 '<label class="phase-check"><input type="checkbox" name="hourly"/> Gigiyenik vosita har soatda to‘lib qolmoqda</label>',
 '<label class="phase-check"><input type="checkbox" name="dizzy"/> Bosh aylanishi yoki kuchli holsizlik bor</label>',
 '<label class="phase-check"><input type="checkbox" name="between"/> Hayzlar oralig‘ida qon kelgan</label>',
 '<div id="phaseEndBox" class="phase-extra" hidden><label class="form-field">Hayz tugadimi?<select id="phaseEnded" name="ended"><option value="">Tanlang</option><option value="yes">Ha, tugadi</option><option value="no">Yo‘q, davom etmoqda</option></select></label><label id="phaseEndDateWrap" class="form-field phase-end-date" hidden>Hayz tugagan sana<input id="phaseEndDate" name="endDate" type="date"/></label></div>',
 '<label class="form-field">Qo‘shimcha belgilar (ixtiyoriy)<textarea name="note" maxlength="400" rows="3" placeholder="Masalan: charchoq, bosh og‘rig‘i, uyqu..."></textarea></label>',
 '</div><p class="phase-note">⚕️ Tibbiy tashxis emas. Juda ko‘p qon ketishi, hushdan ketish yoki kuchli og‘riqda shoshilinch tibbiy yordamga murojaat qiling.</p><p id="phaseError" class="phase-error" role="alert"></p>',
 '<div class="modal-actions"><button type="button" id="phaseCancel" class="button ghost">Bekor qilish</button><button type="submit" class="button primary">✓ Qaydni saqlash</button></div></form></dialog>'
].join("");
function ensureDialog(){if(document.getElementById("phaseDialog"))return;const tpl=document.createElement("template");tpl.innerHTML=dialogMarkup;document.body.appendChild(tpl.content);}
export function openCheckinDialog({periods,checkins,today,average,getLatest,savePeriod,saveCheckin,notify}){
 const phase=selectCheckinPhase(periods,checkins,today,average);
 if(!phase)return;
 ensureStyles();ensureDialog();
 const get=id=>document.getElementById(id),dialog=get("phaseDialog"),form=get("phaseForm");
 form.reset();dialog.dataset.phase=phase.phase;dialog.dataset.periodId=String(phase.period.id||"");
 get("phaseTitle").textContent=phase.title;get("phaseDescription").textContent=phase.description;
 get("phaseError").textContent="";get("phasePainValue").textContent="0/10";
 get("phaseFlow").value=phase.phase==="start"?"normal":"none";
 get("phaseEndBox").hidden=phase.phase!=="end";get("phaseEnded").required=phase.phase==="end";get("phaseEnded").value=phase.period.end?"yes":"";
 get("phaseEndDateWrap").hidden=!phase.period.end;get("phaseEndDate").required=!!phase.period.end;get("phaseEndDate").min=phase.period.start;get("phaseEndDate").max=today;get("phaseEndDate").value=phase.period.end||today;
 get("phaseCancel").onclick=()=>dialog.close();
 get("phasePain").oninput=e=>{get("phasePainValue").textContent=e.target.value+"/10";};
 get("phaseEnded").onchange=e=>{const ended=e.target.value==="yes";get("phaseEndDateWrap").hidden=!ended;get("phaseEndDate").required=ended;};
 form.onsubmit=e=>{
  e.preventDefault();
  const current=getLatest();
  if(!current||current.id!==phase.period.id){get("phaseError").textContent="Hayz qaydi yangilandi. Savolnomani qayta oching.";return;}
  const data=new FormData(form),ended=phase.phase==="end"&&data.get("ended")==="yes";
  if(phase.phase==="end"&&phase.period.end&&!ended){get("phaseError").textContent="Avval saqlangan tugash sanasini o‘zgartirish uchun kalendarga o‘ting.";return;}
  if(phase.phase==="end"&&!["yes","no"].includes(data.get("ended"))){get("phaseError").textContent="Hayz tugaganmi, tanlang.";return;}
  const entry={date:today,periodStart:current.start,phase:phase.phase==="end"&&!ended?"end-followup":phase.phase,
   pain:Number(data.get("pain")),flow:String(data.get("flow")),mood:String(data.get("mood")),
   hourly:data.has("hourly"),dizzy:data.has("dizzy"),between:data.has("between"),note:String(data.get("note")||"").slice(0,400),
   ...(ended?{endDate:String(data.get("endDate")||"")}:{})};
  if(!validatePhaseEntry(entry,today)){get("phaseError").textContent="Javoblar yoki sanalar to‘g‘ri kiritilmagan.";return;}
  if(ended&&daysBetween(current.start,entry.endDate)>30){get("phaseError").textContent="30 kundan ortiq davom etgan qon ketishi bo‘yicha shifokor bilan maslahatlashib, sanani tekshiring.";return;}
  dialog.close();
  if(ended)savePeriod(current.id,{start:current.start,end:entry.endDate});
  saveCheckin(entry);
  const warning=riskAdvice(entry);
  if(warning.level==="routine")notify("Savollar kundalikka saqlandi.");
  else window.alert(warning.text+"\nManba: "+warning.url);
 };
 dialog.showModal();
}
