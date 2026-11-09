// Local-only setup; do not commit or share environment secrets.
const token=process.env.BOT_TOKEN;
const secret=process.env.WEBHOOK_SECRET;
const raw=process.env.WORKER_URL;
if(!token||!secret||!raw)throw Error("Missing BOT_TOKEN, WEBHOOK_SECRET or WORKER_URL");
if(!/^[A-Za-z0-9_-]{1,256}$/.test(secret))throw Error("Invalid webhook secret");
const worker=new URL(raw);
if(worker.protocol!=="https:"||worker.username||worker.password)throw Error("Use a secure Worker URL");
async function telegram(method,data){
 const res=await fetch("https://api.telegram.org/bot"+token+"/"+method,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
 if(!res.ok)throw Error("Telegram request failed");
 const json=await res.json();if(!json.ok)throw Error("Telegram rejected "+method);
}
await telegram("setMyCommands",{commands:[
 {command:"start",description:"Healthy Women menyusi"},
 {command:"topics",description:"Mavzular"},
 {command:"ask",description:"Savolga javob"},
 {command:"sources",description:"Manbalar"},
 {command:"privacy",description:"Maxfiylik"},
 {command:"delete",description:"Ma’lumotlar"},
 {command:"remind",description:"Eslatmalar holati"}
]});
await telegram("setWebhook",{url:new URL("/webhook",worker).href,secret_token:secret,allowed_updates:["message","callback_query"],drop_pending_updates:false});
console.log("Healthy Women webhook registered. No secret was displayed.");
