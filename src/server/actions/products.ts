"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { idSchema } from "@/lib/validation/common";
import {
  mediaReorderSchema,
  productCreateSchema,
  productUpdateSchema,
  variantsUpsertSchema,
} from "@/lib/validation/product";

/**
 * Server actions for the admin product CRUD. Every mutation:
 *
 *   1. Re-checks the staff permission (`requirePermission`).
 *   2. Validates input with Zod.
 *   3. Lets Supabase RLS double-check the write at the database layer.
 *   4. Revalidates the admin list + storefront pages.
 *
 * Returning `{ ok, error }` instead of throwing keeps the client-side
 * progressive-enhancement story straightforward.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function revalidateCatalog(slug?: string | null) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  if (slug) revalidatePath(`/product/${slug}`);
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export async function createProduct(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
  } catch {
    return { ok: false, error: "You don't have permission to create products." };
  }
  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      kind: parsed.data.kind,
      status: parsed.data.status,
      brand: parsed.data.brand || null,
      tags: parsed.data.tags,
      attributes: parsed.data.attributes,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already in use.",
        fieldErrors: { slug: "Already taken" },
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateCatalog(data?.slug);
  return { ok: true, data: { id: data!.id } };
}

export async function updateProduct(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to update products." };
  }
  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();

  // If they're publishing for the first time, stamp published_at.
  const { data: existing } = await supabase
    .from("products")
    .select("status, published_at, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const becomingPublished =
    parsed.data.status === "published" && existing?.status !== "published";

  const { error } = await supabase
    .from("products")
    .update({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      kind: parsed.data.kind,
      status: parsed.data.status,
      brand: parsed.data.brand || null,
      tags: parsed.data.tags,
      attributes: parsed.data.attributes,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
      published_at: becomingPublished
        ? new Date().toISOString()
        : existing?.published_at ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already in use.",
        fieldErrors: { slug: "Already taken" },
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateCatalog(existing?.slug);
  revalidateCatalog(parsed.data.slug);
  return { ok: true, message: "Saved." };
}

export async function deleteProduct(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_DELETE);
  } catch {
    return { ok: false, error: "You don't have permission to delete products." };
  }
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("id", parsed.data)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidateCatalog(existing?.slug);
  return { ok: true, message: "Deleted." };
}

export async function togglePublish(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_PUBLISH);
  } catch {
    return { ok: false, error: "You don't have permission to publish products." };
  }
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const supabase = await createClient();
  const { data: existing, error: readErr } = await supabase
    .from("products")
    .select("status, slug, published_at")
    .eq("id", parsed.data)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Product not found" };

  const nextStatus = existing.status === "published" ? "draft" : "published";
  const { error } = await supabase
    .from("products")
    .update({
      status: nextStatus,
      published_at:
        nextStatus === "published"
          ? existing.published_at ?? new Date().toISOString()
          : existing.published_at,
    })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidateCatalog(existing.slug);
  return { ok: true, message: nextStatus === "published" ? "Published." : "Unpublished." };
}

/* -------------------------------------------------------------------------- */
/* Variants                                                                   */
/* -------------------------------------------------------------------------- */

export async function upsertVariants(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to update variants." };
  }
  const parsed = variantsUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const productId = parsed.data.productId;

  const { data: existing, error: readErr } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  if (readErr) return { ok: false, error: readErr.message };

  const incomingIds = new Set(parsed.data.variants.map((v) => v.id).filter(Boolean));
  const toDelete = (existing ?? [])
    .map((r: { id: string }) => r.id)
    .filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .in("id", toDelete);
    if (error) return { ok: false, error: error.message };
  }

  // Split into updates (have an id) and inserts (no id). Mixing them in a
  // single upsert sends `id: null` for new rows and Postgres rejects on
  // the NOT NULL PK constraint. Inserting without `id` lets the column
  // default (`gen_random_uuid()`) fill it in.
  const toUpdate: Array<Record<string, unknown>> = [];
  const toInsert: Array<Record<string, unknown>> = [];
  parsed.data.variants.forEach((v, i) => {
    const base = {
      product_id: productId,
      sku: v.sku || null,
      title: v.title,
      option1: v.option1 || null,
      option2: v.option2 || null,
      option3: v.option3 || null,
      price_cents: v.priceCents,
      compare_at_cents: v.compareAtCents ?? null,
      currency: v.currency,
      weight_grams: v.weightGrams ?? null,
      requires_shipping: v.requiresShipping,
      taxable: v.taxable,
      inventory_qty: v.inventoryQty,
      inventory_policy: v.inventoryPolicy,
      position: v.position ?? i,
    };
    if (v.id) toUpdate.push({ id: v.id, ...base });
    else toInsert.push(base);
  });

  if (toUpdate.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .upsert(toUpdate, { onConflict: "id" });
    if (error) return { ok: false, error: error.message };
  }
  if (toInsert.length > 0) {
    const { error } = await supabase.from("product_variants").insert(toInsert);
    if (error) return { ok: false, error: error.message };
  }
  const { data: slugRow } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  revalidateCatalog(slugRow?.slug);

  return { ok: true, message: "Variants saved." };
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

