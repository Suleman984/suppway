"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Global, app-wide session sync. Mounted once near the root, this client
 * island subscribes to Supabase's auth state and does two things:
 *
 *   1. Calls `router.refresh()` whenever the auth state actually changes —
 *      so a server-rendered page with stale `user`/`staff` data updates
 *      after sign-in / sign-out (including changes that happened in
 *      another browser tab via storage events).
 *
 *   2. If the user becomes signed-out while sitting on a protected route
 *      (/admin/*, /account), hard-bounces them to /login so they can't
 *      keep interacting with a UI whose data they no longer have access
 *      to read.
 *
 * We deliberately ignore TOKEN_REFRESHED here — those happen silently in
 * the middleware and don't change identity.
 */
export function SessionWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      lastUserRef.current = data.user?.id ?? null;
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUserId = session?.user?.id ?? null;

      // De-bounce no-op events: same identity, no need to refresh.
      if (
        event === "TOKEN_REFRESHED" ||
        currentUserId === lastUserRef.current
      ) {
        return;
      }
      lastUserRef.current = currentUserId;

      // Signed out from a protected area → bounce to /login with a `next`
      // back to where they were.
      if (
        event === "SIGNED_OUT" &&
        pathname &&
        (pathname.startsWith("/admin") || pathname.startsWith("/account"))
      ) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      router.refresh();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  return null;
}
