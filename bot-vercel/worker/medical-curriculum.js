// Healthy Women: manually reviewed, synthetic Uzbek question patterns.
// Rule-based retrieval, NOT machine-learning training. No real conversations.
// Each topic has a public clinical source; editorial clinical review is still required.
export const ADDITIONAL_MEDICAL_TOPICS=Object.freeze([
 {key:"birinchi_hayz",title:"Birinchi hayz (menarxe)",
  words:["birinchi hayz","ilk hayz","birinchi marta hayz","menarxe","hayz boshlanmadi","hayz boshlanmagan"],
  answer:"Birinchi hayz odatda o‘smirlik davrida boshlanadi. Agar 15 yoshga to‘lganda ham hayz boshlanmagan bo‘lsa, shifokor bilan maslahatlashish kerak. Dastlabki yillarda sikl o‘zgaruvchan bo‘lishi mumkin.",
  url:"https://www.acog.org/womens-health/faqs/your-first-period"},
 {key:"oraliq_qon",title:"Hayzlar orasida yoki aloqadan keyin qon kelishi",
  words:["hayz orasida qon","hayzlar orasida qon","oraliqda qon","hayzdan tashqari qon","jinsiy aloqadan keyin qon","aloqadan keyin qon","qonli ajralma","doglanish","qonli dog"],
  answer:"Hayzlar orasida yoki jinsiy aloqadan keyin qon kelishining turli sabablari bor. Takrorlansa yoki yangidan boshlangan bo‘lsa, ginekolog ko‘rigidan o‘tish kerak. Agar hayz kechikishi bilan birga qorin og‘rig‘i ham bo‘lsa, tez tibbiy ko‘rik zarur.",
  url:"https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/"},
 {key:"ajralma",title:"Vaginal ajralma",
  words:["vaginal ajralma","qin ajralmasi","qindan ajralma","oq ajralma","sargish ajralma","ajralma hid","ajralma rangi","ajralma normal","ajralma kelmoqda"],
  answer:"Tiniq yoki oq, yoqimsiz hidsiz ajralma ko‘pincha normal bo‘ladi. Rang, hid yoki tuzilishi o‘zgarsa, qichishish, og‘riq yoki qon ketishi bo‘lsa, shifokor ko‘rigidan o‘ting. O‘zboshimchalik bilan antibiotik qo‘llamang.",
  url:"https://www.nhs.uk/symptoms/vaginal-discharge/"},
 {key:"vaginit",title:"Qin qichishishi va vaginit",
  words:["qin qichish","qichishish","vaginit","kandidoz","kandidozis","zamburug","qin achish","jinsiy azo qichish","qin yalliglan"],
  answer:"Qin qichishishi yoki achishishi zamburug‘, vaginit, tirnashish va boshqa holatlar bilan bog‘liq bo‘lishi mumkin. Faqat alomatga qarab sababini aniqlab bo‘lmaydi. Ajralma o‘zgarsa, og‘riq yoki isitma bo‘lsa, tibbiy ko‘rikka murojaat qiling.",
  url:"https://www.nhs.uk/conditions/vaginitis/"},
 {key:"siydik_yoli",title:"Siydik yo‘li infeksiyasi belgilari",
  words:["siydik achish","siyganda achish","siydik yonish","siyganda ogri","tez tez siy","tez siyish","sistit","tsistit","siydik yoli infeks","siydik pufagi"],
  answer:"Siydik chiqarganda achishish, tez-tez siyish va pastki qorin bezovtaligi siydik yo‘li infeksiyasida uchrashi mumkin, ammo boshqa sabablar ham bor. Isitma, belning yon tomonida og‘riq, homiladorlik yoki siydikda qon bo‘lsa tezroq ko‘rik kerak. Antibiotikni bot tanlamaydi.",
  url:"https://www.nhs.uk/conditions/urinary-tract-infections-utis/"},
 {key:"pcos",title:"Polikistoz tuxumdon sindromi (PCOS)",
  words:["pcos","polikistoz","polikistik tuxumdon","tuxumdon sindromi","tuxumdon kistalari","ortiqcha tuk","girsutizm"],
  answer:"PCOS deb atalgan gormonal holatda hayzlar nomuntazam bo‘lishi, husnbuzar, ortiqcha tuklanish yoki homilador bo‘lishda qiyinchilik kuzatilishi mumkin. Bu belgilar boshqa sabablar bilan ham bog‘liq; tekshiruvni ginekolog yoki endokrinolog belgilaydi.",
  url:"https://www.nhs.uk/conditions/polyendocrine-metabolic-ovarian-syndrome-pmos/"},
 {key:"mioma",title:"Bachadon miomasi",
  words:["mioma","fibroma","fibroid","bachadon osmasi","bachadon tuguni","bachadonda tugun"],
  answer:"Mioma — bachadonning odatda xavfsiz (saraton bo‘lmagan) o‘smasi. Ba’zida alomatsiz kechadi, ba’zida ko‘p hayz, chanoq og‘rig‘i yoki tez-tez siyish kuzatiladi. Aniqlash uchun shifokor tekshiruvi va zarur bo‘lsa UTT qo‘llanadi.",
  url:"https://www.nhs.uk/conditions/Fibroids/"},
 {key:"tezkor_himoya",title:"Shoshilinch kontratsepsiya",
  words:["favqulodda kontratsepsiya","shoshilinch kontratsepsiya","himoyasiz aloqa","prezervativ yirtil","ertasi kuni tabletka","ertalabgi tabletka","homiladorlikdan favqulodda saqlanish"],
  answer:"Himoyasiz jinsiy aloqadan yoki kontratsepsiya muvaffaqiyatsiz bo‘lganidan keyin shoshilinch kontratsepsiya mavjud. Usulga qarab 3–5 kun ichida qo‘llanadi; imkon qadar tezroq shifokor yoki farmatsevt bilan maslahatlashish muhim. Bot dori yoki dozani tanlamaydi.",
  url:"https://www.nhs.uk/contraception/emergency-contraception/"},
 {key:"gigiyena",title:"Hayz paytida gigiyena",
  words:["hayz gigiyena","hayzda gigiyena","prokladka almashtirish","prokladkani qachon","tampon qancha vaqt","tampon almashtirish","hayz vaqtida yuvin","menstrual cup gigiyena","hayz mahsulotlari"],
  answer:"Hayz paytida gigiyena vositalarini ishlab chiqaruvchi ko‘rsatmasiga muvofiq va to‘lganda o‘z vaqtida almashtiring. Qo‘llarni yuvish va tashqi jinsiy a’zolarni ehtiyotkorlik bilan tozalash yetarli; qin ichini yuvish tavsiya etilmaydi. Tampon yoki menstrual kubokdan foydalanganda to‘satdan isitma, qusish, toshma yoki og‘ir holsizlik bo‘lsa, shoshilinch tibbiy yordam oling.",
  url:"https://www.acog.org/womens-health/faqs/your-first-period"}
]);

