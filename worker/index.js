// Healthy Women — source-backed Telegram FAQ bot. Preview: no patient records stored.
const SOURCES = [
  {key:"sikl", words:["sikl","muntazam","muddat","hayz"], title:"Hayz sikli", answer:"Kattalarda sikl ko‘pincha 21–35 kun davom etadi. U hayzning birinchi kunidan keyingi hayzning birinchi kunigacha hisoblanadi. O‘zgarishlar davom etsa, shifokorga murojaat qiling.", url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"},
  {key:"davomiylik", words:["davom","necha kun","7 kun","uzoq"], title:"Hayz davomiyligi", answer:"Hayz odatda 2–7 kun davom etadi. 7 kundan ortiq qon ketishi tibbiy baholashni talab qilishi mumkin.", url:"https://www.acog.org/womens-health/faqs/amenorrhea-absence-of-periods"},
  {key:"ogriq", words:["og‘riq","ogriq","qorin","sanchish"], title:"Hayz og‘rig‘i", answer:"Juda kuchli, odatdagidan farqli yoki kundalik hayotga xalaqit qiluvchi og‘riq bo‘lsa, shifokorga murojaat qiling.", url:"https://www.nhs.uk/symptoms/period-pain/"},
  {key:"qon", words:["qon","prokladka","laxta","kuchli"], title:"Ko‘p qon ketishi", answer:"Har soatda gigiyenik vositani almashtirishga to‘g‘ri kelishi, qon ketishi 7 kundan oshishi yoki bosh aylanishi baholashni talab qiladi. Holsizlik va nafas qisishi bilan kechadigan kuchli qon ketishda shoshilinch yordam oling.", url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"},
  {key:"kechikish", words:["kechik","kelmadi","homilador","test"], title:"Hayz kechikishi", answer:"Homiladorlik ehtimoli mavjud bo‘lsa, mos vaqtda homiladorlik testidan foydalaning. Kalendar natijasi homiladorlikni tasdiqlamaydi va kontratsepsiya usuli emas.", url:"https://www.acog.org/womens-health/faqs/your-first-period"},
  {key:"nomuntazam", words:["notekis","nomuntazam","o‘zgardi","o‘zgarish"], title:"Nomuntazam sikl", answer:"Siklning takroriy o‘zgarishi, hayzlar orasida qon kelishi yoki hayz bir necha oy bo‘lmasligi shifokor ko‘rigini talab qilishi mumkin.", url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"}
];
const urgent=/hushdan|hushsiz|nafas qis|juda kuchli og‘riq|qattiq og‘riq|qon.*bosh aylan|bosh aylan.*qon/i;
const json=(obj,status=200,extra={})=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...extra}});
function matches(q) {
  const query=String(q||"").toLocaleLowerCase("uz").trim().slice(0,180);
  if (!query) return [];
  return SOURCES.map(item=>({item,score:item.words.reduce((score,w)=>score+(query.includes(w)?1:0),0)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.item);
}
function originHeaders(req,env) {
  const origin=req.headers.get("origin");
  const allowed=String(env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim());
  return origin&&allowed.includes(origin)?{"access-control-allow-origin":origin,"vary":"Origin"}:{};
}
async function telegramAPI(env,method,body) {
  if (!env.BOT_TOKEN) throw Error("Bot token not configured");
  const r=await fetch("https://api.telegram.org/bot"+env.BOT_TOKEN+"/"+method,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  if (!r.ok) throw Error("Telegram request failed");
  const response=await r.json();
  if (!response.ok) throw Error("Telegram API returned an error");
  return response.result;
}
async function say(env,chat,text,keyboard) {
  return telegramAPI(env,"sendMessage",{chat_id:chat,text,disable_web_page_preview:true,...(keyboard?{reply_markup:keyboard}:{})});
}
function appButton(env) {
  try { const u=new URL(String(env.APP_URL||"")); if (u.protocol==="https:") return {inline_keyboard:[[{text:"🌷 Ilovani ochish",web_app:{url:u.href}}]]}; } catch {}
  return undefined;
}
const HELP="🌷 Healthy Women — Sog‘lom ayollar\n\nHayz kalendari va tibbiy manbalarga asoslangan qisqa ma’lumotlar.\n\n/start — bosh menyu\n/ask savol — bilimlar bazasidan qidirish\n/privacy — maxfiylik\n/delete — ma’lumotlar holati\n/remind — eslatmalar holati\n\n⚠️ Bu bot tashxis qo‘ymaydi. Shaxsiy tibbiy ma’lumotlarni bot chatiga kiritmang.";
async function handleUpdate(update,env) {
  const msg=update?.message;
  if (msg?.chat?.type!=="private" || !Number.isSafeInteger(msg.chat.id)) return;
  const chat=msg.chat.id, cmd=String(msg.text||"").trim().slice(0,250);
  if (cmd==="/start"||cmd==="/help") return say(env,chat,HELP,appButton(env));
  if (cmd==="/privacy") return say(env,chat,"🔒 Preview bot salomatlik tarixi va savollar jurnalini o‘z bazasida saqlamaydi. Telegramga yuborilgan xabarlar Telegram infratuzilmasidan o‘tadi. Saytdagi test ma’lumotlari qurilmaning brauzerida saqlanadi.");
  if (cmd==="/delete") return say(env,chat,"🔒 Bot serverida shaxsiy tibbiy qaydlar saqlanmaydi. Telegram chatini Telegram ilovasida va saytdagi test qaydlarini sayt sozlamalarida o‘chirishingiz mumkin.");
  if (cmd==="/remind"||cmd==="/stop") return say(env,chat,"🔔 Shaxsiy eslatmalar hozir yoqilmagan. Ular faqat maxfiylik tekshiruvi va foydalanuvchi roziligidan so‘ng ishga tushiriladi.");
  if (cmd==="/ask"||cmd.startsWith("/ask ")) {
    const question=cmd.slice(4).trim();
    if (!question) return say(env,chat,"Savol namunasi: /ask hayz og‘rig‘i");
    if (urgent.test(question)) return say(env,chat,"⚠️ Kuchli qon ketishi, hushdan ketish, nafas qisishi yoki juda kuchli og‘riqda tez tibbiy yordamga murojaat qiling. Chat orqali tashxis qo‘yib bo‘lmaydi.");
    const a=matches(question);
    return say(env,chat,a.length?a.map(x=>x.title+"\n"+x.answer+"\nManba: "+x.url).join("\n\n").slice(0,3400)+"\n\nBu tibbiy tashxis emas.":"Ushbu savol uchun tekshirilgan qisqa ma’lumot topilmadi. Shifokor bilan maslahatlashish mumkin.");
  }
  return say(env,chat,"Menyu: /start. Ma’lumot izlash: /ask savolingiz.",appButton(env));
}
export default {
  async fetch(req,env) {
    const url=new URL(req.url);
    try {
      if (url.pathname==="/health"&&req.method==="GET") return json({ok:true,app:"Healthy Women",health_data_collection:false});
      if (url.pathname==="/api/knowledge") {
        if (req.method==="OPTIONS") return new Response(null,{status:204,headers:{"access-control-allow-methods":"GET, OPTIONS",...originHeaders(req,env)}});
        if (req.method!=="GET") return json({error:"Method not allowed"},405);
        if (req.headers.get("origin")&&!originHeaders(req,env)["access-control-allow-origin"]) return json({error:"Forbidden"},403);
        const q=String(url.searchParams.get("q")||"").slice(0,180);
        return json({articles:urgent.test(q)?[]:matches(q),urgent:urgent.test(q),disclaimer:"Tashxis emas"},200,originHeaders(req,env));
      }
      if (url.pathname==="/webhook") {
        if (req.method!=="POST") return json({error:"Method not allowed"},405);
        if (!env.WEBHOOK_SECRET||req.headers.get("X-Telegram-Bot-Api-Secret-Token")!==env.WEBHOOK_SECRET) return json({error:"Forbidden"},403);
        if (Number(req.headers.get("content-length")||0)>65536) return json({error:"Too large"},413);
        const raw=await req.text();
        if (raw.length>65536) return json({error:"Too large"},413);
        let update; try { update=JSON.parse(raw); } catch { return json({error:"Invalid JSON"},400); }
        await handleUpdate(update,env); return json({ok:true});
      }
      if (url.pathname.startsWith("/api/")) return json({error:"Private synchronization disabled in preview"},503);
      return json({error:"Not found"},404);
    } catch(error) {
      console.error("Healthy Women request error");
      return json({error:"Service temporarily unavailable"},503);
    }
  }
};