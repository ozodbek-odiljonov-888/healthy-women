// Private staging quota adapter; never imported by live FAQ webhook.
import {getNeonSqlFromEnv} from "./neon-provider.js";
import {createStagingRequestLimiter} from "./staging-quota.js";

/** Fail closed if the protected Neon connection or quotas are unavailable. */
export async function createNeonStagingLimiterFromEnv(
 env,loadDriver=()=>import("@neondatabase/serverless")
){
 const sql=await getNeonSqlFromEnv(env,loadDriver);
 return createStagingRequestLimiter(sql);
}
