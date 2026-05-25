"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Store onboarding. A signed-in user picks a slug + display name; we
 * insert a new row in `stores`, a `store_settings` row, and a `staff`
 * row that promotes them to admin of the new store.
 */

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters")
  .max(32, "Slug must be 32 characters or fewer")
  .regex(
    /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$/,
    "Use only lowercase letters, digits and hyphens (e.g. fitness-arena).",
  );

const createStoreSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(80),
});

export type CreateStoreResult =
  | { ok: true; data: { slug: string } }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const RESERVED_SLUGS = new Set([
  "admin",
  "account",
  "api",
  "auth",
  "checkout",
  "login",
  "logout",
  "main",
  "onboarding",
  "products",
  "s",
  "signup",
  "static",
  "store",
]);

export async function createStore(input: unknown): Promise<CreateStoreResult> {
  const parsed = createStoreSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path.join(".") || "_";
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, error: "Check the form for errors.", fieldErrors };
  }
  const slug = parsed.data.slug;
  const name = parsed.data.name;

  if (RESERVED_SLUGS.has(slug)) {
    return {
      ok: false,
      error: "That slug is reserved.",
      fieldErrors: { slug: "Pick a different slug." },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Please sign in first." };
  }

  const admin = createAdminClient();

  // Slug must be globally unique (subdomain semantics).
  const { data: existing } = await admin
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: "That slug is taken.",
      fieldErrors: { slug: "Pick a different slug." },
    };
  }

  // 1. Insert the store, owned by this user.
  const { data: store, error: storeErr } = await admin
    .from("stores")
    .insert({
      slug,
      name,
      owner_user_id: user.id,
    })
    .select("id, slug")
    .single();
  if (storeErr || !store) {
    return { ok: false, error: storeErr?.message ?? "Could not create store." };
  }

  // 2. Add the user as an admin staff member of the new store.
  const { data: adminRole } = await admin
    .from("roles")
    .select("id")
    .eq("key", "admin")
    .maybeSingle();
  if (!adminRole) {
    return {
      ok: false,
      error: "Default 'admin' role is missing — seed not applied.",
    };
  }
  const { error: staffErr } = await admin.from("staff").insert({
    store_id: store.id,
    user_id: user.id,
    role_id: adminRole.id,
    status: "active",
    joined_at: new Date().toISOString(),
  });
  if (staffErr) {
    // Clean up the store so the user can retry.
    await admin.from("stores").delete().eq("id", store.id);
    return { ok: false, error: `Membership failed: ${staffErr.message}` };
  }

  // 3. Seed a store_settings row so branding helpers don't crash.
  await admin.from("store_settings").insert({
    store_id: store.id,
    name,
  });

  return { ok: true, data: { slug: store.slug as string } };
}
