import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

const REVENUE_STATUSES = ["paid", "partially_refunded", "fulfilled"] as const;

export interface DashboardKpis {
  revenueTodayCents: number;
  revenue7dCents: number;
  revenue30dCents: number;
  ordersTodayCount: number;
  orders30dCount: number;
  aov30dCents: number;
  newCustomers30dCount: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  currency: string;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  customerName: string | null;
  totalCents: number;
  currency: string;
  placedAt: string;
}

export interface DashboardLowStockVariant {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string | null;
  variantTitle: string | null;
  sku: string | null;
  inventoryQty: number;
}

export interface DashboardSnapshot {
  kpis: DashboardKpis;
  recentOrders: DashboardRecentOrder[];
  lowStock: DashboardLowStockVariant[];
}

const LOW_STOCK_THRESHOLD = 10;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  const today = startOfTodayIso();
  const last7 = isoDaysAgo(7);
  const last30 = isoDaysAgo(30);

  const [
    revenueRowsRes,
    todayOrdersRes,
    pendingOrdersRes,
    newCustomersRes,
    recentOrdersRes,
    lowStockRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents, refunded_cents, placed_at, currency, status")
      .eq("store_id", storeId)
      .in("status", REVENUE_STATUSES as unknown as string[])
      .gte("placed_at", last30),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("placed_at", today),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "pending"),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", last30),
    supabase
      .from("orders")
      .select(
        `id, order_number, status, email, total_cents, currency, placed_at,
         customer:customers(first_name, last_name)`,
      )
      .eq("store_id", storeId)
      .order("placed_at", { ascending: false })
      .limit(10),
    supabase
      .from("product_variants")
      .select(
        `id, title, sku, inventory_qty,
         product:products(id, title, slug)`,
      )
      .eq("store_id", storeId)
      .lt("inventory_qty", LOW_STOCK_THRESHOLD)
      .order("inventory_qty", { ascending: true })
      .limit(10),
  ]);

  type RevenueRow = {
    total_cents: number | null;
    refunded_cents: number | null;
    placed_at: string;
    currency: string | null;
  };
  const revenueRows = ((revenueRowsRes.data as RevenueRow[] | null) ?? []).map(
    (r) => ({
      net: (r.total_cents ?? 0) - (r.refunded_cents ?? 0),
      placedAt: r.placed_at,
      currency: r.currency,
    }),
  );

  const sumSince = (cutoffIso: string) =>
    revenueRows
      .filter((r) => r.placedAt >= cutoffIso)
      .reduce((acc, r) => acc + r.net, 0);

  const revenue30dCents = sumSince(last30);
  const revenue7dCents = sumSince(last7);
  const revenueTodayCents = sumSince(today);
  const orders30dCount = revenueRows.length;
  const currency =
    revenueRows.find((r) => r.currency)?.currency ?? "PKR";
  const aov30dCents =
    orders30dCount > 0 ? Math.round(revenue30dCents / orders30dCount) : 0;

  type RecentOrderRow = {
    id: string;
    order_number: string;
    status: string;
    email: string;
    total_cents: number;
    currency: string;
    placed_at: string;
    customer:
      | { first_name: string | null; last_name: string | null }
      | Array<{ first_name: string | null; last_name: string | null }>
      | null;
  };
  const recentOrders: DashboardRecentOrder[] = (
    (recentOrdersRes.data as RecentOrderRow[] | null) ?? []
  ).map((o) => {
    const c = Array.isArray(o.customer) ? o.customer[0] : o.customer;
    const customerName = c
      ? [c.first_name, c.last_name].filter(Boolean).join(" ") || null
      : null;
    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      email: o.email,
      customerName,
      totalCents: o.total_cents,
      currency: o.currency,
      placedAt: o.placed_at,
    };
  });

  type LowStockRow = {
    id: string;
    title: string | null;
    sku: string | null;
    inventory_qty: number;
    product:
      | { id: string; title: string; slug: string | null }
      | Array<{ id: string; title: string; slug: string | null }>
      | null;
  };
  const lowStock: DashboardLowStockVariant[] = (
    (lowStockRes.data as LowStockRow[] | null) ?? []
  ).map((v) => {
    const p = Array.isArray(v.product) ? v.product[0] : v.product;
    return {
      variantId: v.id,
      productId: p?.id ?? "",
      productTitle: p?.title ?? "Unknown product",
      productSlug: p?.slug ?? null,
      variantTitle: v.title,
      sku: v.sku,
      inventoryQty: v.inventory_qty,
    };
  });

  return {
    kpis: {
      revenueTodayCents,
      revenue7dCents,
      revenue30dCents,
      ordersTodayCount: todayOrdersRes.count ?? 0,
      orders30dCount,
      aov30dCents,
      newCustomers30dCount: newCustomersRes.count ?? 0,
      pendingOrdersCount: pendingOrdersRes.count ?? 0,
      lowStockCount: lowStock.length,
      currency,
    },
    recentOrders,
    lowStock,
  };
}

export function formatMoneyCents(cents: number, currency = "PKR"): string {
  const value = (cents / 100).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${currency === "PKR" ? "Rs." : currency} ${value}`;
}
