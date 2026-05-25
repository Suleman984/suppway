import Link from "@/lib/store/link";
import { Pencil, Plus } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listAdminDiscounts } from "@/server/services/discounts";
import { DiscountRowActions } from "@/components/admin/discounts/discount-row-actions";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discounts" };

function formatValue(kind: "percent" | "fixed", value: number) {
  if (kind === "percent") return `${value}%`;
  return `Rs. ${(value / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function formatScope(d: {
  scope: string;
  productTitle: string | null;
  categoryTitle: string | null;
}) {
  if (d.scope === "product") return d.productTitle ?? "Product";
  if (d.scope === "category") return d.categoryTitle ?? "Category";
  return "Whole order";
}

export default async function AdminDiscountsPage() {
  if (!(await hasPermission(PERMISSIONS.DISCOUNTS_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Discounts"
        permission={PERMISSIONS.DISCOUNTS_VIEW}
        roleName={staff?.roleName}
      />
    );
  }
  const canCreate = await hasPermission(PERMISSIONS.DISCOUNTS_CREATE);
  const rows = await listAdminDiscounts();

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "discount" : "discounts"} configured
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/discounts/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New discount
          </Link>
        )}
      </header>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Discount</th>
              <th className="px-4 py-3 text-left">Applies to</th>
              <th className="px-4 py-3 text-right">Uses</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No discounts yet.{" "}
                  {canCreate && (
                    <Link
                      href="/admin/discounts/new"
                      className="font-medium text-foreground hover:underline"
                    >
                      Create your first one →
                    </Link>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.title}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {d.code ?? <span className="italic">auto</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatValue(d.kind, d.value)}
                  </td>
                  <td className="px-4 py-3">{formatScope(d)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {d.usesCount}
                    {d.maxUses ? ` / ${d.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        d.isLive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : d.isActive
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {d.isLive ? "Live" : d.isActive ? "Scheduled" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/discounts/${d.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                        aria-label={`Edit ${d.title}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DiscountRowActions id={d.id} isActive={d.isActive} />
                    </div>
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