const uploadSchema = z.object({
  productId: idSchema,
  alt: z.string().max(200).optional(),
});

/**
 * Upload a single image to Supabase Storage and append it to a product's
 * media list. Returns the public URL on success.
 */
export async function uploadProductImage(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to upload images." };
  }

  const file = formData.get("file");
  const parsed = uploadSchema.safeParse({
    productId: formData.get("productId"),
    alt: (formData.get("alt") as string | null) ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file uploaded" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "File too large (max 5 MB)" };
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Unsupported file type" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `${parsed.data.productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("product-media")
    .upload(key, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data: pub } = supabase.storage.from("product-media").getPublicUrl(key);
  const url = pub.publicUrl;

  // Append after the current max position
  const { data: maxRow } = await supabase
    .from("product_media")
    .select("position")
    .eq("product_id", parsed.data.productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = ((maxRow?.position as number | undefined) ?? -1) + 1;

  const { data: inserted, error: insertErr } = await supabase
    .from("product_media")
    .insert({
      product_id: parsed.data.productId,
      url,
      alt: parsed.data.alt ?? null,
      position: nextPos,
    })
    .select("id")
    .single();
  if (insertErr) {
    // Best-effort cleanup of the orphaned storage object
    await supabase.storage.from("product-media").remove([key]);
    return { ok: false, error: insertErr.message };
  }

  const { data: slugRow } = await supabase
    .from("products")
    .select("slug")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  revalidateCatalog(slugRow?.slug);

  return { ok: true, data: { id: inserted!.id, url } };
}

const deleteMediaSchema = z.object({
  id: idSchema,
  productId: idSchema,
});

export async function deleteProductImage(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to delete images." };
  }
  const parsed = deleteMediaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  const { data: row, error: readErr } = await supabase
    .from("product_media")
    .select("url")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };

  // Pull the storage path out of the public URL: `.../product-media/<path>`
  if (row?.url) {
    const marker = "/product-media/";
    const idx = (row.url as string).indexOf(marker);
    if (idx >= 0) {
      const key = (row.url as string).slice(idx + marker.length);
      await supabase.storage.from("product-media").remove([key]);
    }
  }

  const { error } = await supabase
    .from("product_media")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  const { data: slugRow } = await supabase
    .from("products")
    .select("slug")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  revalidateCatalog(slugRow?.slug);

  return { ok: true, message: "Image removed." };
}

export async function reorderProductImages(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to reorder images." };
  }
  const parsed = mediaReorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await createClient();
  // Update positions in order, one-by-one. Small lists (≤20), so the round-
  // trip cost is negligible and we keep the policy check trivial.
  for (let i = 0; i < parsed.data.order.length; i++) {
    const id = parsed.data.order[i];
    const { error } = await supabase
      .from("product_media")
      .update({ position: i })
      .eq("id", id)
      .eq("product_id", parsed.data.productId);
    if (error) return { ok: false, error: error.message };
  }

  const { data: slugRow } = await supabase
    .from("products")
    .select("slug")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  revalidateCatalog(slugRow?.slug);

  return { ok: true };
}

/**
 * Convenience action: create then redirect to the edit page. Lets the
 * "New product" form be a pure progressive-enhancement form post.
 */
export async function createProductAndRedirect(input: unknown) {
  const result = await createProduct(input);
  if (!result.ok) return result;
  redirect(`/admin/products/${result.data!.id}`);
}
