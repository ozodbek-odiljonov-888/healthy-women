// Healthy Women v1.16: conservative Uzbek medical text cleanup.
// This is a hand-auditable typo dictionary, not AI or fuzzy inference.
// NEVER replace arbitrary near-spellings: clinical meaning can change.
const TYPO_TOKENS=Object.freeze({
 xayz:"hayz", xayzim:"hayzim", xayzda:"hayzda", xayzlar:"hayzlar",
 xomilador:"homilador", xomiladorman:"homiladorman",
 xomiladorlik:"homiladorlik", homladorman:"homiladorman",
 ovulatsiya:"ovulyatsiya", ovulyasiya:"ovulyatsiya",
 proklatka:"prokladka", prakladka:"prokladka",
 polikistoz:"polikistoz", pollikistoz:"polikistoz",
 mammagrafiya:"mammografiya", mammagrafiyaa:"mammografiya",
 papiloma:"papilloma", kandidozz:"kandidoz",
 kontrasepsiya:"kontratseptsiya", kantratseptsiya:"kontratseptsiya",
 qornm:"qornim", ogrivotti:"ogriyapti", ogriyapdi:"ogriyapti",
 ogrivoti:"ogriyapti", ogriyabdi:"ogriyapti",
 ketvotti:"ketyapti", ketepti:"ketyapti", ketvoti:"ketyapti",
 kelvotti:"kelyapti", kelvoti:"kelyapti",
 kechikvotti:"kechikyapti", kechikvoti:"kechikyapti",
 siyishim:"siyishim", siyganda:"siyganda",
 chichishish:"qichishish"
});
export function fixConservativeMedicalTypos(normalized){
 if(typeof normalized!=="string"||normalized.length>700)throw Error("Invalid normalized medical query");
 return normalized.split(" ").map(x=>TYPO_TOKENS[x]||x).join(" ");
}

// Suppress only EXPLICIT negative symptom statements, not general "not
// pregnant" claims or broad negation: never strip surrounding positives.
// Examples: "qon ketmayapti, lekin hushim ketayapti" keeps active fainting.
// Note: no claim is made to fully understand Uzbek grammar.
const NEGATED_SYMPTOMS=[
 /\bqon (?:ketmayapti|ketmadi|kelmayapti|kelmadi)\b/g,
 /\bhush(?:im|dan) ket(?:mayapti|mayapman|madim|maganman)\b/g,
 /\bboshim aylan(?:mayapti|mayapman|madi)\b/g,
 /\bnafasim qis(?:mayapti|mayapman|madi)\b/g
];
export function removeExplicitNegatedSymptoms(normalized){
 if(typeof normalized!=="string"||normalized.length>700)throw Error("Invalid normalized medical query");
 let result=normalized;
 for(const pattern of NEGATED_SYMPTOMS)result=result.replace(pattern," ");
 return result.replace(/\s+/g," ").trim();
}
