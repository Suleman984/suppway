import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveStoreId } from "@/lib/store/active";

/**
 * Customer-side read services for the /account dashboard. Every query runs
 * with the customer's auth cookies, so RLS guarantees they only see their
 * own rows.
 */

export interface AccountOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  placedAt: string;
  itemCount: number;
}

export interface LoyaltyEventRow {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  createdAt: string;
  orderNumber: string | null;
}

export interface AccountSnapshot {
  user: { id: string; email: string };
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
    marketingOptIn: boolean;
  } | null;
  customer: {
    id: string | null;
    totalSpentCents: number;
    ordersCount: number;
  };
  points: {
    balance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
  };
  recentOrders: AccountOrderRow[];
  recentPoints: LoyaltyEventRow[];
}

export async function getAccountSnapshot(): Promise<AccountSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const storeId = await getActiveStoreId();

  // Claim any guest customer row that was created at checkout for THIS
  // store with this user's (now-verified) email. Supabase only hands us a
  // session once the email has been confirmed, so matching on user.email
  // is safe. Idempotent: once user_id is set the WHERE clause stops matching.
  if (user.email) {
    const admin = createAdminClient();
    await admin
      .from("customers")
      .update({ user_id: user.id })
      .eq("store_id", storeId)
      .eq("email", user.email.toLowerCase())
      .is("user_id", null);
  }

  // Profile basics + customer aggregate (scoped to this store).
  const [{ data: profileRow }, { data: customerRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, marketing_opt_in")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("id, total_spent_cents, orders_count")
      .eq("user_id", user.id)
      .eq("store_id", storeId)
      .maybeSingle(),
  ]);

  // Points: balance view + last few events, scoped to this store.
  const [{ data: balanceRow }, { data: pointsRows }] = await Promise.all([
    supabase
      .from("loyalty_balances")
      .select("balance, lifetime_earned, lifetime_redeemed")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("loyalty_points")
      .select("id, delta, reason, note, created_at, order:orders(order_number)")
      .eq("user_id", user.id)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Recent orders (only when we have a linked customer row)
  let recentOrders: AccountOrderRow[] = [];
  const customerId = (customerRow as { id?: string } | null)?.id ?? null;
  if (customerId) {
    const { data: orders } = await supabase
      .from("orders")
      .select(
        `id, order_number, status, total_cents, currency, placed_at,
         order_items(id)`,
      )
      .eq("customer_id", customerId)
      .order("placed_at", { ascending: false })
      .limit(10);
    recentOrders = ((orders as Array<Record<string, unknown>>) ?? []).map((o) => ({
      id: o.id as string,
      orderNumber: o.order_number as string,
      status: o.status as string,
      totalCents: o.total_cents as number,
      currency: o.currency as string,
      placedAt: o.placed_at as string,
      itemCount: Array.isArray(o.order_items) ? o.order_items.length : 0,
    }));
  }

  const recentPoints: LoyaltyEventRow[] = (
    (pointsRows as Array<Record<string, unknown>>) ?? []
  ).map((p) => {
    const orderRaw = p.order as unknown;
    const order = (Array.isArray(orderRaw) ? orderRaw[0] : orderRaw) as
      | { order_number?: string }
      | null
      | undefined;
    return {
      id: p.id as string,
      delta: p.delta as number,
      reason: p.reason as string,
      note: (p.note as string | null) ?? null,
      createdAt: p.created_at as string,
      orderNumber: order?.order_number ?? null,
    };
  });

  const points = (balanceRow as {
    balance?: number;
    lifetime_earned?: number;
    lifetime_redeemed?: number;
  } | null) ?? null;

  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: profileRow
      ? {
          fullName: (profileRow as { full_name: string | null }).full_name,
          avatarUrl: (profileRow as { avatar_url: string | null }).avatar_url,
          marketingOptIn:
            (profileRow as { marketing_opt_in: boolean }).marketing_opt_in,
        }
      : null,
    customer: {
      id: customerId,
      totalSpentCents:
        (customerRow as { total_spent_cents?: number } | null)
          ?.total_spent_cents ?? 0,
      ordersCount:
        (customerRow as { orders_count?: number } | null)?.orders_count ?? 0,
    },
    points: {
      balance: points?.balance ?? 0,
      lifetimeEarned: points?.lifetime_earned ?? 0,
      lifetimeRedeemed: points?.lifetime_redeemed ?? 0,
    },
    recentOrders,
    recentPoints,
  };
}

export function formatPKR(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export interface CustomerOrderItem {
  id: string;
  productTitle: string;
  variantTitle: string | null;
  quantity: number;
  priceCents: number;
  totalCents: number;
}

export interface CustomerOrderDetail {
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
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    postal?: string;
    phone?: string;
  } | null;
  paymentMethod: string | null;
  placedAt: string;
  items: CustomerOrderItem[];
}

/**
 * Fetch a single order for the signed-in user by order number. Uses the
 * user's cookied client so RLS guarantees they can only see their own
 * orders — returns null for any order that doesn't belong to them or
 * doesn't exist.
 */
export async function getCustomerOrderByNumber(
  orderNumber: string,
): Promise<CustomerOrderDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const storeId = await getActiveStoreId();

  const { data } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, fulfillment_status, email, currency,
       subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents,
       refunded_cents, shipping_address, placed_at, metadata,
       order_items(id, product_title, variant_title, quantity, price_cents, total_cents)`,
    )
    .eq("store_id", storeId)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!data) return null;
  const o = data as Record<string, unknown>;
  const metadata = (o.metadata as Record<string, unknown> | null) ?? {};

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
    shippingAddress:
      (o.shipping_address as CustomerOrderDetail["shippingAddress"]) ?? null,
    paymentMethod: (metadata.payment_method as string | null) ?? null,
    placedAt: o.placed_at as string,
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
