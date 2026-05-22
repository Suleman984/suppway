"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { idSchema } from "@/lib/validation/common";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "@/lib/validation/category";

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

function bump() {
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission(PERMISSIONS.COLLECTIONS_MANAGE);
  } catch {
    return { ok: false, error: "You don't have permission to manage categories." };
  }
  const parsed = categoryCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      image_url: parsed.data.imageUrl || null,
      parent_id: parsed.data.parentId ?? null,
      sort_order: parsed.data.sortOrder,
      is_published: parsed.data.isPublished,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already used by another category.",
        fieldErrors: { slug: "Already taken" },
      };
    }
    return { ok: false, error: error.message };
  }
  bump();
  return { ok: true, data: { id: data!.id } };
}

export async function updateCategory(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.COLLECTIONS_MANAGE);
  } catch {
    return { ok: false, error: "You don't have permission to manage categories." };
  }
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      image_url: parsed.data.imageUrl || null,
      parent_id: parsed.data.parentId ?? null,
      sort_order: parsed.data.sortOrder,
      is_published: parsed.data.isPublished,
      seo_title: parsed.data.seoTitle || null,
      seo_description: parsed.data.seoDescription || null,
    })
    .eq("id", parsed.data.id);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That slug is already used by another category.",
        fieldErrors: { slug: "Already taken" },
      };
    }
    return { ok: false, error: error.message };
  }
  bump();
  return { ok: true, message: "Saved." };
}

export async function deleteCategory(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.COLLECTIONS_MANAGE);
  } catch {
    return { ok: false, error: "You don't have permission to manage categories." };
  }
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  bump();
  return { ok: true, message: "Deleted." };
}
