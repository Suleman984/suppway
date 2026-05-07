"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/rbac/check";
import { updateBrandingSchema, updateThemeSchema } from "@/lib/validation/settings";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flattenZod(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Update the active theme + optional brand-color override. Refreshes the
 * storefront cache so customers see the new look immediately.
 */
export async function updateTheme(input: unknown): Promise<ActionResult> {
  await requirePermission("settings.update");

  const parsed = updateThemeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      active_theme: parsed.data.activeTheme,
      custom_brand_color: parsed.data.customBrandColor || null,
    })
    .eq("singleton", true);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Theme updated." };
}

export async function updateBranding(input: unknown): Promise<ActionResult> {
  await requirePermission("settings.update");

  const parsed = updateBrandingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };
  }

  const v = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      name: v.name,
      tagline: v.tagline ?? null,
      description: v.description ?? null,
      logo_url: v.logoUrl || null,
      favicon_url: v.faviconUrl || null,
      hero_image_url: v.heroImageUrl || null,
      hero_headline: v.heroHeadline ?? null,
      hero_subheadline: v.heroSubheadline ?? null,
      contact_email: v.contactEmail || null,
      contact_phone: v.contactPhone ?? null,
      whatsapp_number: v.whatsappNumber ?? null,
      address: v.address ?? null,
      seo_title: v.seoTitle ?? null,
      seo_description: v.seoDescription ?? null,
    })
    .eq("singleton", true);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Branding updated." };
}
