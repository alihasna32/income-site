import crypto from "crypto";

export const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
export const OTP_LOCKOUT_MINUTES = Number(process.env.OTP_LOCKOUT_MINUTES || 30);
export const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.OTP_RESEND_COOLDOWN_SECONDS || 60
);
export const RESET_TOKEN_TTL_SECONDS = Number(
  process.env.RESET_TOKEN_TTL_SECONDS || 600
);

const OTP_LENGTH = 6;

function tokenSecret() {
  const secret =
    process.env.RESET_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Missing RESET_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY");
  }
  return secret;
}

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

function unb64url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function generateOtpCode() {
  const digits = crypto.randomInt(0, 10);
  const buffer = crypto.randomBytes(OTP_LENGTH - 1);
  let code = String(digits);
  for (const byte of buffer) {
    code += String(byte % 10);
  }
  return code;
}

export function hashOtp(code) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(code, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyOtpHash(code, stored) {
  const [scheme, salt, expected] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = crypto.scryptSync(String(code), salt, 64).toString("base64url");
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function signResetToken({ otpId }) {
  const expiresAt = Date.now() + RESET_TOKEN_TTL_SECONDS * 1000;
  const payload = `${otpId}.${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url");
  return `v1.${b64url(payload)}.${signature}`;
}

export function verifyResetToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const payload = unb64url(parts[1]);
  const expected = crypto
    .createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const [otpId, expiresAtRaw] = payload.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!otpId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { otpId, expiresAt };
}