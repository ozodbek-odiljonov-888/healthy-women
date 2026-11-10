// This CLI creates a local, unapproved clinical editorial queue, never uploads it.
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {buildEditorialMatrix,exportEditorialMatrixCSV} from "./lib/medical-editorial-matrix.mjs";
const destination=resolve(process.argv[2]||"healthy-women-medical-editorial-v118.csv");
if(!destination.toLowerCase().endsWith(".csv"))throw Error("Expected a local CSV output path");
const {counts}=buildEditorialMatrix();
writeFileSync(destination,exportEditorialMatrixCSV(),{encoding:"utf8",flag:"wx"});
console.log("Created 50-row PENDING_CLINICAL_REVIEW queue: "+destination);
console.log("Priority groups (editorial only): "+JSON.stringify(counts));
console.log("Review each claim, locale, risks and source manually. No AI API invoked.");
