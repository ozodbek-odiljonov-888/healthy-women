// Read-only extraction of Telegram Mini App launch data.
// This value is UNTRUSTED until bot-server HMAC verification succeeds.
// Never write it to localStorage, logs, analytics or URL query strings.
export function getRawTelegramInitData(win) {
  try {
    const fromSdk=win?.Telegram?.WebApp?.initData;
    if(typeof fromSdk==="string" && fromSdk.length<=8192 && /(?:^|&)hash=/.test(fromSdk))return fromSdk;
    const hash=win?.location?.hash;
    if(typeof hash!=="string" || hash.length>24000)return "";
    const raw=new URLSearchParams(hash.startsWith("#")?hash.slice(1):hash).get("tgWebAppData");
    if(typeof raw!=="string" || !raw.length || raw.length>8192)return "";
    return /(?:^|&)hash=/.test(raw)?raw:"";
  }catch {return "";}
}
