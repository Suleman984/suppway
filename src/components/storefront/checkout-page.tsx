"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Wallet, Lock } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
const FREE_SHIPPING_THRESHOLD = 5000;

type Method = "card" | "jazzcash" | "easypaisa" | "cod";

const METHODS: { id: Method; label: string; sub: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Credit / Debit card", sub: "Visa, Mastercard via Stripe", icon: CreditCard },
  { id: "jazzcash", label: "JazzCash", sub: "Mobile wallet · Pakistan", icon: Smartphone },
  { id: "easypaisa", label: "EasyPaisa", sub: "Mobile wallet · Pakistan", icon: Smartphone },
  { id: "cod", label: "Cash on delivery", sub: "Pay the rider on arrival", icon: Wallet },
];

export function CheckoutPageClient() {
  const items = useCartStore((s) => s.items);
  const [method, setMethod] = useState<Method>("card");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const shippingFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = shippingFree ? 0 : 350;
  const total = subtotal + shipping;

  if (items.length === 0 && !done) {
    return (
      <p className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/65">
        Your cart is empty —{" "}
        <a href="/products" className="font-bold text-[#ff3b3b] hover:underline">
          add something
        </a>{" "}
        before checking out.
      </p>
    );
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-10 text-center">
        <p className="text-3xl font-black uppercase tracking-tight text-white">
          Order placed ✓
        </p>
        <p className="mt-3 text-white/65">
          (Demo only — wire this to your payment provider to charge for real.)
        </p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      useCartStore.setState({ items: [] });
    }, 900);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-8">
        <Section title="Contact">
          <Grid>
            <Field label="Email" type="email" name="email" required placeholder="you@example.com" />
            <Field label="Phone" type="tel" name="phone" required placeholder="+92 300 1234567" />
          </Grid>
        </Section>

        <Section title="Shipping address">
          <Grid>
            <Field label="First name" name="first_name" required />
            <Field label="Last name" name="last_name" required />
            <Field label="Address" name="address" required className="sm:col-span-2" />
            <Field label="City" name="city" required defaultValue="Lahore" />
            <Field label="Postal code" name="postal" required defaultValue="54000" />
          </Grid>
        </Section>

        <Section title="Payment">
          <div className="grid gap-3 sm:grid-cols-2">
            {METHODS.map((m) => {
              const active = m.id === method;
              const Icon = m.icon;
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                    active
                      ? "border-[#ff3b3b] bg-[#ff3b3b]/10"
                      : "border-white/15 bg-white/[0.02] hover:border-white/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.id}
                    checked={active}
                    onChange={() => setMethod(m.id)}
                    className="sr-only"
                  />
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      active ? "bg-[#ff3b3b] text-white" : "bg-white/10 text-white/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">{m.label}</span>
                    <span className="block text-xs text-white/55">{m.sub}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {method === "card" && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Grid>
                <Field label="Card number" name="cc_number" placeholder="4242 4242 4242 4242" className="sm:col-span-2" />
                <Field label="Expiry" name="cc_exp" placeholder="MM / YY" />
                <Field label="CVC" name="cc_cvc" placeholder="123" />
              </Grid>
            </div>
          )}
        </Section>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-28">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
          Order summary
        </h2>
        <ul className="divide-y divide-white/5">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {it.name}{" "}
                  <span className="font-normal text-white/45">× {it.qty}</span>
                </p>
                <p className="truncate text-xs text-white/55">{it.flavor}</p>
              </div>
              <span className="text-sm tabular-nums text-white">
                {fmt(it.qty * it.price)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-white/10 pt-4 text-sm text-white/70">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{fmt(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className={shippingFree ? "text-[#22c55e]" : "tabular-nums"}>
              {shippingFree ? "Free" : fmt(shipping)}
            </dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
            Total
          </span>
          <span className="text-2xl font-black tabular-nums text-white">{fmt(total)}</span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff3b3b] text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252] disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          {submitting ? "Processing…" : `Pay ${fmt(total)}`}
        </button>
        <p className="text-center text-[11px] text-white/45">
          Secure checkout · 256-bit SSL · PCI-DSS
        </p>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  className = "",
  ...input
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/55">
        {label}
      </span>
      <input
        {...input}
        className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff3b3b] focus:outline-none focus:ring-2 focus:ring-[#ff3b3b]/30"
      />
    </label>
  );
}
