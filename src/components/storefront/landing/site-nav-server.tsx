import { getStoreContext } from "@/lib/store/context";
import { SiteNav } from "./site-nav";

/**
 * Server-rendered wrapper around SiteNav. Reads the current auth context
 * (which can see httpOnly Supabase cookies — the browser client can't)
 * and hands the user identity down as a prop. UserMenu uses it for its
 * initial render, then subscribes to onAuthStateChange for live updates.
 *
 * Every page that wants the storefront nav should render this one, not
 * the bare client SiteNav.
 */
export async function SiteNavServer() {
  const ctx = await getStoreContext();
  const user = ctx.user
    ? {
        id: ctx.user.id,
        email: ctx.user.email ?? null,
        isStaff: Boolean(ctx.staff),
      }
    : null;
  return <SiteNav user={user} />;
}
