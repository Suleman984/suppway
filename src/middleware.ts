import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Per-request middleware:
 *   1. Refresh the Supabase auth session (best-effort).
 *   2. Gate authenticated routes (admin + customer account).
 *
 * The Supabase call is wrapped in try/catch so the storefront still
 * renders during the demo phase before Supabase is configured. Auth
 * gates fall through to "anonymous" in that case.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  let user: { id: string } | null = null;

  try {
    const result = await updateSession(request);
    response = result.response;
    user = result.user;
  } catch {
    // Supabase unreachable (likely demo mode without env wired up).
  }

  const { pathname } = request.nextUrl;
  const requiresAuth = pathname.startsWith("/admin") || pathname.startsWith("/account");

  if (requiresAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
