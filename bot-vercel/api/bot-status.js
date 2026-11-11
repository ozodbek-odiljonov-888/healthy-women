// Public bot diagnostics. Only public bot username and booleans; NEVER token, webhook URL or Telegram errors.
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
async function telegramRead(token,method,fetchFn){
 const r=await fetchFn("https://api.telegram.org/bot"+token+"/"+method,{
  method:"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(7000)});
 if(!r.ok)return null;
 const result=await r.json();
 return result?.ok===true?result.result:null;
}
export async function getTelegramBotStatus(request,{env=process.env,fetchFn=fetch}={}){
 if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405,headers:{...headers,Allow:"GET"}});
 const token=env.BOT_TOKEN;
 if(typeof token!=="string"||!/^[0-9]{5,16}:[A-Za-z0-9_-]{30,}$/.test(token))
  return Response.json({configured:false,online:false,webhookReady:false,username:null},
   {status:200,headers});
 try{
  const [bot,hook]=await Promise.all([
   telegramRead(token,"getMe",fetchFn),telegramRead(token,"getWebhookInfo",fetchFn)]);
  const username=typeof bot?.username==="string"&&/^[a-zA-Z0-9_]{5,32}$/.test(bot.username)?bot.username:null;
  const registered=typeof hook?.url==="string"&&
   ["https://healthy-women-bot.vercel.app/webhook","https://healthy-women-bot.vercel.app/api/webhook"].includes(hook.url);
  return Response.json({configured:true,online:!!username,webhookReady:registered,
   username,hasRecentDeliveryError:!!hook?.last_error_date}, {status:200,headers});
 }catch{
  return Response.json({configured:true,online:false,webhookReady:false,
   username:null,diagnostic:"Telegram temporarily unreachable"}, {status:200,headers});
 }
}
export default {fetch(request){return getTelegramBotStatus(request,{env:process.env})}};
