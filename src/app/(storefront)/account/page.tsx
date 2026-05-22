import Link from "next/link";
import { MapPin, Package, Settings, User } from "lucide-react";
import { SiteNav } from "@/components/storefront/landing/site-nav";
import { SiteFooter } from "@/components/storefront/landing/site-footer";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account", robots: { index: false } };

const ORDERS = [
  {
    id: "SW-10428",
    placed: "2026-05-18",
    status: "Delivered",
    total: 18497,
    items: 3,
  },
  {
    id: "SW-10391",
    placed: "2026-04-29",
    status: "Shipped",
    total: 8499,
    items: 1,
  },
  {
    id: "SW-10342",
    placed: "2026-04-04",
    status: "Delivered",
    total: 12798,
    items: 2,
  },
];

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

export default function AccountPage() {
  return (
    <>
      <SiteNav />
      <main className="pt-24">
        <section className="container py-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
            Welcome back, Athlete
          </h1>
          <p className="mt-3 text-white/65">
            Demo dashboard — wire to Supabase Auth + orders once the schema is live.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-3xl border border-white/10 bg-white/[0.02] p-3 lg:sticky lg:top-28 lg:h-fit">
              <NavItem icon={Package} label="Orders" active />
              <NavItem icon={MapPin} label="Addresses" />
              <NavItem icon={User} label="Profile" />
              <NavItem icon={Settings} label="Settings" />
            </aside>

            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Orders" value="12" />
                <Stat label="Lifetime spend" value={fmt(124800)} />
                <Stat label="Loyalty points" value="1,248" />
              </div>

              <section className="rounded-3xl border border-white/10 bg-white/[0.02]">
                <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
                    Recent orders
                  </h2>
                  <Link
                    href="/products"
                    prefetch
                    className="text-xs font-bold uppercase tracking-widest text-[#ff3b3b] hover:underline"
                  >
                    Reorder essentials →
                  </Link>
                </header>
                <ul className="divide-y divide-white/5">
                  {ORDERS.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-bold text-white">{o.id}</p>
                        <p className="mt-0.5 text-xs text-white/55">
                          Placed {o.placed} · {o.items}{" "}
                          {o.items === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            o.status === "Delivered"
                              ? "bg-[#22c55e]/15 text-[#22c55e]"
                              : "bg-[#00d4ff]/15 text-[#00d4ff]"
                          }`}
                        >
                          {o.status}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-white">
                          {fmt(o.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
                  Default address
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Athlete X<br />
                  House 42, Street 7, DHA Phase 5<br />
                  Lahore, 54000<br />
                  +92 300 1234567
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Package;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-[#ff3b3b]/15 text-white"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums text-white">{value}</p>
    </div>
  );
}
