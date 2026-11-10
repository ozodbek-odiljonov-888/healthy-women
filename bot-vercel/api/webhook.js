// Vercel Web Handler: forward POST /api/webhook to the source-backed FAQ bot.
import worker from "../worker/index.js";
export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return Response.json({error:"Method not allowed"},{status:405,headers:{"cache-control":"no-store"}});
    }
    // Forward the original request body and headers without logging Telegram chat data.
    const forwarded = new Request(new URL("/webhook",request.url),{method:request.method,headers:request.headers,body:request.body,duplex:"half"});
    return worker.fetch(forwarded, {
      BOT_TOKEN: process.env.BOT_TOKEN,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      APP_URL: process.env.APP_URL,
      AI_MODE: process.env.AI_MODE,
      AI_FREE_TIER_NO_BILLING: process.env.AI_FREE_TIER_NO_BILLING,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      AI_DATABASE_URL: process.env.AI_DATABASE_URL,
      AI_IP_PEPPER: process.env.AI_IP_PEPPER,
      AI_ALLOWED_ORIGIN: process.env.AI_ALLOWED_ORIGIN,
      AI_ALLOWED_HOSTNAME: process.env.AI_ALLOWED_HOSTNAME,
      AI_ANDROID_ORIGIN: process.env.AI_ANDROID_ORIGIN
    });
  }
};
