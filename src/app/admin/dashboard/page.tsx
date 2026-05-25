import Link from "@/lib/store/link";
import {
  ArrowUpRight,
  BadgePercent,
  Boxes,
  PackagePlus,
  ShoppingBag,
  TriangleAlert,
  Users,
} from "lucide-react";
import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";
import {
  formatMoneyCents,
  getDashboardSnapshot,
} from "@/server/services/dashboard";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  fulfilled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  partially_refunded: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  refunded: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  canceled: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export default async function DashboardPage() {
  const [{ profile }, settings, snapshot, canCreateProduct, canCreateDiscount] =
    await Promise.all([
      getStoreContext(),
      getStoreSettings(),
      getDashboardSnapshot(),
      hasPermission(PERMISSIONS.PRODUCTS_CREATE),
      hasPermission(PERMISSIONS.DISCOUNTS_CREATE),
    ]);

  const { kpis, recentOrders, lowStock } = snapshot;
  const fmt = (cents: number) => formatMoneyCents(cents, kpis.currency);
  const firstName = profile?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at{" "}
            <strong>{settings.name}</strong> today.
          </p>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canCreateProduct && (
          <QuickAction
            href="/admin/products/new"
            icon={PackagePlus}
            label="New product"
            hint="Add to catalog"
          />
        )}
        <QuickAction
          href="/admin/orders"
          icon={ShoppingBag}
          label="View orders"
          hint={
            kpis.pendingOrdersCount > 0
              ? `${kpis.pendingOrdersCount} pending`
              : "All caught up"
          }
        />
        {canCreateDiscount && (
          <QuickAction
            href="/admin/discounts/new"
            icon={BadgePercent}
            label="New discount"
            hint="Run a promo"
          />
        )}
        <QuickAction
          href="/admin/customers"
          icon={Users}
          label="Customers"
          hint={
            kpis.newCustomers30dCount > 0
              ? `+${kpis.newCustomers30dCount} new in 30d`
              : "Browse customers"
          }
        />
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Revenue today"
          value={fmt(kpis.revenueTodayCents)}
          sub={`${kpis.ordersTodayCount} ${kpis.ordersTodayCount === 1 ? "order" : "orders"}`}
        />
        <Kpi
          label="Revenue · 7d"
          value={fmt(kpis.revenue7dCents)}
          sub={`${fmt(kpis.revenue30dCents)} in 30d`}
        />
        <Kpi
          label="Avg order · 30d"
          value={fmt(kpis.aov30dCents)}
          sub={`${kpis.orders30dCount} ${kpis.orders30dCount === 1 ? "order" : "orders"}`}
        />
        <Kpi
          label="Low stock"
          value={kpis.lowStockCount.toString()}
          sub={
            kpis.lowStockCount > 0 ? "variants below threshold" : "all healthy"
          }
          tone={kpis.lowStockCount > 0 ? "warn" : "default"}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No orders yet. Once customers check out, they&apos;ll show up
              here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Order</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium hover:underline"
                      >
                        #{o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.placedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="truncate">{o.customerName ?? o.email}</p>
                      {o.customerName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {o.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                          STATUS_STYLES[o.status] ??
                          "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatMoneyCents(o.totalCents, o.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Boxes className="h-4 w-4" /> Low stock
            </h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Products <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>
          {lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Inventory looks healthy — no variants below 10 units.
            </p>
          ) : (
            <ul className="divide-y">
              {lowStock.map((v) => (
                <li key={v.variantId}>
                  <Link
                    href={`/admin/products/${v.productId}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {v.productTitle}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.variantTitle ?? "Default"}
                        {v.sku ? ` · ${v.sku}` : ""}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                        v.inventoryQty <= 0
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      <TriangleAlert className="h-3 w-3" />
                      {v.inventoryQty}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof PackagePlus;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition hover:border-foreground/20 hover:bg-accent"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        tone === "warn" ? "border-amber-500/40" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
