"use server";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderCheckoutOtpEmail, sendEmail } from "@/lib/email/resend";

/**
 * Guest-checkout email OTP. Proves the email at the checkout form belongs
 * to the person checking out, so we can't ship an order's shipping address
 * to a stranger's account just because they typed that stranger's email.
 *
 * Pairs with placeOrder() which consumes the verification row server-side.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const SEND_WINDOW_MS = 10 * 60 * 1000;
const SEND_MAX_PER_WINDOW = 3;
const MAX_ATTEMPTS = 5;

const sendSchema = z.object({ email: z.string().trim().email() });
const verifySchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type OtpResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function hashCode(code: string, email: string): string {
  // Email is mixed in so a hash leak can't be replayed against another
  // user's verification row. No external pepper needed.
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function sendCheckoutOtp(input: unknown): Promise<OtpResult> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid email" };
  const email = parsed.data.email.toLowerCase();

  const admin = createAdminClient();

  // Per-email send rate limit. Cheap and effective against a single victim;
  // global per-IP rate limiting belongs in middleware, not here.
  const since = new Date(Date.now() - SEND_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("checkout_verifications")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= SEND_MAX_PER_WINDOW) {
    return {
      ok: false,
      error: "Too many codes requested. Try again in a few minutes.",
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: insertErr } = await admin.from("checkout_verifications").insert({
    email,
    code_hash: hashCode(code, email),
    max_attempts: MAX_ATTEMPTS,
    expires_at: expiresAt,
  });
  if (insertErr) return { ok: false, error: "Could not send code. Try again." };

  const tpl = renderCheckoutOtpEmail(code);
  const sent = await sendEmail({ to: email, ...tpl });
  if (!sent.ok) return { ok: false, error: sent.error ?? "Email failed to send" };

  return {
    ok: true,
    message: sent.stubbed
      ? "Code generated (check server logs — email service not configured)."
      : "Code sent. Check your inbox.",
  };
}

export async function verifyCheckoutOtp(input: unknown): Promise<OtpResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }
  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.code;

  const admin = createAdminClient();

  // Most recent unconsumed row; older rows for this email are ignored
  // (still expire naturally and stay around for audit).
  const { data: row } = await admin
    .from("checkout_verifications")
    .select("id, code_hash, attempts, max_attempts, expires_at, consumed_at")
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { ok: false, error: "No active code. Request a new one." };
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "Code expired. Request a new one." };
  }
  if ((row.attempts as number) >= (row.max_attempts as number)) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  const match = constantTimeEqual(row.code_hash as string, hashCode(code, email));
  if (!match) {
    await admin
      .from("checkout_verifications")
      .update({ attempts: (row.attempts as number) + 1 })
      .eq("id", row.id as string);
    return { ok: false, error: "Wrong code. Try again." };
  }

  // Mark verified but leave consumed_at null — placeOrder consumes it on the
  // actual order insert. This way the user can spend a few minutes filling
  // the rest of the form without re-verifying.
  return { ok: true, message: "Email verified." };
}
