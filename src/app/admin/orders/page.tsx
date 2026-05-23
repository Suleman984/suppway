import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { formatCents, listAdminOrders } from "@/server/services/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "canceled", label: "Canceled" },
  { value: "failed", label: "Failed" },
];

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  if (!(await hasPermission(PERMISSIONS.ORDERS_VIEW))) {
    redirect("/admin/dashboard");
  }
  const sp = await searchParams;
  const { rows, total, page, pageSize } = await listAdminOrders({
    q: sp.q,
    status: sp.status,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container max-w-6xl py-10">
      <header>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "order" : "orders"} placed
        </p>
      </header>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card/50 p-3"
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Search by order # or email…"
            defaultValue={sp.q ?? ""}
            className="pl-9"
          />
        </div>
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No orders match these filters yet.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      prefetch
                      className="font-mono font-medium text-foreground hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {o.customerName ?? <span className="text-muted-foreground">Guest</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{o.itemCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCents(o.totalCents, o.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {new Date(o.placedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav
          className="mt-4 flex items-center justify-end gap-2 text-sm"
          aria-label="Pagination"
        >
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page > 1 && (
            <Link
              href={buildHref({ ...sp, page: String(page - 1) })}
              className="rounded-md border px-3 py-1.5 hover:bg-accent"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={buildHref({ ...sp, page: String(page + 1) })}
              className="rounded-md border px-3 py-1.5 hover:bg-accent"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function buildHref(sp: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v) params.set(k, v);
  }
  const q = params.toString();
  return q ? `/admin/orders?${q}` : "/admin/orders";
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "paid" || status === "fulfilled"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : status === "refunded" || status === "partially_refunded"
          ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
          : status === "canceled" || status === "failed"
            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
            : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
