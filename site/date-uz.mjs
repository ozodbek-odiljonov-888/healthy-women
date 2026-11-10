// Deterministic Uzbek date labels: avoid incomplete ICU locale data (e.g. "M11").
import {validDay} from "./cycle-safety.mjs";
export const MONTHS_UZ=["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const SHORT_UZ=["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"];
const WEEKDAYS_UZ=["yakshanba","dushanba","seshanba","chorshanba","payshanba","juma","shanba"];
export function formatUzDate(iso,opt={day:"numeric",month:"long"}){
 if(!validDay(iso))return "—";
 const [year,mon,day]=iso.split("-").map(Number);
 const month=opt.month==="short"?SHORT_UZ[mon-1]:MONTHS_UZ[mon-1];
 const hasDay=!!opt.day,hasMonth=!!opt.month,hasYear=!!opt.year;
 const prefix=opt.weekday?WEEKDAYS_UZ[new Date(iso+"T12:00:00Z").getUTCDay()]+", ":"";
 const date=hasDay?(opt.day==="2-digit"?String(day).padStart(2,"0"):String(day)):"";
 let label=hasDay&&hasMonth?date+"-"+month:hasDay?date:hasMonth?month:"";
 if(hasYear)label+=(label?" ":"")+(opt.year==="2-digit"?"'"+String(year).slice(-2):String(year));
 return prefix+(label||iso);
}
export function formatUzMonth(date){
 if(!(date instanceof Date)||Number.isNaN(date.valueOf()))return "—";
 const name=MONTHS_UZ[date.getMonth()];
 return name[0].toUpperCase()+name.slice(1)+" "+date.getFullYear();
}
export function formatUzChartMonth(yyyyMM){
 if(typeof yyyyMM!=="string"||!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(yyyyMM))return "—";
 return SHORT_UZ[Number(yyyyMM.slice(5))-1]+" '"+yyyyMM.slice(2,4);
}
