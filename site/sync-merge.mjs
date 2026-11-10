// Healthy Women v1.9 — client-only, conservative offline snapshot reconciliation.
// Never resolve changed/deleted diary entries automatically by wall-clock time.
import {validateBackupEvents} from "./vault.mjs";

const order=(a,b)=>a.id.localeCompare(b.id,"en");
function input(localEvents,remoteEvents){
 const local=validateBackupEvents(localEvents),remote=validateBackupEvents(remoteEvents);
 const lm=new Map(local.map(entry=>[entry.id,entry]));
 const rm=new Map(remote.map(entry=>[entry.id,entry]));
 const ids=[...new Set([...lm.keys(),...rm.keys()])].sort();
 const conflicts=ids.filter(id=>lm.has(id)&&rm.has(id)
  && JSON.stringify(lm.get(id))!==JSON.stringify(rm.get(id)));
 return {lm,rm,ids,conflicts};
}

/**
 * A deleted entry is a tombstone, not an absent entry. Any concurrent
 * difference (including tombstone/live) requires an explicit decision.
 * No changes are applied when a conflict is present.
 */
export function planSyncMerge(localEvents,remoteEvents){
 const {lm,rm,ids,conflicts}=input(localEvents,remoteEvents);
 if(conflicts.length)return {safeToApply:false,conflictIds:conflicts,mergedEvents:null};
 const merged=ids.map(id=>lm.get(id)||rm.get(id)).sort(order);
 return {safeToApply:true,conflictIds:[],mergedEvents:merged};
}

/**
 * Explicit conflict resolution must be supplied separately after displaying
 * a review UI. This helper is not an automatic policy or user consent.
 * resolutions is an object keyed by event ID: "local" or "remote".
 */
export function mergeWithExplicitChoices(localEvents,remoteEvents,resolutions){
 const {lm,rm,ids,conflicts}=input(localEvents,remoteEvents);
 if(!resolutions||typeof resolutions!=="object"||Array.isArray(resolutions))throw Error("Sinxronlashda ziddiyat bo‘yicha tanlov kerak.");
 const chosen=new Map();
 for(const id of conflicts){
  const selected=Object.hasOwn(resolutions,id)?resolutions[id]:null;
  if(selected!=="local"&&selected!=="remote")throw Error("Sinxronlashda ziddiyat bo‘yicha tanlov kerak.");
  chosen.set(id,selected==="local"?lm.get(id):rm.get(id));
 }
 if(Object.keys(resolutions).some(id=>!conflicts.includes(id)))
  throw Error("Notanish yoki ziddiyatsiz qaydga tanlov kiritilgan.");
 return ids.map(id=>chosen.get(id)||lm.get(id)||rm.get(id)).sort(order);
}
