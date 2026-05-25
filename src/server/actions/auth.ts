"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { storeLink } from "@/lib/store/active";
import { publicEnv } from "@/config/env";
import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import { landingPathForCurrentUser } from "@/lib/auth/landing";

export type AuthActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flattenZod(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function getCallbackOrigin(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : publicEnv.appUrl;
}

export async function signInWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };

  redirect(await landingPathForCurrentUser(supabase, parsed.data.next));
}

export async function signUpWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };

  const supabase = await createClient();
  const origin = await getCallbackOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        marketing_opt_in: parsed.data.marketingOptIn,
      },
      // The confirm route will read the user's staff row and pick the
      // right landing path; we pass an empty `next` so it falls through
      // to the role-aware default.
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });
  if (error) return { ok: false, error: error.message };

  if (data.session) redirect(await landingPathForCurrentUser(supabase));
  return { ok: true, message: "Check your inbox for a verification link." };
}

export async function signInWithMagicLink(input: unknown): Promise<AuthActionResult> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid email", fieldErrors: flattenZod(parsed.error) };

  const supabase = await createClient();
  const origin = await getCallbackOrigin();
  // We let /auth/confirm pick the destination after verifyOtp succeeds.
  const nextParam = parsed.data.next ? `?next=${encodeURIComponent(parsed.data.next)}` : "";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/confirm${nextParam}` },
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Sign-in link sent. Check your inbox." };
}

export async function signInWithGoogle(next?: string): Promise<AuthActionResult & { url?: string }> {
  const supabase = await createClient();
  const origin = await getCallbackOrigin();
  const nextParam = next && next.startsWith("/") && !next.startsWith("//")
    ? `?next=${encodeURIComponent(next)}`
    : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback${nextParam}` },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.url) return { ok: false, error: "OAuth provider returned no URL" };
  return { ok: true, url: data.url };
}

export async function forgotPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid email", fieldErrors: flattenZod(parsed.error) };

  const supabase = await createClient();
  const origin = await getCallbackOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "If that email exists, we've sent a reset link." };
}

export async function resetPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };

  redirect(await storeLink("/account"));
}

/**
 * Sign out of the current device only. The refresh token for *this* session
 * is revoked server-side, the session cookies are cleared, and the user
 * lands back on the home page. Other devices keep their sessions — that's
 * the modern default ("sign out of this device").
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

/**
 * Sign out everywhere: revokes every refresh token associated with this
 * user across all devices. Use sparingly — handy for "account stolen,
 * kick everyone out" or "I forgot to log out on a public computer".
 */
export async function signOutEverywhere(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}

