import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listAdminCustomers } from "@/server/services/customers";
import { formatCents } from "@/server/services/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  if (!(await hasPermission(PERMISSIONS.CUSTOMERS_VIEW))) {
    redirect("/admin/dashboard");
  }
  const sp = await searchParams;
  const { rows, total, page, pageSize } = await listAdminCustomers({
    q: sp.q,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container max-w-6xl py-10">
      <header>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "customer" : "customers"}
        </p>
      </header>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card/50 p-3"
      >
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Search by email, name or phone…"
            defaultValue={sp.q ?? ""}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Login</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Lifetime spend</th>
              <th className="px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No customers yet — they&apos;ll appear here after the first order.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      prefetch
                      className="min-w-0 block"
                    >
                      <p className="truncate font-medium hover:underline">
                        {c.name ?? <span className="text-muted-foreground">{c.email}</span>}
                      </p>
                      {c.name && (
                        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {c.hasLogin ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                        Account
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs text-muted-foreground">
                        Guest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.ordersCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCents(c.totalSpentCents)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.pointBalance.toLocaleString("en-PK")}
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
  return q ? `/admin/customers?${q}` : "/admin/customers";
}
