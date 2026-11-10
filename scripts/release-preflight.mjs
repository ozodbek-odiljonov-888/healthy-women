// Display a conservative release report; never connect to live accounts.
// Usage: node scripts/release-preflight.mjs [--json] [--strict] [--signoff PATH]
// --strict deliberately exits 2 while any human release prerequisite remains.
import {resolve} from "node:path";
import {buildReleasePreflight} from "./lib/release-preflight.mjs";

const args=process.argv.slice(2);
const flags=new Set();
let signoffPath;
for(let i=0;i<args.length;i++){
 const arg=args[i];
 if(arg==="--json"||arg==="--strict"){
  if(flags.has(arg))throw Error("Duplicate argument");
  flags.add(arg);
 }else if(arg==="--signoff"){
  if(signoffPath!==undefined||!args[i+1]||args[i+1].startsWith("--"))
   throw Error("Expected exactly one --signoff PATH");
  signoffPath=resolve(args[++i]);
 }else{
  throw Error("Unknown argument: "+arg);
 }
}
const report=buildReleasePreflight(signoffPath?{signoffPath}:{});
if(flags.has("--json")){
 process.stdout.write(JSON.stringify(report,null,2)+"\n");
}else{
 console.log("Healthy Women — RELIZGA TAYYORLIK: BLOKLANGAN");
 console.log("Manbalar:",report.source_topics,"| Klinik shaklan tasdiqlangan:",report.clinical_structurally_approved+"/"+report.clinical_total);
 for(const check of report.checks)console.log(" - "+check.id+": "+check.result);
 console.log("Shifokor va qurilma tasdiqlarini kod o‘zi berolmaydi.");
 console.log("Bu skript internetga chiqmaydi va ilovani joylashtirmaydi.");
}
if(flags.has("--strict")&&!report.ready_for_public_release)process.exitCode=2;
