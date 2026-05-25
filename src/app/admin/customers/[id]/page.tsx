import Link from "@/lib/store/link";
import { storeLink } from "@/lib/store/active";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { getAdminCustomerById } from "@/server/services/customers";
import { formatCents } from "@/server/services/orders";
import { AdjustPointsForm } from "@/components/admin/customers/adjust-points-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const REASON_LABELS: Record<string, string> = {
  purchase: "Purchase",
  redeem: "Redeem",
  adjustment: "Manual adjustment",
  expire: "Expired",
  signup: "Sign-up bonus",
  review: "Review",
  referral: "Referral",
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = await getAdminCustomerById(id);
  return {
    title: c ? c.email : "Customer",
  };
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.CUSTOMERS_VIEW))) {
    redirect(await storeLink("/admin/dashboard"));
  }
  const { id } = await params;
  const customer = await getAdminCustomerById(id);
  if (!customer) notFound();

  const canAdjustPoints = await hasPermission(PERMISSIONS.LOYALTY_ADJUST);

  const displayName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            customer.userId
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-zinc-500/15 text-muted-foreground"
          }`}
        >
          {customer.userId ? "Has account" : "Guest"}
        </span>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Orders"
          value={customer.ordersCount.toString()}
          sub={`Customer since ${new Date(customer.createdAt).toLocaleDateString()}`}
        />
        <Stat
          label="Lifetime spend"
          value={formatCents(customer.totalSpentCents)}
        />
        <Stat
          label="Point balance"
          value={customer.pointBalance.toLocaleString("en-PK")}
          sub={`${customer.pointsLifetimeEarned.toLocaleString(
            "en-PK",
          )} earned · ${customer.pointsLifetimeRedeemed.toLocaleString(
            "en-PK",
          )} redeemed`}
        />
      </div>

      {canAdjustPoints && (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Adjust points
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manual adjustments are logged in the ledger with reason
            &ldquo;adjustment&rdquo; so the trail is preserved.
          </p>
          <div className="mt-4">
            <AdjustPointsForm
              customerId={customer.id}
              hasLogin={Boolean(customer.userId)}
            />
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card">
          <header className="border-b px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Orders
          </header>
          {customer.orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y">
              {customer.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      prefetch
                      className="font-mono text-sm font-medium hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(o.placedAt).toLocaleDateString()} ·{" "}
                      {o.status.replace("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {formatCents(o.totalCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-card">
          <header className="border-b px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Loyalty activity
          </header>
          {customer.points.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No point activity yet.
            </p>
          ) : (
            <ul className="divide-y">
              {customer.points.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {REASON_LABELS[p.reason] ?? p.reason}
                      {p.orderNumber && (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          #{p.orderNumber}
                        </span>
                      )}
                    </p>
                    {p.note && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.note}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      p.delta > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {p.delta > 0 ? "+" : ""}
                    {p.delta.toLocaleString("en-PK")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
