import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Decide where the user lands after a successful authentication.
 *
 *   - active staff  → /admin/dashboard
 *   - everyone else → /account
 *
 * If the caller supplied a `next` query param we honour it, but only when
 * it's a same-origin relative path (guards against open-redirect).
 *
 * Shared by server actions (`signInWithPassword`, `signUpWithPassword`) and
 * the two route handlers (`/auth/confirm`, `/auth/callback`) so the routing
 * rule lives in exactly one place.
 */
export async function landingPathForCurrentUser(
  supabase: SupabaseClient,
  requested?: string | null,
): Promise<string> {
  const allowed =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return allowed ?? "/login";

  const { data: staff } = await supabase
    .from("staff")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (allowed) return allowed;
  return staff ? "/admin/dashboard" : "/account";
}
