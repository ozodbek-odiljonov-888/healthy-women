// Optional future Neon connector: used by server code only, never by web/PWA.
// This module is NOT imported by current bot endpoints.
import {createNeonStorageAdapter} from "./neon-storage.js";

/** No secret is logged or returned. Test code can inject an isolated driver. */
export async function createNeonStorageFromEnv(env,loadDriver=()=>import("@neondatabase/serverless")){
 const raw=env?.DATABASE_URL;
 if(typeof raw!=="string"||raw.length>4096)throw Error("Neon database connection is not configured");
 let url;
 try{url=new URL(raw);}catch{throw Error("Invalid Neon database connection");}
 if(!["postgres:","postgresql:"].includes(url.protocol)
    ||!/\.neon\.tech$/i.test(url.hostname)
    ||!url.username||!url.password||url.pathname.length<2
    ||url.searchParams.get("sslmode")==="disable")
  throw Error("Neon PostgreSQL URL must be server-only and use secure transport");
 const module=await loadDriver();
 if(typeof module?.neon!=="function")throw Error("Neon driver unavailable");
 const sql=module.neon(raw);
 return createNeonStorageAdapter(sql);
}
