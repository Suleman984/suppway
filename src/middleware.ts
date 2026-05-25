import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Per-request middleware:
 *   1. Detect `/s/{slug}/...` and tag the request with `x-store-slug` so
 *      RSC server components can resolve the active store via
 *      getActiveStore(). Requests without an `/s/` prefix fall back to
 *      the default store (currently `main`).
 *   2. Refresh the Supabase auth session (best-effort).
 *   3. Gate authenticated routes (admin + account), supporting both
 *      prefixed (`/s/{slug}/admin`) and unprefixed (`/admin`) URLs.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect /s/{slug}/... and stamp the request before anything else runs,
  // so downstream code paths (incl. supabase session refresh) see it.
  const storeMatch = pathname.match(/^\/s\/([a-z0-9][a-z0-9-]{0,31})(\/|$)/);
  const slug = storeMatch?.[1] ?? null;
  if (slug) request.headers.set("x-store-slug", slug);

  // Rewrite `/s/{slug}/...` to `/...` internally so we don't have to
  // duplicate the entire page tree under app/s/[slug]/. The slug travels
  // through the header we just set, and getActiveStore() reads it.
  if (slug) {
    const stripped = pathname.replace(/^\/s\/[^/]+/, "") || "/";
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = stripped;
    // NextResponse.rewrite keeps the URL as the user sees it in the
    // browser while serving the rewritten path's React tree.
    let rewriteResponse = NextResponse.rewrite(rewritten, { request });

    let user: { id: string } | null = null;
    try {
      const result = await updateSession(request);
      // The rewrite response keeps our cookies if we re-apply from
      // updateSession's response.
      for (const c of result.response.cookies.getAll()) {
        rewriteResponse.cookies.set(c);
      }
      user = result.user;
    } catch {
      // Supabase unreachable
    }

    const logicalPath = stripped;
    const requiresAuth =
      logicalPath.startsWith("/admin") || logicalPath.startsWith("/account");
    if (requiresAuth && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return rewriteResponse;
  }

  let response = NextResponse.next({ request });
  let user: { id: string } | null = null;

  try {
    const result = await updateSession(request);
    response = result.response;
    user = result.user;
  } catch {
    // Supabase unreachable (likely demo mode without env wired up).
  }

  // Logical path with the store prefix stripped, for auth gating.
  const logicalPath = slug
    ? pathname.replace(/^\/s\/[^/]+/, "") || "/"
    : pathname;

  const requiresAuth =
    logicalPath.startsWith("/admin") || logicalPath.startsWith("/account");

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
