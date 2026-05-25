"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { idSchema } from "@/lib/validation/common";
import { priceCart } from "@/server/services/pricing";
import { getActiveStoreId } from "@/lib/store/active";
import {
  renderOrderCanceledEmail,
  renderOrderRefundedEmail,
  sendEmail,
} from "@/lib/email/resend";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Restock the variants from an order back into inventory. Used by cancel
 * and full refund. Best-effort per item — if one update fails we keep
 * going so the surrounding action still completes.
 */
async function restockOrderItems(admin: AdminClient, orderId: string) {
  const { data: items } = await admin
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);
  for (const it of (items as Array<{ variant_id: string; quantity: number }> | null) ?? []) {
    const { data: v } = await admin
      .from("product_variants")
      .select("inventory_qty")
      .eq("id", it.variant_id)
      .maybeSingle();
    if (!v) continue;
    await admin
      .from("product_variants")
      .update({ inventory_qty: (v.inventory_qty as number) + it.quantity })
      .eq("id", it.variant_id);
  }
}

function pkr(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

/**
 * Customer checkout submission + admin order management actions.
 *
 * Customer side:
 *   - placeOrder(input) creates an `orders` row, copies the priced cart
 *     into `order_items`, increments discount usage counters, and (if
 *     paid via cash-on-delivery shortcut) awards loyalty points.
 *
 * Admin side:
 *   - markOrderPaid, fulfillOrder, refundOrder, cancelOrder.
 *   - Status transitions also trigger loyalty point awards / reversals
 *     so points stay in lockstep with revenue.
 */

const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  postal: z.string().trim().min(1).max(20),
  phone: z.string().trim().min(7).max(20),
});

const placeOrderSchema = z.object({
  email: z.string().trim().email(),
  shipping: addressSchema,
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  couponCode: z.string().trim().max(40).optional().nullable(),
  paymentMethod: z.enum(["card", "jazzcash", "easypaisa", "cod"]),
});

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flatten(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Earn rate: 1 point per 100 PKR (i.e. per 10_000 cents). */
const POINTS_PER_CENT = 1 / 10_000;
function pointsForSubtotal(subtotalCents: number) {
  return Math.floor(subtotalCents * POINTS_PER_CENT);
}

/**
 * Atomically claim an unconsumed, non-expired verification row for the
 * given email. Mirrors the verify action's check but also marks the row
 * consumed so it can't gate a second order.
 *
 * Note: we don't take the OTP code here — the user already entered it on
 * verify. Once consumed_at is null and the row hasn't expired, we treat
 * the email as proven and burn the row.
 */
async function consumeCheckoutVerification(
  email: string,
  storeId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("checkout_verifications")
    .select("id, expires_at, consumed_at")
    .eq("store_id", storeId)
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) {
    return { ok: false, error: "Please verify your email before placing the order." };
  }
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "Email verification expired. Verify again." };
  }
  const nowIso = new Date().toISOString();
  // Conditional update so two concurrent placeOrder calls can't both win.
  const { data: claimed, error: claimErr } = await admin
    .from("checkout_verifications")
    .update({ consumed_at: nowIso })
    .eq("id", row.id as string)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();
  if (claimErr || !claimed) {
    return { ok: false, error: "Verification already used. Verify again." };
  }
  return { ok: true };
}

