"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/config/env";
import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

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

  redirect(safeNext(parsed.data.next));
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
      emailRedirectTo: `${origin}/auth/confirm?next=/account`,
    },
  });
  if (error) return { ok: false, error: error.message };

  if (data.session) redirect("/account");
  return { ok: true, message: "Check your inbox for a verification link." };
}

export async function signInWithMagicLink(input: unknown): Promise<AuthActionResult> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid email", fieldErrors: flattenZod(parsed.error) };

  const supabase = await createClient();
  const origin = await getCallbackOrigin();
  const next = safeNext(parsed.data.next);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Sign-in link sent. Check your inbox." };
}

export async function signInWithGoogle(next?: string): Promise<AuthActionResult & { url?: string }> {
  const supabase = await createClient();
  const origin = await getCallbackOrigin();
  const target = safeNext(next);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(target)}` },
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

  redirect("/account");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Same-origin relative paths only — guards against open-redirect.
 * Default destination is /account; staff get bumped into /admin/dashboard
 * by the admin layout if they have the role.
 */
function safeNext(next: string | undefined): string {
  if (!next) return "/account";
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}
