import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve the active store for the current request.
 *
 * Lookup order:
 *   1. The `x-store-slug` request header (set by middleware when the URL
 *      contains `/s/{slug}/...`).
 *   2. The `STORE_DEFAULT_SLUG` env var (defaults to `"main"`).
 *
 * In a future iteration we'll resolve from the hostname (subdomain) too.
 * Until then `/s/{slug}/...` is the canonical way to switch stores.
 *
 * Uses the admin client so the resolve works for anonymous storefront
 * visitors as well as signed-in users.
 */

export interface ActiveStore {
  id: string;
  slug: string;
  name: string;
  status: string;
  ownerUserId: string | null;
}

const DEFAULT_SLUG = "main";

async function readSlugFromRequest(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-store-slug") ?? DEFAULT_SLUG;
  } catch {
    return DEFAULT_SLUG;
  }
}

export const getActiveStore = cache(async (): Promise<ActiveStore> => {
  const slug = await readSlugFromRequest();
  const admin = createAdminClient();
  const { data } = await admin
    .from("stores")
    .select("id, slug, name, status, owner_user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    // Fall back to the default store so the app keeps working even when
    // the URL slug doesn't match a real store.
    const { data: fallback } = await admin
      .from("stores")
      .select("id, slug, name, status, owner_user_id")
      .eq("slug", DEFAULT_SLUG)
      .maybeSingle();
    if (!fallback) {
      throw new Error(
        `No default store '${DEFAULT_SLUG}' exists. Did the 0014 migration run?`,
      );
    }
    return {
      id: fallback.id as string,
      slug: fallback.slug as string,
      name: fallback.name as string,
      status: fallback.status as string,
      ownerUserId: (fallback.owner_user_id as string | null) ?? null,
    };
  }
  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    status: data.status as string,
    ownerUserId: (data.owner_user_id as string | null) ?? null,
  };
});

export async function getActiveStoreId(): Promise<string> {
  const s = await getActiveStore();
  return s.id;
}

/**
 * Global, non-store-scoped route prefixes. Links to these are NEVER
 * prefixed with `/s/{slug}` — they live at the platform root regardless of
 * the active store.
 */
const GLOBAL_PREFIXES = [
  "/login",
  "/signup",
  "/logout",
  "/auth/",
  "/onboarding/",
  "/api/",
  "/_next/",
];

function isGlobalPath(path: string): boolean {
  if (/^https?:\/\//i.test(path)) return true;
  if (path === "/" || path === "") return false; // home is store-scoped
  return GLOBAL_PREFIXES.some((p) => path === p || path.startsWith(p));
}

/**
 * Build a path that respects the active store context.
 *
 *   await storeLink("/products")        // in main store → "/products"
 *                                       // in fitnessarena → "/s/fitnessarena/products"
 *   await storeLink("/login")           // → "/login" (global)
 *
 * Use this in **server** code (page components, server actions, redirects).
 * For client components see `useStoreLink()` in `@/lib/store/link`.
 */
export async function storeLink(path: string): Promise<string> {
  if (!path.startsWith("/")) path = "/" + path;
  if (isGlobalPath(path)) return path;
  const store = await getActiveStore();
  if (store.slug === "main") return path;
  return `/s/${store.slug}${path === "/" ? "" : path}`;
}

/** Test-only export of the predicate for unit tests. */
export const _isGlobalPath = isGlobalPath;
