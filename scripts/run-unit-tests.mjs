// All built-in Node.js tests plus static-site validation. No npm install needed.
import {readdirSync,existsSync} from "node:fs";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const tests=readdirSync(join(root,"tests")).filter(x=>x.endsWith(".test.mjs")).sort().map(x=>join(root,"tests",x));
const worker=join(root,"worker","index.test.js");
if(existsSync(worker))tests.unshift(worker);
if(tests.length<15)throw Error("Incomplete test suite");
const run=(args,timeout)=>{
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit",timeout});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
};
console.log("Running "+tests.length+" Healthy Women Node.js test files");
run(["--test",...tests],120000);
run([join(root,"scripts","verify-site.mjs")],60000);
