// Apply backup hardening to generated Capacitor Android sources.
// No user data or secrets are read.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
const root=process.argv[2]||"android";
const file=join(root,"app/src/main/AndroidManifest.xml");
let xml=readFileSync(file,"utf8");
const match=xml.match(/<application\b[^>]*>/);
if(!match)throw Error("Android application element not found");
let tag=match[0];
for(const [name,value] of Object.entries({
 "android:allowBackup":"false",
 "android:fullBackupContent":"@xml/healthy_women_backup_rules",
 "android:dataExtractionRules":"@xml/healthy_women_data_extraction_rules"
})){
 const expression=new RegExp("\\s"+name+"\\s*=\\s*['\"][^'\"]*['\"]");
 if(expression.test(tag))tag=tag.replace(expression," "+name+'="'+value+'"');
 else tag=tag.slice(0,-1)+" "+name+'="'+value+'">';
}
xml=xml.replace(match[0],tag);
writeFileSync(file,xml);
const xmlDir=join(root,"app/src/main/res/xml");
mkdirSync(xmlDir,{recursive:true});
writeFileSync(join(xmlDir,"healthy_women_backup_rules.xml"),
 '<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content>\n  <exclude domain="root" path="."/>\n  <exclude domain="device_root" path="."/>\n</full-backup-content>\n');
writeFileSync(join(xmlDir,"healthy_women_data_extraction_rules.xml"),
 '<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n  <cloud-backup>\n    <exclude domain="root" path="."/>\n    <exclude domain="device_root" path="."/>\n  </cloud-backup>\n  <device-transfer>\n    <exclude domain="root" path="."/>\n    <exclude domain="device_root" path="."/>\n  </device-transfer>\n</data-extraction-rules>\n');
console.log("Android backup and transfer restrictions configured.");
