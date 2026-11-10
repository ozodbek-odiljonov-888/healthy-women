// Healthy Women v1.10 — PostgreSQL/Neon storage adapter.
// NOT a public API. Requires a reviewed server-only PostgreSQL connection.
// No raw health information or encryption password is accepted here.
import {validateOpaqueEnvelope} from "./opaque-sync-contract.js";

const ID_MAX=Number.MAX_SAFE_INTEGER;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SELECT_SQL = `
 SELECT revision::text AS revision, deleted, envelope
 FROM hw_private.opaque_snapshots
 WHERE telegram_user_id = $1::bigint
 LIMIT 1
`;

// One SQL statement, atomic under concurrent writes even across Vercel instances.
// Expected revision=NULL permits creating a NEW row only.
// Existing deleted rows are never updated, even with the latest revision.
const CAS_SQL = `
 INSERT INTO hw_private.opaque_snapshots AS existing
   (telegram_user_id, revision, deleted, envelope)
 VALUES ($1::bigint, $2::uuid, $3::boolean, $4::jsonb)
 ON CONFLICT (telegram_user_id) DO UPDATE
 SET revision = EXCLUDED.revision,
     deleted = EXCLUDED.deleted,
     envelope = EXCLUDED.envelope,
     updated_at = CURRENT_TIMESTAMP
 WHERE existing.revision IS NOT DISTINCT FROM $5::uuid
   AND existing.deleted = false
 RETURNING revision::text AS revision
`;

const invalid=()=>new Error("Invalid encrypted storage operation");
function accountId(value){
 if(!Number.isSafeInteger(value)||value<=0||value>ID_MAX)throw invalid();
 return String(value);
}
function revision(value,allowNull=false){
 if(allowNull&&value===null)return null;
 if(typeof value!=="string"||!UUID.test(value))throw invalid();
 return value;
}
function resultRows(value){
 if(!Array.isArray(value))throw Error("Database response is unavailable");
 return value;
}
/**
 * Factory accepts Neon's parameterized sql.query(statement, parameters).
 * Caller is responsible for never exposing DATABASE_URL to the browser.
 * Connection objects / credentials are not stored in module globals.
 */
export function createNeonStorageAdapter(sql){
 if(!sql||typeof sql.query!=="function")throw new Error("Parameterized Neon query function required");
 return {
  async read(userId){
   const id=accountId(userId);
   const rows=resultRows(await sql.query(SELECT_SQL,[id]));
   if(rows.length===0)return null;
   if(rows.length!==1)throw Error("Duplicate database identity");
   const row=rows[0];
   const idOfRevision=revision(row.revision);
   if(row.deleted===true){
    if(row.envelope!==null)throw Error("Invalid deleted database row");
    return {revision:idOfRevision,deleted:true};
   }
   if(row.deleted!==false)throw Error("Invalid deletion state");
   const envelope=validateOpaqueEnvelope(row.envelope);
   return {revision:idOfRevision,deleted:false,envelope};
  },
  async compareAndSwap(userId,expectedRevision,newRecord){
   const id=accountId(userId);
   const expected=revision(expectedRevision,true);
   if(!newRecord||typeof newRecord!=="object")throw invalid();
   const nextRevision=revision(newRecord.revision);
   if(newRecord.deleted!==true&&newRecord.deleted!==false)throw invalid();
   const isDeleted=newRecord.deleted;
   if(isDeleted&&Object.hasOwn(newRecord,"envelope"))throw invalid();
   const clean=isDeleted?null:validateOpaqueEnvelope(newRecord.envelope);
   // Send ciphertext as one JSON string parameter; no dynamic SQL fragments.
   const json=clean===null?null:JSON.stringify(clean);
   const rows=resultRows(await sql.query(CAS_SQL,[id,nextRevision,isDeleted,json,expected]));
   if(rows.length>1)throw Error("Unexpected database revision state");
   return rows.length===1&&rows[0]?.revision===nextRevision;
  }
 };
}

export const STORAGE_SQL={select:SELECT_SQL,compareAndSwap:CAS_SQL};
