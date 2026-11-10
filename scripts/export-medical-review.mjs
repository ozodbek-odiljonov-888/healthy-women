// Produce a review-ready CSV locally; no external APIs, network or secrets.
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {exportMedicalReviewCSV} from "../bot-vercel/worker/medical-review-export.js";

const destination=resolve(process.argv[2]||"medical-review-v115.csv");
writeFileSync(destination,exportMedicalReviewCSV(),{encoding:"utf8",flag:"w"});
console.log("Wrote review CSV with 500 synthetic educational questions: "+destination);
console.log("IMPORTANT: every record starts as PENDING_CLINICAL_REVIEW.");