// Real users' medical questions must never be uploaded into this fixture.
// Multiple alternative phrasings per topic are intentionally hand-authored.
export const TRAINING_UTTERANCES=Object.freeze({
 sikl:[
  "Hayz sikli necha kun?", "Sikl 28 kundan uzun bo‘lsa normalmi?",
  "Menstrual sikl qanday hisoblanadi?", "Hayz oralig‘i odatda qancha?",
  "Siklning birinchi kuni qaysi?", "Hayz har necha kunda keladi?"
 ],
 davomiylik:[
  "Hayz necha kun davom etadi?", "Hayz 7 kundan oshsa nima qilish kerak?",
  "Hayz qancha kun bo‘ladi?", "Hayzim tugamayapti",
  "Hayz davomiyligi normasi qanday?", "Hayz necha kunda to‘xtaydi?"
 ],
 ogriq:[
  "Hayz paytida qorin og‘rishi normalmi?", "Hayz og‘rig‘ini qanday yengillashtirish mumkin?",
  "Hayzim kelganda belim og‘riydi", "Dismenoreya nima?",
  "Hayzda qornim sanchiydi", "Hayz og‘rig‘i qancha davom etadi?"
 ],
 qon:[
  "Ko‘p qon ketishi nimadan bo‘lishi mumkin?", "Hayz qoni ko‘p kelyapti",
  "Hayzimda katta laxtalar kelmoqda", "Hayzda qon qancha ketishi normal?",
  "Prokladka tez to‘lyapti, bu normalmi?", "Hayz juda ko‘p kelsa nima qilaman?"
 ],
 kechikish:[
  "Hayzim kechikyapti, nima qilish kerak?", "Hayz 10 kunga kechiksa nima bo‘ladi?",
  "Hayzim kelmayapti", "Hayz kelmasa homilador bo‘lamanmi?",
  "Stressdan hayz kechikishi mumkinmi?", "Hayz to‘xtab qoldi nima sabab?"
 ],
 nomuntazam:[
  "Siklim nomuntazam bo‘lib qoldi", "Hayz muntazam emas, nega?",
  "Hayzlarim tartibsiz kelyapti", "Menstrual sikl notekis",
  "Sikl doim o‘zgarib turadi", "Hayz sanalari o‘zgarishi normalmi?"
 ],
 test:[
  "Homiladorlik testi qachon qilinadi?", "Test manfiy chiqsa nima qilaman?",
  "Hayz kechiksa testni qachon qilish kerak?", "Test natijasi qachon aniq bo‘ladi?",
  "Uyda homiladorlik testini qanday qilaman?", "Himoyasiz aloqadan keyin test qachon?"
 ],
 ovulyatsiya:[
  "Ovulyatsiya qachon bo‘ladi?", "Serhosil kunlar qaysilar?",
  "Fertil davr nima?", "Tuxum hujayra qachon chiqadi?",
  "Sikl davomida ovulyatsiya qanday hisoblanadi?", "Ovulyatsiya kalendariga ishonsa bo‘ladimi?"
 ],
 pms:[
  "PMS nima?", "Hayz oldi sindromi belgilari",
  "Hayzdan oldin kayfiyatim o‘zgaradi", "Hayz oldidan ko‘kragim sezgir bo‘ladi",
  "Hayz oldidan shishish normalmi?", "Hayz oldi bezovtaligini kamaytirish"
 ],
 menopauza:[
  "Menopauza belgilari qanday?", "Klimaks qachon boshlanadi?",
  "Perimenopauza nima?", "Issiq bosishi menopauzadanmi?",
  "Menopauzada hayz qanday o‘zgaradi?", "Menopauza qaysi yoshda?"
 ],
 endometrioz:[
  "Endometrioz nima?", "Endometrioz belgilari qanaqa?",
  "Endometrioz hayz og‘rig‘i bilan bog‘liqmi?", "Endometriosis degani nima?",
  "Endometriozda qorin og‘riydimi?", "Endometrioz haqida ma’lumot"
 ],
 birinchi_hayz:[
  "Birinchi hayz qachon boshlanadi?", "Ilk hayzda nima qilish kerak?",
  "Menarxe nima?", "15 yoshda hayz boshlanmagan bo‘lsa-chi?",
  "Birinchi marta hayz kelishi qanday bo‘ladi?", "Birinchi hayz sanasi nechchi yoshda?"
 ],
 oraliq_qon:[
  "Hayzlar orasida qon kelishi normalmi?", "Hayzdan tashqari qon kelmoqda",
  "Jinsiy aloqadan keyin qon keldi", "Hayz orasida ozgina qonli dog‘ paydo bo‘ldi",
  "Oraliqda qon kelsa shifokorga borish kerakmi?", "Aloqadan keyin vaginal qon kelishi"
 ],
 ajralma:[
  "Oq ajralma normalmi?", "Qindan ajralma kelishi sababi",
  "Vaginal ajralmaning rangi o‘zgardi", "Ajralmaning hidi o‘zgarishi nimadan?",
  "Ajralma nega ko‘payadi?", "Tiniq ajralma ovulyatsiyada bo‘ladimi?"
 ],
 vaginit:[
  "Qin qichishishi nimadan?", "Vaginit nima?",
  "Kandidoz qanday belgilar beradi?", "Jinsiy a’zoda qichishish bo‘lsa nima qilay?",
  "Qin ichida achishish sabablari", "Zamburug‘ alomatlari qanday?"
 ],
 siydik_yoli:[
  "Siyganda achishish sabablari", "Siydik yo‘li infeksiyasi belgilari",
  "Tsistit nima?", "Tez-tez siyish va pastki qorin bezovtaligi",
  "Siydik pufagi yallig‘lanishi qanday bo‘ladi?", "Siydik chiqarganda kuyish sezaman"
 ],
 pcos:[
  "PCOS nima?", "Polikistoz tuxumdon sindromi nima?",
  "Tuxumdon polikistozi belgilari", "PCOS hayz kechikishiga sabab bo‘ladimi?",
  "Ortiqcha tuklanish va nomuntazam hayz", "Polikistozda homiladorlik qiyinmi?"
 ],
 mioma:[
  "Bachadon miomasi nima?", "Mioma belgilari qanday?",
  "Mioma hayzni ko‘paytiradimi?", "Fibroid degani nima?",
  "Bachadonda tugun chiqdi nima degani?", "Mioma UTT orqali aniqlanadimi?"
 ],
 tezkor_himoya:[
  "Favqulodda kontratsepsiya nima?", "Himoyasiz aloqadan keyin nima qilish kerak?",
  "Prezervativ yirtilsa nima qilinadi?", "Ertasi kuni tabletka qachon qo‘llanadi?",
  "Shoshilinch kontratsepsiya necha kun ichida?", "Homiladorlikdan favqulodda saqlanish usullari"
 ],
 gigiyena:[
  "Hayz gigiyenasi qoidalari", "Prokladkani qachon almashtirish kerak?",
  "Tampon qancha vaqt ishlatiladi?", "Hayz paytida yuvinish mumkinmi?",
  "Menstrual cup gigiyenasi qanday?", "Hayz vaqtida gigiyenaga qanday amal qilaman?"
 ]
});

