import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { storeLink } from "@/lib/store/active";

/**
 * Where to land a user after a successful auth.
 *
 *   - has staff row in some store → /s/{slug}/admin/dashboard
 *   - otherwise → /account (or the active store's account page)
 *
 * `next` (when same-origin) wins over the role-aware default.
 */
export async function landingPathForCurrentUser(
  supabase: SupabaseClient,
  requested?: string | null,
): Promise<string> {
  const allowed =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : null;
  if (allowed) return allowed;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  // If we already have a `next` (validated above), it wins. Otherwise we
  // pick a destination based on whether the user is staff anywhere AND
  // honour the active store from the URL they signed in on.

  // Find any active staff row across stores. If the user owns multiple
  // stores we pick the first one; a store-switcher is a future iteration.
  const { data: staff } = await supabase
    .from("staff")
    .select("store_id, store:stores(slug)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (staff) {
    const storeRaw = staff.store as unknown;
    const store = (Array.isArray(storeRaw) ? storeRaw[0] : storeRaw) as
      | { slug: string }
      | null;
    const slug = store?.slug ?? "main";
    return slug === "main"
      ? "/admin/dashboard"
      : `/s/${slug}/admin/dashboard`;
  }

  // Customer: send them to the account page of the store they signed in on.
  return storeLink("/account");
}
