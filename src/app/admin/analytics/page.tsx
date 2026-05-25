import Link from "@/lib/store/link";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import {
  getAnalyticsSnapshot,
  type DailyRevenuePoint,
} from "@/server/services/analytics";
import { formatMoneyCents } from "@/server/services/dashboard";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  fulfilled: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  partially_refunded: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  refunded: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  canceled: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

const WINDOW_OPTIONS = [7, 30, 90] as const;
type WindowDays = (typeof WINDOW_OPTIONS)[number];

interface PageProps {
  searchParams: Promise<{ window?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.ANALYTICS_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Analytics"
        permission={PERMISSIONS.ANALYTICS_VIEW}
        roleName={staff?.roleName}
      />
    );
  }

  const sp = await searchParams;
  const parsedWindow = Number(sp.window);
  const windowDays: WindowDays = (
    WINDOW_OPTIONS as readonly number[]
  ).includes(parsedWindow)
    ? (parsedWindow as WindowDays)
    : 30;

  const snapshot = await getAnalyticsSnapshot(windowDays);
  const { kpis, daily, topProducts, statusBreakdown } = snapshot;
  const fmt = (cents: number) => formatMoneyCents(cents, kpis.currency);

  const maxRevenue = Math.max(1, ...daily.map((d) => d.revenueCents));
  const totalOrders = statusBreakdown.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last {windowDays} days · all amounts in {kpis.currency}
          </p>
        </div>
        <nav className="flex items-center gap-1 rounded-md border bg-card p-1 text-xs">
          {WINDOW_OPTIONS.map((w) => (
            <Link
              key={w}
              href={`/admin/analytics?window=${w}`}
              className={`rounded px-3 py-1.5 font-medium ${
                w === windowDays
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {w}d
            </Link>
          ))}
        </nav>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Revenue"
          value={fmt(kpis.revenueCents)}
          sub={`${kpis.ordersCount} ${kpis.ordersCount === 1 ? "order" : "orders"}`}
        />
        <Kpi
          label="Avg order"
          value={fmt(kpis.aovCents)}
          sub={`${kpis.customersCount} ${kpis.customersCount === 1 ? "customer" : "customers"}`}
        />
        <Kpi
          label="Refunds"
          value={fmt(kpis.refundedCents)}
          sub={
            kpis.revenueCents > 0
              ? `${((kpis.refundedCents / kpis.revenueCents) * 100).toFixed(1)}% of revenue`
              : "no revenue yet"
          }
          tone={kpis.refundedCents > 0 ? "warn" : "default"}
        />
        <Kpi
          label="Funnel conversion"
          value={`${(kpis.conversionRate * 100).toFixed(1)}%`}
          sub="sessions → converted"
        />
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border bg-card">
        <header className="border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Daily revenue</h2>
        </header>
        <div className="p-5">
          <DailyRevenueChart points={daily} max={maxRevenue} currency={kpis.currency} />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <header className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Top products by revenue</h2>
          </header>
          {topProducts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No sales in this window yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-right">Units</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topProducts.map((p, i) => (
                  <tr key={`${p.productTitle}-${i}`} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <p className="truncate font-medium">{p.productTitle}</p>
                      {p.variantTitle && (
                        <p className="truncate text-xs text-muted-foreground">
                          {p.variantTitle}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {p.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {fmt(p.revenueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <header className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Order status breakdown</h2>
          </header>
          {totalOrders === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No orders in this window.
            </p>
          ) : (
            <ul className="divide-y">
              {statusBreakdown.map((s) => {
                const pct = (s.count / totalOrders) * 100;
                return (
                  <li key={s.status} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                          STATUS_STYLES[s.status] ??
                          "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {s.count}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
                      {pct.toFixed(1)}%
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function DailyRevenueChart({
  points,
  max,
  currency,
}: {
  points: DailyRevenuePoint[];
  max: number;
  currency: string;
}) {
  if (points.length === 0)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No data.
      </p>
    );
  return (
    <div className="flex h-40 items-end gap-1">
      {points.map((p) => {
        const heightPct = max > 0 ? (p.revenueCents / max) * 100 : 0;
        const day = new Date(p.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={p.date}
            className="group relative flex flex-1 flex-col items-center"
          >
            <div
              className="w-full rounded-t bg-primary/70 transition group-hover:bg-primary"
              style={{ height: `${heightPct}%`, minHeight: "2px" }}
              title={`${day}: ${formatMoneyCents(p.revenueCents, currency)} (${p.ordersCount} orders)`}
            />
          </div>
        );
      })}
    </div>
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