export const SAFETY_TRAINING_UTTERANCES=Object.freeze([
 {question:"Qon juda ko‘p ketayapti, hushim ketayapti",level:"emergency"},
 {question:"Hayz qoni oqyapti, boshim juda aylanmoqda",level:"emergency"},
 {question:"Qon ketmoqda va nafas ololmayapman",level:"emergency"},
 {question:"Homiladorlik ehtimoli bor, qorinim qattiq og‘riyapti",level:"emergency"},
 {question:"Homilador bo‘lishim mumkin, bir tomondan kuchli chanoq og‘rig‘i",level:"emergency"},
 {question:"Hayz kechikdi, qon kelmoqda va pastki qorin og‘riyapti",level:"urgent"},
 {question:"Homiladorman, ozgina vaginal qon kelmoqda",level:"urgent"},
 {question:"Har soat prokladka to‘lib qolmoqda",level:"urgent"},
 {question:"Menopauzadan keyin qon kelmoqda",level:"urgent"},
 {question:"Tampon ishlataman, isitma va toshma chiqdi",level:"urgent"},
 {question:"Siydik achishadi, isitmam baland va belim og‘riyapti",level:"urgent"},
 {question:"Homiladorman, siyganda achishadi",level:"urgent"},
 {question:"Hayzda og‘riq juda kuchli, nafasim qisilyapti",level:"emergency"},
 {question:"Homiladorlik ehtimoli, yelka uchim og‘riyapti va qon kelmoqda",level:"urgent"}
]);

export const UNSUPPORTED_TRAINING_UTTERANCES=Object.freeze([
 "Qaysi antibiotikni necha milligramm ichay?", "Menga ukol retsepti yozib ber",
 "Qon bosimim baland, dori nomini ayt", "Bolam uchun insulin dozasini hisobla",
 "Qaysi antidepressant menga to‘g‘ri keladi?", "Antibiotikni har necha soatda ichishim kerak?",
 "Tishimni qanday sug‘uraman?", "Oshqozon yarasini qanday davolash kerak?",
 "Necha tomchi gormon ichsam bo‘ladi?", "Analizim bo‘yicha saraton tashxisi qo‘y",
 "Menga uyda operatsiya qilishni o‘rgat", "Mening manzilimni topib ber"
]);

export const TRAINING_FIXTURE_COUNT=Object.values(TRAINING_UTTERANCES)
 .reduce((sum,examples)=>sum+examples.length,0)
 +SAFETY_TRAINING_UTTERANCES.length+UNSUPPORTED_TRAINING_UTTERANCES.length;
