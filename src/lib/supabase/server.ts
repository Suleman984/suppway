import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client bound to the user's auth cookies. Use this in
 * Server Components, Server Actions, and Route Handlers — every query runs
 * with the user's identity, so RLS applies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — cookie writes are ignored. Refresh
          // happens on the next mutation or via middleware.
        }
      },
    },
  });
}
