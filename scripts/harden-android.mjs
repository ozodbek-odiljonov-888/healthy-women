import {readFileSync,writeFileSync,mkdirSync,readdirSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";

// Harden generated Capacitor app resources after npx cap sync.
export function hardenManifest(xml){
 if(typeof xml!=="string"||!xml.includes("xmlns:android="))throw Error("Invalid Android manifest");
 const pattern=/<application\b([^>]*?)>/s;
 if(!pattern.test(xml))throw Error("Application element missing");
 return xml.replace(pattern,(_,attrs)=>{
  if(attrs.trimEnd().endsWith("/"))throw Error("Unexpected self-closing application element");
  attrs=attrs.replace(/\s+android:(?:allowBackup|fullBackupContent|dataExtractionRules|usesCleartextTraffic)\s*=\s*"[^"]*"/g,"");
  return '<application'+attrs+' android:allowBackup="false" android:fullBackupContent="@xml/hw_backup_rules" android:dataExtractionRules="@xml/hw_data_extraction_rules" android:usesCleartextTraffic="false">';
 });
}
export function hardenMainActivity(java){
 if(typeof java!=="string"||!java.includes("extends BridgeActivity")||!java.includes("class MainActivity"))throw Error("Unexpected Capacitor MainActivity");
 if(java.includes("WindowManager.LayoutParams.FLAG_SECURE"))return java;
 if(!/package\s+[\w.]+;/.test(java)||!java.includes("import com.getcapacitor.BridgeActivity;"))throw Error("Java source format unexpected");
 let code=java.replace(/(package\s+[\w.]+;)/,"$1\nimport android.os.Bundle;\nimport android.view.WindowManager;");
 const last=code.lastIndexOf("}");if(last<0)throw Error("Java class closing brace missing");
 code=code.slice(0,last)+'  @Override\n  protected void onCreate(Bundle state) {\n    super.onCreate(state);\n    getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);\n  }\n'+code.slice(last);
 return code;
}
function findMainActivity(folder){
 const found=[];
 function visit(path){
  for(const d of readdirSync(path,{withFileTypes:true})){
   if(d.isDirectory())visit(join(path,d.name));
   else if(d.isFile()&&d.name==="MainActivity.java")found.push(join(path,d.name));
  }
 }
 visit(folder);if(found.length!==1)throw Error("Expected exactly one MainActivity.java");
 return found[0];
}
const backupRules=['<?xml version="1.0" encoding="utf-8"?>','<full-backup-content>','  <exclude domain="root" path="."/>','  <exclude domain="device_root" path="."/>','</full-backup-content>',''].join("\n");
const extractionRules=['<?xml version="1.0" encoding="utf-8"?>','<data-extraction-rules>','  <cloud-backup>','    <exclude domain="root" path="."/>','    <exclude domain="device_root" path="."/>','  </cloud-backup>','  <device-transfer>','    <exclude domain="root" path="."/>','    <exclude domain="device_root" path="."/>','  </device-transfer>','</data-extraction-rules>',''].join("\n");
export function hardenAndroid(root){
 const main=join(resolve(root),"app","src","main"),manifest=join(main,"AndroidManifest.xml"),activity=findMainActivity(join(main,"java"));
 // Validate both originals before overwriting either.
 const hardenedManifest=hardenManifest(readFileSync(manifest,"utf8"));
 const hardenedActivity=hardenMainActivity(readFileSync(activity,"utf8"));
 writeFileSync(manifest,hardenedManifest);writeFileSync(activity,hardenedActivity);
 const dest=join(main,"res","xml");mkdirSync(dest,{recursive:true});
 writeFileSync(join(dest,"hw_backup_rules.xml"),backupRules);
 writeFileSync(join(dest,"hw_data_extraction_rules.xml"),extractionRules);
 return {manifest,activity,backup:join(dest,"hw_backup_rules.xml"),extraction:join(dest,"hw_data_extraction_rules.xml")};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 hardenAndroid(process.argv[2]||"android");
 console.log("Android backups and screenshots protection configured. No secrets printed.");
}
