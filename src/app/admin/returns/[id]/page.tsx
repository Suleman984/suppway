import Link from "@/lib/store/link";
import { storeLink } from "@/lib/store/active";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { getReturnDetail } from "@/server/services/returns";
import { formatCents } from "@/server/services/orders";
import { ReturnDecisionForm } from "@/components/admin/returns/return-decision-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Return ${id.slice(0, 8)}` };
}

export default async function AdminReturnDetailPage({ params }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.RETURNS_VIEW))) {
    redirect(await storeLink("/admin/dashboard"));
  }
  const { id } = await params;
  const req = await getReturnDetail(id);
  if (!req) notFound();
  const canDecide = await hasPermission(PERMISSIONS.RETURNS_DECIDE);

  const remaining = req.order.totalCents - req.order.refundedCents;

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/returns"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to returns
      </Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold capitalize">{req.type} request</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order{" "}
            <Link
              href={`/admin/orders/${req.orderId}`}
              className="font-mono font-medium hover:underline"
            >
              {req.orderNumber}
            </Link>{" "}
            · {req.customerEmail} ·{" "}
            {new Date(req.createdAt).toLocaleString()}
          </p>
        </div>
        <StatusPill status={req.status} />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Customer message
            </h2>
            {req.reason && (
              <p className="mt-2 text-xs text-muted-foreground">
                Reason: <span className="font-medium text-foreground">{req.reason}</span>
              </p>
            )}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {req.customerMessage}
            </p>
          </div>

          {req.attachments.length > 0 && (
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Photos
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {req.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.signedUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block overflow-hidden rounded-md border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.signedUrl}
                      alt="customer attachment"
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card">
            <header className="border-b px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Order items
            </header>
            <ul className="divide-y">
              {req.order.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {it.productTitle}
                    </p>
                    {it.variantTitle && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {it.variantTitle}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="tabular-nums">
                      {formatCents(it.totalCents, req.order.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      × {it.quantity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                Refundable remaining
              </span>
              <span className="font-bold tabular-nums">
                {formatCents(remaining, req.order.currency)}
              </span>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {req.status === "pending" && canDecide && (
            <ReturnDecisionForm
              requestId={req.id}
              type={req.type}
              remainingCents={remaining}
              currency={req.order.currency}
            />
          )}
          {req.status !== "pending" && (
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Decision
              </h2>
              <p className="mt-2 text-sm capitalize">{req.status}</p>
              {req.decidedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(req.decidedAt).toLocaleString()}
                </p>
              )}
              {req.refundAmountCents != null && (
                <p className="mt-2 text-sm">
                  Refunded{" "}
                  <span className="font-bold tabular-nums">
                    {formatCents(req.refundAmountCents, req.order.currency)}
                  </span>
                </p>
              )}
              {req.adminNotes && (
                <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
                  {req.adminNotes}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "pending"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : status === "refunded" || status === "exchanged"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}
