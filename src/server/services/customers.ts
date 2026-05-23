import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminCustomerRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  totalSpentCents: number;
  ordersCount: number;
  pointBalance: number;
  hasLogin: boolean;
  createdAt: string;
}

export interface ListAdminCustomersParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAdminCustomersResult {
  rows: AdminCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAdminCustomers(
  params: ListAdminCustomersParams = {},
): Promise<ListAdminCustomersResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select(
      "id, email, first_name, last_name, phone, total_spent_cents, orders_count, user_id, created_at",
      { count: "exact" },
    )
    .order("total_spent_cents", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(
      `email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},phone.ilike.${term}`,
    );
  }

  const { data, count } = await query;
  const rows = (data as Array<Record<string, unknown>> | null) ?? [];

  // Fetch all balances in one shot for the user_ids on this page.
  const userIds = rows
    .map((r) => r.user_id as string | null)
    .filter((id): id is string => Boolean(id));
  let balances = new Map<string, number>();
  if (userIds.length > 0) {
    const { data: bal } = await supabase
      .from("loyalty_balances")
      .select("user_id, balance")
      .in("user_id", userIds);
    balances = new Map(
      ((bal as Array<{ user_id: string; balance: number }> | null) ?? []).map(
        (b) => [b.user_id, b.balance ?? 0],
      ),
    );
  }

  return {
    rows: rows.map((r) => ({
      id: r.id as string,
      email: r.email as string,
      name:
        [r.first_name as string | null, r.last_name as string | null]
          .filter(Boolean)
          .join(" ") || null,
      phone: (r.phone as string | null) ?? null,
      totalSpentCents: (r.total_spent_cents as number | null) ?? 0,
      ordersCount: (r.orders_count as number | null) ?? 0,
      pointBalance: r.user_id ? balances.get(r.user_id as string) ?? 0 : 0,
      hasLogin: Boolean(r.user_id),
      createdAt: r.created_at as string,
    })),
    total: count ?? rows.length,
    page,
    pageSize,
  };
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  userId: string | null;
  totalSpentCents: number;
  ordersCount: number;
  marketingOptIn: boolean;
  pointBalance: number;
  pointsLifetimeEarned: number;
  pointsLifetimeRedeemed: number;
  createdAt: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    placedAt: string;
  }>;
  points: Array<{
    id: string;
    delta: number;
    reason: string;
    note: string | null;
    createdAt: string;
    orderNumber: string | null;
  }>;
}

export async function getAdminCustomerById(
  id: string,
): Promise<AdminCustomerDetail | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("customers")
    .select(
      `id, email, first_name, last_name, phone, marketing_opt_in, user_id,
       total_spent_cents, orders_count, created_at`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;

  const c = row as Record<string, unknown>;
  const userId = (c.user_id as string | null) ?? null;

  const [{ data: ordersRows }, { data: balanceRow }, { data: pointsRows }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, status, total_cents, placed_at")
        .eq("customer_id", id)
        .order("placed_at", { ascending: false })
        .limit(50),
      userId
        ? supabase
            .from("loyalty_balances")
            .select("balance, lifetime_earned, lifetime_redeemed")
            .eq("user_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      userId
        ? supabase
            .from("loyalty_points")
            .select(
              "id, delta, reason, note, created_at, order:orders(order_number)",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: null }),
    ]);

  return {
    id: c.id as string,
    email: c.email as string,
    firstName: (c.first_name as string | null) ?? null,
    lastName: (c.last_name as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    userId,
    totalSpentCents: (c.total_spent_cents as number | null) ?? 0,
    ordersCount: (c.orders_count as number | null) ?? 0,
    marketingOptIn: Boolean(c.marketing_opt_in),
    pointBalance:
      (balanceRow as { balance?: number } | null)?.balance ?? 0,
    pointsLifetimeEarned:
      (balanceRow as { lifetime_earned?: number } | null)?.lifetime_earned ?? 0,
    pointsLifetimeRedeemed:
      (balanceRow as { lifetime_redeemed?: number } | null)
        ?.lifetime_redeemed ?? 0,
    createdAt: c.created_at as string,
    orders: ((ordersRows as Array<Record<string, unknown>>) ?? []).map((o) => ({
      id: o.id as string,
      orderNumber: o.order_number as string,
      status: o.status as string,
      totalCents: o.total_cents as number,
      placedAt: o.placed_at as string,
    })),
    points: ((pointsRows as Array<Record<string, unknown>>) ?? []).map((p) => {
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
    }),
  };
}
