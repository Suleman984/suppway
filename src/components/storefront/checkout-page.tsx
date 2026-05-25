"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  CreditCard,
  Lock,
  Smartphone,
  TagIcon,
  Wallet,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { recalculateCart } from "@/server/actions/cart";
import { placeOrder } from "@/server/actions/orders";
import {
  sendCheckoutOtp,
  verifyCheckoutOtp,
} from "@/server/actions/checkout-otp";
import { useStoreLink } from "@/lib/store/link";
import type { PricedCart } from "@/server/services/pricing";

const fmt = (cents: number) => `Rs. ${(cents / 100).toLocaleString("en-PK")}`;

type Method = "card" | "jazzcash" | "easypaisa" | "cod";

const METHODS: { id: Method; label: string; sub: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Credit / Debit card", sub: "Visa, Mastercard via Stripe", icon: CreditCard },
  { id: "jazzcash", label: "JazzCash", sub: "Mobile wallet · Pakistan", icon: Smartphone },
  { id: "easypaisa", label: "EasyPaisa", sub: "Mobile wallet · Pakistan", icon: Smartphone },
  { id: "cod", label: "Cash on delivery", sub: "Pay the rider on arrival", icon: Wallet },
];

interface ShippingForm {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postal: string;
}

interface CheckoutPageClientProps {
  /** Email of the logged-in user, if any. Lowercased. */
  signedInEmail: string | null;
}

