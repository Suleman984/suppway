"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { idSchema } from "@/lib/validation/common";
import {
  discountCreateSchema,
  discountUpdateSchema,
} from "@/lib/validation/discount";

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
  revalidatePath("/admin/discounts");
  revalidatePath("/products");
  revalidatePath("/");
}

function toInsert(input: z.infer<typeof discountCreateSchema>) {
  return {
    title: input.title,
    description: input.description || null,
    code: input.code ? input.code.toUpperCase() : null,
    kind: input.kind,
    value: input.value,
    scope: input.scope,
    product_id: input.scope === "product" ? input.productId : null,
    category_id: input.scope === "category" ? input.categoryId : null,
    min_subtotal_cents: input.minSubtotalCents ?? null,
    max_uses: input.maxUses ?? null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    is_active: input.isActive,
  };
}

export async function createDiscount(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission(PERMISSIONS.DISCOUNTS_CREATE);
  } catch {
    return { ok: false, error: "You don't have permission to create discounts." };
  }
  const parsed = discountCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .insert(toInsert(parsed.data))
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That code is already in use.",
        fieldErrors: { code: "Already taken" },
      };
    }
    return { ok: false, error: error.message };
  }
  bump();
  return { ok: true, data: { id: data!.id } };
}

export async function updateDiscount(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.DISCOUNTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to update discounts." };
  }
  const parsed = discountUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("discounts")
    .update(toInsert(parsed.data))
    .eq("id", parsed.data.id);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That code is already in use.",
        fieldErrors: { code: "Already taken" },
      };
    }
    return { ok: false, error: error.message };
  }
  bump();
  return { ok: true, message: "Saved." };
}

export async function deleteDiscount(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.DISCOUNTS_DELETE);
  } catch {
    return { ok: false, error: "You don't have permission to delete discounts." };
  }
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const supabase = await createClient();
  const { error } = await supabase.from("discounts").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  bump();
  return { ok: true, message: "Deleted." };
}

export async function toggleDiscountActive(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.DISCOUNTS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to update discounts." };
  }
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const supabase = await createClient();
  const { data: existing, error: readErr } = await supabase
    .from("discounts")
    .select("is_active")
    .eq("id", parsed.data)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Discount not found" };

  const { error } = await supabase
    .from("discounts")
    .update({ is_active: !existing.is_active })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };
  bump();
  return { ok: true };
}
