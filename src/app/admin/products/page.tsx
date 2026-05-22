import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Button is used in the filter form below.
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import {
  formatCents,
  listAdminProducts,
  type ListAdminProductsParams,
} from "@/server/services/products";
import { ProductRowActions } from "@/components/admin/products/product-row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const KIND_OPTIONS = [
  { value: "", label: "All kinds" },
  { value: "supplement", label: "Supplement" },
  { value: "apparel", label: "Apparel" },
  { value: "equipment", label: "Equipment" },
  { value: "accessory", label: "Accessory" },
  { value: "program", label: "Program" },
  { value: "membership", label: "Membership" },
];

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; kind?: string; page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.PRODUCTS_VIEW))) redirect("/admin/dashboard");

  const sp = await searchParams;
  const params: ListAdminProductsParams = {
    q: sp.q,
    status:
      sp.status === "draft" || sp.status === "published" || sp.status === "archived"
        ? sp.status
        : undefined,
    kind: sp.kind || undefined,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
  };
  const { rows, total, page, pageSize } = await listAdminProducts(params);
  const canCreate = await hasPermission(PERMISSIONS.PRODUCTS_CREATE);
  const canDelete = await hasPermission(PERMISSIONS.PRODUCTS_DELETE);
  const canPublish = await hasPermission(PERMISSIONS.PRODUCTS_PUBLISH);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"} in your catalog
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New product
          </Link>
        )}
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
            placeholder="Search by title, slug or brand…"
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
        <select
          name="kind"
          defaultValue={sp.kind ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {KIND_OPTIONS.map((o) => (
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
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Kind</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Variants</th>
              <th className="px-4 py-3 text-right">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No products match these filters.
                  {canCreate && (
                    <>
                      {" "}
                      <Link
                        href="/admin/products/new"
                        className="font-medium text-foreground hover:underline"
                      >
                        Create your first one →
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {p.thumbUrl ? (
                          // Use a plain img — admin tables don't justify the
                          // Image optimizer overhead for tiny thumbs.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {p.kind}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCents(p.minPriceCents, p.currency ?? "PKR")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {p.variantCount}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                        aria-label={`Edit ${p.title}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <ProductRowActions
                        productId={p.id}
                        status={p.status}
                        canDelete={canDelete}
                        canPublish={canPublish}
                      />
                    </div>
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
  return q ? `/admin/products?${q}` : "/admin/products";
}

function StatusPill({ status }: { status: "draft" | "published" | "archived" }) {
  const styles =
    status === "published"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status === "archived"
        ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}
