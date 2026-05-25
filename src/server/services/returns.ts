import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveStoreId } from "@/lib/store/active";

/**
 * Read services for return/exchange requests. Customer-facing reads use
 * the cookied client (RLS scoped to the request's requested_by). Admin-
 * facing reads use the cookied client too — RLS allows reads when the
 * caller has `returns.view`.
 *
 * Image previews are served via short-lived signed URLs minted by the
 * admin client (the bucket is private).
 */

export type ReturnStatus = "pending" | "refunded" | "exchanged" | "denied";
export type ReturnType = "refund" | "exchange";

export interface ReturnAttachmentView {
  id: string;
  signedUrl: string;
  mimeType: string | null;
}

export interface ReturnRow {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  type: ReturnType;
  status: ReturnStatus;
  createdAt: string;
  refundAmountCents: number | null;
}

export interface ReturnDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  type: ReturnType;
  status: ReturnStatus;
  reason: string | null;
  customerMessage: string;
  adminNotes: string | null;
  refundAmountCents: number | null;
  decidedAt: string | null;
  createdAt: string;
  attachments: ReturnAttachmentView[];
  order: {
    totalCents: number;
    refundedCents: number;
    currency: string;
    items: Array<{
      id: string;
      productTitle: string;
      variantTitle: string | null;
      quantity: number;
      totalCents: number;
    }>;
  };
}

const SIGNED_URL_TTL = 60 * 30; // 30 min

async function signAttachments(
  rows: Array<{ id: string; storage_path: string; mime_type: string | null }>,
): Promise<ReturnAttachmentView[]> {
  if (rows.length === 0) return [];
  const admin = createAdminClient();
  const out: ReturnAttachmentView[] = [];
  for (const r of rows) {
    const { data } = await admin.storage
      .from("return-attachments")
      .createSignedUrl(r.storage_path, SIGNED_URL_TTL);
    if (data?.signedUrl) {
      out.push({
        id: r.id,
        signedUrl: data.signedUrl,
        mimeType: r.mime_type,
      });
    }
  }
  return out;
}

export async function getPendingReturnsCount(): Promise<number> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const { count } = await supabase
    .from("return_requests")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("status", "pending");
  return count ?? 0;
}

export async function listAdminReturns(params: {
  status?: ReturnStatus;
} = {}): Promise<ReturnRow[]> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  let q = supabase
    .from("return_requests")
    .select(
      `id, order_id, type, status, refund_amount_cents, created_at,
       order:orders(order_number, email)`,
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (params.status) q = q.eq("status", params.status);
  const { data } = await q;
  return ((data as Array<Record<string, unknown>>) ?? []).map((r) => {
    const orderRaw = r.order as unknown;
    const order = (Array.isArray(orderRaw) ? orderRaw[0] : orderRaw) as
      | { order_number: string; email: string }
      | null;
    return {
      id: r.id as string,
      orderId: r.order_id as string,
      orderNumber: order?.order_number ?? "—",
      customerEmail: order?.email ?? "—",
      type: r.type as ReturnType,
      status: r.status as ReturnStatus,
      createdAt: r.created_at as string,
      refundAmountCents: (r.refund_amount_cents as number | null) ?? null,
    };
  });
}

export async function listCustomerReturnsForOrder(
  orderId: string,
): Promise<ReturnRow[]> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const { data } = await supabase
    .from("return_requests")
    .select(
      `id, order_id, type, status, refund_amount_cents, created_at,
       order:orders(order_number, email)`,
    )
    .eq("store_id", storeId)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  return ((data as Array<Record<string, unknown>>) ?? []).map((r) => {
    const orderRaw = r.order as unknown;
    const order = (Array.isArray(orderRaw) ? orderRaw[0] : orderRaw) as
      | { order_number: string; email: string }
      | null;
    return {
      id: r.id as string,
      orderId: r.order_id as string,
      orderNumber: order?.order_number ?? "—",
      customerEmail: order?.email ?? "—",
      type: r.type as ReturnType,
      status: r.status as ReturnStatus,
      createdAt: r.created_at as string,
      refundAmountCents: (r.refund_amount_cents as number | null) ?? null,
    };
  });
}

export async function getReturnDetail(
  id: string,
): Promise<ReturnDetail | null> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const { data } = await supabase
    .from("return_requests")
    .select(
      `id, order_id, type, status, reason, customer_message, admin_notes,
       refund_amount_cents, decided_at, created_at,
       order:orders(order_number, email, total_cents, refunded_cents, currency,
                    order_items(id, product_title, variant_title, quantity, total_cents)),
       attachments:return_attachments(id, storage_path, mime_type)`,
    )
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const r = data as Record<string, unknown>;
  const orderRaw = r.order as unknown;
  const order = (Array.isArray(orderRaw) ? orderRaw[0] : orderRaw) as
    | {
        order_number: string;
        email: string;
        total_cents: number;
        refunded_cents: number;
        currency: string;
        order_items: Array<{
          id: string;
          product_title: string;
          variant_title: string | null;
          quantity: number;
          total_cents: number;
        }>;
      }
    | null;
  if (!order) return null;

  const attachmentRows =
    (r.attachments as Array<{
      id: string;
      storage_path: string;
      mime_type: string | null;
    }> | null) ?? [];
  const attachments = await signAttachments(attachmentRows);

  return {
    id: r.id as string,
    orderId: r.order_id as string,
    orderNumber: order.order_number,
    customerEmail: order.email,
    type: r.type as ReturnType,
    status: r.status as ReturnStatus,
    reason: (r.reason as string | null) ?? null,
    customerMessage: r.customer_message as string,
    adminNotes: (r.admin_notes as string | null) ?? null,
    refundAmountCents: (r.refund_amount_cents as number | null) ?? null,
    decidedAt: (r.decided_at as string | null) ?? null,
    createdAt: r.created_at as string,
    attachments,
    order: {
      totalCents: order.total_cents,
      refundedCents: order.refunded_cents,
      currency: order.currency,
      items: (order.order_items ?? []).map((it) => ({
        id: it.id,
        productTitle: it.product_title,
        variantTitle: it.variant_title,
        quantity: it.quantity,
        totalCents: it.total_cents,
      })),
    },
  };
}
