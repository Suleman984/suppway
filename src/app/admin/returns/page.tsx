import Link from "@/lib/store/link";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import {
  listAdminReturns,
  type ReturnStatus,
} from "@/server/services/returns";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Returns" };

const STATUSES: { value: ReturnStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "exchanged", label: "Exchanged" },
  { value: "denied", label: "Denied" },
];

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReturnsPage({ searchParams }: Props) {
  if (!(await hasPermission(PERMISSIONS.RETURNS_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Returns"
        permission={PERMISSIONS.RETURNS_VIEW}
        roleName={staff?.roleName}
      />
    );
  }
  const sp = await searchParams;
  const statusFilter = (sp.status as ReturnStatus | undefined) ?? undefined;
  const rows = await listAdminReturns({ status: statusFilter });

  return (
    <div className="container max-w-6xl py-10">
      <header>
        <h1 className="text-3xl font-bold">Returns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "request" : "requests"}
          {statusFilter ? ` · ${statusFilter}` : ""}
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = (statusFilter ?? "") === s.value;
          const href = s.value ? `/admin/returns?status=${s.value}` : "/admin/returns";
          return (
            <Link
              key={s.value || "all"}
              href={href}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No requests match this filter.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/returns/${r.id}`}
                      prefetch
                      className="font-mono text-foreground hover:underline"
                    >
                      {r.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.customerEmail}
                  </td>
                  <td className="px-4 py-3 capitalize">{r.type}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnStatus }) {
  const styles =
    status === "pending"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : status === "refunded" || status === "exchanged"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}
