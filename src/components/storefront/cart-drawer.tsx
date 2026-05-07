"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

export function CartDrawer() {
  const open = useCartStore((s) => s.open);
  const items = useCartStore((s) => s.items);
  const closeCart = useCartStore((s) => s.closeCart);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeCart]);

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const FREE_SHIPPING_THRESHOLD = 5000;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={open ? 0 : -1}
        onClick={closeCart}
        className={`fixed inset-0 z-[60] cursor-default bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-[#0c0c0c] text-white shadow-[-30px_0_60px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff3b3b]/15 text-[#ff3b3b]">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div>
              <p className="text-base font-black uppercase tracking-tight">
                Your Cart
              </p>
              <p className="text-xs text-white/55">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {items.length > 0 && (
          <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4">
            {remainingForFree > 0 ? (
              <p className="text-xs text-white/65">
                Add{" "}
                <span className="font-bold text-white">
                  {fmt(remainingForFree)}
                </span>{" "}
                more for free shipping
              </p>
            ) : (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#22c55e]">
                ✓ Free shipping unlocked
              </p>
            )}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff3b3b] to-[#ffae00] transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/30">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <div>
                <p className="text-lg font-black uppercase tracking-tight">
                  Cart's empty
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Add something brutal.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 inline-flex h-11 items-center rounded-full bg-[#ff3b3b] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252]"
              >
                Browse supplements
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 p-5">
                  <div
                    aria-hidden
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10"
                    style={{
                      background: `radial-gradient(circle at 30% 25%, ${item.accent}55, ${item.accent}10 60%, transparent), #181818`,
                    }}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center text-2xl font-black"
                      style={{ color: item.accent }}
                    >
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.name}</p>
                        <p className="mt-0.5 truncate text-xs text-white/50">
                          {item.flavor}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="shrink-0 text-white/40 transition hover:text-[#ff3b3b]"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-white/15">
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="inline-flex h-8 w-8 items-center justify-center text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center text-white/70 transition hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold tabular-nums">
                        {fmt(item.qty * item.price)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-white/10 bg-black/40 p-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shipping</span>
                <span
                  className={
                    subtotal >= FREE_SHIPPING_THRESHOLD
                      ? "text-[#22c55e]"
                      : "text-white/50"
                  }
                >
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? "Free" : "Calculated at checkout"}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
                <span className="text-xs uppercase tracking-[0.2em] text-white/55">
                  Total
                </span>
                <span className="text-xl font-black tabular-nums">
                  {fmt(subtotal)}
                </span>
              </div>
            </div>
            <Link
              href="/checkout"
              prefetch
              onClick={closeCart}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff3b3b] text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252]"
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={closeCart}
              className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-bold uppercase tracking-[0.2em] text-white/55 transition hover:text-white"
            >
              Continue shopping
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
