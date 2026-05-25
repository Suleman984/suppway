import Link from "@/lib/store/link";
import { Pencil, Plus } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listAdminCategories } from "@/server/services/categories";
import { CategoryRowActions } from "@/components/admin/categories/category-row-actions";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  if (!(await hasPermission(PERMISSIONS.COLLECTIONS_MANAGE))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Categories"
        permission={PERMISSIONS.COLLECTIONS_MANAGE}
        roleName={staff?.roleName}
      />
    );
  }
  const rows = await listAdminCategories();

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New category
        </Link>
      </header>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Parent</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Sort</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No categories yet.{" "}
                  <Link
                    href="/admin/categories/new"
                    className="font-medium text-foreground hover:underline"
                  >
                    Create your first one →
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.title}</p>
                        <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.parentTitle ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.productCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.isPublished
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {c.isPublished ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/categories/${c.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                        aria-label={`Edit ${c.title}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <CategoryRowActions id={c.id} />
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
