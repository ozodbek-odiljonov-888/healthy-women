// Offline CSV generator for human review of 50 source-backed topics.
// Does NOT auto-approve content or send any data to cloud services.
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {exportMedicalEditorialCSV,getMedicalEditorialSummary} from "./lib/medical-editorial-v118.mjs";

const output=resolve(process.argv[2]||"medical-editorial-v118.csv");
writeFileSync(output,exportMedicalEditorialCSV(),{encoding:"utf8",flag:"wx"});
const summary=getMedicalEditorialSummary();
console.log("Created 50-topic review table at "+output);
console.log("Higher review priority: "+summary.high_priority+" topics");
console.log("Uzbekistan policy check: "+summary.requires_local_protocol+" topics");
console.log("Clinically approved: 0/50 — all entries require independent human review");
