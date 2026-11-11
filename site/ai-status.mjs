// Opt-in status check. No diary, names, raw questions or health history are transmitted.
export const AI_STATUS_URL="https://healthy-women-bot.vercel.app/api/ai-status";
export async function checkAiAvailability({fetchFn=fetch}={}){
 try{
  const res=await fetchFn(AI_STATUS_URL,{method:"GET",cache:"no-store",credentials:"omit",redirect:"error",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(7000)});
  if(!res.ok)return {enabled:false,checked:true,reason:"AI serveri javob bermadi. Offline javobdan foydalaning."};
  const result=await res.json();
  if(!result||typeof result.enabled!=="boolean")throw Error("invalid response");
  return {enabled:result.enabled===true&&result.freeTierVerified===true,checked:true,reason:result.enabled?"Bepul AI tekshirildi.":"Haqiqiy AI hozircha serverda yoqilmagan. Offline javob mavjud."};
 }catch{return {enabled:false,checked:true,reason:"Server holatini tekshirib bo‘lmadi. Offline javob mavjud."};
 }
}
