const RESEND_API_KEY = process.env.RESEND_API_KEY;

export function mailerConfigured() {
  return Boolean(RESEND_API_KEY);
}

export async function sendPasswordResetEmail({ email, code, expiresInMinutes }) {
  if (!mailerConfigured()) {
    console.info(
      "[password-reset] No RESEND_API_KEY configured - email not sent. " +
        `Development-only OTP delivery: email=${email} code=${code} expiresInMinutes=${expiresInMinutes}`
    );
    return { delivered: false, reason: "no_mailer_configured" };
  }

  const from = process.env.MAIL_FROM || "CoinQuest <noreply@coinquest.app>";
  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Your CoinQuest password reset code",
        html: `<p>Hi,</p><p>Your CoinQuest password reset code is:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>It expires in ${expiresInMinutes} minutes. If you did not request this, you can safely ignore this email.</p>`,
      }),
    });
  } catch (err) {
    console.error(`[password-reset] Resend request failed: ${err.message}`);
    return { delivered: false, reason: "mailer_error" };
  }

  const resendId = res.ok ? (await res.json().catch(() => ({}))).id : null;

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(
      `[password-reset] Resend delivery rejected (${res.status}). ` +
        `Development-only OTP fallback: email=${email} code=${code} reason=${body.slice(0, 200)}`
    );
    return { delivered: false, reason: "mailer_rejected", resendId: null };
  }

  return { delivered: true, resendId };
}