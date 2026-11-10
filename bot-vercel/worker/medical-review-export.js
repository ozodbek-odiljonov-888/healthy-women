// Healthy Women: offline clinical-review export, no network/secret access.
// All question rows are synthetic. Clinician approval is NOT implicit.
import {MEDICAL_TOPICS,TRAINING_UTTERANCES_500} from "./medical-qa.js";

const COLUMNS=Object.freeze([
 "topic_key","topic_title","synthetic_question","prepared_education_answer",
 "public_medical_source","clinical_review_status","reviewer","reviewed_on",
 "notes"
]);
const defaultStatus="PENDING_CLINICAL_REVIEW";

function csvCell(value){
 let s=String(value??"");
 // Prevent formula execution in spreadsheet apps if future data changes.
 if(/^[\s]*[=+@-]/.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
}
export function makeMedicalReviewRows(){
 const rows=[];
 for(const topic of MEDICAL_TOPICS){
  const questions=TRAINING_UTTERANCES_500[topic.key];
  if(!Array.isArray(questions)||questions.length!==10)
   throw Error("Review corpus is incomplete");
  for(const question of questions){
   rows.push({
    topic_key:topic.key,topic_title:topic.title,synthetic_question:question,
    prepared_education_answer:topic.answer,public_medical_source:topic.url,
    clinical_review_status:defaultStatus,reviewer:"",reviewed_on:"",notes:""
   });
  }
 }
 if(rows.length!==500)throw Error("Unexpected review row count");
 return rows;
}
export function exportMedicalReviewCSV(){
 const rows=[COLUMNS,...makeMedicalReviewRows().map(row=>COLUMNS.map(key=>row[key]))];
 return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
