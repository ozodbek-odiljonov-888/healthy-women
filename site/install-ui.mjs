// Healthy Women: install controls; no network, storage, tracking or paid services.
export function createInstallUi({win=window,doc=document}={}){
 let prompt=null,installed=false;
 const isStandalone=()=>win.matchMedia?.('(display-mode: standalone)')?.matches===true||win.navigator?.standalone===true;
 function refresh(){
  const button=doc.getElementById('installPwaButton');
  const status=doc.getElementById('installPwaStatus');
  if(!button||!status)return;
  button.hidden=!prompt||installed||isStandalone();button.disabled=false;
  status.textContent=installed||isStandalone()
   ?'Ilova allaqachon o‘rnatilgan yoki mustaqil oynada ochilgan.'
   :prompt?'Brauzer o‘rnatishni qo‘llab-quvvatlaydi. Quyidagi tugmani bosing.'
   :'Android Chrome: menyu → Ilovani o‘rnatish. iPhone Safari: Ulashish → Bosh ekranga qo‘shish. Ba’zi brauzerlarda tugma ko‘rinmasligi odatiy hol.';
 }
 function onPrompt(e){e.preventDefault();prompt=e;refresh();}
 win.addEventListener('beforeinstallprompt',onPrompt);
 win.addEventListener('appinstalled',()=>{installed=true;prompt=null;refresh();});
 async function install(){
  const current=prompt;prompt=null;refresh();
  if(!current)return false;
  try{
   await current.prompt();
   const choice=await current.userChoice;
   if(choice?.outcome==='accepted'){installed=true;refresh();return true;}
  }catch{}
  refresh();return false;
 }
 return {
  bind(){refresh();doc.getElementById('installPwaButton')?.addEventListener('click',install);},
  state(){return {available:!!prompt,installed:installed||isStandalone()};}
 };
}
export function installCardHtml(){return `<div class="card install-card"><p class="eyebrow">TELEFONGA O‘RNATISH</p><h2>Ilovani telefonda ochish</h2><p class="muted">Healthy Women’ni mos brauzerda bosh ekranga joylashtirishingiz mumkin. Ilova uchun Play Market hisobini ulash shart emas.</p><button type="button" class="button primary" id="installPwaButton" hidden>↓ Ilovani o‘rnatish</button><p id="installPwaStatus" class="micro" role="status"></p><p class="micro">⚠️ PWA o‘rnatish Android APK bilan bir xil emas. Offline kesh ilk tashrif va tegishli ruxsatlardan keyin ishlaydi.</p></div>`;}
