import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ChevronRight, MapPin, Package, Settings, User } from "lucide-react";
import { SiteNav } from "@/components/storefront/landing/site-nav";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { AccountSignOut } from "@/components/storefront/account-signout";
import { formatPKR, getAccountSnapshot } from "@/server/services/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account", robots: { index: false } };

const REASON_LABELS: Record<string, string> = {
  purchase: "Earned · purchase",
  redeem: "Redeemed",
  adjustment: "Manual adjustment",
  expire: "Expired",
  signup: "Sign-up bonus",
  review: "Reviewed a product",
  referral: "Referral",
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-[#22c55e]/15 text-[#22c55e]",
  fulfilled: "bg-[#22c55e]/15 text-[#22c55e]",
  pending: "bg-[#ffae00]/15 text-[#ffae00]",
  partially_refunded: "bg-[#a855f7]/15 text-[#a855f7]",
  refunded: "bg-white/15 text-white/65",
  canceled: "bg-white/10 text-white/55",
  failed: "bg-[#ff3b3b]/20 text-[#ff3b3b]",
};

export default async function AccountPage() {
  const snapshot = await getAccountSnapshot();
  if (!snapshot) redirect("/login?next=/account");

  const displayName =
    snapshot.profile?.fullName?.split(" ")[0] ??
    snapshot.user.email?.split("@")[0] ??
    "Athlete";

  return (
    <>
      <SiteNav />
      <main className="pt-24">
        <section className="container py-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            Account
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-3 text-sm text-white/65">{snapshot.user.email}</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-3xl border border-white/10 bg-white/[0.02] p-3 lg:sticky lg:top-28 lg:h-fit">
              <NavItem icon={Package} label="Orders" active />
              <NavItem icon={Award} label="Loyalty points" />
              <NavItem icon={MapPin} label="Addresses" />
              <NavItem icon={User} label="Profile" />
              <NavItem icon={Settings} label="Settings" />
            </aside>

            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Orders"
                  value={snapshot.customer.ordersCount.toString()}
                />
                <Stat
                  label="Lifetime spend"
                  value={formatPKR(snapshot.customer.totalSpentCents)}
                />
                <Stat
                  label="Point balance"
                  value={snapshot.points.balance.toLocaleString("en-PK")}
                  sub={`${snapshot.points.lifetimeEarned.toLocaleString(
                    "en-PK",
                  )} earned · ${snapshot.points.lifetimeRedeemed.toLocaleString(
                    "en-PK",
                  )} redeemed`}
                />
              </div>

              {/* Recent orders */}
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
                    Shop again →
                  </Link>
                </header>
                {snapshot.recentOrders.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-white/55">
                    You haven&apos;t placed any orders yet.{" "}
                    <Link
                      href="/products"
                      prefetch
                      className="font-bold text-[#ff3b3b] hover:underline"
                    >
                      Browse the catalog
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {snapshot.recentOrders.map((o) => (
                      <li
                        key={o.id}
                        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-bold text-white">
                            #{o.orderNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-white/55">
                            {new Date(o.placedAt).toLocaleDateString()} ·{" "}
                            {o.itemCount}{" "}
                            {o.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                              STATUS_STYLES[o.status] ??
                              "bg-white/10 text-white/65"
                            }`}
                          >
                            {o.status.replace("_", " ")}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-white">
                            {o.currency} {formatPKR(o.totalCents).replace("Rs. ", "")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/35" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Points history */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.02]">
                <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
                    Loyalty activity
                  </h2>
                  <span className="text-xs text-white/45">
                    Earn 1 point per Rs. 100 spent
                  </span>
                </header>
                {snapshot.recentPoints.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-white/55">
                    No point activity yet — your first order will earn points.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {snapshot.recentPoints.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {REASON_LABELS[p.reason] ?? p.reason}
                            {p.orderNumber ? (
                              <span className="ml-2 text-white/50">
                                · #{p.orderNumber}
                              </span>
                            ) : null}
                          </p>
                          {p.note && (
                            <p className="mt-0.5 truncate text-xs text-white/55">
                              {p.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/45">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              p.delta > 0 ? "text-[#22c55e]" : "text-[#ff3b3b]"
                            }`}
                          >
                            {p.delta > 0 ? "+" : ""}
                            {p.delta.toLocaleString("en-PK")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <AccountSignOut />
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/45">{sub}</p>}
    </div>
  );
}
