"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { idSchema } from "@/lib/validation/common";
import { env, publicEnv } from "@/config/env";
import { getActiveStoreId } from "@/lib/store/active";
import {
  renderReturnDecidedEmail,
  renderReturnRequestedAdminEmail,
  sendEmail,
} from "@/lib/email/resend";
import { refundOrder } from "@/server/actions/orders";

/**
 * Customer-initiated refund/exchange request lifecycle.
 *
 * createReturnRequest — customer submits with reason, message, and pre-
 * uploaded storage paths (the client uploads the images directly to
 * Supabase Storage first, then sends the paths in this action).
 *
 * decideReturn — admin approves as refund, approves as exchange, or
 * denies. Approving as refund delegates to refundOrder so the existing
 * refunds-table + inventory restock + loyalty reversal pipeline runs.
 */

export type ReturnActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

const createSchema = z.object({
  orderId: idSchema,
  type: z.enum(["refund", "exchange"]),
  reason: z.string().trim().max(80).optional().nullable(),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more so we can help (min 20 characters)")
    .max(2000),
  attachmentPaths: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
        mimeType: z.string().max(80).nullable().optional(),
        byteSize: z.number().int().positive().max(10 * 1024 * 1024).optional(),
      }),
    )
    .max(6)
    .default([]),
});

const decideSchema = z.object({
  id: idSchema,
  outcome: z.enum(["refund", "exchange", "deny"]),
  refundAmountCents: z.number().int().positive().optional(),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
});

async function adminBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return publicEnv.appUrl;
}

export async function createReturnRequest(
  input: unknown,
): Promise<ReturnActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to submit a request." };

  const storeId = await getActiveStoreId();

  // Verify the order belongs to this user and is in a state where a
  // return makes sense (paid, fulfilled, or partially refunded).
  const { data: order } = await supabase
    .from("orders")
    .select("id, store_id, order_number, email, status, customer:customers(user_id)")
    .eq("id", parsed.data.orderId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };
  const orderRow = order as {
    id: string;
    store_id: string;
    order_number: string;
    email: string;
    status: string;
    customer: { user_id: string | null } | { user_id: string | null }[] | null;
  };
  const cust = Array.isArray(orderRow.customer)
    ? orderRow.customer[0]
    : orderRow.customer;
  if (!cust || cust.user_id !== user.id) {
    return { ok: false, error: "You can't request a return on this order." };
  }
  if (
    orderRow.status !== "paid" &&
    orderRow.status !== "fulfilled" &&
    orderRow.status !== "partially_refunded"
  ) {
    return {
      ok: false,
      error: "This order isn't eligible for a return right now.",
    };
  }

  // Block stacking pending requests on the same order — admin would have
  // to dedupe by hand otherwise.
  const { count: existingPending } = await supabase
    .from("return_requests")
    .select("id", { count: "exact", head: true })
    .eq("order_id", parsed.data.orderId)
    .eq("status", "pending");
  if ((existingPending ?? 0) > 0) {
    return {
      ok: false,
      error: "You already have an open request for this order.",
    };
  }

  // Insert via the user's client so RLS enforces ownership.
  const { data: created, error: insertErr } = await supabase
    .from("return_requests")
    .insert({
      store_id: orderRow.store_id,
      order_id: parsed.data.orderId,
      requested_by: user.id,
      type: parsed.data.type,
      reason: parsed.data.reason ?? null,
      customer_message: parsed.data.message,
    })
    .select("id")
    .single();
  if (insertErr || !created) {
    return { ok: false, error: insertErr?.message ?? "Could not submit request." };
  }
  const requestId = created.id as string;

  if (parsed.data.attachmentPaths.length > 0) {
    const rows = parsed.data.attachmentPaths.map((a) => ({
      store_id: orderRow.store_id,
      request_id: requestId,
      storage_path: a.path,
      mime_type: a.mimeType ?? null,
      byte_size: a.byteSize ?? null,
    }));
    const { error: attErr } = await supabase
      .from("return_attachments")
      .insert(rows);
    if (attErr) {
      // Best-effort cleanup; we still keep the request so the customer
      // doesn't lose their typed message.
      console.warn("[returns] attachment insert failed", attErr.message);
    }
  }

  // Notify admin via the support inbox. EMAIL_FROM doubles as the catch-all
  // inbox when no dedicated admin alias is configured.
  const base = await adminBaseUrl();
  const adminInbox = env.STORE_SUPPORT_EMAIL;
  if (adminInbox) {
    const tpl = renderReturnRequestedAdminEmail({
      orderNumber: orderRow.order_number,
      type: parsed.data.type,
      customerEmail: orderRow.email,
      message: parsed.data.message,
      adminUrl: `${base}/admin/returns/${requestId}`,
    });
    await sendEmail({ to: adminInbox, ...tpl });
  }

  revalidatePath(`/account/orders/${orderRow.order_number}`);
  revalidatePath("/admin/returns");

  return { ok: true, data: { id: requestId }, message: "Request submitted." };
}

