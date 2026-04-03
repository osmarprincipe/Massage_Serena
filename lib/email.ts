/**
 * Email sending helper.
 *
 * Priority:
 *   1. Resend  — set RESEND_API_KEY in .env (no npm package required)
 *   2. Console — development fallback when no service is configured
 *
 * To enable Resend: sign up at resend.com, add RESEND_API_KEY to .env,
 * and set EMAIL_FROM to your verified sender address.
 */

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Serene Studio";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistrationEmailParams {
  to: string;
  name: string | null;
  registrationUrl: string;
  purchaseDescription: string; // e.g. "Premium Membership" or "Deep Tissue Tutorial"
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function sendRegistrationEmail(params: RegistrationEmailParams) {
  const { to, name, registrationUrl, purchaseDescription } = params;
  const displayName = name || to;

  const subject = `Complete your ${APP_NAME} account setup`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:system-ui,sans-serif;background:#fafaf9;padding:40px 16px">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e8e4df">
        <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">${APP_NAME}</h2>
        <p style="color:#6b7280;margin:0 0 32px">Thanks for your purchase!</p>

        <p style="color:#374151">Hi ${displayName},</p>
        <p style="color:#374151">
          Your payment for <strong>${purchaseDescription}</strong> was successful.
          Click the button below to create your account and access your purchase.
        </p>

        <div style="text-align:center;margin:32px 0">
          <a href="${registrationUrl}"
             style="background:#7c5c48;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block">
            Create my account
          </a>
        </div>

        <p style="color:#6b7280;font-size:13px">
          Or copy this link into your browser:<br>
          <a href="${registrationUrl}" style="color:#7c5c48;word-break:break-all">${registrationUrl}</a>
        </p>

        <p style="color:#6b7280;font-size:13px;margin-top:32px;padding-top:24px;border-top:1px solid #e8e4df">
          This link expires in 7 days. If you didn't make this purchase, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  // ── Attempt Resend ──────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from = process.env.EMAIL_FROM ?? `noreply@${new URL(APP_URL).hostname}`;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[email] Resend error ${res.status}:`, body);
      } else {
        const { id } = await res.json();
        console.log(`[email] Sent via Resend — id: ${id}, to: ${to}`);
      }
      return;
    } catch (err) {
      console.error("[email] Resend request failed:", err);
    }
  }

  // ── Console fallback (development) ────────────────────────────────────────
  console.log("\n" + "═".repeat(64));
  console.log("[EMAIL] Not configured — showing link in console instead");
  console.log(`  To              : ${to}`);
  console.log(`  Subject         : ${subject}`);
  console.log(`  Purchase        : ${purchaseDescription}`);
  console.log(`  Registration URL: ${registrationUrl}`);
  console.log("═".repeat(64) + "\n");
}
