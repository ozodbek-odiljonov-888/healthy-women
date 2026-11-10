// Telegram Mini App initData authentication. No client trust, data storage or logging.
// Official algorithm: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const utf8 = new TextEncoder();
const invalid = () => new Error("Invalid Telegram initialization data");
const MAX_RAW_LENGTH = 8192;
const MAX_FIELDS = 32;

function constantTimeEqual(actual, expectedHex) {
  if (!/^[0-9a-fA-F]{64}$/.test(expectedHex)) return false;
  const expected = Uint8Array.from(expectedHex.match(/../g), value => Number.parseInt(value, 16));
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

async function signHmac(keyBytes, bytes) {
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, {name: "HMAC", hash: "SHA-256"}, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes));
}

/**
 * Verify untrusted Telegram.WebApp.initData against this bot's token.
 * Only the server should call this function. A valid signature never implies
 * that the input is safe to render as HTML or to share with other users.
 *
 * @returns {{userId:number,authDate:number}} Minimal verified identity.
 * @throws {Error} A generic error (never raw initData or secret).
 */
export async function verifyTelegramInitData(raw, botToken, options = {}) {
  if (typeof raw !== "string" || !raw.length || raw.length > MAX_RAW_LENGTH) throw invalid();
  if (typeof botToken !== "string" || !/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(botToken)) throw invalid();
  const nowMs = options.nowMs ?? Date.now();
  const maxAgeSeconds = options.maxAgeSeconds ?? 3600;
  if (!Number.isFinite(nowMs) || !Number.isSafeInteger(maxAgeSeconds)
      || maxAgeSeconds < 1 || maxAgeSeconds > 86400) throw invalid();

  const fields = [...new URLSearchParams(raw)];
  if (fields.length < 3 || fields.length > MAX_FIELDS) throw invalid();
  const seen = new Set();
  for (const [name] of fields) {
    if (!name || seen.has(name) || /[\r\n\0]/.test(name)) throw invalid();
    seen.add(name);
  }
  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  const dateValue = params.get("auth_date");
  const userValue = params.get("user");
  if (!hash || !dateValue || !userValue || !/^\d{1,12}$/.test(dateValue)) throw invalid();
  const authDate = Number(dateValue);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(authDate) || authDate <= 0
      || authDate > nowSeconds + 60 || nowSeconds - authDate > maxAgeSeconds) throw invalid();

  const canonical = fields.filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, value]) => key + "=" + value).join("\n");
  const stageOne = await signHmac(utf8.encode("WebAppData"), utf8.encode(botToken));
  const calculated = await signHmac(stageOne, utf8.encode(canonical));
  if (!constantTimeEqual(calculated, hash)) throw invalid();

  let user;
  try { user = JSON.parse(userValue); } catch { throw invalid(); }
  if (!user || typeof user !== "object" || Array.isArray(user)
      || !Number.isSafeInteger(user.id) || user.id <= 0) throw invalid();
  return {userId: user.id, authDate};
}
