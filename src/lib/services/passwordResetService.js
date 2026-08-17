import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_LOCKOUT_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  RESET_TOKEN_TTL_SECONDS,
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  signResetToken,
  verifyResetToken,
} from "@/lib/security/otp";
import { sendPasswordResetEmail } from "@/lib/security/mailer";

function fail(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findUserByEmail(email) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const res = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const body = await res.json();
  const normalized = email.toLowerCase();
  return (body.users || []).find((u) => String(u.email || "").toLowerCase() === normalized) || null;
}

async function latestOtp(admin, email) {
  const { data } = await admin
    .from("password_reset_otps")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function invalidatePrevious(admin, email) {
  await admin
    .from("password_reset_otps")
    .update({ used: true })
    .eq("email", email)
    .eq("used", false);
}

async function sendCode({ email, userId, code }) {
  const sent = await sendPasswordResetEmail({
    email,
    code,
    expiresInMinutes: OTP_TTL_MINUTES,
  });
  if (!sent.delivered) {
    // Mailer failure must not let the user know their code, but the request
    // itself still "succeeded" to avoid account enumeration.
    console.error(
      `[password-reset] Code for ${email} (user ${userId || "unknown"}) was not delivered.`
    );
  }
}

export async function requestResetCode({ email, ip }) {
  if (!supabaseReady()) throw fail("SERVICE_UNAVAILABLE", "Password reset is unavailable right now.");

  if (ip && !(await checkRateLimit({ key: `pwd-reset:req:ip:${ip}`, max: 10, windowSeconds: 900 }))) {
    throw fail("RATE_LIMITED", "Too many reset requests. Please try again later.");
  }
  if (!(await checkRateLimit({ key: `pwd-reset:req:${email}`, max: 5, windowSeconds: 900 }))) {
    throw fail("RATE_LIMITED", "Too many reset requests for this account. Please try again later.");
  }

  const admin = createAdminClient();
  let userId = null;

  const user = await findUserByEmail(email);
  if (user) userId = user.id;

  if (!userId) {
    // Unknown email: keep the response identical and roughly timing-equal.
    await delay(350);
    return { sent: false, emailKnown: false };
  }

  const code = generateOtpCode();
  const otpHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await invalidatePrevious(admin, email);

  const { error: insertError } = await admin.from("password_reset_otps").insert({
    user_id: userId,
    email,
    otp_hash: otpHash,
    expires_at: expiresAt,
  });
  if (insertError) throw fail("SERVICE_UNAVAILABLE", "Password reset is unavailable right now.");

  await sendCode({ email, userId, code });

  return { sent: true, emailKnown: true, expiresInMinutes: OTP_TTL_MINUTES };
}

export async function resendResetCode({ email, ip }) {
  if (!supabaseReady()) throw fail("SERVICE_UNAVAILABLE", "Password reset is unavailable right now.");

  if (ip && !(await checkRateLimit({ key: `pwd-reset:resend:ip:${ip}`, max: 10, windowSeconds: 900 }))) {
    throw fail("RATE_LIMITED", "Too many reset requests. Please try again later.");
  }

  const admin = createAdminClient();
  const existing = await latestOtp(admin, email);

  if (!existing) {
    await delay(350);
    return { sent: false, emailKnown: false };
  }

  const cooldownUntil = new Date(existing.created_at).getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
  if (Date.now() < cooldownUntil) {
    throw fail(
      "COOLDOWN",
      `Please wait ${Math.ceil((cooldownUntil - Date.now()) / 1000)}s before requesting another code.`
    );
  }

  const code = generateOtpCode();
  const otpHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await invalidatePrevious(admin, email);

  const { error: insertError } = await admin.from("password_reset_otps").insert({
    user_id: existing.user_id,
    email,
    otp_hash: otpHash,
    expires_at: expiresAt,
  });
  if (insertError) throw fail("SERVICE_UNAVAILABLE", "Password reset is unavailable right now.");

  await sendCode({ email, userId: existing.user_id, code });

  return { sent: true, emailKnown: true, expiresInMinutes: OTP_TTL_MINUTES };
}

export async function verifyResetCode({ email, code }) {
  if (!supabaseReady()) throw fail("SERVICE_UNAVAILABLE", "Password reset is unavailable right now.");

  if (!(await checkRateLimit({ key: `pwd-reset:verify:${email}`, max: 10, windowSeconds: 900 }))) {
    throw fail("RATE_LIMITED", "Too many verification attempts. Please try again later.");
  }

  const admin = createAdminClient();
  const row = await latestOtp(admin, email);

  if (!row || row.used) {
    await delay(300);
    throw fail("INVALID_CODE", "That code is invalid. Request a new one.");
  }

  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    throw fail("CODE_LOCKED", "Too many verification attempts. Please request a new code later.");
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw fail("CODE_EXPIRED", "This code has expired. Request a new one.");
  }

  if (!verifyOtpHash(code, row.otp_hash)) {
    const attempts = (row.attempt_count || 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await admin
        .from("password_reset_otps")
        .update({
          attempt_count: attempts,
          locked_until: new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60 * 1000).toISOString(),
        })
        .eq("id", row.id);
      throw fail(
        "CODE_LOCKED",
        "Too many verification attempts. Please request a new code later."
      );
    }
    await admin.from("password_reset_otps").update({ attempt_count: attempts }).eq("id", row.id);
    throw fail("INVALID_CODE", "That code is incorrect. Please check and try again.");
  }

  await admin
    .from("password_reset_otps")
    .update({ verified: true, attempt_count: row.attempt_count })
    .eq("id", row.id);

  const resetToken = signResetToken({ otpId: row.id });
  return { resetToken, expiresInSeconds: RESET_TOKEN_TTL_SECONDS };
}

export async function updatePasswordWithToken({ resetToken, password, ip }) {
  if (!supabaseReady()) throw fail("SERVICE_UNAVAILABLE", "Password reset is unavailable right now.");

  if (ip && !(await checkRateLimit({ key: `pwd-reset:update:ip:${ip}`, max: 5, windowSeconds: 900 }))) {
    throw fail("RATE_LIMITED", "Too many reset attempts. Please try again later.");
  }

  const payload = verifyResetToken(resetToken);
  if (!payload) throw fail("INVALID_TOKEN", "This reset link is invalid or has expired. Start over.");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("password_reset_otps")
    .select("*")
    .eq("id", payload.otpId)
    .maybeSingle();

  if (!row || !row.verified) throw fail("INVALID_TOKEN", "This reset link is invalid or has expired. Start over.");
  if (row.used) throw fail("INVALID_TOKEN", "This reset link has already been used. Start over.");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw fail("INVALID_TOKEN", "This reset link is invalid or has expired. Start over.");
  }

  const { error } = await admin.auth.admin.updateUserById(row.user_id, { password });
  if (error) throw fail("SERVICE_UNAVAILABLE", "Could not update your password. Please try again.");

  await admin.from("password_reset_otps").update({ used: true }).eq("user_id", row.user_id);

  return { ok: true };
}