export async function decideReturn(
  input: unknown,
): Promise<ReturnActionResult> {
  try {
    await requirePermission(PERMISSIONS.RETURNS_DECIDE);
  } catch {
    return { ok: false, error: "You don't have permission to decide returns." };
  }
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: req } = await supabase
    .from("return_requests")
    .select(
      `id, store_id, order_id, type, status, order:orders(id, order_number, email, total_cents, refunded_cents)`,
    )
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!req) return { ok: false, error: "Request not found." };
  const reqRow = req as {
    id: string;
    order_id: string;
    type: "refund" | "exchange";
    status: string;
    order:
      | {
          id: string;
          order_number: string;
          email: string;
          total_cents: number;
          refunded_cents: number;
        }
      | Array<{
          id: string;
          order_number: string;
          email: string;
          total_cents: number;
          refunded_cents: number;
        }>
      | null;
  };
  const orderInfo = Array.isArray(reqRow.order) ? reqRow.order[0] : reqRow.order;
  if (!orderInfo) return { ok: false, error: "Order missing on request." };
  if (reqRow.status !== "pending") {
    return { ok: false, error: "This request has already been decided." };
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  if (parsed.data.outcome === "deny") {
    const { error } = await admin
      .from("return_requests")
      .update({
        status: "denied",
        admin_notes: parsed.data.adminNotes ?? null,
        decided_at: nowIso,
        decided_by: user?.id ?? null,
      })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, error: error.message };

    const tpl = renderReturnDecidedEmail({
      orderNumber: orderInfo.order_number,
      type: reqRow.type,
      outcome: "denied",
      adminNotes: parsed.data.adminNotes ?? null,
    });
    await sendEmail({ to: orderInfo.email, ...tpl });

    revalidatePath("/admin/returns");
    revalidatePath(`/admin/returns/${parsed.data.id}`);
    revalidatePath(`/account/orders/${orderInfo.order_number}`);
    return { ok: true, message: "Request denied. Customer notified." };
  }

  if (parsed.data.outcome === "refund") {
    const remaining = orderInfo.total_cents - orderInfo.refunded_cents;
    if (remaining <= 0) {
      return {
        ok: false,
        error: "No amount remaining to refund on this order.",
      };
    }
    const amount = parsed.data.refundAmountCents ?? remaining;
    if (amount > remaining) {
      return {
        ok: false,
        error: "Refund amount exceeds the remaining balance.",
      };
    }
    // Delegate to refundOrder — it inserts the refunds row, updates
    // status/refunded_cents, restocks on full, reverses loyalty, and
    // sends the existing refund email.
    const refundResult = await refundOrder({
      id: orderInfo.id,
      amountCents: amount,
      reason: parsed.data.adminNotes ?? "Approved return request",
    });
    if (!refundResult.ok) return refundResult;

    const { error } = await admin
      .from("return_requests")
      .update({
        status: "refunded",
        admin_notes: parsed.data.adminNotes ?? null,
        refund_amount_cents: amount,
        decided_at: nowIso,
        decided_by: user?.id ?? null,
      })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, error: error.message };

    // refundOrder already emails the customer about the refund; we send a
    // second email tying it specifically to the return request so the
    // customer sees their request was honored.
    const tpl = renderReturnDecidedEmail({
      orderNumber: orderInfo.order_number,
      type: reqRow.type,
      outcome: "refunded",
      refundAmountCents: amount,
      adminNotes: parsed.data.adminNotes ?? null,
    });
    await sendEmail({ to: orderInfo.email, ...tpl });

    revalidatePath("/admin/returns");
    revalidatePath(`/admin/returns/${parsed.data.id}`);
    revalidatePath(`/account/orders/${orderInfo.order_number}`);
    return { ok: true, message: "Refund approved and issued." };
  }

  // outcome === "exchange"
  const { error } = await admin
    .from("return_requests")
    .update({
      status: "exchanged",
      admin_notes: parsed.data.adminNotes ?? null,
      decided_at: nowIso,
      decided_by: user?.id ?? null,
    })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  const tpl = renderReturnDecidedEmail({
    orderNumber: orderInfo.order_number,
    type: reqRow.type,
    outcome: "exchanged",
    adminNotes: parsed.data.adminNotes ?? null,
  });
  await sendEmail({ to: orderInfo.email, ...tpl });

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${parsed.data.id}`);
  revalidatePath(`/account/orders/${orderInfo.order_number}`);
  return {
    ok: true,
    message: "Exchange approved. Coordinate shipping with the customer.",
  };
}