export function CheckoutPageClient({ signedInEmail }: CheckoutPageClientProps) {
  const router = useRouter();
  const link = useStoreLink();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const [method, setMethod] = useState<Method>("cod");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricing, startPricing] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingForm>({
    email: signedInEmail ?? "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "Lahore",
    postal: "54000",
  });

  // OTP gate state. We only require OTP when the submitted email isn't the
  // user's signed-in email — Supabase already verified that one.
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifiedFor, setOtpVerifiedFor] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSending, startOtpSend] = useTransition();
  const [otpVerifying, startOtpVerify] = useTransition();

  const emailNormalized = form.email.trim().toLowerCase();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized);
  const isOwnAuthEmail =
    !!signedInEmail && emailNormalized === signedInEmail;
  const needsOtp = !isOwnAuthEmail;
  const otpVerified =
    !needsOtp || otpVerifiedFor === emailNormalized;

  // Re-price whenever cart contents or applied coupon change.
  useEffect(() => {
    if (items.length === 0) {
      setPriced(null);
      return;
    }
    startPricing(async () => {
      const payload = {
        items: items.map((i) => ({ variantId: i.id, qty: i.qty })),
        couponCode: appliedCoupon,
      };
      const result = await recalculateCart(payload);
      if (!result.ok) {
        setPricingError(result.error);
        setPriced(null);
        return;
      }
      setPricingError(null);
      setPriced(result.cart);
    });
  }, [items, appliedCoupon]);

  function patch<K extends keyof ShippingForm>(key: K, v: ShippingForm[K]) {
    setForm((f) => ({ ...f, [key]: v }));
    if (key === "email") {
      // Editing the email invalidates any prior OTP — the verified address
      // and the submitted one must always match.
      setOtpSent(false);
      setOtpCode("");
      setOtpStatus(null);
      setOtpError(null);
    }
  }

  function handleSendOtp() {
    setOtpError(null);
    setOtpStatus(null);
    if (!emailLooksValid) {
      setOtpError("Enter a valid email first.");
      return;
    }
    startOtpSend(async () => {
      const result = await sendCheckoutOtp({ email: emailNormalized });
      if (!result.ok) {
        setOtpError(result.error);
        return;
      }
      setOtpSent(true);
      setOtpStatus(result.message ?? "Code sent.");
    });
  }

  function handleVerifyOtp() {
    setOtpError(null);
    startOtpVerify(async () => {
      const result = await verifyCheckoutOtp({
        email: emailNormalized,
        code: otpCode.trim(),
      });
      if (!result.ok) {
        setOtpError(result.error);
        return;
      }
      setOtpVerifiedFor(emailNormalized);
      setOtpStatus("Email verified.");
    });
  }

  function applyCoupon() {
    setAppliedCoupon(coupon.trim().toUpperCase() || null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    if (!priced || priced.lines.length === 0) {
      setSubmitError("Your cart is empty");
      return;
    }
    if (needsOtp && !otpVerified) {
      setSubmitError("Verify your email before placing the order.");
      return;
    }
    startSubmit(async () => {
      const result = await placeOrder({
        email: form.email,
        paymentMethod: method,
        couponCode: appliedCoupon,
        shipping: {
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          postal: form.postal,
          phone: form.phone,
        },
        items: items.map((i) => ({ variantId: i.id, qty: i.qty })),
      });
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      clear();
      router.push(link(`/order/${result.data!.orderNumber}`));
    });
  }

  if (items.length === 0) {
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-8">
        <Section title="Contact">
          <Grid>
            <Field label="Email" type="email" value={form.email} onChange={(v) => patch("email", v)} required placeholder="you@example.com" />
            <Field label="Phone" type="tel" value={form.phone} onChange={(v) => patch("phone", v)} required placeholder="+92 300 1234567" />
          </Grid>
          {needsOtp && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              {otpVerified ? (
                <p className="text-sm font-bold text-[#22c55e]">
                  ✓ Email verified · {emailNormalized}
                </p>
              ) : !otpSent ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-white/65">
                    We&apos;ll send a 6-digit code to confirm this email is
                    yours before placing the order.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !emailLooksValid}
                    className="rounded-md border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    {otpSending ? "Sending…" : "Send code"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-white/65">
                    Enter the 6-digit code we sent to{" "}
                    <span className="font-bold text-white">{emailNormalized}</span>.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="123456"
                      className="h-10 w-32 rounded-md border border-white/15 bg-black/40 px-3 text-center text-base tracking-[0.4em] text-white placeholder:text-white/30 focus:border-[#ff3b3b] focus:outline-none focus:ring-2 focus:ring-[#ff3b3b]/30"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpCode.length !== 6}
                      className="rounded-md bg-[#ff3b3b] px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ff5252] disabled:opacity-50"
                    >
                      {otpVerifying ? "Verifying…" : "Verify"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="rounded-md border border-white/20 px-3 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </div>
                </div>
              )}
              {otpStatus && !otpError && (
                <p className="mt-2 text-xs text-white/55">{otpStatus}</p>
              )}
              {otpError && (
                <p className="mt-2 text-xs text-[#ff3b3b]">{otpError}</p>
              )}
            </div>
          )}
        </Section>

        <Section title="Shipping address">
          <Grid>
            <Field label="First name" value={form.firstName} onChange={(v) => patch("firstName", v)} required />
            <Field label="Last name" value={form.lastName} onChange={(v) => patch("lastName", v)} required />
            <Field label="Address" value={form.address} onChange={(v) => patch("address", v)} required className="sm:col-span-2" />
            <Field label="City" value={form.city} onChange={(v) => patch("city", v)} required />
            <Field label="Postal code" value={form.postal} onChange={(v) => patch("postal", v)} required />
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
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs text-white/55">
              Card capture not wired in this build — pick Cash on Delivery to test the full order flow.
            </div>
          )}
        </Section>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:sticky lg:top-28">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
          Order summary
        </h2>

        <ul className="divide-y divide-white/5">
          {(priced?.lines ?? items.map((i) => ({
            variantId: i.id,
            productTitle: i.name,
            variantTitle: i.flavor,
            qty: i.qty,
            unitPriceCents: i.price * 100,
            lineDiscountCents: 0,
            lineTotalCents: i.price * 100 * i.qty,
          }))).map((l) => (
            <li
              key={l.variantId}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {l.productTitle}{" "}
                  <span className="font-normal text-white/45">× {l.qty}</span>
                </p>
                <p className="truncate text-xs text-white/55">{l.variantTitle}</p>
              </div>
              <span className="text-sm tabular-nums text-white">
                {fmt(l.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>

        {/* Coupon input — NOT a <form>, because we're already inside the
            outer checkout <form> and nested forms are invalid HTML. */}
        <div className="flex gap-2 border-t border-white/10 pt-4">
          <div className="relative flex-1">
            <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Prevent the keystroke from bubbling up to the outer
                  // form, which would submit the order prematurely.
                  e.preventDefault();
                  applyCoupon();
                }
              }}
              placeholder="Coupon code"
              className="h-10 w-full rounded-md border border-white/15 bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-white/35"
            />
          </div>
          <button
            type="button"
            onClick={applyCoupon}
            disabled={pricing}
            className="rounded-md border border-white/20 px-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        {priced?.couponError && (
          <p className="text-xs text-[#ff3b3b]">{priced.couponError}</p>
        )}
        {appliedCoupon && !priced?.couponError && priced && (
          <p className="text-xs text-[#22c55e]">
            Coupon <span className="font-bold">{appliedCoupon}</span> applied.
          </p>
        )}

        <dl className="space-y-2 border-t border-white/10 pt-4 text-sm text-white/70">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{fmt(priced?.subtotalCents ?? 0)}</dd>
          </div>
          {priced && priced.discountCents > 0 && (
            <div className="flex justify-between text-[#22c55e]">
              <dt>Discount</dt>
              <dd className="tabular-nums">− {fmt(priced.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className={priced && priced.shippingCents === 0 ? "text-[#22c55e]" : "tabular-nums"}>
              {priced && priced.shippingCents === 0 ? "Free" : fmt(priced?.shippingCents ?? 0)}
            </dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
            Total
          </span>
          <span className="text-2xl font-black tabular-nums text-white">
            {fmt(priced?.totalCents ?? 0)}
          </span>
        </div>

        {pricingError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-[#ff3b3b]">
            {pricingError}
          </p>
        )}
        {priced && priced.invalidLines.length > 0 && (
          <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            {priced.invalidLines.length === 1
              ? "1 item in your cart is no longer available."
              : `${priced.invalidLines.length} items in your cart are no longer available.`}
          </p>
        )}
        {submitError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-[#ff3b3b]"
          >
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            pricing ||
            !priced ||
            priced.lines.length === 0 ||
            (needsOtp && !otpVerified)
          }
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ff3b3b] text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252] disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          {submitting
            ? "Placing order…"
            : pricing
              ? "Pricing…"
              : `Place order · ${fmt(priced?.totalCents ?? 0)}`}
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
  onChange,
  value,
  ...input
}: {
  label: string;
  className?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/55">
        {label}
      </span>
      <input
        {...input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff3b3b] focus:outline-none focus:ring-2 focus:ring-[#ff3b3b]/30"
      />
    </label>
  );
}
