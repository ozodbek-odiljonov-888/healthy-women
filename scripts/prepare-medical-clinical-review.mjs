// Generate local 50-topic human-review form. Default: 0/50 approved.
// Never edit this script to fabricate a clinician's review.
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {createMedicalReviewTemplate} from "./lib/clinical-review.mjs";

const path=resolve(process.argv[2]||"medical-clinical-review-draft.json");
writeFileSync(path,JSON.stringify(createMedicalReviewTemplate(),null,2)+"\n",{encoding:"utf8",flag:"wx"});
console.log("Created an unapproved clinical review template at "+path);
console.log("Human validation required: 50 separate topics, checked against their sources.");
