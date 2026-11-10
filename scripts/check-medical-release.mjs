// A human must review evidence before the draft medical module is released.
// If there are no 50 valid topic approvals, this intentionally exits nonzero.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {validateMedicalReviewSignoffs} from "./lib/clinical-review.mjs";

const location=resolve(process.argv[2]||"medical-clinical-review.json");
let data;
try{data=JSON.parse(readFileSync(location,"utf8"));}
catch{
 console.error("BLOCKED: missing or unreadable clinical sign-off JSON.");
 console.error("To prepare a draft: node scripts/prepare-medical-clinical-review.mjs");
 process.exitCode=1;
}
if(data){
 const report=validateMedicalReviewSignoffs(data);
 if(!report.ready){
  console.error("BLOCKED: only "+report.approved+"/"+report.total+" topics have complete, matching clinician review.");
  for(const issue of report.issues.slice(0,12))console.error(" - "+issue);
  if(report.issues.length>12)console.error(" - ... "+(report.issues.length-12)+" additional issues");
  process.exitCode=1;
 }else{
  console.log("STRUCTURAL CHECK PASSED: "+report.approved+"/"+report.total+" topic signoffs match current sources.");
  console.log("IMPORTANT: separately confirm the real clinician's identity and editorial decision before publishing.");
 }
}
