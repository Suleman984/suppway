import Link from "@/lib/store/link";
import { ArrowUpRight, GitBranch, Layers, Plus } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listAdminFunnels } from "@/server/services/funnels";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funnels" };

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  draft: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  archived: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
};

export default async function AdminFunnelsPage() {
  if (!(await hasPermission(PERMISSIONS.FUNNELS_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Funnels"
        permission={PERMISSIONS.FUNNELS_VIEW}
        roleName={staff?.roleName}
      />
    );
  }

  const funnels = await listAdminFunnels();
  const canCreate = await hasPermission(PERMISSIONS.FUNNELS_CREATE);

  const totalSessions = funnels.reduce((acc, f) => acc + f.sessionsCount, 0);
  const totalConverted = funnels.reduce((acc, f) => acc + f.convertedCount, 0);

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Funnels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {funnels.length} {funnels.length === 1 ? "funnel" : "funnels"} ·{" "}
            {totalSessions} {totalSessions === 1 ? "session" : "sessions"} ·{" "}
            {totalSessions > 0
              ? `${((totalConverted / totalSessions) * 100).toFixed(1)}% converted`
              : "no traffic yet"}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center gap-2 rounded-md border bg-muted/40 px-4 text-sm font-medium text-muted-foreground"
            title="Funnel builder UI coming soon"
          >
            <Plus className="h-4 w-4" />
            New funnel
          </button>
        )}
      </header>

      {funnels.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-card p-12 text-center">
          <GitBranch className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No funnels yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Funnels let you stitch landing pages, upsells, downsells, and
            thank-you steps into a guided purchase flow. The schema is in
            place — the builder UI is the next milestone.
          </p>
        </div>
      ) : (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {funnels.map((f) => (
            <article
              key={f.id}
              className="flex flex-col rounded-lg border bg-card p-5"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{f.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    /{f.slug}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    STATUS_STYLES[f.status] ??
                    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {f.status}
                </span>
              </header>
              {f.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              )}
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Steps
                  </dt>
                  <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold tabular-nums">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    {f.stepsCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sessions
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {f.sessionsCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Conv.
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {f.sessionsCount > 0
                      ? `${(f.conversionRate * 100).toFixed(1)}%`
                      : "—"}
                  </dd>
                </div>
              </dl>
              {f.status === "published" && f.stepsCount > 0 && (
                <Link
                  href={`/f/${f.slug}`}
                  className="mt-4 inline-flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent"
                >
                  Preview funnel
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
