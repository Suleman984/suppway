import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForCurrentUser } from "@/lib/auth/landing";

/**
 * OAuth callback handler. Supabase redirects here after Google (or any OAuth
 * provider) authenticates the user. We exchange the `code` for a session,
 * then forward the user to the role-aware landing path.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const dest = await landingPathForCurrentUser(supabase, nextRaw);
  return NextResponse.redirect(new URL(dest, url.origin));
}
