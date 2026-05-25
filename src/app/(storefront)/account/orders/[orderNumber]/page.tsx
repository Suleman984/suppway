import Link from "@/lib/store/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import {
  formatPKR,
  getCustomerOrderByNumber,
} from "@/server/services/account";
import { listCustomerReturnsForOrder } from "@/server/services/returns";
import { ReturnRequestForm } from "@/components/storefront/return-request-form";
import { createClient } from "@/lib/supabase/server";
import { storeLink } from "@/lib/store/active";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-[#22c55e]/15 text-[#22c55e]",
  fulfilled: "bg-[#22c55e]/15 text-[#22c55e]",
  pending: "bg-[#ffae00]/15 text-[#ffae00]",
  partially_refunded: "bg-[#a855f7]/15 text-[#a855f7]",
  refunded: "bg-white/15 text-white/65",
  canceled: "bg-white/10 text-white/55",
  failed: "bg-[#ff3b3b]/20 text-[#ff3b3b]",
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "Credit / Debit card",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
  cod: "Cash on delivery",
};

export async function generateMetadata({ params }: PageProps) {
  const { orderNumber } = await params;
  return { title: `Order #${orderNumber}`, robots: { index: false } };
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;

  // Auth gate: forward unauthenticated visitors back through login so they
  // land back here after signing in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = await storeLink(`/account/orders/${orderNumber}`);
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const order = await getCustomerOrderByNumber(orderNumber);
  if (!order) notFound();

  const returns = await listCustomerReturnsForOrder(order.id);
  const canRequestReturn =
    (order.status === "paid" ||
      order.status === "fulfilled" ||
      order.status === "partially_refunded") &&
    !returns.some((r) => r.status === "pending");

  const ship = order.shippingAddress;
  const paymentLabel = order.paymentMethod
    ? PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod
    : null;

  return (
    <>
      <SiteNavServer />
      <main className="pt-24">
        <section className="container max-w-5xl py-12">
          <Link
            href="/account"
            prefetch
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/55 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to account
          </Link>

          <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
                Order
              </p>
              <h1 className="mt-2 font-mono text-3xl font-black text-white md:text-4xl">
                #{order.orderNumber}
              </h1>
              <p className="mt-2 text-sm text-white/55">
                Placed {new Date(order.placedAt).toLocaleString("en-PK")}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                STATUS_STYLES[order.status] ?? "bg-white/10 text-white/65"
              }`}
            >
              {order.status.replace("_", " ")}
            </span>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.02]">
              <header className="border-b border-white/10 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Items
              </header>
              <ul className="divide-y divide-white/5">
                {order.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-3 p-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {it.productTitle}
                      </p>
                      {it.variantTitle && (
                        <p className="mt-0.5 truncate text-xs text-white/55">
                          {it.variantTitle} · {order.currency}{" "}
                          {formatPKR(it.priceCents).replace("Rs. ", "")} each
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-white">
                        {order.currency}{" "}
                        {formatPKR(it.totalCents).replace("Rs. ", "")}
                      </p>
                      <p className="text-xs text-white/55">× {it.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="space-y-2 border-t border-white/10 px-6 py-5 text-sm text-white/70">
                <Row label="Subtotal" value={formatPKR(order.subtotalCents)} />
                {order.discountCents > 0 && (
                  <Row
                    label="Discount"
                    value={`− ${formatPKR(order.discountCents)}`}
                    tone="green"
                  />
                )}
                <Row
                  label="Shipping"
                  value={
                    order.shippingCents === 0
                      ? "Free"
                      : formatPKR(order.shippingCents)
                  }
                  tone={order.shippingCents === 0 ? "green" : undefined}
                />
                {order.taxCents > 0 && (
                  <Row label="Tax" value={formatPKR(order.taxCents)} />
                )}
                {order.refundedCents > 0 && (
                  <Row
                    label="Refunded"
                    value={`− ${formatPKR(order.refundedCents)}`}
                    tone="red"
                  />
                )}
                <div className="flex items-baseline justify-between border-t border-white/10 pt-3 text-base font-black text-white">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatPKR(order.totalCents)}
                  </span>
                </div>
              </dl>
            </section>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                  Status
                </h2>
                <dl className="mt-3 space-y-2 text-sm text-white/80">
                  <SideRow label="Payment" value={order.status.replace("_", " ")} />
                  <SideRow
                    label="Fulfilment"
                    value={order.fulfillmentStatus.replace("_", " ")}
                  />
                  {paymentLabel && (
                    <SideRow label="Method" value={paymentLabel} />
                  )}
                </dl>
              </section>

              {ship && (
                <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                    <MapPin className="h-3.5 w-3.5" />
                    Shipping to
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">
                    {[ship.firstName, ship.lastName].filter(Boolean).join(" ")}
                    {ship.address && (
                      <>
                        <br />
                        {ship.address}
                      </>
                    )}
                    {(ship.city || ship.postal) && (
                      <>
                        <br />
                        {[ship.city, ship.postal].filter(Boolean).join(", ")}
                      </>
                    )}
                    {ship.phone && (
                      <>
                        <br />
                        {ship.phone}
                      </>
                    )}
                  </p>
                </section>
              )}

              {returns.length > 0 && (
                <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                    Your requests
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {returns.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-md border border-white/10 bg-black/30 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold capitalize text-white">
                            {r.type}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                              r.status === "pending"
                                ? "bg-[#ffae00]/15 text-[#ffae00]"
                                : r.status === "refunded" ||
                                    r.status === "exchanged"
                                  ? "bg-[#22c55e]/15 text-[#22c55e]"
                                  : "bg-white/10 text-white/55"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p className="mt-1 text-white/55">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                  Need help?
                </h2>
                <p className="mt-3 text-xs text-white/65">
                  Reply to the confirmation email or contact support with
                  order number{" "}
                  <span className="font-mono font-bold text-white">
                    #{order.orderNumber}
                  </span>
                  .
                </p>
              </section>
            </aside>
          </div>

          {canRequestReturn && (
            <div className="mt-6">
              <ReturnRequestForm
                orderId={order.id}
                orderNumber={order.orderNumber}
                userId={user.id}
              />
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
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
      ? "text-[#22c55e]"
      : tone === "red"
        ? "text-[#ff3b3b]"
        : "text-white/80";
  return (
    <div className="flex justify-between">
      <dt className="text-white/55">{label}</dt>
      <dd className={`tabular-nums ${cls}`}>{value}</dd>
    </div>
  );
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className="capitalize text-white/85">{value}</dd>
    </div>
  );
}
