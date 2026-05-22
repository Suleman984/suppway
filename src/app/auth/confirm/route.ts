import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForCurrentUser } from "@/lib/auth/landing";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email link handler — used for sign-up verification, magic links, and
 * password recovery. Supabase emails point here with a `token_hash` and
 * `type`. We verify the OTP, set the session cookies, then forward to
 * the role-aware landing path (honouring `next` if it's same-origin).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextRaw = url.searchParams.get("next");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const dest = await landingPathForCurrentUser(supabase, nextRaw);
  return NextResponse.redirect(new URL(dest, url.origin));
}
