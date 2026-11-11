// Zero-billing AI readiness only: no model call, no quota reservation, no personal health data.
import {aiConfigReady,allowedOrigin} from "./ai.js";
const HEADERS={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Vary":"Origin"};
export function getAiStatus(request,{env=process.env}={}){
 const origin=request.headers.get("Origin")||"";
 const cors=allowedOrigin(env,origin)?{"Access-Control-Allow-Origin":origin}:{};
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...HEADERS,...cors,"Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Max-Age":"0"}});
 if(request.method!=="GET")return Response.json({error:"Method not allowed"},{status:405,headers:{...HEADERS,...cors,Allow:"GET, OPTIONS"}});
 const enabled=aiConfigReady(env);
 return Response.json({enabled,scope:"public-education-only",topics:10,freeTierVerified:env.AI_FREE_TIER_NO_BILLING==="CONFIRMED"&&enabled,
  warning:enabled?"Faqat umumiy mavzular; shaxsiy ma'lumot yubormang.":"AI hali faollashtirilmagan. Offline javoblar mavjud."},
 {status:200,headers:{...HEADERS,...cors}});
}
export default {fetch(request){return getAiStatus(request,{env:process.env})}};
