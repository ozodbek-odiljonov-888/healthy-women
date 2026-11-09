import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
// This script never embeds, prints or commits keystore passwords.
const NAMES=["HW_SIGNING_STORE_PATH","HW_SIGNING_STORE_PASSWORD","HW_SIGNING_KEY_ALIAS","HW_SIGNING_KEY_PASSWORD"];
export function signingGradle(runNumber){
 const n=Number(runNumber);
 if(!Number.isSafeInteger(n)||n<1||n>10000000)throw Error("Invalid workflow run number");
 return [
  "// Healthy Women - manually triggered signed test build.",
  "def hwNames = ['HW_SIGNING_STORE_PATH','HW_SIGNING_STORE_PASSWORD','HW_SIGNING_KEY_ALIAS','HW_SIGNING_KEY_PASSWORD']",
  "hwNames.each { k -> if (!System.getenv(k)) throw new GradleException('Protected signing variable missing: ' + k) }",
  "android {",
  "  signingConfigs {",
  "    hwSignedTest {",
  "      storeFile file(System.getenv('HW_SIGNING_STORE_PATH'))",
  "      storePassword System.getenv('HW_SIGNING_STORE_PASSWORD')",
  "      keyAlias System.getenv('HW_SIGNING_KEY_ALIAS')",
  "      keyPassword System.getenv('HW_SIGNING_KEY_PASSWORD')",
  "    }",
  "  }",
  "  defaultConfig {",
  "    versionCode "+(100000+n),
  '    versionName "1.0.1-signed.'+n+'"',
  "  }",
  "  buildTypes {",
  "    release {",
  "      signingConfig signingConfigs.hwSignedTest",
  "    }",
  "  }",
  "}",
  ""
 ].join("\n");
}
export function configureSignedBuild(root,env=process.env){
 const missing=NAMES.filter(k=>!env[k]);
 if(missing.length)throw Error("Signing secrets unavailable: "+missing.join(", "));
 if(!existsSync(env.HW_SIGNING_STORE_PATH))throw Error("Keystore file does not exist");
 const path=join(resolve(root),"app","build.gradle"),content=readFileSync(path,"utf8");
 if(!/com\.android\.application/.test(content)||!/android\s*\{/.test(content))throw Error("Unexpected Gradle project");
 if(content.includes("hwSignedTest"))throw Error("Signing configuration already injected");
 writeFileSync(path,content+"\n"+signingGradle(env.GITHUB_RUN_NUMBER));
 return path;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 configureSignedBuild(process.argv[2]||"android");
 console.log("Protected signed test APK configuration installed. No keys printed.");
}
