// Healthy Women v1.24 — a local, read-only release readiness report.
// The report MUST NOT invent clinical or physical-device approvals, inspect
// private patient data, use the network, deploy, or modify provider settings.
import {existsSync,readFileSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import {validateMedicalReviewSignoffs} from "./clinical-review.mjs";
import {auditMedicalSourceURLs} from "./medical-source-audit.mjs";

export const PREFLIGHT_SCHEMA="healthy-women-release-preflight-v1";
const rootDefault=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const status=(id,result,explanation)=>({id,result,explanation});
const read=(file)=>readFileSync(file,"utf8");
function reviewedFile(path){
 if(!existsSync(path))return null;
 try{return JSON.parse(read(path));}
 catch{return null;}
}
const safetyFlags=Object.freeze({
 clinical:"50 must be approved by a real qualified clinician; the file's structural validity does not authenticate their identity.",
 devices:"The app must be checked on two separate physical devices with a verified encrypted backup and restore.",
 security:"An independent privacy/security review and incident/retention controls are still required.",
 billing:"Confirm Vercel Hobby and Neon Free plans, their current quota settings and zero paid add-ons in the owner dashboards.",
 rollout:"A reversible, user-authorized production rollout has not occurred; production must not be assumed updated."
});
export function buildReleasePreflight({root=rootDefault,signoffPath=join(root,"medical-clinical-review.json")}={}){
 const checks=[];
 const sources=auditMedicalSourceURLs();
 const sourceCount=sources.rows.length;
 const sourceSafe=sourceCount===50&&sources.totals.invalid_domains===0;
 checks.push(status("medical_source_inventory",sourceSafe?"PASS":"BLOCKED",
  "50 topics must use approved HTTPS source origins. Opened links are not a clinical signoff."));
 const clinicalFile=reviewedFile(signoffPath);
 const clinicalReport=validateMedicalReviewSignoffs(clinicalFile);
 const reviewValid=clinicalReport.ready===true&&clinicalReport.approved===50;
 checks.push(status("clinical_form_structure",reviewValid?"VALID_BUT_UNVERIFIED":"BLOCKED",
  reviewValid?"All 50 signoff rows match the current code, but reviewer credentials must be independently verified."
  :"Missing, incomplete, outdated or unapproved clinical signoff rows."));

 const configFile=join(root,"site/config.js");
 const appFile=join(root,"site/app.mjs");
 const apiFile=join(root,"bot-vercel/api/sync.js");
 let staticSafe=false;
 try{
  const config=read(configFile),app=read(appFile),api=read(apiFile);
  staticSafe=config.trim()==='window.HEALTHY_WOMEN_API="";\nwindow.HEALTHY_WOMEN_AI_API="";'
   &&app.includes("async function syncData(){ /* fail closed: no plaintext health-data network sync */ return; }")
   &&api.includes('env?.SYNC_API_MODE!=="staging"')
   &&api.includes('host!=="healthy-women-bot.vercel.app"');
 }catch{}
 checks.push(status("code_sync_disabled",staticSafe?"PASS":"BLOCKED",
  "Static source check only: active client has no cloud sync; staging API must remain forbidden on production hostname."));
 checks.push(status("human_clinician_identity", "MANUAL_REQUIRED",safetyFlags.clinical));
 checks.push(status("physical_devices_and_recovery","MANUAL_REQUIRED",safetyFlags.devices));
 checks.push(status("independent_privacy_review","MANUAL_REQUIRED",safetyFlags.security));
 checks.push(status("provider_free_plan_confirmation","MANUAL_REQUIRED",safetyFlags.billing));
 checks.push(status("production_rollout","NOT_PERFORMED",safetyFlags.rollout));
 const blockers=checks.filter(x=>x.result!=="PASS").map(x=>x.id);
 // Never auto-clear externally verified clinical qualifications, cost state,
 // or physical-device/production checks from a self-supplied JSON file.
 return {
  schema:PREFLIGHT_SCHEMA,
  status:"BLOCKED_PENDING_HUMAN_VERIFICATION",
  ready_for_public_release:false,
  source_topics:sourceCount,
  clinical_structurally_approved:clinicalReport.approved,
  clinical_total:clinicalReport.total,
  private_patient_records_accessed:false,
  cloud_or_paid_api_called:false,
  checks,
  blockers,
  next_actions:[
   "Provide the downloadable 50-topic clinician review pack to a qualified clinician.",
   "Verify actual clinician identity and review decisions outside the application.",
   "Test encryption, recovery and erasure on two physical devices using fictional data.",
   "Complete independent health-data privacy/security assessment.",
   "Reconfirm the live provider billing plans and ceilings before any rollout.",
   "Only after the above: review merge order and arrange an approved reversible release."
  ]
 };
}
