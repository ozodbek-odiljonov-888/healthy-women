// Dependency-free static-site and offline privacy checks.
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {join,resolve,dirname,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..","site");
const src=f=>readFileSync(join(root,f),"utf8");
const sw=src("sw.js");
const match=sw.match(/const CACHE_FILES\s*=\s*\[([\s\S]*?)\]/);
if(!match)throw Error("Offline cache list missing");
const cached=[...match[1].matchAll(/"(\.\/[^"]*)"/g)].map(m=>m[1]);
if(cached.length<20||new Set(cached).size!==cached.length)throw Error("Invalid offline cache list");
for(const p of cached)if(p!=="./"&&(p.includes("..")||!existsSync(join(root,p))))throw Error("Missing/off-scope asset: "+p);
if(!sw.includes("!STATIC_PATHS.has(url.pathname)")||!sw.includes("url.search")||sw.includes("cache.put("))throw Error("Dynamic cache safety regression");
for(const file of ["index.html","privacy.html"]){
 const html=src(file);
 if(!html.includes('http-equiv="Content-Security-Policy"')||!html.includes("script-src 'self'"))throw Error("Missing CSP in "+file);
 if(/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html))throw Error("Inline script in "+file);
 for(const m of html.matchAll(/\b(?:href|src)=["'](\.\/[^"']+)["']/g)){
  const asset=m[1].split("#")[0].split("?")[0];
  if(!existsSync(join(root,asset))||!cached.includes(asset))throw Error(file+" missing offline file "+asset);
 }
}
for(const file of readdirSync(root)){
 if(![".js",".mjs"].includes(extname(file)))continue;
 const result=spawnSync(process.execPath,["--check",join(root,file)],{encoding:"utf8",timeout:20000});
 if(result.status!==0)throw Error("Invalid JS: "+file+" "+result.stderr);
 for(const m of src(file).matchAll(/\bfrom\s*["'](\.\/[^"']+)["']/g)){
  if(!existsSync(join(root,m[1]))||!cached.includes(m[1]))throw Error(file+" import missing offline: "+m[1]);
 }
}
const manifest=JSON.parse(src("manifest.webmanifest"));
for(const icon of manifest.icons||[]){
 const filename=icon.src.replace(/^\.\//,"");
 if(!existsSync(join(root,filename))||!cached.includes("./"+filename))throw Error("Missing PWA icon "+filename);
}
const vercel=JSON.parse(src("vercel.json"));
const csp=vercel.headers?.flatMap(h=>h.headers||[]).find(h=>h.key==="Content-Security-Policy")?.value;
if(!csp?.includes("script-src 'self'")||/script-src[^;]*'unsafe-inline'/.test(csp))throw Error("Invalid production CSP");
console.log("Healthy Women static/offline check passed: "+cached.length+" cached resources, JS syntax and CSP");
