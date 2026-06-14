// ================================================================
// SIMPLE COOKIE-BASED AUTH FOR ADMIN-ONLY APP
// ================================================================

const getSecret = () => process.env.AUTH_SECRET || "spk-wisata-balikpapan-secret-key-2024";
const COOKIE_NAME = "spk_session";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(signature))));
}

export async function createSessionToken(username: string): Promise<string> {
  const payload = `${username}.${Date.now()}.${Date.now() + SESSION_DURATION * 1000}`;
  const signature = await hmacSign(payload, getSecret());
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const payload = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const expectedSig = await hmacSign(payload, getSecret());

  if (parts[3] !== expectedSig) return false;

  const expiry = parseInt(parts[2]);
  if (Date.now() > expiry) return false;

  return true;
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionDuration(): number {
  return SESSION_DURATION;
}
