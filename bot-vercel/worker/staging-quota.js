// Healthy Women v1.12 — $0 staging protection: atomic per-day request quotas.
// No paid Redis, cron job, analytics or IP tracking. This is NOT a DDoS firewall.
// Each signed user has one opaque row, plus one global row; counters rotate daily.
// No client plaintext, Telegram initData, IP address or authentication key stored.
const UTF8 = new TextEncoder();
const QUOTA_SQL = `
 INSERT INTO hw_private.sync_request_quota AS existing
    (scope_key, window_day, used, touched_at)
 VALUES ($1::text, $2::integer, 1, CURRENT_TIMESTAMP)
 ON CONFLICT (scope_key) DO UPDATE
 SET window_day = EXCLUDED.window_day,
     used = CASE WHEN existing.window_day = EXCLUDED.window_day
                 THEN existing.used + 1 ELSE 1 END,
     touched_at = CURRENT_TIMESTAMP
 WHERE existing.window_day <> EXCLUDED.window_day OR existing.used < $3::integer
 RETURNING used
`;

export const STAGING_QUOTAS = Object.freeze({globalPerDay:60,userPerDay:12,maxUsers:5});

function assertDayAndLimits(nowMs, limits){
 if(!Number.isFinite(nowMs)||nowMs<0
   ||!Number.isSafeInteger(limits.globalPerDay)||limits.globalPerDay<1||limits.globalPerDay>1000
   ||!Number.isSafeInteger(limits.userPerDay)||limits.userPerDay<1||limits.userPerDay>100
   ||limits.userPerDay>limits.globalPerDay)throw Error("Unsafe staging quota");
 const day=Math.floor(nowMs/86400000);
 if(!Number.isSafeInteger(day)||day>2147483647)throw Error("Invalid quota date");
 return day;
}

async function pseudonymousKey(userId,botToken){
 if(!Number.isSafeInteger(userId)||userId<=0
   ||typeof botToken!=="string"||botToken.length<32
   ||!globalThis.crypto?.subtle)throw Error("Invalid staging quota identity");
 const cryptoKey=await crypto.subtle.importKey(
  "raw",UTF8.encode(botToken),{name:"HMAC",hash:"SHA-256"},false,["sign"]
 );
 const signature=new Uint8Array(await crypto.subtle.sign(
  "HMAC",cryptoKey,UTF8.encode("healthy-women/staging-quota/v1/"+userId)
 ));
 return "u:"+Array.from(signature,b=>b.toString(16).padStart(2,"0")).join("");
}

function acceptedRows(result){
 if(!Array.isArray(result)||result.length>1)throw Error("Staging quota database failure");
 if(result.length===0)return false;
 if(!Number.isSafeInteger(Number(result[0]?.used)))throw Error("Staging quota invalid response");
 return true;
}

/**
 * `sql.query` must execute each parameterized SQL as a single PostgreSQL
 * statement (so concurrent upserts serialize on the scope's primary key).
 * The global token is consumed first: even denied per-user requests count
 * against the global safety budget. This is intentional fail-closed behavior.
 */
export function createStagingRequestLimiter(sql,{limits=STAGING_QUOTAS}={}){
 if(!sql||typeof sql.query!=="function")throw Error("Staging quota DB unavailable");
 if(!limits||!Number.isSafeInteger(limits.globalPerDay)||limits.globalPerDay<1
   ||limits.globalPerDay>1000||!Number.isSafeInteger(limits.userPerDay)
   ||limits.userPerDay<1||limits.userPerDay>100
   ||limits.userPerDay>limits.globalPerDay)throw Error("Unsafe staging quota");
 return {
  async consume({userId,botToken,nowMs=Date.now()}={}){
   const day=assertDayAndLimits(nowMs,limits);
   const userScope=await pseudonymousKey(userId,botToken);
   const retryAfterSeconds=Math.max(1,Math.ceil(((day+1)*86400000-nowMs)/1000));
   const global=acceptedRows(await sql.query(QUOTA_SQL,["global",day,limits.globalPerDay]));
   if(!global)return {allowed:false,retryAfterSeconds};
   const user=acceptedRows(await sql.query(QUOTA_SQL,[userScope,day,limits.userPerDay]));
   return user?{allowed:true}:{allowed:false,retryAfterSeconds};
  }
 };
}
export const QUOTA_STATEMENT = QUOTA_SQL;
