// Healthy Women — validated on-device daily diary entries. No network access.
import {validDay} from "./cycle-safety.mjs";
export const DIARY_FLOWS=["none","light","normal","heavy","very-heavy"];
export const DIARY_MOODS=["good","neutral","low","anxious"];
export function validateDiaryEntry(entry,today){
 if(!entry||!validDay(today)||!validDay(entry.date)||entry.date>today)return {ok:false,message:"Kundalik sanasini tekshiring; kelajakdagi sana qabul qilinmaydi."};
 const pain=Number(entry.pain);
 if(!Number.isInteger(pain)||pain<0||pain>10)return {ok:false,message:"Og‘riq darajasi 0–10 orasida bo‘lishi kerak."};
 if(!DIARY_FLOWS.includes(entry.flow)||!DIARY_MOODS.includes(entry.mood))return {ok:false,message:"Qon miqdori yoki kayfiyat javobini tekshiring."};
 if(typeof entry.note!=="string"||entry.note.length>600)return {ok:false,message:"Qo‘shimcha belgilar 600 belgidan oshmasin."};
 if(typeof entry.between!=="boolean")return {ok:false,message:"Kutilmagan qon ketishi haqidagi javob noto‘g‘ri."};
 return {ok:true,value:{date:entry.date,pain,flow:entry.flow,mood:entry.mood,note:entry.note,between:entry.between}};
}
export function editableDiaryForDate(checkins,date,editingId=null){
 if(!validDay(date))return null;
 const entries=(Array.isArray(checkins)?checkins:[]).filter(x=>x&&x.date===date&&!x.phase&&x.id!==editingId);
 return entries.sort((a,b)=>Number(b.updated_at||0)-Number(a.updated_at||0))[0]||null;
}
export function diaryById(checkins,id){
 if(typeof id!=="string"||!id)return null;
 return (Array.isArray(checkins)?checkins:[]).find(x=>x?.id===id&&!x.phase)||null;
}
