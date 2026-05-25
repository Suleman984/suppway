import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

const REVENUE_STATUSES = ["paid", "partially_refunded", "fulfilled"] as const;

export interface AnalyticsKpis {
  revenueCents: number;
  ordersCount: number;
  customersCount: number;
  aovCents: number;
  refundedCents: number;
  conversionRate: number;
  currency: string;
}

export interface DailyRevenuePoint {
  date: string;
  revenueCents: number;
  ordersCount: number;
}

export interface TopProduct {
  productTitle: string;
  variantTitle: string | null;
  quantity: number;
  revenueCents: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface AnalyticsSnapshot {
  kpis: AnalyticsKpis;
  daily: DailyRevenuePoint[];
  topProducts: TopProduct[];
  statusBreakdown: StatusBreakdown[];
  windowDays: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function buildDateRange(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export async function getAnalyticsSnapshot(
  windowDays = 30,
): Promise<AnalyticsSnapshot> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - (windowDays - 1));
  const cutoffIso = cutoff.toISOString();

  const [ordersRes, itemsRes, sessionsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, total_cents, refunded_cents, currency, status, placed_at, customer_id",
      )
      .eq("store_id", storeId)
      .gte("placed_at", cutoffIso),
    supabase
      .from("order_items")
      .select(
        `quantity, total_cents, product_title, variant_title,
         order:orders!inner(store_id, status, placed_at)`,
      )
      .eq("store_id", storeId),
    supabase
      .from("funnel_sessions")
      .select("id, status, created_at")
      .eq("store_id", storeId)
      .gte("created_at", cutoffIso),
  ]);

  type OrderRow = {
    id: string;
    total_cents: number;
    refunded_cents: number;
    currency: string;
    status: string;
    placed_at: string;
    customer_id: string | null;
  };
  const orders = (ordersRes.data as OrderRow[] | null) ?? [];
  const revenueOrders = orders.filter((o) =>
    (REVENUE_STATUSES as readonly string[]).includes(o.status),
  );

  const revenueCents = revenueOrders.reduce(
    (acc, o) => acc + (o.total_cents - o.refunded_cents),
    0,
  );
  const refundedCents = orders.reduce(
    (acc, o) => acc + (o.refunded_cents ?? 0),
    0,
  );
  const customers = new Set(
    revenueOrders.map((o) => o.customer_id).filter(Boolean) as string[],
  );
  const aovCents =
    revenueOrders.length > 0
      ? Math.round(revenueCents / revenueOrders.length)
      : 0;
  const currency = orders.find((o) => o.currency)?.currency ?? "PKR";

  // Daily revenue
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (const day of buildDateRange(windowDays)) {
    dailyMap.set(day, { revenue: 0, orders: 0 });
  }
  for (const o of revenueOrders) {
    const k = dayKey(o.placed_at);
    const bucket = dailyMap.get(k);
    if (bucket) {
      bucket.revenue += o.total_cents - o.refunded_cents;
      bucket.orders += 1;
    }
  }
  const daily: DailyRevenuePoint[] = Array.from(dailyMap.entries()).map(
    ([date, v]) => ({
      date,
      revenueCents: v.revenue,
      ordersCount: v.orders,
    }),
  );

  // Top products (by revenue) — restrict to orders inside the window with revenue status
  type ItemRow = {
    quantity: number;
    total_cents: number;
    product_title: string;
    variant_title: string | null;
    order:
      | { store_id: string; status: string; placed_at: string }
      | Array<{ store_id: string; status: string; placed_at: string }>
      | null;
  };
  const items = (itemsRes.data as ItemRow[] | null) ?? [];
  const productMap = new Map<
    string,
    { productTitle: string; variantTitle: string | null; qty: number; rev: number }
  >();
  for (const item of items) {
    const order = Array.isArray(item.order) ? item.order[0] : item.order;
    if (!order) continue;
    if (order.placed_at < cutoffIso) continue;
    if (!(REVENUE_STATUSES as readonly string[]).includes(order.status))
      continue;
    const key = `${item.product_title}::${item.variant_title ?? ""}`;
    const existing = productMap.get(key);
    if (existing) {
      existing.qty += item.quantity;
      existing.rev += item.total_cents;
    } else {
      productMap.set(key, {
        productTitle: item.product_title,
        variantTitle: item.variant_title,
        qty: item.quantity,
        rev: item.total_cents,
      });
    }
  }
  const topProducts: TopProduct[] = Array.from(productMap.values())
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 10)
    .map((p) => ({
      productTitle: p.productTitle,
      variantTitle: p.variantTitle,
      quantity: p.qty,
      revenueCents: p.rev,
    }));

  // Status breakdown
  const statusMap = new Map<string, number>();
  for (const o of orders) {
    statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  }
  const statusBreakdown: StatusBreakdown[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Conversion rate from funnel sessions
  const sessions = (sessionsRes.data as Array<{
    id: string;
    status: string;
  }> | null) ?? [];
  const sessionCount = sessions.length;
  const convertedCount = sessions.filter(
    (s) => s.status === "converted",
  ).length;
  const conversionRate =
    sessionCount > 0 ? convertedCount / sessionCount : 0;

  return {
    kpis: {
      revenueCents,
      ordersCount: revenueOrders.length,
      customersCount: customers.size,
      aovCents,
      refundedCents,
      conversionRate,
      currency,
    },
    daily,
    topProducts,
    statusBreakdown,
    windowDays,
  };
}
