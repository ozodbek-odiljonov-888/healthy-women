// Fixed, public educational questions only. Never interpolate user input into a model prompt.
export const AI_TOPICS=Object.freeze({
 cycle:{question:"Hayz sikli qanday hisoblanadi va qachon shifokor bilan maslahatlashish kerak?",source:"ACOG",url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"},
 duration:{question:"Hayz qon ketishi odatda qancha davom etadi va uzoq davom etsa nima qilish kerak?",source:"ACOG",url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"},
 pain:{question:"Hayz og‘rig‘i haqida umumiy xavfsiz ta'limiy ma'lumot bering. Qachon shifokorga murojaat qilish kerak?",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/"},
 heavy:{question:"Juda ko‘p hayz qon ketishi nima va qanday holatlarda shoshilinch yordam zarur?",source:"ACOG",url:"https://www.acog.org/womens-health/faqs/abnormal-uterine-bleeding"},
 irregular:{question:"Nomuntazam hayz siklining umumiy sabablari va shifokor ko‘rigiga murojaat qilish holatlari nimalar?",source:"NHS",url:"https://www.nhs.uk/symptoms/irregular-periods/"},
 pregnancy:{question:"Hayz kechikishining turli sabablari va homiladorlik ehtimoli bo‘lsa umumiy maslahatlar nimalar?",source:"NHS",url:"https://www.nhs.uk/symptoms/irregular-periods/"},
 between:{question:"Hayzlar oralig‘ida qon kelishi haqida umumiy ma'lumot va shoshilinch belgilar nimalar?",source:"NHS",url:"https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/"},
 pcos:{question:"Polikistoz tuxumdon sindromi PCOS haqida umumiy ma'lumot bering, tashxis qo‘ymang.",source:"NHS",url:"https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/"},
 endo:{question:"Endometrioz va kuchli hayz og‘rig‘i haqida umumiy ta'limiy ma'lumot bering.",source:"NHS",url:"https://www.nhs.uk/conditions/endometriosis/"},
 selfcare:{question:"Hayz og‘rig‘ini yengillashtirishning umumiy xavfsiz turmush tarzi usullari haqida ayting.",source:"NHS",url:"https://www.nhs.uk/symptoms/period-pain/"}
});
export const AI_MODEL="gemini-3.1-flash-lite";
export const AI_LIMITS=Object.freeze({perClientDay:3,perClientMinute:1,globalDay:30,globalMonth:300,globalLifetime:1000,maxOutputTokens:220});
