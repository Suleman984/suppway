"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
const FREE_SHIPPING_THRESHOLD = 5000;

export function CartPageClient() {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = shippingFree ? 0 : 350;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.02] py-20 text-center">
        <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-white/40">
          <ShoppingBag className="h-9 w-9" />
        </span>
        <div>
          <p className="text-2xl font-black uppercase tracking-tight text-white">
            Your cart is empty
          </p>
          <p className="mt-2 text-sm text-white/55">
            Pick something heavy. Let&apos;s build the stack.
          </p>
        </div>
        <Link
          href="/products"
          prefetch
          className="inline-flex h-12 items-center rounded-full bg-[#ff3b3b] px-8 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252]"
        >
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02]">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-lg font-black uppercase tracking-tight text-white">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </h2>
          <Link
            href="/products"
            prefetch
            className="text-xs font-bold uppercase tracking-widest text-white/55 hover:text-white"
          >
            Continue shopping →
          </Link>
        </header>

        <ul className="divide-y divide-white/5">
          {items.map((item) => (
            <li key={item.id} className="flex gap-5 p-6">
              <div
                aria-hidden
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${item.accent}55, ${item.accent}10 60%, transparent), #181818`,
                }}
              >
                <span
                  className="absolute inset-0 flex items-center justify-center text-3xl font-black"
                  style={{ color: item.accent }}
                >
                  {item.name.charAt(0)}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-white/55">{item.flavor}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="text-white/40 transition hover:text-[#ff3b3b]"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between pt-3">
                  <div className="inline-flex items-center rounded-full border border-white/15">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="inline-flex h-9 w-9 items-center justify-center text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-bold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="inline-flex h-9 w-9 items-center justify-center text-white/70 transition hover:text-white"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-lg font-black tabular-nums text-white">
                    {fmt(item.qty * item.price)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-28">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
          Order summary
        </h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between text-white/70">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{fmt(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-white/70">
            <dt>Shipping</dt>
            <dd className={shippingFree ? "text-[#22c55e]" : "tabular-nums"}>
              {shippingFree ? "Free" : fmt(shipping)}
            </dd>
          </div>
          {!shippingFree && (
            <p className="rounded-xl bg-white/[0.04] p-3 text-xs text-white/65">
              Add <span className="font-bold text-white">{fmt(FREE_SHIPPING_THRESHOLD - subtotal)}</span> more for free shipping.
            </p>
          )}
        </dl>
        <div className="mt-6 flex items-baseline justify-between border-t border-white/10 pt-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
            Total
          </span>
          <span className="text-2xl font-black tabular-nums text-white">
            {fmt(total)}
          </span>
        </div>
        <Link
          href="/checkout"
          prefetch
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff3b3b] text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252]"
        >
          Checkout
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-center text-[11px] text-white/45">
          Pay via Stripe, JazzCash or EasyPaisa.
        </p>
      </aside>
    </div>
  );
}
