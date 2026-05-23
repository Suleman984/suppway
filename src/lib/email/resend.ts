import "server-only";
import { Resend } from "resend";
import { env, publicEnv } from "@/config/env";

/**
 * Thin Resend wrapper. Returns a stub in dev when no API key is set so the
 * checkout flow keeps working — the OTP is logged to the server console
 * instead of emailed, which is what you want against a local stack.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendResult {
  ok: boolean;
  error?: string;
  /** True when we logged the message instead of sending — useful for tests. */
  stubbed?: boolean;
}

let cached: Resend | null = null;
function client(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const c = client();
  if (!c || !env.EMAIL_FROM) {
    console.warn(
      "[email] RESEND_API_KEY/EMAIL_FROM not set — logging instead of sending.",
      { to: args.to, subject: args.subject, text: args.text },
    );
    return { ok: true, stubbed: true };
  }
  const { error } = await c.emails.send({
    from: env.EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function renderCheckoutOtpEmail(code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const store = publicEnv.storeName;
  return {
    subject: `Your ${store} checkout code: ${code}`,
    text:
      `Your ${store} checkout verification code is ${code}.\n\n` +
      `Enter it in the browser tab where you're placing your order. ` +
      `The code expires in 10 minutes.\n\n` +
      `If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Inter,Segoe UI,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
        <h1 style="font-size:18px;margin:0 0 8px">${store} checkout verification</h1>
        <p style="color:#555;margin:0 0 24px">Enter this code in the checkout tab to confirm it's you.</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:6px;padding:16px;background:#f6f6f6;border-radius:12px;text-align:center;margin:0 0 24px">${code}</p>
        <p style="color:#777;font-size:13px;margin:0">The code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };
}
