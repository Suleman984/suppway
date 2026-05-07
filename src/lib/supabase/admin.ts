import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. BYPASSES Row Level Security — only use it from
 * trusted server code (webhooks, background jobs, migrations, super-admin
 * operations). Never import this from any path reachable by user input
 * without an explicit authorization check first.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
