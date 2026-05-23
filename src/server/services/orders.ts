import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  customerName: string | null;
  totalCents: number;
  currency: string;
  itemCount: number;
  placedAt: string;
}

export interface ListAdminOrdersParams {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAdminOrdersResult {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAdminOrders(
  params: ListAdminOrdersParams = {},
): Promise<ListAdminOrdersResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select(
      `id, order_number, status, email, total_cents, currency, placed_at,
       order_items(id),
       customer:customers(first_name, last_name)`,
      { count: "exact" },
    )
    .order("placed_at", { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq("status", params.status);
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(`order_number.ilike.${term},email.ilike.${term}`);
  }

  const { data, count } = await query;
  const rows = ((data as Array<Record<string, unknown>>) ?? []).map((o) => {
    const itemRows = (o.order_items as Array<{ id: string }>) ?? [];
    const customerRaw = o.customer as unknown;
    const customer = (Array.isArray(customerRaw)
      ? customerRaw[0]
      : customerRaw) as
      | { first_name: string | null; last_name: string | null }
      | null
      | undefined;
    const customerName = customer
      ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        null
      : null;
    return {
      id: o.id as string,
      orderNumber: o.order_number as string,
      status: o.status as string,
      email: o.email as string,
      customerName,
      totalCents: o.total_cents as number,
      currency: o.currency as string,
      itemCount: itemRows.length,
      placedAt: o.placed_at as string,
    };
  });

  return { rows, total: count ?? rows.length, page, pageSize };
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentStatus: string;
  email: string;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  refundedCents: number;
  shippingAddress: Record<string, unknown> | null;
  placedAt: string;
  notes: string | null;
  customer: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    userId: string | null;
    totalSpentCents: number;
    ordersCount: number;
  } | null;
  items: Array<{
    id: string;
    productTitle: string;
    variantTitle: string | null;
    quantity: number;
    priceCents: number;
    totalCents: number;
  }>;
  metadata: Record<string, unknown>;
}

export async function getAdminOrderById(
  id: string,
): Promise<AdminOrderDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, fulfillment_status, email, currency,
       subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents,
       refunded_cents, shipping_address, placed_at, notes, metadata,
       customer:customers(id, first_name, last_name, phone, user_id,
                          total_spent_cents, orders_count),
       order_items(id, product_title, variant_title, quantity, price_cents, total_cents)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const o = data as Record<string, unknown>;
  const customerRaw = o.customer as unknown;
  const customer = (Array.isArray(customerRaw)
    ? customerRaw[0]
    : customerRaw) as
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        user_id: string | null;
        total_spent_cents: number | null;
        orders_count: number | null;
      }
    | null
    | undefined;

  return {
    id: o.id as string,
    orderNumber: o.order_number as string,
    status: o.status as string,
    fulfillmentStatus: o.fulfillment_status as string,
    email: o.email as string,
    currency: o.currency as string,
    subtotalCents: o.subtotal_cents as number,
    discountCents: o.discount_cents as number,
    shippingCents: o.shipping_cents as number,
    taxCents: o.tax_cents as number,
    totalCents: o.total_cents as number,
    refundedCents: o.refunded_cents as number,
    shippingAddress: o.shipping_address as Record<string, unknown> | null,
    placedAt: o.placed_at as string,
    notes: (o.notes as string | null) ?? null,
    metadata: ((o.metadata as Record<string, unknown> | null) ?? {}),
    customer: customer
      ? {
          id: customer.id,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          userId: customer.user_id,
          totalSpentCents: customer.total_spent_cents ?? 0,
          ordersCount: customer.orders_count ?? 0,
        }
      : null,
    items: ((o.order_items as Array<Record<string, unknown>>) ?? []).map((it) => ({
      id: it.id as string,
      productTitle: it.product_title as string,
      variantTitle: (it.variant_title as string | null) ?? null,
      quantity: it.quantity as number,
      priceCents: it.price_cents as number,
      totalCents: it.total_cents as number,
    })),
  };
}

export function formatCents(cents: number | null, currency = "PKR") {
  if (cents == null) return "—";
  return `${currency} ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}
