// Healthy Women v0.9: screen privacy shield, not an authentication/encryption system.
// Screen hiding is cosmetic and does not encrypt at-rest localStorage.
export const SCREEN_PRIVACY_KEY="healthywomen.auto-mask.v1";
export function isAutoMaskEnabled(storage){
 try{return storage?.getItem(SCREEN_PRIVACY_KEY)!=="off";}catch{return true;}
}
export function setAutoMask(enabled,storage){
 if(typeof enabled!=="boolean")throw Error("Invalid preference");
 if(enabled)storage.removeItem(SCREEN_PRIVACY_KEY);
 else storage.setItem(SCREEN_PRIVACY_KEY,"off");
}
export function privacyShieldMarkup(){
 return '<div id="privacyShield" class="privacy-shield" hidden aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="privacyShieldTitle">'+
 '<div class="privacy-shield-card"><div class="privacy-shield-symbol" aria-hidden="true">✿</div><h2 id="privacyShieldTitle">Healthy Women</h2>'+
 '<p>Shaxsiy qaydlaringiz hozir ekranda yashirilgan.</p>'+
 '<button id="privacyReveal" type="button" class="privacy-shield-button">Ko‘rinishni ochish</button>'+
 '<small>Bu faqat ekran ko‘rinishini yashiradi. Qurilmadagi ma’lumotlar shifrlanmaydi va parol talab qilinmaydi.</small></div></div>';
}
export const PRIVACY_SHIELD_CSS=".privacy-shield[hidden]{display:none!important}.privacy-shield{position:fixed;inset:0;z-index:999999;background:linear-gradient(125deg,#f9e8ef,#f5effe);display:flex;align-items:center;justify-content:center;padding:22px}.privacy-shield-card{width:min(100%,410px);background:#fff;text-align:center;border:1px solid #e9d4e2;padding:38px 25px;border-radius:26px;box-shadow:0 18px 60px #95547120}.privacy-shield-symbol{font-size:45px;color:#b36585}.privacy-shield-card h2{margin:8px 0;color:#644153;font-size:25px}.privacy-shield-card p{font-size:14px;color:#745c6c;line-height:1.6}.privacy-shield-button{font:inherit;border:0;background:#a85c82;color:#fff;font-weight:700;cursor:pointer;border-radius:14px;padding:14px 24px;margin:12px 0;min-height:48px}.privacy-shield-card small{display:block;color:#826b79;font-size:11px;line-height:1.6;margin-top:10px}body.privacy-masked>.app-shell{visibility:hidden!important}";
export function createScreenPrivacy({doc=globalThis.document,win=globalThis.window,storage=globalThis.localStorage}={}){
 if(!doc?.body)throw Error("Document body required");
 const existing=doc.getElementById("privacyShield");
 if(!existing){const template=doc.createElement("template");template.innerHTML=privacyShieldMarkup();doc.body.append(template.content);}
 const shield=doc.getElementById("privacyShield"),reveal=doc.getElementById("privacyReveal");
 const app=doc.querySelector(".app-shell");
 let masked=false;
 const mask=()=>{
  if(masked)return;
  masked=true;shield.hidden=false;shield.setAttribute("aria-hidden","false");
  doc.body.classList.add("privacy-masked");
  if(app){app.inert=true;app.setAttribute("aria-hidden","true");}
  try{reveal.focus({preventScroll:true});}catch{}
 };
 const unmask=()=>{
  if(!masked)return;
  masked=false;
  if(app){app.inert=false;app.removeAttribute("aria-hidden");}
  doc.body.classList.remove("privacy-masked");
  shield.hidden=true;shield.setAttribute("aria-hidden","true");
 };
 reveal.addEventListener("click",unmask);
 const onVisibility=()=>{if(doc.hidden&&isAutoMaskEnabled(storage))mask();};
 const onPageHide=()=>{if(isAutoMaskEnabled(storage))mask();};
 doc.addEventListener("visibilitychange",onVisibility);
 win.addEventListener("pagehide",onPageHide);
 const destroy=()=>{doc.removeEventListener("visibilitychange",onVisibility);win.removeEventListener("pagehide",onPageHide);reveal.removeEventListener("click",unmask);unmask();};
 return {mask,unmask,destroy,isMasked:()=>masked};
}
