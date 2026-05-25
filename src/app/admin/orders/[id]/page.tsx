import Link from "@/lib/store/link";
import { storeLink } from "@/lib/store/active";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { formatCents, getAdminOrderById } from "@/server/services/orders";
import { OrderActions } from "@/components/admin/orders/order-actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.ORDERS_VIEW))) {
    redirect(await storeLink("/admin/dashboard"));
  }
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const [canUpdate, canCancel, canRefund] = await Promise.all([
    hasPermission(PERMISSIONS.ORDERS_UPDATE),
    hasPermission(PERMISSIONS.ORDERS_CANCEL),
    hasPermission(PERMISSIONS.ORDERS_REFUND),
  ]);

  const shipping = order.shippingAddress as {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    postal?: string;
    phone?: string;
  } | null;

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.placedAt).toLocaleString()} · {order.email}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <section className="mt-6 rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Actions
        </h2>
        <div className="mt-4">
          <OrderActions
            orderId={order.id}
            status={order.status}
            permissions={{ update: canUpdate, cancel: canCancel, refund: canRefund }}
            totalCents={order.totalCents}
            refundedCents={order.refundedCents}
            currency={order.currency}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="rounded-lg border bg-card">
          <header className="border-b px-5 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Items
          </header>
          <ul className="divide-y">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.productTitle}</p>
                  {it.variantTitle && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {it.variantTitle} · {formatCents(it.priceCents, order.currency)} each
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums">
                    {formatCents(it.totalCents, order.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">× {it.quantity}</p>
                </div>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t px-5 py-4 text-sm">
            <Row label="Subtotal" value={formatCents(order.subtotalCents, order.currency)} />
            {order.discountCents > 0 && (
              <Row
                label="Discount"
                value={`− ${formatCents(order.discountCents, order.currency)}`}
                tone="green"
              />
            )}
            <Row
              label="Shipping"
              value={
                order.shippingCents === 0
                  ? "Free"
                  : formatCents(order.shippingCents, order.currency)
              }
            />
            {order.refundedCents > 0 && (
              <Row
                label="Refunded"
                value={`− ${formatCents(order.refundedCents, order.currency)}`}
                tone="red"
              />
            )}
            <div className="flex items-baseline justify-between border-t pt-3 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCents(order.totalCents, order.currency)}
              </span>
            </div>
          </dl>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="font-medium">
                {order.customer
                  ? [order.customer.firstName, order.customer.lastName]
                      .filter(Boolean)
                      .join(" ") || "Guest"
                  : "Guest"}
              </p>
              <p className="text-muted-foreground">{order.email}</p>
              {order.customer?.phone && (
                <p className="text-muted-foreground">{order.customer.phone}</p>
              )}
              {order.customer && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Lifetime: {formatCents(order.customer.totalSpentCents, order.currency)} ·
                  {" "}{order.customer.ordersCount}{" "}
                  {order.customer.ordersCount === 1 ? "order" : "orders"}
                </p>
              )}
              {order.customer?.id && (
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  prefetch
                >
                  View customer →
                </Link>
              )}
            </div>
          </section>

          {shipping && (
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Shipping to
              </h2>
              <p className="mt-3 text-sm leading-relaxed">
                {shipping.firstName} {shipping.lastName}
                <br />
                {shipping.address}
                <br />
                {shipping.city}, {shipping.postal}
                <br />
                {shipping.phone}
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "red";
}) {
  const cls =
    tone === "green"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "red"
        ? "text-rose-600 dark:text-rose-400"
        : "";
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${cls}`}>{value}</dd>
    </div>
  );
}
