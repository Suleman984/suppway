import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, Receipt } from "lucide-react";
import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmed", robots: { index: false } };

const fmt = (cents: number) => `Rs. ${(cents / 100).toLocaleString("en-PK")}`;

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderNumber } = await params;
  // Confirmation pages are public-by-URL; we use the admin client to
  // read the row without depending on RLS (the order may belong to a
  // guest who isn't authenticated). Knowing the order number is
  // effectively the only required credential — same model as
  // Shopify/Amazon "track your order" links.
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      `id, order_number, status, email, currency, subtotal_cents, discount_cents,
       shipping_cents, total_cents, placed_at, shipping_address,
       order_items(product_title, variant_title, quantity, total_cents)`,
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!data) notFound();
  const order = data as {
    order_number: string;
    status: string;
    email: string;
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    total_cents: number;
    placed_at: string;
    shipping_address: {
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      postal?: string;
      phone?: string;
    } | null;
    order_items: Array<{
      product_title: string;
      variant_title: string | null;
      quantity: number;
      total_cents: number;
    }>;
  };

  return (
    <>
      <SiteNavServer />
      <main className="pt-24">
        <section className="container max-w-3xl py-16">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/15 text-[#22c55e]">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              Order placed
            </h1>
            <p className="mt-3 text-white/65">
              Thanks — we&apos;ve emailed a confirmation to {order.email}.
            </p>
            <p className="mt-2 text-xs font-mono text-white/45">
              #{order.order_number}
            </p>
          </div>

          <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02]">
            <header className="flex items-center gap-2 border-b border-white/10 px-6 py-4 text-sm text-white/65">
              <Receipt className="h-4 w-4" /> Items
            </header>
            <ul className="divide-y divide-white/5">
              {order.order_items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 px-6 py-4"
                >
                  <div>
                    <p className="font-bold text-white">
                      {it.product_title}
                      <span className="ml-2 font-normal text-white/45">
                        × {it.quantity}
                      </span>
                    </p>
                    {it.variant_title && (
                      <p className="mt-0.5 text-xs text-white/55">
                        {it.variant_title}
                      </p>
                    )}
                  </div>
                  <span className="text-sm tabular-nums text-white">
                    {fmt(it.total_cents)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-white/10 px-6 py-5 text-sm text-white/70">
              <Row label="Subtotal" value={fmt(order.subtotal_cents)} />
              {order.discount_cents > 0 && (
                <Row
                  label="Discount"
                  value={`− ${fmt(order.discount_cents)}`}
                  tone="green"
                />
              )}
              <Row
                label="Shipping"
                value={order.shipping_cents === 0 ? "Free" : fmt(order.shipping_cents)}
              />
              <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                  Total
                </span>
                <span className="text-2xl font-black tabular-nums text-white">
                  {fmt(order.total_cents)}
                </span>
              </div>
            </div>
          </section>

          {order.shipping_address && (
            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <header className="flex items-center gap-2 text-sm text-white/55">
                <Package className="h-4 w-4" /> Shipping to
              </header>
              <p className="mt-3 text-sm text-white/85">
                {order.shipping_address.firstName} {order.shipping_address.lastName}
                <br />
                {order.shipping_address.address}
                <br />
                {order.shipping_address.city}, {order.shipping_address.postal}
                <br />
                {order.shipping_address.phone}
              </p>
            </section>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/account"
              prefetch
              className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
            >
              My account
            </Link>
            <Link
              href="/products"
              prefetch
              className="inline-flex h-11 items-center rounded-full bg-[#ff3b3b] px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ff5252]"
            >
              Continue shopping
            </Link>
          </div>
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
  tone?: "green";
}) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className={`tabular-nums ${tone === "green" ? "text-[#22c55e]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
