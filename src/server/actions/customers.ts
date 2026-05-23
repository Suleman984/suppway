"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { idSchema } from "@/lib/validation/common";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

const adjustSchema = z.object({
  customerId: idSchema,
  delta: z.number().int().refine((n) => n !== 0, "Use a non-zero delta"),
  note: z.string().trim().max(200).optional(),
});

/**
 * Manual point adjustment by staff. Records an `adjustment` event on the
 * customer's loyalty ledger so the audit trail is preserved (we never
 * mutate balances directly — only append).
 */
export async function adjustCustomerPoints(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.LOYALTY_ADJUST);
  } catch {
    return { ok: false, error: "You don't have permission to adjust points." };
  }
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: cust } = await admin
    .from("customers")
    .select("user_id")
    .eq("id", parsed.data.customerId)
    .maybeSingle();
  if (!cust || !cust.user_id) {
    return {
      ok: false,
      error:
        "This customer has no linked login account — points can only be granted to customers with an account.",
    };
  }

  const { error } = await admin.from("loyalty_points").insert({
    user_id: cust.user_id,
    delta: parsed.data.delta,
    reason: "adjustment",
    note: parsed.data.note?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  revalidatePath("/admin/customers");
  revalidatePath("/account");
  return {
    ok: true,
    message: `${parsed.data.delta > 0 ? "+" : ""}${parsed.data.delta} points recorded.`,
  };
}
