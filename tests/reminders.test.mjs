import test from "node:test";
import assert from "node:assert/strict";
import {parseReminderTime,REMINDER_ID,REMINDER_KEY,setDailyReminder,cancelDailyReminder,storedReminder,nativeNotifications} from "../site/reminders.mjs";
const makeStore=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
test("reminder time and platform are validated",()=>{
 assert.deepEqual(parseReminderTime("20:30"),{hour:20,minute:30});
 assert.equal(parseReminderTime("24:01"),null);assert.equal(parseReminderTime("9:00"),null);
 assert.equal(nativeNotifications({Capacitor:{isNativePlatform:()=>false,Plugins:{LocalNotifications:{}}}}),null);
});
test("permission denial cannot schedule reminders",async()=>{
 const calls=[],storage=makeStore();
 const plugin={checkPermissions:async()=>({display:"denied"}),requestPermissions:async()=>({display:"denied"}),schedule:async()=>calls.push(1)};
 const r=await setDailyReminder("20:00",{plugin,storage});assert.equal(r.ok,false);assert.deepEqual(calls,[]);
});
test("opt in only schedules generic phone notification",async()=>{
 const events=[],storage=makeStore();
 const plugin={checkPermissions:async()=>({display:"granted"}),cancel:async x=>events.push(["cancel",x]),schedule:async x=>events.push(["schedule",x])};
 const r=await setDailyReminder("19:45",{plugin,storage});
 assert.equal(r.ok,true);assert.equal(storedReminder(storage),"19:45");
 assert.equal(events.length,2);const n=events[1][1].notifications[0];
 assert.equal(n.id,REMINDER_ID);assert.deepEqual(n.schedule.on,{hour:19,minute:45,second:0});
 assert(!/hayz|sikl|og‘riq|sana/i.test(n.body));
});
test("cancel removes exactly our notification and local preference",async()=>{
 const storage=makeStore();storage.setItem(REMINDER_KEY,JSON.stringify({enabled:true,time:"20:00"}));
 let cancelled;const r=await cancelDailyReminder({plugin:{cancel:async v=>cancelled=v},storage});
 assert.equal(r.ok,true);assert.equal(cancelled.notifications[0].id,REMINDER_ID);assert.equal(storedReminder(storage),null);
});