/** Order number: SW-YYMMDD-XXXXXX (six random alphanums). */
function newOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear() % 100).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SW-${yy}${mm}${dd}-${rand}`;
}

/* -------------------------------------------------------------------------- */
/* Customer: place order                                                      */
/* -------------------------------------------------------------------------- */

export async function placeOrder(
  input: unknown,
): Promise<ActionResult<{ orderNumber: string }>> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid checkout payload", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  // Server is the source of truth for pricing — never trust the client.
  const priced = await priceCart(parsed.data.items, {
    couponCode: parsed.data.couponCode ?? null,
  });
  if (priced.couponError) {
    return { ok: false, error: priced.couponError };
  }
  if (priced.lines.length === 0) {
    return { ok: false, error: "Your cart is empty" };
  }
  if (priced.invalidLines.length > 0) {
    return {
      ok: false,
      error: `One or more items are no longer available: ${priced.invalidLines
        .map((l) => l.reason)
        .join("; ")}`,
    };
  }

  // Who's checking out? Logged-in user gets their profile linked; guests
  // checkout with just an email.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Email ownership gate. A logged-in user submitting their own auth email
  // is already proven (Supabase verified it at signup). Everyone else —
  // guests, and logged-in users submitting a different email — must have
  // a valid OTP verification row. Consumed atomically here so the same row
  // can't back two orders.
  const email = parsed.data.email.toLowerCase();
  const isOwnAuthEmail =
    !!user && (user.email ?? "").toLowerCase() === email;
  if (!isOwnAuthEmail) {
    const gate = await consumeCheckoutVerification(email, storeId);
    if (!gate.ok) return { ok: false, error: gate.error };
  }

  // Find or create customer (by email) — scoped to THIS store. The same
  // email at a different store is a different customer record.
  const { data: existingCust } = await admin
    .from("customers")
    .select("id, total_spent_cents, orders_count")
    .eq("store_id", storeId)
    .eq("email", parsed.data.email.toLowerCase())
    .maybeSingle();

  let customerId: string | null = null;
  if (existingCust) {
    customerId = existingCust.id as string;
    if (user) {
      // Backfill the link if the customer existed as a guest before.
      await admin
        .from("customers")
        .update({
          user_id: user.id,
          first_name: parsed.data.shipping.firstName,
          last_name: parsed.data.shipping.lastName,
          phone: parsed.data.shipping.phone,
        })
        .eq("id", customerId);
    }
  } else {
    const { data: created, error: createErr } = await admin
      .from("customers")
      .insert({
        store_id: storeId,
        user_id: user?.id ?? null,
        email: parsed.data.email.toLowerCase(),
        first_name: parsed.data.shipping.firstName,
        last_name: parsed.data.shipping.lastName,
        phone: parsed.data.shipping.phone,
      })
      .select("id")
      .single();
    if (createErr) return { ok: false, error: createErr.message };
    customerId = created!.id as string;
  }

  // Cash-on-delivery is "pending" until the rider confirms; other rails
  // get marked "paid" optimistically for the demo (real Stripe/JC flow
  // will set this from a webhook later).
  const isPaid = parsed.data.paymentMethod !== "cod";
  const orderNumber = newOrderNumber();

  const { data: orderRow, error: orderErr } = await admin
    .from("orders")
    .insert({
      store_id: storeId,
      customer_id: customerId,
      order_number: orderNumber,
      status: isPaid ? "paid" : "pending",
      email: parsed.data.email.toLowerCase(),
      currency: priced.currency,
      subtotal_cents: priced.subtotalCents,
      discount_cents: priced.discountCents,
      shipping_cents: priced.shippingCents,
      tax_cents: priced.taxCents,
      total_cents: priced.totalCents,
      shipping_address: parsed.data.shipping,
      billing_address: parsed.data.shipping,
      source: "storefront",
      metadata: {
        payment_method: parsed.data.paymentMethod,
        coupon: parsed.data.couponCode ?? null,
        applied_discounts: priced.appliedDiscounts.map((d) => d.id),
      },
    })
    .select("id, order_number")
    .single();
  if (orderErr) return { ok: false, error: orderErr.message };

  const orderId = orderRow!.id as string;

  const itemRows = priced.lines.map((l) => ({
    store_id: storeId,
    order_id: orderId,
    variant_id: l.variantId,
    product_title: l.productTitle,
    variant_title: l.variantTitle,
    quantity: l.qty,
    price_cents: l.unitPriceCents,
    total_cents: l.lineTotalCents,
  }));
  // The order_items table was defined in 0004_orders.sql — fall back to
  // a generic insert and ignore missing optional columns gracefully.
  const { error: itemsErr } = await admin.from("order_items").insert(itemRows);
  if (itemsErr) {
    // Best-effort cleanup
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, error: `Failed to record items: ${itemsErr.message}` };
  }

  // Increment discount usage counters
  if (priced.appliedDiscounts.length > 0) {
    for (const d of priced.appliedDiscounts) {
      await admin.rpc("increment_discount_uses", { p_id: d.id }).then(
        () => undefined,
        async () => {
          // Fallback: read-then-write if the RPC isn't defined
          const { data: cur } = await admin
            .from("discounts")
            .select("uses_count")
            .eq("id", d.id)
            .maybeSingle();
          if (cur) {
            await admin
              .from("discounts")
              .update({ uses_count: (cur.uses_count as number) + 1 })
              .eq("id", d.id);
          }
        },
      );
    }
  }

  // Update customer totals + award loyalty points (only if paid).
  if (isPaid) {
    await admin
      .from("customers")
      .update({
        total_spent_cents:
          (existingCust?.total_spent_cents ?? 0) + priced.totalCents,
        orders_count: (existingCust?.orders_count ?? 0) + 1,
      })
      .eq("id", customerId);

    if (user) {
      const pts = pointsForSubtotal(priced.subtotalCents);
      if (pts > 0) {
        await admin.from("loyalty_points").insert({
          store_id: storeId,
          user_id: user.id,
          order_id: orderId,
          delta: pts,
          reason: "purchase",
          note: `+${pts} pts on order ${orderNumber}`,
        });
      }
    }
  }

  revalidatePath("/account");
  revalidatePath("/admin/orders");

  return { ok: true, data: { orderNumber: orderRow!.order_number as string } };
}

/* -------------------------------------------------------------------------- */
/* Admin: status transitions                                                  */
/* -------------------------------------------------------------------------- */

const orderActionSchema = z.object({ id: idSchema });

async function getOrderForAdmin(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, store_id, order_number, email, status, fulfillment_status, customer_id, total_cents, subtotal_cents, refunded_cents",
    )
    .eq("id", orderId)
    .maybeSingle();
  return data as
    | {
        id: string;
        store_id: string;
        order_number: string;
        email: string;
        status: string;
        fulfillment_status: string;
        customer_id: string | null;
        total_cents: number;
        subtotal_cents: number;
        refunded_cents: number;
      }
    | null;
}

export async function markOrderPaid(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.ORDERS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to update orders." };
  }
  const parsed = orderActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const order = await getOrderForAdmin(parsed.data.id);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "paid") return { ok: true, message: "Already paid" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  // Award points + bump customer totals if this is the first time the
  // order becomes paid. We detect it by checking the prior status.
  if (order.customer_id) {
    const { data: cust } = await admin
      .from("customers")
      .select("user_id, total_spent_cents, orders_count")
      .eq("id", order.customer_id)
      .maybeSingle();
    if (cust) {
      await admin
        .from("customers")
        .update({
          total_spent_cents: (cust.total_spent_cents ?? 0) + order.total_cents,
          orders_count: (cust.orders_count ?? 0) + 1,
        })
        .eq("id", order.customer_id);
      if (cust.user_id) {
        const pts = pointsForSubtotal(order.subtotal_cents);
        if (pts > 0) {
          await admin.from("loyalty_points").insert({
            store_id: order.store_id,
            user_id: cust.user_id,
            order_id: parsed.data.id,
            delta: pts,
            reason: "purchase",
            note: `+${pts} pts when order was marked paid`,
          });
        }
      }
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  revalidatePath("/account");
  return { ok: true, message: "Marked paid." };
}

export async function fulfillOrder(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.ORDERS_UPDATE);
  } catch {
    return { ok: false, error: "You don't have permission to update orders." };
  }
  const parsed = orderActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status: "fulfilled", fulfillment_status: "fulfilled" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  return { ok: true, message: "Marked fulfilled." };
}

export async function cancelOrder(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.ORDERS_CANCEL);
  } catch {
    return { ok: false, error: "You don't have permission to cancel orders." };
  }
  const parsed = orderActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const order = await getOrderForAdmin(parsed.data.id);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "canceled") {
    return { ok: true, message: "Already canceled." };
  }
  if (order.fulfillment_status === "fulfilled") {
    return {
      ok: false,
      error: "This order has been fulfilled. Issue a refund instead.",
    };
  }
  if (order.status !== "pending" && order.status !== "paid") {
    return {
      ok: false,
      error: "Only pending or paid orders can be canceled.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status: "canceled" })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: error.message };

  // Free up inventory so the canceled units can be sold again.
  await restockOrderItems(admin, parsed.data.id);

  // Tell the customer. Best-effort — a delivery failure shouldn't block
  // the cancel from completing in the DB.
  const tpl = renderOrderCanceledEmail({ orderNumber: order.order_number });
  await sendEmail({ to: order.email, ...tpl });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  revalidatePath("/account");
  return { ok: true, message: "Canceled. Items restocked, customer notified." };
}

const refundSchema = z.object({
  id: idSchema,
  amountCents: z.number().int().positive().optional(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export async function refundOrder(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission(PERMISSIONS.ORDERS_REFUND);
  } catch {
    return { ok: false, error: "You don't have permission to refund orders." };
  }
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid refund input" };

  const order = await getOrderForAdmin(parsed.data.id);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "refunded") {
    return { ok: false, error: "Order is already fully refunded." };
  }
  if (
    order.status !== "paid" &&
    order.status !== "fulfilled" &&
    order.status !== "partially_refunded"
  ) {
    return {
      ok: false,
      error: "Only paid or fulfilled orders can be refunded.",
    };
  }

  const remaining = order.total_cents - order.refunded_cents;
  if (remaining <= 0) {
    return { ok: false, error: "No amount left to refund on this order." };
  }
  const amount = parsed.data.amountCents ?? remaining;
  if (amount > remaining) {
    return {
      ok: false,
      error: `Cannot refund more than the remaining ${pkr(remaining)}.`,
    };
  }

  // Who's clicking the button — recorded for the audit trail.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const newRefunded = order.refunded_cents + amount;
  const isFull = newRefunded >= order.total_cents;
  const newStatus = isFull ? "refunded" : "partially_refunded";

  const { error: refundErr } = await admin.from("refunds").insert({
    store_id: order.store_id,
    order_id: parsed.data.id,
    amount_cents: amount,
    reason: parsed.data.reason ?? null,
    processed_by: user?.id ?? null,
  });
  if (refundErr) return { ok: false, error: refundErr.message };

  const { error: orderErr } = await admin
    .from("orders")
    .update({ status: newStatus, refunded_cents: newRefunded })
    .eq("id", parsed.data.id);
  if (orderErr) return { ok: false, error: orderErr.message };

  // Restock only on full refund. Partial refunds don't tell us which line
  // items were affected, so we leave inventory alone until we have a
  // line-item return UI (later phase).
  if (isFull) {
    await restockOrderItems(admin, parsed.data.id);
  }

  // Reverse loyalty points proportional to the refunded amount.
  if (order.customer_id) {
    const { data: cust } = await admin
      .from("customers")
      .select("user_id")
      .eq("id", order.customer_id)
      .maybeSingle();
    if (cust?.user_id) {
      const subtotalShare = isFull
        ? order.subtotal_cents
        : Math.floor((order.subtotal_cents * amount) / order.total_cents);
      const pts = pointsForSubtotal(subtotalShare);
      if (pts > 0) {
        await admin.from("loyalty_points").insert({
          store_id: order.store_id,
          user_id: cust.user_id,
          order_id: parsed.data.id,
          delta: -pts,
          reason: "adjustment",
          note: isFull
            ? `Full refund of order ${order.order_number} — points reversed`
            : `Partial refund (${pkr(amount)}) — points reversed`,
        });
      }
    }
  }

  const tpl = renderOrderRefundedEmail({
    orderNumber: order.order_number,
    amountCents: amount,
    isFull,
    reason: parsed.data.reason ?? null,
  });
  await sendEmail({ to: order.email, ...tpl });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  revalidatePath("/account");
  return {
    ok: true,
    message: isFull ? "Refunded in full." : `Refunded ${pkr(amount)}.`,
  };
}
