// Vercel Web Handler: forward POST /api/webhook to the source-backed FAQ bot.
import worker from "../worker/index.js";
export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return Response.json({error:"Method not allowed"},{status:405,headers:{"cache-control":"no-store"}});
    }
    // Forward the original request body and headers without logging Telegram chat data.
    const forwarded = new Request(new URL("/webhook",request.url),request);
    return worker.fetch(forwarded, {
      BOT_TOKEN: process.env.BOT_TOKEN,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      APP_URL: process.env.APP_URL
    });
  }
};
