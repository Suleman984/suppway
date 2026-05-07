"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client. Uses the anon key — RLS in the database
 * enforces ownership and permission checks.
 */
export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
