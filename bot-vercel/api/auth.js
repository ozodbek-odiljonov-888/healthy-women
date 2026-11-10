// Stateless, read-only Telegram authentication probe.
// No health records, password, secret, session token or Telegram initData is stored.
import {verifyTelegramInitData} from "../worker/telegram-auth.js";

const TRUSTED_ORIGIN = "https://healthy-women.vercel.app";
const SAFE_HEADERS = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Vary": "Origin"
};
function headers(origin, extra={}) {
  return {...SAFE_HEADERS, ...(origin === TRUSTED_ORIGIN ? {
    "Access-Control-Allow-Origin": origin
  } : {}), ...extra};
}
function json(payload, status, origin, extra={}) {
  return new Response(JSON.stringify(payload), {status, headers:headers(origin, extra)});
}
export async function handleAuthRequest(request,{botToken,nowMs}={}) {
  const origin=request.headers.get("Origin");
  // A browser Origin header is not authentication. It merely limits browser access.
  if (origin && origin !== TRUSTED_ORIGIN) return json({error:"Forbidden"},403,origin);
  if (request.method === "OPTIONS") {
    if (!origin) return json({error:"Forbidden"},403,origin);
    return new Response(null,{status:204,headers:headers(origin,{
      "Access-Control-Allow-Headers":"X-Telegram-Init-Data",
      "Access-Control-Allow-Methods":"POST, OPTIONS",
      "Access-Control-Max-Age":"0"
    })});
  }
  if (request.method !== "POST") return json({error:"Method not allowed"},405,origin,{"Allow":"POST, OPTIONS"});
  if (!botToken) return json({error:"Service unavailable"},503,origin);
  if (Number(request.headers.get("content-length")||0) > 0 || request.body !== null) {
    return json({error:"Unexpected request body"},400,origin);
  }
  const raw=request.headers.get("X-Telegram-Init-Data");
  try {
    await verifyTelegramInitData(raw,botToken,{nowMs});
  } catch {
    return json({authenticated:false,error:"Unauthorized"},401,origin);
  }
  // Intentionally never echo user identifiers, names, initData or medical records.
  return json({authenticated:true,features:{cloudSync:false}},200,origin);
}
export default {
  fetch(request) {
    return handleAuthRequest(request,{botToken:process.env.BOT_TOKEN});
  }
};
