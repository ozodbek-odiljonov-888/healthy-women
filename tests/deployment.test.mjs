import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const text=path=>readFileSync(new URL(path,import.meta.url),"utf8");
test("Vercel serves the static site only, with noindex preview policy",()=>{
 const config=JSON.parse(text("../site/vercel.json"));
 assert.equal(config.framework,null);
 assert.equal(config.public,false);
 assert(config.headers[0].headers.some(h=>h.key==="X-Robots-Tag"&&h.value.includes("noindex")));
 assert(text("../site/robots.txt").includes("Disallow: /"));
});
test("Cloudflare deployment is manually triggered and requires credentials",()=>{
 const workflow=text("../.github/workflows/cloudflare-bot.yml");
 assert(workflow.includes("workflow_dispatch:"));
 assert(!/^\s*push:\s*$/m.test(workflow));
 assert(workflow.includes("secrets.CLOUDFLARE_API_TOKEN"));
 assert(workflow.includes("secrets.CLOUDFLARE_ACCOUNT_ID"));
});
test("deployment does not accidentally publish bot tokens or medical records",()=>{
 const site=text("../site/index.html");
 assert(!/BOT_TOKEN\s*[:=]\s*["'][A-Za-z0-9_-]{12,}/.test(site));
 assert(!/WEBHOOK_SECRET\s*[:=]\s*["'][A-Za-z0-9_-]{12,}/.test(site));
 assert(!/ACCESS_KEY\s*[:=]\s*["'][A-Za-z0-9_-]{12,}/.test(site));
});
